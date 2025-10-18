package com.example.voxelearth;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import org.bukkit.Location;
import org.bukkit.entity.Player;
import org.bukkit.World;

import org.json.JSONObject;

// Field 
import java.lang.reflect.Field;


public class VoxelEarth extends JavaPlugin {

    // Hold a single instance of VoxelChunkGenerator
    private VoxelChunkGenerator voxelChunkGenerator;
    private PlayerMovementListener movementListener; // NEW

    @Override
    public void onEnable() {
        getLogger().info("VoxelEarth has been enabled");
        // Quiet logs in release builds
        if (!Debug.isDebug()) {
            getLogger().setLevel(java.util.logging.Level.WARNING);
        }
        
        // Register the player movement listener
        movementListener = new PlayerMovementListener(this); // NEW
        getServer().getPluginManager().registerEvents(movementListener, this);
        getLogger().info("Player movement listener registered successfully");

        // Re-attach the generator to the existing world
        reattachGeneratorToWorld("world");
        getLogger().info("VoxelChunkGenerator re-attached to world 'world'");
    }

    @Override
    public void onDisable() {
        getLogger().info("VoxelEarth has been disabled");
    }

    @Override
    public ChunkGenerator getDefaultWorldGenerator(String worldName, String id) {
        if (voxelChunkGenerator == null) {
            getLogger().info("VoxelEarth making new Chunk Generator");
            voxelChunkGenerator = new VoxelChunkGenerator();
        }
        getLogger().info("VoxelEarth is returning Default World Generator");
        return voxelChunkGenerator;
    }

    public VoxelChunkGenerator getVoxelChunkGenerator() {
        if (voxelChunkGenerator == null) {
            getLogger().info("VoxelEarth making new Chunk Generator");
            voxelChunkGenerator = new VoxelChunkGenerator();
        }
        return voxelChunkGenerator;
    }

