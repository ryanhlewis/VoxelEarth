package com.example.voxelearth;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Chunk;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.command.ProxiedCommandSender;
import org.bukkit.entity.Player;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.block.Block;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;
import java.util.logging.Level;

public class VoxelEarth extends JavaPlugin {

    private static VoxelEarth instance;

    private static final String DEFAULT_API_KEY = "AIzaSy..."; // Built-in fallback key

    // Hold a single instance of VoxelChunkGenerator
    private VoxelChunkGenerator voxelChunkGenerator;
    private PlayerMovementListener movementListener;
    private ApiKeyManager apiKeyManager;

    /** Number of blocks to stand above the detected ground surface. */
    private static final int SPAWN_ABOVE_GROUND = 2;
    private static final int MAX_SAFE_SEARCH_RADIUS = 64;
    private static final int MAX_HEADROOM_CHECK = 2;

    private static final Set<Material> UNSAFE_SURFACES = EnumSet.of(
        Material.LAVA,
        Material.WATER,
        Material.FIRE,
        Material.SOUL_FIRE,
        Material.MAGMA_BLOCK,
        Material.CAMPFIRE,
        Material.SOUL_CAMPFIRE,
        Material.CACTUS,
        Material.SWEET_BERRY_BUSH,
        Material.POWDER_SNOW
    );

    private static final Set<Material> UNSAFE_HEADROOM = EnumSet.of(
        Material.LAVA,
        Material.WATER,
        Material.FIRE,
        Material.SOUL_FIRE,
        Material.CACTUS,
        Material.POWDER_SNOW,
        Material.COBWEB,
        Material.MAGMA_BLOCK,
        Material.CAMPFIRE,
        Material.SOUL_CAMPFIRE
    );

    public static VoxelEarth getInstance() {
        return instance;
    }

    @Override
    public void onLoad() {
        instance = this;
        apiKeyManager = new ApiKeyManager(this, DEFAULT_API_KEY);
    }

    @Override
    public void onEnable() {
        instance = this;
        if (apiKeyManager == null) {
            apiKeyManager = new ApiKeyManager(this, DEFAULT_API_KEY);
        } else {
            apiKeyManager.reloadFromDisk();
        }
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
        instance = null;
    }

    @Override
    public ChunkGenerator getDefaultWorldGenerator(String worldName, String id) {
        if (voxelChunkGenerator == null) {
            getLogger().info("VoxelEarth making new Chunk Generator");
            voxelChunkGenerator = new VoxelChunkGenerator(getApiKeyManager());
        }
        getLogger().info("VoxelEarth is returning Default World Generator");
        return voxelChunkGenerator;
    }

    public VoxelChunkGenerator getVoxelChunkGenerator() {
        if (voxelChunkGenerator == null) {
            getLogger().info("VoxelEarth making new Chunk Generator");
            voxelChunkGenerator = new VoxelChunkGenerator(getApiKeyManager());
        }
        return voxelChunkGenerator;
    }

    public ApiKeyManager getApiKeyManager() {
        if (apiKeyManager == null) {
            apiKeyManager = new ApiKeyManager(this, DEFAULT_API_KEY);
        }
        return apiKeyManager;
    }

    public PlayerMovementListener getMovementListener() {
        return movementListener;
    }

    private void broadcastSettingUpdate(String message, CommandSender actor, Player... excluded) {
        Player actorPlayer = (actor instanceof Player) ? (Player) actor : null;
        for (Player online : Bukkit.getOnlinePlayers()) {
            if (actorPlayer != null && actorPlayer.getUniqueId().equals(online.getUniqueId())) {
                continue;
            }
            if (excluded != null) {
                boolean skip = false;
                for (Player ex : excluded) {
                    if (ex != null && ex.getUniqueId().equals(online.getUniqueId())) {
                        skip = true;
                        break;
                    }
                }
                if (skip) {
                    continue;
                }
            }
            online.sendMessage(message);
        }
    }

    private void notifyMoveLoadStatus(Player target, boolean enabled, boolean stateChanged) {
        String prefix = stateChanged ? "Your MoveLoad is now " : "Your MoveLoad is currently ";
        target.sendMessage(prefix + (enabled ? "ON." : "OFF."));
    }

