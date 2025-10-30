package com.example.voxelearth;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.net.HttpURLConnection;
import java.net.URL;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.ProxiedCommandSender;
import org.bukkit.entity.Player;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.JSONObject;

public class VoxelEarth extends JavaPlugin {

    // Hold a single instance of VoxelChunkGenerator
    private VoxelChunkGenerator voxelChunkGenerator;
    private PlayerMovementListener movementListener;

    @Override
    public void onEnable() {
        getLogger().info("VoxelEarth has been enabled");
        if (!Debug.isDebug()) {
            getLogger().setLevel(java.util.logging.Level.WARNING);
        }

        // Register Brigadier mapping (Paper 1.20.4)
        new BrigadierMapper(this).registerAll();

        // Register the player movement listener
        movementListener = new PlayerMovementListener(this);
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

    public PlayerMovementListener getMovementListener() {
        return movementListener;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {

        // Unwrap /execute as <player> to the callee (DO NOT reassign `sender`)
        final CommandSender realSender =
                (sender instanceof ProxiedCommandSender pcs && pcs.getCallee() != null)
                        ? pcs.getCallee()
                        : sender;

        if (command.getName().equalsIgnoreCase("createcustomworld")) {
            if (args.length == 1) {
                String worldName = args[0];
                WorldCreator worldCreator = new WorldCreator(worldName);
                worldCreator.generator(new VoxelChunkGenerator());
                World world = Bukkit.createWorld(worldCreator);
                realSender.sendMessage("Custom world '" + worldName + "' created!");
                return true;
            } else {
                realSender.sendMessage("Usage: /createcustomworld <worldname>");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("regenchunks")) {
            if (args.length == 6) {
                double scaleX = Double.parseDouble(args[0]);
                double scaleY = Double.parseDouble(args[1]);
                double scaleZ = Double.parseDouble(args[2]);
                double newOffsetX = Double.parseDouble(args[3]);
                double newOffsetY = Double.parseDouble(args[4]);
                double newOffsetZ = Double.parseDouble(args[5]);

                World world = Bukkit.getWorld("world");
                if (world == null) {
                    realSender.sendMessage("World not found!");
                    return false;
                }

                if (voxelChunkGenerator == null) {
                    getLogger().info("VoxelEarth making new Chunk Generator");
                    voxelChunkGenerator = new VoxelChunkGenerator();
                }

                voxelChunkGenerator.regenChunks(world, scaleX, scaleY, scaleZ, newOffsetX, newOffsetY, newOffsetZ);
                realSender.sendMessage("Chunks regenerated with new parameters.");
                return true;
            } else {
                realSender.sendMessage("Usage: /regenchunks <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>");
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
                    realSender.sendMessage("World not found!");
                    return false;
                }

                if (voxelChunkGenerator == null) {
                    getLogger().info("Creating new VoxelChunkGenerator");
                    voxelChunkGenerator = new VoxelChunkGenerator();
                }

                try {
                    voxelChunkGenerator.loadMaterialColors();
                    voxelChunkGenerator.loadJson(filename, scaleX, scaleY, scaleZ, offsetX, offsetY, offsetZ);
                    realSender.sendMessage("JSON file loaded and chunks regenerated.");
                } catch (Exception e) {
                    realSender.sendMessage("Failed to load JSON file: " + filename);
                    e.printStackTrace();
                }
                return true;
            } else {
                realSender.sendMessage("Usage: /loadjson <filename> <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("visitradius")) {
            if (args.length != 1) {
                realSender.sendMessage("Usage: /visitradius <tiles>");
                return false;
            }
            try {
                int tiles = Integer.parseInt(args[0]);
                if (tiles < 1) {
                    realSender.sendMessage("Minimum radius is 1 tile.");
                    return true;
                }
                getVoxelChunkGenerator().setVisitTileRadius(tiles);
                realSender.sendMessage("Visit tile radius set to " + tiles + " tile(s).");
                return true;
            } catch (NumberFormatException e) {
                realSender.sendMessage("Tiles must be an integer.");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("moveradius")) {
            if (args.length != 1) {
                realSender.sendMessage("Usage: /moveradius <tiles>");
                return false;
            }
            try {
                int tiles = Integer.parseInt(args[0]);
                if (tiles < 1) {
                    realSender.sendMessage("Minimum moveradius is 1 tile.");
                    return true;
                }
                getVoxelChunkGenerator().setMoveTileRadius(tiles);
                realSender.sendMessage("Movement tile load radius set to " + tiles + " tile(s).");
                return true;
            } catch (NumberFormatException e) {
                realSender.sendMessage("Tiles must be an integer.");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("movethreshold")) {
            if (args.length != 1) {
                realSender.sendMessage("Usage: /movethreshold <blocks>");
                return false;
            }
            try {
                double blocks = Double.parseDouble(args[0]);
                getMovementListener().setMoveThresholdBlocks(blocks);
                realSender.sendMessage("Movement distance threshold set to " + (int) blocks + " block(s).");
                return true;
            } catch (NumberFormatException e) {
                realSender.sendMessage("Threshold must be a number (in blocks).");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("moveload")) {
            if (!(realSender instanceof Player)) {
                realSender.sendMessage("Only players can toggle their moveload setting.");
                return true;
            }
            final Player player = (Player) realSender;
            if (args.length == 0 || args[0].equalsIgnoreCase("toggle")) {
                getMovementListener().toggleMoveLoad(player.getUniqueId());
                realSender.sendMessage("MoveLoad is now " + (getMovementListener().isMoveLoadEnabled(player.getUniqueId()) ? "ON" : "OFF") + ".");
                return true;
            }
            if (args[0].equalsIgnoreCase("on")) {
                getMovementListener().setMoveLoad(player.getUniqueId(), true);
                realSender.sendMessage("MoveLoad is now ON.");
                return true;
            }
            if (args[0].equalsIgnoreCase("off")) {
                getMovementListener().setMoveLoad(player.getUniqueId(), false);
                realSender.sendMessage("MoveLoad is now OFF.");
                return true;
            }
            if (args[0].equalsIgnoreCase("status")) {
                boolean enabled = getMovementListener().isMoveLoadEnabled(player.getUniqueId());
                int moveRadius = getVoxelChunkGenerator().getMoveTileRadius();
                double threshold = getMovementListener().getMoveThresholdBlocks();
                realSender.sendMessage("MoveLoad: " + (enabled ? "ON" : "OFF") +
                        " | Tile Radius: " + moveRadius +
                        " | Distance Threshold: " + (int) threshold + " blocks");
                return true;
            }
            realSender.sendMessage("Usage: /moveload <on|off|toggle|status>");
            return false;
        } else if (command.getName().equalsIgnoreCase("visit")) {
            if (args.length == 0) {
                realSender.sendMessage("Usage: /visit <location>");
                return false;
            }

            final String location = String.join(" ", args);

            if (!(realSender instanceof Player)) {
                realSender.sendMessage("This command can only be used by players.");
                return false;
            }

            final Player p = (Player) realSender;
            final VoxelChunkGenerator gen = getVoxelChunkGenerator();

            // Geocode asynchronously
            Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
                try {
                    gen.notifyProgress(p.getUniqueId(), 0, "Starting visit…");
                    double[] latLng = geocodeLocation(location);
                    if (latLng == null) {
                        realSender.sendMessage("Failed to find location: " + location);
                        gen.notifyProgress(p.getUniqueId(), -1, "Geocoding failed");
                        return;
                    } else {
                        realSender.sendMessage("Found location: " + latLng[0] + ", " + latLng[1]);
                        gen.notifyProgress(p.getUniqueId(), 10, "Geocoded " + location);
                    }

                    // Convert lat/lng
                    int[] chunkCoords = gen.latLngToMinecraft(latLng[0], latLng[1]);
                    int[] playerCoords = gen.latLngToBlock(latLng[0], latLng[1]);

                    // Capture into finals for inner lambda
                    final int cx = chunkCoords[0];
                    final int cz = chunkCoords[1];
                    final int px = playerCoords[0];
                    final int pz = playerCoords[1];

                    // Teleport & load on main thread
                    Bukkit.getScheduler().runTask(this, () -> {
                        World world = p.getWorld();
                        teleportAndLoadChunk(p, world, cx, cz, px, pz);
                    });

                } catch (Exception e) {
                    realSender.sendMessage("An error occurred while processing the location.");
                    e.printStackTrace();
                }
            });

            return true;
        } else if (command.getName().equalsIgnoreCase("visitother")) {
            // /visitother <player> <location...>
            if (args.length < 2) {
                sender.sendMessage("Usage: /visitother <player> <location>");
                return false;
            }

            final String targetName = args[0];
            final String location = String.join(" ", java.util.Arrays.copyOfRange(args, 1, args.length));

            final Player target = Bukkit.getPlayerExact(targetName);
            if (target == null) {
                sender.sendMessage("Player not found or not online: " + targetName);
                return true;
            }

            final VoxelChunkGenerator gen = getVoxelChunkGenerator();

            // Geocode asynchronously
            Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
                try {
                    gen.notifyProgress(target.getUniqueId(), 0, "Starting visit…");
                    double[] latLng = geocodeLocation(location);
                    if (latLng == null) {
                        sender.sendMessage("Failed to find location: " + location);
                        gen.notifyProgress(target.getUniqueId(), -1, "Geocoding failed");
                        return;
                    } else {
                        sender.sendMessage("Found location for " + target.getName() + ": " + latLng[0] + ", " + latLng[1]);
                        target.sendMessage("Navigating to: " + location + " (" + latLng[0] + ", " + latLng[1] + ")");
                        gen.notifyProgress(target.getUniqueId(), 10, "Geocoded " + location);
                    }

                    // Convert lat/lng
                    int[] chunkCoords = gen.latLngToMinecraft(latLng[0], latLng[1]);
                    int[] playerCoords = gen.latLngToBlock(latLng[0], latLng[1]);

                    final int cx = chunkCoords[0];
                    final int cz = chunkCoords[1];
                    final int px = playerCoords[0];
                    final int pz = playerCoords[1];

                    // Teleport & load on main thread
                    Bukkit.getScheduler().runTask(this, () -> {
                        if (!target.isOnline()) {
                            sender.sendMessage("Player went offline before teleport: " + targetName);
                            return;
                        }
                        World world = target.getWorld();
                        teleportAndLoadChunk(target, world, cx, cz, px, pz);
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
        String apiKey = "AIzaSy..."; // Replace with your API key

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
            getLogger().severe("Geocoding API error: " + jsonResponse.getString("status"));
            getLogger().severe("Geocoding API response: " + jsonResponse);
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
        int chunkX = x;
        int chunkZ = z;

        if (!world.isChunkLoaded(chunkX, chunkZ)) {
            System.out.println("Loading chunk: " + chunkX + ", " + chunkZ);
            voxelChunkGenerator.loadChunk(player.getUniqueId(), chunkX, chunkZ, true, (blockLocation) -> {
                Bukkit.getScheduler().runTask(this, () -> {
                    System.out.println("Block location: " + blockLocation[0] + ", " + blockLocation[1]);
                    Location location = new Location(world, blockLocation[0], blockLocation[1], blockLocation[2]);
                    player.sendMessage("You are now at: " + blockLocation[0] + ", " + blockLocation[1] + ", " + blockLocation[2]);
                    player.teleport(location);
                    player.sendMessage("Welcome to your destination!");
                    getLogger().info("Teleported player to: " + blockLocation[0] + ", " + blockLocation[1] + ", " + blockLocation[2]);
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
            try {
                Field generatorField = World.class.getDeclaredField("generator");
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