    public PlayerMovementListener getMovementListener() { // NEW
        return movementListener;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (command.getName().equalsIgnoreCase("createcustomworld")) {
            if (args.length == 1) {
                String worldName = args[0];
                WorldCreator worldCreator = new WorldCreator(worldName);
                worldCreator.generator(new VoxelChunkGenerator());
                World world = Bukkit.createWorld(worldCreator);
                sender.sendMessage("Custom world '" + worldName + "' created!");
                return true;
            } else {
                sender.sendMessage("Usage: /createcustomworld <worldname>");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("regenchunks")) {
            if (args.length == 6) {  // Updated to expect 6 arguments
                double scaleX = Double.parseDouble(args[0]);
                double scaleY = Double.parseDouble(args[1]);
                double scaleZ = Double.parseDouble(args[2]);
                double newOffsetX = Double.parseDouble(args[3]);
                double newOffsetY = Double.parseDouble(args[4]);
                double newOffsetZ = Double.parseDouble(args[5]);

                World world = Bukkit.getWorld("world"); // Replace with your world name
                if (world == null) {
                    sender.sendMessage("World not found!");
                    return false;
                }

                if (voxelChunkGenerator == null) {
                    getLogger().info("VoxelEarth making new Chunk Generator");
                    voxelChunkGenerator = new VoxelChunkGenerator();
                }

                // Call regenChunks with individual scaling and offsets for each axis
                voxelChunkGenerator.regenChunks(world, scaleX, scaleY, scaleZ, newOffsetX, newOffsetY, newOffsetZ);

                sender.sendMessage("Chunks regenerated with new parameters.");
                return true;
            } else {
                sender.sendMessage("Usage: /regenchunks <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("loadjson")) {
            if (args.length == 7) {
                String filename = args[0];
                double scaleX = Double.parseDouble(args[1]);
                double scaleY = Double.parseDouble(args[2]);
                double scaleZ = Double.parseDouble(args[3]);
                double offsetX = Double.parseDouble(args[4]);
                double offsetY = Double.parseDouble(args[5]);
                double offsetZ = Double.parseDouble(args[6]);

                World world = Bukkit.getWorld("world"); // future - player's world or custom?
                if (world == null) {
                    sender.sendMessage("World not found!");
                    return false;
                }

                if (voxelChunkGenerator == null) {
                    getLogger().info("Creating new VoxelChunkGenerator");
                    voxelChunkGenerator = new VoxelChunkGenerator();
                }

                try {
                    voxelChunkGenerator.loadMaterialColors();
                    voxelChunkGenerator.loadJson(filename, scaleX, scaleY, scaleZ, offsetX, offsetY, offsetZ);
                    // voxelChunkGenerator.regenChunks(world);
                    sender.sendMessage("JSON file loaded and chunks regenerated.");
                } catch (Exception e) {
                    sender.sendMessage("Failed to load JSON file: " + filename);
                    e.printStackTrace();
                }
                return true;
            } else {
                sender.sendMessage("Usage: /loadjson <filename> <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("visitradius")) {
            // /visitradius <tiles>
            if (args.length != 1) {
                sender.sendMessage("Usage: /visitradius <tiles>");
                return false;
            }
            try {
                int tiles = Integer.parseInt(args[0]);
                if (tiles < 1) {
                    sender.sendMessage("Minimum radius is 1 tile.");
                    return true;
                }
                getVoxelChunkGenerator().setVisitTileRadius(tiles);
                sender.sendMessage("Visit tile radius set to " + tiles + " tile(s).");
                return true;
            } catch (NumberFormatException e) {
                sender.sendMessage("Tiles must be an integer.");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("moveradius")) {
            if (args.length != 1) {
                sender.sendMessage("Usage: /moveradius <tiles>");
                return false;
            }
            try {
                int tiles = Integer.parseInt(args[0]);
                if (tiles < 1) {
                    sender.sendMessage("Minimum moveradius is 1 tile.");
                    return true;
                }
                getVoxelChunkGenerator().setMoveTileRadius(tiles);
                sender.sendMessage("Movement tile load radius set to " + tiles + " tile(s).");
                return true;
            } catch (NumberFormatException e) {
                sender.sendMessage("Tiles must be an integer.");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("movethreshold")) {
            if (args.length != 1) {
                sender.sendMessage("Usage: /movethreshold <blocks>");
                return false;
            }
            try {
                double blocks = Double.parseDouble(args[0]);
                getMovementListener().setMoveThresholdBlocks(blocks);
                sender.sendMessage("Movement distance threshold set to " + (int)blocks + " block(s).");
                return true;
            } catch (NumberFormatException e) {
                sender.sendMessage("Threshold must be a number (in blocks).");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("moveload")) {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("Only players can toggle their moveload setting.");
                return true;
            }
            Player player = (Player) sender;
            if (args.length == 0 || args[0].equalsIgnoreCase("toggle")) {
                getMovementListener().toggleMoveLoad(player.getUniqueId());
                sender.sendMessage("MoveLoad is now " + (getMovementListener().isMoveLoadEnabled(player.getUniqueId()) ? "ON" : "OFF") + ".");
                return true;
            }
            if (args[0].equalsIgnoreCase("on")) {
                getMovementListener().setMoveLoad(player.getUniqueId(), true);
                sender.sendMessage("MoveLoad is now ON.");
                return true;
            }
            if (args[0].equalsIgnoreCase("off")) {
                getMovementListener().setMoveLoad(player.getUniqueId(), false);
                sender.sendMessage("MoveLoad is now OFF.");
                return true;
            }
            if (args[0].equalsIgnoreCase("status")) {
                boolean enabled = getMovementListener().isMoveLoadEnabled(player.getUniqueId());
                int moveRadius = getVoxelChunkGenerator().getMoveTileRadius();
                double threshold = getMovementListener().getMoveThresholdBlocks();
                sender.sendMessage("MoveLoad: " + (enabled ? "ON" : "OFF") + 
                                 " | Tile Radius: " + moveRadius + 
                                 " | Distance Threshold: " + (int)threshold + " blocks");
                return true;
            }
            sender.sendMessage("Usage: /moveload <on|off|toggle|status>");
            return false;
        } else if (command.getName().equalsIgnoreCase("visit")) {
            if (args.length == 0) {
                sender.sendMessage("Usage: /visit <location>");
                return false;
            }

            String location = String.join(" ", args);
            
            // Add instanceof check to prevent console errors
            if (!(sender instanceof Player)) {
                sender.sendMessage("This command can only be used by players.");
                return false;
            }
            
            Player player = (Player) sender;

            // Geocode the location asynchronously
            Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
                try {
                    // 0% – submitted
                    getVoxelChunkGenerator().notifyProgress(player.getUniqueId(), 0, "Starting visit…");
                    double[] latLng = geocodeLocation(location);
                    if (latLng == null) {
                        sender.sendMessage("Failed to find location: " + location);
                        getVoxelChunkGenerator().notifyProgress(player.getUniqueId(), -1, "Geocoding failed");
                        return;
                    } else {
                        sender.sendMessage("Found location: " + latLng[0] + ", " + latLng[1]);
                        getVoxelChunkGenerator().notifyProgress(player.getUniqueId(), 10, "Geocoded " + location);

                    }

                    if (voxelChunkGenerator == null) {
                        getLogger().info("Creating new VoxelChunkGenerator");
                        voxelChunkGenerator = new VoxelChunkGenerator();
                    }

                    // Convert lat/lng to Minecraft coordinates
                    int[] chunkCoords = voxelChunkGenerator.latLngToMinecraft(latLng[0], latLng[1]);
                    
                    // Multiply the x coord by 64 and the z by 10
                    // chunkCoords[0] = (int) (chunkCoords[0] * 64.5860077);
                    // chunkCoords[1] = (int) (chunkCoords[1] * 9.60032897);
                    
                    int[] playerCoords = voxelChunkGenerator.latLngToBlock(latLng[0], latLng[1]);


                    // Teleport and load the chunk
                    Bukkit.getScheduler().runTask(this, () -> {
                        World world = player.getWorld();
                        teleportAndLoadChunk(player, world, chunkCoords[0], chunkCoords[1], playerCoords[0], playerCoords[1]);
                    });

                } catch (Exception e) {
                    sender.sendMessage("An error occurred while processing the location.");
                    e.printStackTrace();
                }
            });

            return true;
        }
        return false;
    }


private double[] geocodeLocation(String location) throws IOException {
    String apiUrl = "https://maps.googleapis.com/maps/api/geocode/json";
    String apiKey = "AIzaSyDV0rBF5y2f_xsSNj32fxvhqj3ZErTt6HQ"; // Replace with your API key

    String requestUrl = apiUrl + "?address=" + location.replace(" ", "+") + "&key=" + apiKey;
    HttpURLConnection connection = (HttpURLConnection) new URL(requestUrl).openConnection();
    connection.setRequestMethod("GET");

    BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
    StringBuilder response = new StringBuilder();
    String line;
    while ((line = reader.readLine()) != null) {
        response.append(line);
    }
    reader.close();

    JSONObject jsonResponse = new JSONObject(response.toString());
    if (!jsonResponse.getString("status").equals("OK")) {
        // Log the error message for debugging
        getLogger().severe("Geocoding API error: " + jsonResponse.getString("status"));
        getLogger().severe("Geocoding API response: " + jsonResponse.toString());
        return null;
    }

    JSONObject locationObject = jsonResponse
            .getJSONArray("results")
            .getJSONObject(0)
            .getJSONObject("geometry")
            .getJSONObject("location");

    double lat = locationObject.getDouble("lat");
    double lng = locationObject.getDouble("lng");

    return new double[]{lat, lng};
}

private void teleportAndLoadChunk(Player player, World world, int x, int z, int playerX, int playerZ) {
    int chunkX = x; //>> 4;
    int chunkZ = z; //>> 4;

    // Load the chunk to trigger generation if needed
    if (!world.isChunkLoaded(chunkX, chunkZ)) {
        System.out.println("Loading chunk: " + chunkX + ", " + chunkZ);
        // world.loadChunk(chunkX, chunkZ, true);
        // voxelChunkGenerator.loadChunk(chunkX, chunkZ);
        voxelChunkGenerator.loadChunk(player.getUniqueId(), chunkX, chunkZ, true, (blockLocation) -> {
            Bukkit.getScheduler().runTask(this, () -> {
                System.out.println("Block location: " + blockLocation[0] + ", " + blockLocation[1]);
                Location location = new Location(world, blockLocation[0], blockLocation[1], blockLocation[2]);
                player.sendMessage("You are now at: " + blockLocation[0] + ", " + blockLocation[1] + ", " + blockLocation[2]);
                player.teleport(location);
                player.sendMessage("Welcome to your destination!");
                getLogger().info("Teleported player to: " + blockLocation[0] + ", " + blockLocation[1] + ", " + blockLocation[2]);
                // 100% – done
                getVoxelChunkGenerator().notifyProgress(player.getUniqueId(), 100, "Arrived");
            });
        });
    } else {
        System.out.println("Chunk already loaded: " + chunkX + ", " + chunkZ);
        Location location = new Location(world, playerX, 100, playerZ);
        player.sendMessage("Chunk preloaded. You are now at: " + playerX + ", 100, " + playerZ);
        player.teleport(location);
        player.sendMessage("Welcome to your destination!");
        getLogger().info("Teleported player to: " + playerX + ", " + playerZ);
        getVoxelChunkGenerator().notifyProgress(player.getUniqueId(), 100, "Arrived");
    }
}


private void reattachGeneratorToWorld(String worldName) {
    World world = Bukkit.getWorld(worldName);
    if (world != null) {
        getLogger().info("Re-attaching VoxelChunkGenerator to existing world: " + worldName);

        // Since the world exists, we need to set its generator
        // Unfortunately, Bukkit doesn't provide a direct method to set a generator on an existing world
        // So we need to access the world's generator field via reflection (this is a workaround)

        try {
            Field generatorField = World.class.getDeclaredField("generator");
            getLogger().info("generatorField: " + generatorField);

            generatorField.setAccessible(true);
            generatorField.set(world, getVoxelChunkGenerator());

            getLogger().info("Successfully re-attached VoxelChunkGenerator to world: " + worldName);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            getLogger().severe("Failed to re-attach VoxelChunkGenerator to world: " + worldName);
            e.printStackTrace();
        }
    } else {
        getLogger().info("World '" + worldName + "' does not exist.");
    }
}



}