    private void notifyTargetIfDifferent(CommandSender actor, Player target, String message) {
        if (actor instanceof Player) {
            Player actorPlayer = (Player) actor;
            if (actorPlayer.getUniqueId().equals(target.getUniqueId())) {
                return;
            }
        }
        target.sendMessage(message);
    }

    /** Try to land relative to a freshly placed block before falling back to broader searches. */
    private Location safeFromBlockAnchor(World world, int[] blockLocation, int aboveBlocks) {
        if (world == null || blockLocation == null || blockLocation.length < 3) {
            return null;
        }
        int ax = blockLocation[0];
        int ay = blockLocation[1];
        int az = blockLocation[2];

        Location viaAnchor = safeAtOrAbove(world, ax, ay, az, aboveBlocks);
        if (viaAnchor != null) {
            return viaAnchor;
        }

        Location sameColumn = findSafeSpawnAtXZ(world, ax, az, aboveBlocks);
        if (sameColumn != null) {
            return sameColumn;
        }

        return findNearestSafeSpawn(world, ax, az, aboveBlocks);
    }

    /** Place the player above the indicated ground, ensuring support and headroom. */
    private Location safeAtOrAbove(World world, int x, int groundY, int z, int aboveBlocks) {
        if (world == null) {
            return null;
        }

        Chunk chunk = world.getChunkAt(x >> 4, z >> 4);
        if (!chunk.isLoaded()) {
            chunk.load();
        }

        int minY = world.getMinHeight();
        int maxY = world.getMaxHeight() - 1;
        int clampedGround = Math.min(Math.max(groundY, minY), maxY - 1);

        for (int y = clampedGround; y >= minY; y--) {
            Block supportBlock = world.getBlockAt(x, y, z);
            if (!isSafeSupport(supportBlock.getType())) {
                continue;
            }

            int desiredFeetY = Math.min(y + Math.max(1, aboveBlocks), maxY - 1);
            int maxCheck = Math.min(desiredFeetY + 6, maxY - 1);
            for (int candidateFeetY = desiredFeetY; candidateFeetY <= maxCheck; candidateFeetY++) {
                if (candidateFeetY - 1 < minY) {
                    continue;
                }
                if (!isAirColumn(world, x, candidateFeetY, z, MAX_HEADROOM_CHECK)) {
                    continue;
                }
                Block belowFeet = world.getBlockAt(x, candidateFeetY - 1, z);
                if (!isSafeSupport(belowFeet.getType())) {
                    continue;
                }
                return new Location(world, x + 0.5, candidateFeetY, z + 0.5);
            }
        }
        return null;
    }

    /** Use the current column to find a safe landing spot. */
    private Location findSafeSpawnAtXZ(World world, int x, int z, int aboveBlocks) {
        if (world == null) {
            return null;
        }
        int surfaceY = world.getHighestBlockYAt(x, z);
        if (surfaceY <= world.getMinHeight()) {
            return null;
        }
        return safeAtOrAbove(world, x, surfaceY, z, aboveBlocks);
    }

    /** Spiral outward to locate the nearest viable spawn column. */
    private Location findNearestSafeSpawn(World world, int x, int z, int aboveBlocks) {
        if (world == null) {
            return null;
        }
        for (int radius = 0; radius <= MAX_SAFE_SEARCH_RADIUS; radius++) {
            for (int dx = -radius; dx <= radius; dx++) {
                for (int dz = -radius; dz <= radius; dz++) {
                    if (Math.abs(dx) != radius && Math.abs(dz) != radius) {
                        continue;
                    }
                    Location candidate = findSafeSpawnAtXZ(world, x + dx, z + dz, aboveBlocks);
                    if (candidate != null) {
                        return candidate;
                    }
                }
            }
        }

        Location worldSpawn = world.getSpawnLocation();
        if (worldSpawn != null) {
            Location fallback = findSafeSpawnAtXZ(world, worldSpawn.getBlockX(), worldSpawn.getBlockZ(), aboveBlocks);
            if (fallback != null) {
                return fallback;
            }
        }
        return worldSpawn;
    }

    /** Ensure the two-block column above the candidate feet position is empty of hazards. */
    private boolean isAirColumn(World world, int x, int startY, int z, int height) {
        if (world == null) {
            return false;
        }
        int maxY = world.getMaxHeight();
        for (int i = 0; i < height; i++) {
            int y = startY + i;
            if (y >= maxY) {
                return false;
            }
            Block block = world.getBlockAt(x, y, z);
            Material type = block.getType();
            if (block.isLiquid() || type.isSolid() || UNSAFE_HEADROOM.contains(type)) {
                return false;
            }
        }
        return true;
    }

    /** Decide whether a block can safely support the player. */
    private boolean isSafeSupport(Material material) {
        if (material == null) {
            return false;
        }
        if (material.isAir()) {
            return false;
        }
        if (!material.isSolid()) {
            return false;
        }
        return !UNSAFE_SURFACES.contains(material);
    }

    private void setPlayerSpawnSmart(Player player, Location safe) {
        if (player == null || safe == null) {
            return;
        }
        try {
            player.setRespawnLocation(safe, true);
        } catch (Throwable t) {
            getLogger().log(java.util.logging.Level.FINE, "Failed to update player respawn", t);
        }
    }

    private void setWorldSpawnSmart(World world, Location safe) {
        if (world == null || safe == null) {
            return;
        }
        try {
            world.setSpawnLocation(safe.getBlockX(), safe.getBlockY(), safe.getBlockZ());
        } catch (Throwable t) {
            getLogger().log(java.util.logging.Level.FINE, "Failed to update world spawn", t);
        }
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {

        // Unwrap /execute as <player> to the callee (DO NOT reassign `sender`)
        final CommandSender realSender;
        if (sender instanceof ProxiedCommandSender) {
            ProxiedCommandSender proxied = (ProxiedCommandSender) sender;
            realSender = proxied.getCallee() != null ? proxied.getCallee() : sender;
        } else {
            realSender = sender;
        }

        if (command.getName().equalsIgnoreCase("createcustomworld")) {
            if (args.length == 1) {
                String worldName = args[0];
                WorldCreator worldCreator = new WorldCreator(worldName);
                worldCreator.generator(new VoxelChunkGenerator(getApiKeyManager()));
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
                    voxelChunkGenerator = new VoxelChunkGenerator(getApiKeyManager());
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
                    voxelChunkGenerator = new VoxelChunkGenerator(getApiKeyManager());
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
        } else if (command.getName().equalsIgnoreCase("voxelapikey")) {
            if (args.length != 1) {
                realSender.sendMessage("Usage: /voxelapikey <google-api-key>");
                return false;
            }
            String newKey = args[0].trim();
            if (newKey.isEmpty()) {
                realSender.sendMessage(ChatColor.RED + "API key cannot be empty.");
                return true;
            }
            try {
                getApiKeyManager().setCustomApiKey(newKey);
                if (voxelChunkGenerator != null) {
                    voxelChunkGenerator.refreshTileDownloaderApiKey();
                }
                realSender.sendMessage(ChatColor.GREEN + "Stored custom Google API key (" + newKey.length() + " chars).");
                realSender.sendMessage(ChatColor.YELLOW + "Ensure Geocoding + Maps Tiles APIs are enabled for this key.");
            } catch (IllegalArgumentException e) {
                realSender.sendMessage(ChatColor.RED + e.getMessage());
            } catch (IOException e) {
                realSender.sendMessage(ChatColor.RED + "Failed to store API key. Check console for details.");
                getLogger().log(Level.WARNING, "Failed to persist custom API key", e);
            }
            return true;
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
                String message = "Visit tile radius set to " + tiles + " tile(s).";
                realSender.sendMessage(message);
                broadcastSettingUpdate(message, realSender);
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
                String message = "Movement tile load radius set to " + tiles + " tile(s).";
                realSender.sendMessage(message);
                broadcastSettingUpdate(message, realSender);
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
                double updated = getMovementListener().getMoveThresholdBlocks();
                String display = (Math.abs(updated - Math.rint(updated)) < 1e-6)
                        ? Integer.toString((int) Math.round(updated))
                        : String.format(Locale.US, "%.2f", updated);
                String message = "Movement distance threshold set to " + display + " block(s).";
                realSender.sendMessage(message);
                broadcastSettingUpdate(message, realSender);
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
        } else if (command.getName().equalsIgnoreCase("moveloadother")) {
            if (args.length < 1) {
                realSender.sendMessage("Usage: /moveloadother <player> [on|off|toggle|status]");
                return false;
            }

            Player target = Bukkit.getPlayerExact(args[0]);
            if (target == null) {
                realSender.sendMessage("Player not found or not online: " + args[0]);
                return true;
            }

            String action = args.length >= 2 ? args[1].toLowerCase(Locale.ROOT) : "toggle";

            switch (action) {
                case "on":
                    getMovementListener().setMoveLoad(target.getUniqueId(), true);
                    notifyMoveLoadStatus(target, true, true);
                    realSender.sendMessage("MoveLoad for " + target.getName() + " is now ON.");
                    return true;
                case "off":
                    getMovementListener().setMoveLoad(target.getUniqueId(), false);
                    notifyMoveLoadStatus(target, false, true);
                    realSender.sendMessage("MoveLoad for " + target.getName() + " is now OFF.");
                    return true;
                case "toggle": {
                    getMovementListener().toggleMoveLoad(target.getUniqueId());
                    boolean enabled = getMovementListener().isMoveLoadEnabled(target.getUniqueId());
                    notifyMoveLoadStatus(target, enabled, true);
                    realSender.sendMessage("MoveLoad for " + target.getName() + " is now " + (enabled ? "ON" : "OFF") + ".");
                    return true;
                }
                case "status": {
                    boolean status = getMovementListener().isMoveLoadEnabled(target.getUniqueId());
                    notifyMoveLoadStatus(target, status, false);
                    realSender.sendMessage("MoveLoad for " + target.getName() + " is currently " + (status ? "ON" : "OFF") + ".");
                    return true;
                }
                default:
                    realSender.sendMessage("Usage: /moveloadother <player> [on|off|toggle|status]");
                    return false;
            }
        } else if (command.getName().equalsIgnoreCase("visitradiusother")) {
            if (args.length != 2) {
                realSender.sendMessage("Usage: /visitradiusother <player> <tiles>");
                return false;
            }
            Player target = Bukkit.getPlayerExact(args[0]);
            if (target == null) {
                realSender.sendMessage("Player not found or not online: " + args[0]);
                return true;
            }
            try {
                int tiles = Integer.parseInt(args[1]);
                if (tiles < 1) {
                    realSender.sendMessage("Minimum radius is 1 tile.");
                    return true;
                }
                getVoxelChunkGenerator().setVisitTileRadius(tiles);
                String message = "Visit tile radius set to " + tiles + " tile(s).";
                realSender.sendMessage(message);
                notifyTargetIfDifferent(realSender, target, message);
                broadcastSettingUpdate(message, realSender, target);
                return true;
            } catch (NumberFormatException e) {
                realSender.sendMessage("Tiles must be an integer.");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("moveradiusother")) {
            if (args.length != 2) {
                realSender.sendMessage("Usage: /moveradiusother <player> <tiles>");
                return false;
            }
            Player target = Bukkit.getPlayerExact(args[0]);
            if (target == null) {
                realSender.sendMessage("Player not found or not online: " + args[0]);
                return true;
            }
            try {
                int tiles = Integer.parseInt(args[1]);
                if (tiles < 1) {
                    realSender.sendMessage("Minimum moveradius is 1 tile.");
                    return true;
                }
                getVoxelChunkGenerator().setMoveTileRadius(tiles);
                String message = "Movement tile load radius set to " + tiles + " tile(s).";
                realSender.sendMessage(message);
                notifyTargetIfDifferent(realSender, target, message);
                broadcastSettingUpdate(message, realSender, target);
                return true;
            } catch (NumberFormatException e) {
                realSender.sendMessage("Tiles must be an integer.");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("movethresholdother")) {
            if (args.length != 2) {
                realSender.sendMessage("Usage: /movethresholdother <player> <blocks>");
                return false;
            }
            Player target = Bukkit.getPlayerExact(args[0]);
            if (target == null) {
                realSender.sendMessage("Player not found or not online: " + args[0]);
                return true;
            }
            try {
                double blocks = Double.parseDouble(args[1]);
                getMovementListener().setMoveThresholdBlocks(blocks);
                double updated = getMovementListener().getMoveThresholdBlocks();
                String display = (Math.abs(updated - Math.rint(updated)) < 1e-6)
                        ? Integer.toString((int) Math.round(updated))
                        : String.format(Locale.US, "%.2f", updated);
                String message = "Movement distance threshold set to " + display + " block(s).";
                realSender.sendMessage(message);
                notifyTargetIfDifferent(realSender, target, message);
                broadcastSettingUpdate(message, realSender, target);
                return true;
            } catch (NumberFormatException e) {
                realSender.sendMessage("Threshold must be a number (in blocks).");
                return false;
            }
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

            getMovementListener().suspendMoveLoadForVisit(p.getUniqueId());

            // Geocode asynchronously
            Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
                try {
                    gen.notifyProgress(p.getUniqueId(), 0, "Starting visit…");
                    double[] latLng = geocodeLocation(location);
                    if (latLng == null) {
                        realSender.sendMessage("Failed to find location: " + location);
                        warnApiKeyExpired(realSender);
                        gen.notifyProgress(p.getUniqueId(), -1, "Geocoding failed");
                        getMovementListener().cancelVisit(p.getUniqueId());
                        return;
                    } else {
                        realSender.sendMessage("Found location: " + latLng[0] + ", " + latLng[1]);
                        gen.notifyProgress(p.getUniqueId(), 10, "Geocoded " + location);
                    }
                    getMovementListener().setReferenceLatLng(p.getUniqueId(), latLng[0], latLng[1]);

                    int[] islandBase = gen.allocateNewIslandBase();
                    gen.setPlayerAnchor(p.getUniqueId(), latLng[0], latLng[1], islandBase[0], islandBase[1]);

                    // Convert lat/lng using the per-player anchor
                    int[] chunkCoords = gen.latLngToMinecraft(p.getUniqueId(), latLng[0], latLng[1]);
                    int[] playerCoords = gen.latLngToBlock(latLng[0], latLng[1]);

                    // Capture into finals for inner lambda
                    final int cx = chunkCoords[0];
                    final int cz = chunkCoords[1];
                    final int px = playerCoords[0];
                    final int pz = playerCoords[1];

                    // Teleport & load on main thread
                    Bukkit.getScheduler().runTask(this, () -> {
                        if (!p.isOnline()) {
                            getMovementListener().cancelVisit(p.getUniqueId());
                            return;
                        }
                        World world = p.getWorld();
                        teleportAndLoadChunk(p, world, cx, cz, px, pz);
                    });

                } catch (Exception e) {
                    realSender.sendMessage("An error occurred while processing the location.");
                    e.printStackTrace();
                    getMovementListener().cancelVisit(p.getUniqueId());
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

            getMovementListener().suspendMoveLoadForVisit(target.getUniqueId());

            // Geocode asynchronously
            Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
                try {
                    gen.notifyProgress(target.getUniqueId(), 0, "Starting visit…");
                    double[] latLng = geocodeLocation(location);
                    if (latLng == null) {
                        sender.sendMessage("Failed to find location: " + location);
                        warnApiKeyExpired(sender);
                        warnApiKeyExpired(target);
                        gen.notifyProgress(target.getUniqueId(), -1, "Geocoding failed");
                        getMovementListener().cancelVisit(target.getUniqueId());
                        return;
                    } else {
                        sender.sendMessage("Found location for " + target.getName() + ": " + latLng[0] + ", " + latLng[1]);
                        target.sendMessage("Navigating to: " + location + " (" + latLng[0] + ", " + latLng[1] + ")");
                        gen.notifyProgress(target.getUniqueId(), 10, "Geocoded " + location);
                    }

                    int[] islandBase = gen.allocateNewIslandBase();
                    gen.setPlayerAnchor(target.getUniqueId(), latLng[0], latLng[1], islandBase[0], islandBase[1]);

                    // Convert lat/lng
                    int[] chunkCoords = gen.latLngToMinecraft(target.getUniqueId(), latLng[0], latLng[1]);
                    int[] playerCoords = gen.latLngToBlock(latLng[0], latLng[1]);

                    final int cx = chunkCoords[0];
                    final int cz = chunkCoords[1];
                    final int px = playerCoords[0];
                    final int pz = playerCoords[1];

                    // Teleport & load on main thread
                    Bukkit.getScheduler().runTask(this, () -> {
                        if (!target.isOnline()) {
                            sender.sendMessage("Player went offline before teleport: " + targetName);
                            getMovementListener().cancelVisit(target.getUniqueId());
                            return;
                        }
                        World world = target.getWorld();
                        teleportAndLoadChunk(target, world, cx, cz, px, pz);
                    });

                } catch (Exception e) {
                    sender.sendMessage("An error occurred while processing the location.");
                    e.printStackTrace();
                    getMovementListener().cancelVisit(target.getUniqueId());
                }
            });

            return true;
        }
        return false;
    }

    /**
     * Attempts to parse coordinates directly from the location string.
     * Supports formats like "40.7128, -74.0060" or "40.7128 -74.0060"
     * 
     * @param location The location string to parse
     * @return A double array [lat, lng] if successfully parsed, null otherwise
     */
    private double[] parseCoordinates(String location) {
        if (location == null || location.trim().isEmpty()) {
            return null;
        }
        
        String trimmed = location.trim();
        
        // Try to match coordinate patterns: "lat, lng" or "lat lng"
        // Coordinates can be decimal numbers with optional minus sign
        String[] parts = null;
        
        // Try comma-separated first
        if (trimmed.contains(",")) {
            parts = trimmed.split(",");
        }
        // Try space-separated (one or more spaces)
        else if (trimmed.contains(" ")) {
            parts = trimmed.split("\\s+");
        }
        
        // If we have exactly 2 parts, try to parse them as doubles
        if (parts != null && parts.length == 2) {
            try {
                double lat = Double.parseDouble(parts[0].trim());
                double lng = Double.parseDouble(parts[1].trim());
                
                // Validate coordinate ranges
                // Latitude must be between -90 and 90
                // Longitude must be between -180 and 180
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    return new double[]{lat, lng};
                }
            } catch (NumberFormatException e) {
                // Not valid coordinates, fall through to return null
            }
        }
        
        return null;
    }

    private double[] geocodeLocation(String location) throws IOException {
        // First, try to parse as direct coordinates
        double[] coordinates = parseCoordinates(location);
        if (coordinates != null) {
            getLogger().info("Parsed direct coordinates: " + coordinates[0] + ", " + coordinates[1]);
            return coordinates;
        }
        
        // If not coordinates, use the geocoding API
        String apiUrl = "https://maps.googleapis.com/maps/api/geocode/json";
        String apiKey = getApiKeyManager().getCurrentApiKey();

        String requestUrl = apiUrl + "?address=" + location.replace(" ", "+") + "&key=" + apiKey;
        URL url = URI.create(requestUrl).toURL();
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
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

    private void warnApiKeyExpired(CommandSender recipient) {
        if (recipient == null) return;
        recipient.sendMessage(ChatColor.RED + "Google API key is expired or missing.");
        recipient.sendMessage(ChatColor.YELLOW + "Enable Geocoding + Maps Tiles APIs and run /voxelapikey <your-key>.");
    }

    private void teleportAndLoadChunk(Player player, World world, int x, int z, int playerX, int playerZ) {
        final int chunkX = x;
        final int chunkZ = z;
        VoxelChunkGenerator generator = getVoxelChunkGenerator();

        generator.loadChunk(player.getUniqueId(), chunkX, chunkZ, true, (blockLocation) -> {
            Bukkit.getScheduler().runTask(this, () -> {
                if (!player.isOnline()) {
                    getMovementListener().cancelVisit(player.getUniqueId());
                    return;
                }

                Location safe = safeFromBlockAnchor(world, blockLocation, SPAWN_ABOVE_GROUND);
                if (safe == null) {
                    safe = findSafeSpawnAtXZ(world, playerX, playerZ, SPAWN_ABOVE_GROUND);
                }
                if (safe == null) {
                    safe = findNearestSafeSpawn(world, playerX, playerZ, SPAWN_ABOVE_GROUND);
                }
                if (safe == null) {
                    safe = world.getSpawnLocation();
                }
                if (safe == null) {
                    safe = player.getLocation();
                }

                player.teleport(safe);
                player.setFallDistance(0f);

                setPlayerSpawnSmart(player, safe);
                setWorldSpawnSmart(world, safe);

                getMovementListener().markVisitArrived(player.getUniqueId());
                player.sendMessage("You are now at: "
                        + safe.getBlockX() + ", " + safe.getBlockY() + ", " + safe.getBlockZ());
                player.sendMessage("Welcome to your destination!");
                getLogger().info("Teleported to safe: "
                        + safe.getBlockX() + ", " + safe.getBlockY() + ", " + safe.getBlockZ());
                generator.notifyProgress(player.getUniqueId(), 100, "Arrived");
            });
        });
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
