package com.example.voxelearth;

import com.sk89q.worldedit.EditSession;
import com.sk89q.worldedit.WorldEdit;
import com.sk89q.worldedit.bukkit.BukkitAdapter;
import com.sk89q.worldedit.math.BlockVector3;
import com.sk89q.worldedit.world.block.BlockState;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Chunk;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.generator.ChunkGenerator.ChunkData;
import org.bukkit.generator.WorldInfo;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scoreboard.DisplaySlot;
import org.bukkit.scoreboard.Objective;
import org.bukkit.scoreboard.Scoreboard;
import org.bukkit.scoreboard.ScoreboardManager;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.awt.Color;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BiConsumer;
import java.util.function.Consumer;

public class VoxelChunkGenerator extends ChunkGenerator {

    private static final double LAT_ORIGIN = 50.081033020810736;
    private static final double LNG_ORIGIN = 14.451093643141064;
    private static final String API_KEY = "AIzaSy..."; // Your API key here
    private TileDownloader tileDownloader;
    private final ConcurrentHashMap<String, IndexedTile> indexedBlocks = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, JavaCpuVoxelizer.VoxelPayload> voxelCache = new ConcurrentHashMap<>();
    private static final List<MaterialColor> MATERIAL_COLORS = new ArrayList<>();
    private Map<Integer, Material> colorToMaterialCache = new HashMap<>();
    private Map<UUID, double[]> playerOrigins = new ConcurrentHashMap<>();

    private Map<UUID, Integer> playerXOffsets = new ConcurrentHashMap<>();
    private Map<UUID, Integer> playerYOffsets = new ConcurrentHashMap<>();
    private Map<UUID, Integer> playerZOffsets = new ConcurrentHashMap<>();

    // Per-player Mercator anchor offsets (meters) for stabilized chunk<->lat/lng mapping
    private final Map<UUID, Double> anchorXXm = new ConcurrentHashMap<>();
    private final Map<UUID, Double> anchorZZm = new ConcurrentHashMap<>();

    // Island tiling near origin so each visit lands on its own base chunk
    private static final int ISLAND_STRIDE_CHUNKS = 2048; // ~15.6 km between islands at 0.476 m/block
    private static final int ISLAND_GRID_SPAN = 128;      // keeps base chunks within +/-262k
    private final Deque<int[]> islandBag = new ArrayDeque<>();
    private final Object islandBagLock = new Object();
    private final SecureRandom islandRandom = new SecureRandom();

    // Progress tracking (per player)
    private final Map<UUID, Integer> lastPct = new ConcurrentHashMap<>();
    private final Map<UUID, String> lastStage = new ConcurrentHashMap<>();
    // Scoreboard HUD state
    private final Map<UUID, Scoreboard> boards = new ConcurrentHashMap<>();
    private final Map<UUID, Objective>  objectives = new ConcurrentHashMap<>();
    private final Map<UUID, String>     prevBarEntry = new ConcurrentHashMap<>();
    private final Map<UUID, String>     prevStageEntry = new ConcurrentHashMap<>();
    private final Map<UUID, Scoreboard> previousBoards = new ConcurrentHashMap<>();
    private static final String SCOREBOARD_TITLE =
            ChatColor.AQUA + "Voxel Earth" + ChatColor.DARK_GRAY + " - " + ChatColor.WHITE + "© Google Earth";
    private static final int BAR_WIDTH = 20;
    private static final int MAX_STAGE_LEN = 26; // keep lines tidy

    private static void debug(String message) {
        Log.debug(message);
    }

    private static void debugf(String format, Object... args) {
        Log.debug(String.format(format, args));
    }

    private static void info(String message) {
        Log.info(message);
    }

    private static void warn(String message) {
        Log.warning(message);
    }

    // VISIT tile radius (for /visit)
    private volatile int visitTileRadius = 200;   // default; was 50 in earlier example
    public void setVisitTileRadius(int tiles) { this.visitTileRadius = Math.max(1, tiles); }
    public int getVisitTileRadius() { return visitTileRadius; }

    // MOVEMENT tile radius (for PlayerMovementListener-triggered loads)
    private volatile int moveTileRadius = 100;    // default; previously "single tile loading" ~25
    public void setMoveTileRadius(int tiles) { this.moveTileRadius = Math.max(1, tiles); }
    public int getMoveTileRadius() { return moveTileRadius; }

    // NEW: explicit "begin a fresh visit" hook
    public void beginVisit(UUID playerId) {
        playerOrigins.remove(playerId);
        playerXOffsets.remove(playerId);
        playerYOffsets.remove(playerId);
        playerZOffsets.remove(playerId);
        lastPct.remove(playerId);
        lastStage.remove(playerId);
        // clear any existing HUD
        hideProgressBoard(playerId);
    }

    // origin ecef
    private double[] originEcef; // [x0, y0, z0]

    // Default values for scale and offsets
    // private double scaleFactor = 2.97;
    private double scaleFactor = 2.1;
    private double metersPerBlock = scaleFactor;

    private double offsetX = 0.0;
    private double offsetY = 0.0;
    private double offsetZ = 0.0;
    private double scaleX = scaleFactor;
    private double scaleY = scaleFactor;
    private double scaleZ = scaleFactor;

    private static final long CLEANUP_INTERVAL = TimeUnit.HOURS.toMillis(1); // 1 hour

    // Prefer FAWE when available; fall back to BlockChanger automatically.
    private final boolean faweAvailable = detectFawe();
    private record Voxel(int x, int y, int z, Material material) {}

    private static final class VoxelizedTile {
        final String tileId;
        final JavaCpuVoxelizer.VoxelPayload payload;
        final double[] translation;

        VoxelizedTile(String tileId, JavaCpuVoxelizer.VoxelPayload payload, double[] translation) {
            this.tileId = tileId;
            this.payload = payload;
            this.translation = (translation != null) ? Arrays.copyOf(translation, translation.length) : null;
        }
    }

    private static final class IndexedTile {
        private final String tileId;
        private final List<Voxel> voxels;
        private final Map<Long, Material> lookup;
        private volatile boolean placed;

        IndexedTile(String tileId, List<Voxel> voxels) {
            this.tileId = tileId;
            this.voxels = Collections.unmodifiableList(new ArrayList<>(voxels));
            this.lookup = buildLookup(this.voxels);
        }

        List<Voxel> voxels() {
            return voxels;
        }

        boolean isPlaced() {
            return placed;
        }

        void markPlaced() {
            this.placed = true;
        }

        Material materialAt(int x, int y, int z) {
            return lookup.get(encodeBlockKey(x, y, z));
        }

        private static Map<Long, Material> buildLookup(List<Voxel> voxels) {
            Map<Long, Material> data = new HashMap<>(Math.max(16, voxels.size()));
            for (Voxel voxel : voxels) {
                data.put(encodeBlockKey(voxel.x(), voxel.y(), voxel.z()), voxel.material());
            }
            return data;
        }
    }

    public VoxelChunkGenerator() {
        debug("VoxelChunkGenerator initialized");
        debug("LAT_ORIGIN: " + LAT_ORIGIN + ", LNG_ORIGIN: " + LNG_ORIGIN);
        debug("Default scaleFactor (metersPerBlock): " + scaleFactor);
        debug("Using a tile radius of 25 for single tile loading.");

        tileDownloader = new TileDownloader(API_KEY, LNG_ORIGIN, LAT_ORIGIN, 25); 
        loadMaterialColors();
    }

    /** Update the per-player scoreboard HUD. pct=-1 marks an error. */
    public void notifyProgress(UUID playerId, int pct, String stage) {
        Player p = Bukkit.getPlayer(playerId);
        if (p == null) return;
        int prev = lastPct.getOrDefault(playerId, Integer.MIN_VALUE);
        String prevStage = lastStage.get(playerId);
        boolean important = (pct == 100 || pct == -1);
        if (!important && (Math.abs(pct - prev) < 2) && java.util.Objects.equals(prevStage, stage)) return;
        lastPct.put(playerId, pct);
        lastStage.put(playerId, stage);
        Bukkit.getScheduler().runTask(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
            ensureProgressBoard(p);
            Scoreboard board = boards.get(playerId);
            Objective  obj   = objectives.get(playerId);
            if (board == null || obj == null) return;

            int clamped = Math.max(0, Math.min(pct < 0 ? 0 : pct, 100));
            String barLine   = ChatColor.DARK_GRAY + "[" + ChatColor.GREEN + barBlocks(clamped) + ChatColor.GRAY + barSpaces(clamped) + ChatColor.DARK_GRAY + "] "
                             + ChatColor.WHITE + clamped + "%";
            String stageLine = (pct >= 0 ? ChatColor.GRAY.toString() : ChatColor.RED.toString()) + trimForScore(stage, MAX_STAGE_LEN);

            // update display title
            try { obj.setDisplayName(SCOREBOARD_TITLE); } catch (Throwable ignored) {}

            // replace previous entries with new ones (stable line order)
            String prevBar = prevBarEntry.get(playerId);
            if (prevBar != null) board.resetScores(prevBar);
            obj.getScore(barLine).setScore(2);
            prevBarEntry.put(playerId, barLine);

            String prevStageStr = prevStageEntry.get(playerId);
            if (prevStageStr != null) board.resetScores(prevStageStr);
            obj.getScore(stageLine).setScore(1);
            prevStageEntry.put(playerId, stageLine);

            // auto-hide after finish/error
            if (pct == 100 || pct == -1) {
                Bukkit.getScheduler().runTaskLater(
                        Bukkit.getPluginManager().getPlugin("VoxelEarth"),
                        () -> hideProgressBoard(playerId),
                        60L /* 3 seconds */
                );
            }
        });
    }

    // ===== Scoreboard helpers =====
    private void ensureProgressBoard(Player p) {
        UUID id = p.getUniqueId();
        if (!boards.containsKey(id)) {
            ScoreboardManager mgr = Bukkit.getScoreboardManager();
            if (mgr == null) return;
            Scoreboard board = mgr.getNewScoreboard();
            Objective obj;
            try {
                // legacy signature that stays compatible
                obj = board.registerNewObjective("visit", "dummy", SCOREBOARD_TITLE);
            } catch (Throwable t) {
                // extremely defensive: fallback without title
                obj = board.registerNewObjective("visit", "dummy");
                try { obj.setDisplayName(SCOREBOARD_TITLE); } catch (Throwable ignored) {}
            }
            obj.setDisplaySlot(DisplaySlot.SIDEBAR);
            boards.put(id, board);
            objectives.put(id, obj);
            // stash the player's previous board to restore later
            previousBoards.putIfAbsent(id, p.getScoreboard());
            p.setScoreboard(board);
        }
    }

    private void hideProgressBoard(UUID id) {
        Player p = Bukkit.getPlayer(id);
        if (p == null) return;
        Scoreboard board = boards.remove(id);
        Objective obj = objectives.remove(id);
        if (board != null && obj != null) {
            try { obj.unregister(); } catch (Throwable ignored) {}
        }
        prevBarEntry.remove(id);
        prevStageEntry.remove(id);
        Scoreboard prev = previousBoards.remove(id);
        if (prev != null) p.setScoreboard(prev);
        else {
            ScoreboardManager mgr = Bukkit.getScoreboardManager();
            if (mgr != null) p.setScoreboard(mgr.getMainScoreboard());
        }
    }

    private String barBlocks(int pct) {
        int total = BAR_WIDTH;
        int filled = (int)Math.round((pct / 100.0) * total);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < filled; i++) sb.append('#');
        return sb.toString();
    }
    private String barSpaces(int pct) {
        int total = BAR_WIDTH;
        int filled = (int)Math.round((pct / 100.0) * total);
        StringBuilder sb = new StringBuilder();
        for (int i = filled; i < total; i++) sb.append('-');
        return sb.toString();
    }
    private String trimForScore(String s, int max) {
        if (s == null) return "";
        if (s.length() <= max) return s;
        return s.substring(0, Math.max(0, max - 1)) + "...";
    }

    private boolean detectFawe() {
        try {
            // Make sure plugin is present & enabled
            org.bukkit.plugin.Plugin p = org.bukkit.Bukkit.getPluginManager().getPlugin("FastAsyncWorldEdit");
            if (p == null || !p.isEnabled()) return false;
            // Verify critical WorldEdit classes exist at runtime
            Class.forName("com.sk89q.worldedit.WorldEdit");
            Class.forName("com.sk89q.worldedit.bukkit.BukkitAdapter");
            Class.forName("com.sk89q.worldedit.math.BlockVector3");
            Class.forName("com.sk89q.worldedit.util.SideEffectSet");
            Class.forName("com.sk89q.worldedit.world.World");
            return true;
        } catch (Throwable t) {
            return false;
        }
    }


    public void regenChunks(World world, 
                            double scaleX, double scaleY, double scaleZ, 
                            double newOffsetX, double newOffsetY, double newOffsetZ) {

        debug("regenChunks called with scaleX=" + scaleX + ", scaleY=" + scaleY + ", scaleZ=" + scaleZ);
        debug("offsets: X=" + newOffsetX + ", Y=" + newOffsetY + ", Z=" + newOffsetZ);

        indexedBlocks.clear();
        loadMaterialColors();
        debug("MATERIAL_COLORS size: " + MATERIAL_COLORS.size());

        this.offsetX = newOffsetX;
        this.offsetY = newOffsetY;
        this.offsetZ = newOffsetZ;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.scaleZ = scaleZ;

        debug("Starting block removal and regeneration...");
        List<Chunk> chunksToProcess = new ArrayList<>();

        for (int chunkX = -20; chunkX <= 20; chunkX++) {
            for (int chunkZ = -20; chunkZ <= 20; chunkZ++) {
                Chunk chunk = world.getChunkAt(chunkX, chunkZ);
                if (!chunk.isLoaded()) chunk.load();
                chunksToProcess.add(chunk);
            }
        }

        try {
            downloadAndProcessTiles(0, 0);
        } catch (Exception e) {
            debug("Failed to load indexed JSON blocks.");
            e.printStackTrace();
        }

        processChunksInBatches(chunksToProcess, world);
    }

    private void processChunksInBatches(List<Chunk> chunks, World world) {
        AtomicInteger currentIndex = new AtomicInteger(0);
        int batchSize = 1;

        Bukkit.getScheduler().runTaskTimer(Bukkit.getPluginManager().getPlugin("VoxelEarth"), task -> {
            if (currentIndex.get() >= chunks.size()) {
                debug("All chunks processed and blocks placed.");
                task.cancel();
                return;
            }

            Chunk chunk = chunks.get(currentIndex.getAndIncrement());

            for (int x = 0; x < 16; x++) {
                for (int y = 0; y < world.getMaxHeight(); y++) {
                    for (int z = 0; z < 16; z++) {
                        Block block = chunk.getBlock(x, y, z);

                        if (block.getType() != Material.AIR) {
                            BlockChanger.setSectionBlockAsynchronously(block.getLocation(), new ItemStack(Material.AIR), false);
                        }

                        placeNewBlock(chunk, x, y, z, world);
                    }
                }
            }
        }, 0L, 2L);
    }

    private void placeNewBlock(Chunk chunk, int x, int y, int z, World world) {
        for (IndexedTile tile : indexedBlocks.values()) {
            if (tile == null || tile.isPlaced()) continue;
            Material material = tile.materialAt(x, y, z);
            if (material != null) {
                BlockChanger.setSectionBlockAsynchronously(chunk.getBlock(x, y, z).getLocation(), new ItemStack(material), false);
                tile.markPlaced();
            }
        }
    }

    public void loadMaterialColors() {
        debug("Loading material colors...");
        try (InputStream is = getClass().getResourceAsStream("/vanilla.atlas")) {
            if (is == null) {
                debug("vanilla.atlas not found in resources.");
                return;
            }
            JSONObject atlasJson = new JSONObject(new JSONTokener(is));
            JSONArray blocksArray = atlasJson.getJSONArray("blocks");

            for (int i = 0; i < blocksArray.length(); i++) {
                JSONObject blockObject = blocksArray.getJSONObject(i);
                String blockName = blockObject.getString("name");

                Material material = getMaterial(blockName);

                JSONObject colourObject = blockObject.getJSONObject("colour");
                int r = (int) (colourObject.getDouble("r") * 255);
                int g = (int) (colourObject.getDouble("g") * 255);
                int b = (int) (colourObject.getDouble("b") * 255);

                MATERIAL_COLORS.add(new MaterialColor(material, new Color(r, g, b)));
                debugf("Loaded material: %s with color: (%d, %d, %d)", material, r, g, b);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private Material getMaterial(String blockName) {
        String formattedName = blockName.replace("minecraft:", "").toUpperCase()
                                        .replace("_", " ").replace(" ", "_");

        Material material = Material.matchMaterial(formattedName);
        if (material == null) {
            if (formattedName.contains("LOG_HORIZONTAL")) {
                material = Material.matchMaterial(formattedName.replace("_HORIZONTAL", ""));
            } else if (formattedName.matches("FROSTED_ICE_\\d")) {
                material = Material.ICE;
            } else {
                debugf("Material not found for block: %s. Using STONE as fallback.", formattedName);
                material = Material.STONE;
            }
        }
        return material;
    }

    private void downloadAndProcessTiles(int chunkX, int chunkZ) {
        try {
            debug("Calling downloadTiles for single tile load at radius 25");
            debug("Set coordinates: lng=" + LNG_ORIGIN + ", lat=" + LAT_ORIGIN);
            tileDownloader.setCoordinates(LNG_ORIGIN, LAT_ORIGIN);
            List<TileDownloader.TilePayload> downloadedTiles = tileDownloader.downloadTiles();
            debug("Downloaded tiles: " + downloadedTiles.size());
            if (downloadedTiles.isEmpty()) {
                debug("No new tiles were downloaded.");
                return;
            }
            List<VoxelizedTile> voxelTiles = voxelizeTiles(downloadedTiles, null);
            ingestVoxelizedTiles(voxelTiles, chunkX, chunkZ, null);
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }

    private List<VoxelizedTile> voxelizeTiles(List<TileDownloader.TilePayload> tiles, UUID playerId) {
        if (tiles == null || tiles.isEmpty()) return Collections.emptyList();
        JavaCpuVoxelizer voxelizer = new JavaCpuVoxelizer(128, true, false);
        List<VoxelizedTile> results = new ArrayList<>(tiles.size());
        for (int i = 0; i < tiles.size(); i++) {
            TileDownloader.TilePayload tile = tiles.get(i);
            try {
                JavaCpuVoxelizer.VoxelPayload payload = voxelCache.get(tile.tileId());
                if (payload != null) {
                debug("Voxel cache hit: " + tile.tileId());
                } else {
                debug("Voxel cache miss: " + tile.tileId());
                    payload = voxelizer.voxelizeToMemory(tile.tileId(), tile.glbBytes());
                    if (payload != null) {
                        voxelCache.put(tile.tileId(), payload);
                    }
                }
                if (payload != null) {
                    results.add(new VoxelizedTile(tile.tileId(), payload, tile.translation()));
                }
            } catch (Exception e) {
                warn("Voxelizer failed for " + tile.tileId() + ": " + e.getMessage());
                if (playerId != null) notifyProgress(playerId, -1, "Voxelizer failed for " + tile.tileId());
            }
            if (playerId != null) {
                int pct = 55 + (int) Math.floor(15.0 * (i + 1) / Math.max(1, tiles.size()));
                notifyProgress(playerId, pct, "Voxelized " + (i + 1) + "/" + tiles.size());
            }
        }
        return results;
    }

    private void ingestVoxelizedTiles(List<VoxelizedTile> voxelTiles, int chunkX, int chunkZ, UUID playerId) {
        if (voxelTiles == null || voxelTiles.isEmpty()) return;
        int numThreads = Math.max(1, Math.min(Runtime.getRuntime().availableProcessors(), voxelTiles.size()));
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        AtomicInteger processed = new AtomicInteger(0);
        List<Future<?>> futures = new ArrayList<>();
        for (VoxelizedTile tile : voxelTiles) {
            futures.add(executor.submit(() -> {
                try {
                    processVoxelizedTile(tile, chunkX, chunkZ);
                } catch (Exception e) {
                    debug("Error loading voxel tile " + tile.tileId + ": " + e.getMessage());
                } finally {
                    if (playerId != null) {
                        int now = processed.incrementAndGet();
                        int pct = 72 + (int) Math.floor(13.0 * now / Math.max(1, voxelTiles.size()));
                        notifyProgress(playerId, pct, "Indexed " + now + "/" + voxelTiles.size());
                    }
                }
            }));
        }
        for (Future<?> future : futures) {
            try {
                future.get();
            } catch (InterruptedException | ExecutionException ignored) {}
        }
        executor.shutdown();
    }

    private void processVoxelizedTile(VoxelizedTile tile, int chunkX, int chunkZ) {
        double[] rawTranslation = tile.translation;
        double[] tileTranslation = new double[3];
        boolean hasRawTranslation = rawTranslation != null && rawTranslation.length >= 3;
        if (hasRawTranslation) {
            tileTranslation[0] = (rawTranslation[0] * scaleX) + offsetX + (chunkX * 16);
            tileTranslation[1] = (rawTranslation[1] * scaleY) + offsetY;
            tileTranslation[2] = (rawTranslation[2] * scaleZ) + offsetZ + (chunkZ * 16);
            debug("Computed tileTranslation: (" + tileTranslation[0] + ", " + tileTranslation[1] + ", " + tileTranslation[2] + ")");
        }

        Map<Integer, Material> colorIndexToMaterial = new HashMap<>();
        for (Map.Entry<Integer, int[]> entry : tile.payload.palette().entrySet()) {
            colorIndexToMaterial.put(entry.getKey(), mapRgbaToMaterial(entry.getValue()));
        }

        List<Voxel> voxels = new ArrayList<>(tile.payload.xyzi().size());
        int minX = Integer.MAX_VALUE, minY = Integer.MAX_VALUE, minZ = Integer.MAX_VALUE;
        int maxX = Integer.MIN_VALUE, maxY = Integer.MIN_VALUE, maxZ = Integer.MIN_VALUE;

        for (int[] xyzi : tile.payload.xyzi()) {
            int x = xyzi[0];
            int y = xyzi[1];
            int z = xyzi[2];
            int colorIndex = xyzi[3];

            int translatedX = (int) Math.round(x + tileTranslation[0]);
            int translatedY = (int) Math.round(y + tileTranslation[1]);
            int translatedZ = (int) Math.round(z + tileTranslation[2]);

            Material material = colorIndexToMaterial.get(colorIndex);
            if (material != null) {
                voxels.add(new Voxel(translatedX, translatedY, translatedZ, material));
                if (translatedX < minX) minX = translatedX;
                if (translatedY < minY) minY = translatedY;
                if (translatedZ < minZ) minZ = translatedZ;
                if (translatedX > maxX) maxX = translatedX;
                if (translatedY > maxY) maxY = translatedY;
                if (translatedZ > maxZ) maxZ = translatedZ;
            }
        }

        IndexedTile indexed = new IndexedTile(tile.tileId, voxels);
        indexedBlocks.put(tile.tileId, indexed);
        debug("Loaded tile: " + tile.tileId + " with " + voxels.size() + " blocks.");
        debug("Block bounding box for " + tile.tileId + ": X[" + minX + "," + maxX + "] Y[" + minY + "," + maxY + "] Z[" + minZ + "," + maxZ + "]");
    }


    private static final double MAX_COLOR_DISTANCE = 30.0;

    private Material mapRgbaToMaterial(JSONArray rgbaArray) {
        return mapRgbaToMaterial(rgbaArray.getInt(0), rgbaArray.getInt(1), rgbaArray.getInt(2));
    }

    private Material mapRgbaToMaterial(int[] rgba) {
        if (rgba == null || rgba.length < 3) return Material.STONE;
        return mapRgbaToMaterial(rgba[0], rgba[1], rgba[2]);
    }

    private Material mapRgbaToMaterial(int r, int g, int b) {

        Color voxelColor = new Color(r, g, b);
        double[] voxelLab = ColorUtils.rgbToLab(voxelColor);

        MaterialColor bestMatch = null;
        double minDeltaE = Double.MAX_VALUE;

        for (MaterialColor mc : MATERIAL_COLORS) {
            Color materialColor = mc.getColor();
            double[] materialLab = ColorUtils.rgbToLab(materialColor);
            double deltaE = ColorUtils.deltaE(voxelLab, materialLab);

            if (deltaE < minDeltaE) {
                minDeltaE = deltaE;
                bestMatch = mc;
            }
        }

        if (bestMatch != null && minDeltaE <= 10.0) {
            return bestMatch.getMaterial();
        } else {
            debugf("No suitable match for color (%d, %d, %d). Using STONE", r, g, b);
            return Material.STONE;
        }
    }

    private double colorDistance(Color c1, Color c2) {
        int dr = c1.getRed() - c2.getRed();
        int dg = c1.getGreen() - c2.getGreen();
        int db = c1.getBlue() - c2.getBlue();
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    public void loadJson(String filename, double scaleX, double scaleY, double scaleZ, double offsetX, double offsetY, double offsetZ) throws IOException {
        File file = new File(filename);
        if (!file.exists()) {
        debug("File " + filename + " does not exist.");
            return;
        }

        indexedBlocks.clear();

        String baseName = file.getName().replace(".json", "");
        try (FileReader reader = new FileReader(file)) {
            JSONObject json = new JSONObject(new JSONTokener(reader));

            double[] tileTranslation = new double[3];

            if (!json.has("blocks") || !json.has("xyzi")) {
                debug("JSON file " + filename + " missing 'blocks' or 'xyzi'.");
                return;
            }

            JSONObject blocksObject = json.getJSONObject("blocks");
            JSONArray xyziArray = json.getJSONArray("xyzi");
            List<Voxel> voxels = new ArrayList<>(xyziArray.length());

            Map<Integer, Material> colorIndexToMaterial = new HashMap<>();
            Iterator<String> keys = blocksObject.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                int colorIndex = Integer.parseInt(key);
                JSONArray rgbaArray = blocksObject.getJSONArray(key);

                Material material = mapRgbaToMaterial(rgbaArray);
                colorIndexToMaterial.put(colorIndex, material);
            }

            for (int i = 0; i < xyziArray.length(); i++) {
                JSONArray xyziEntry = xyziArray.getJSONArray(i);
                int x = xyziEntry.getInt(0);
                int y = xyziEntry.getInt(1);
                int z = xyziEntry.getInt(2);
                int colorIndex = xyziEntry.getInt(3);

                int translatedX = (int) ((x * scaleX + offsetX));
                int translatedY = (int) ((y * scaleY + offsetY));
                int translatedZ = (int) ((z * scaleZ + offsetZ));

                Material material = colorIndexToMaterial.get(colorIndex);

                if (material != null) {
                    voxels.add(new Voxel(translatedX, translatedY, translatedZ, material));
                }
            }

            indexedBlocks.put(baseName, new IndexedTile(baseName, voxels));

            Bukkit.getScheduler().runTask(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
            debug("Starting chunk regeneration after loadJson...");
            debug("IndexedBlocks length: " + indexedBlocks.size());

                World world = Bukkit.getWorld("world");
                if (world == null) {
                    debug("World not found in loadJson placement.");
                    return;
                }

                for (Map.Entry<String, IndexedTile> tileEntry : indexedBlocks.entrySet()) {
                    IndexedTile tile = tileEntry.getValue();
                    if (tile == null || tile.isPlaced()) continue;
                    placeBlocks(world, tile.voxels(), 0);
                    tile.markPlaced();
                }
                debug("JSON generated.");
            });

            debug("Loaded JSON file: " + filename);
        }
    }

    @Override
    public void generateSurface(WorldInfo worldInfo, Random random, int chunkX, int chunkZ, ChunkData chunkData) {
        // Not generating anything directly here
    }

    public void loadChunk(UUID playerUUID, int tileX, int tileZ, boolean isVisit, Consumer<int[]> callback) {
        Bukkit.getScheduler().runTaskAsynchronously(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
            try {
                // Global origin (unchanged)
                File originTranslationFile = new File("origin_translation.json");
                if (originTranslationFile.exists()) {
                    try (FileReader reader = new FileReader(originTranslationFile)) {
                        JSONArray originArray = new JSONArray(new JSONTokener(reader));
                        originEcef = new double[]{
                            originArray.getDouble(0),
                            -originArray.getDouble(2),
                            originArray.getDouble(1)
                        };
                    }
                }

                // CHANGED: handle origin based on visit/non-visit
                if (isVisit) {
                    // Fresh visit -> clear any stale state and force null origin
                    beginVisit(playerUUID); // NEW
                    tileDownloader.setOrigin(null); // NEW: ensure no stale origin affects voxelization
                } else {
                    double[] playerOrigin = playerOrigins.get(playerUUID);
                    tileDownloader.setOrigin(playerOrigin); // may be null; that's fine
                }

                int[] blockLocation = new int[]{210, 70, 0};

                double[] latLng = minecraftToLatLng(playerUUID, tileX, tileZ);
                debug("loadChunk: tileX=" + tileX + ", tileZ=" + tileZ + " -> lat/lng=" + latLng[0] + "," + latLng[1]);

                tileDownloader.setCoordinates(latLng[1], latLng[0]);
                notifyProgress(playerUUID, 15, "Preparing download ...");
                
                // ðŸ”´ THIS is the key line:
                int activeRadius = isVisit ? getVisitTileRadius() : getMoveTileRadius();
                tileDownloader.setRadius(activeRadius);

                debug("Downloading single tile at lat=" + latLng[0] + ", lng=" + latLng[1] + " with radius " + activeRadius);
                notifyProgress(playerUUID, 20, "Downloading tiles ...");
                List<TileDownloader.TilePayload> downloadedTiles = tileDownloader.downloadTiles();
                debug("Downloaded tile payloads: " + downloadedTiles.size());

                if (downloadedTiles.isEmpty()) {
                    debug("No tiles downloaded.");
                    notifyProgress(playerUUID, -1, "No tiles available for this area.");
                    callback.accept(blockLocation);
                    return;
                }

                debug("Running voxelizer for in-memory tiles...");
                notifyProgress(playerUUID, 55, "Preparing voxelizer ...");
                List<VoxelizedTile> voxelTiles = voxelizeTiles(downloadedTiles, playerUUID);
                if (voxelTiles.isEmpty()) {
                    notifyProgress(playerUUID, -1, "Voxelization failed.");
                    callback.accept(blockLocation);
                    return;
                }

                Set<String> previousKeys = new HashSet<>(indexedBlocks.keySet());

                int adjustedTileX = tileX;
                int adjustedTileZ = tileZ;

                if (isVisit) {
                    playerXOffsets.put(playerUUID, tileX);
                    playerZOffsets.put(playerUUID, tileZ);
                    debug("Visit mode: storing offsets tileX=" + tileX + ", tileZ=" + tileZ);
                } else {
                    Integer storedXOffset = playerXOffsets.get(playerUUID);
                    Integer storedZOffset = playerZOffsets.get(playerUUID);
                    if (storedXOffset != null) adjustedTileX = storedXOffset;
                    if (storedZOffset != null) adjustedTileZ = storedZOffset;
                    debug("Non-visit mode: using stored offsets adjustedTileX=" + adjustedTileX + ", adjustedTileZ=" + adjustedTileZ);
                }

                ingestVoxelizedTiles(voxelTiles, adjustedTileX, adjustedTileZ, playerUUID);
                Set<String> currentKeys = new HashSet<>(indexedBlocks.keySet());
                currentKeys.removeAll(previousKeys);

                String initialTileKey = null;
                if (!currentKeys.isEmpty()) {
                    initialTileKey = currentKeys.iterator().next();
                } else if (!indexedBlocks.isEmpty()) {
                    initialTileKey = indexedBlocks.keySet().iterator().next();
                } else {
                    debug("No tiles loaded, cannot compute block location.");
                    callback.accept(blockLocation);
                    return;
                }

                debug("Initial tile key: " + initialTileKey);

                final AtomicInteger yOffset = new AtomicInteger(0);
                final int desiredY = 70;

                debug("Starting chunk regeneration...");
                debug("IndexedBlocks size: " + indexedBlocks.size());
                notifyProgress(playerUUID, 90, "Placing blocks ...");

                World world = Bukkit.getWorld("world");
                if (world == null) {
                    debug("World 'world' not found!");
                    notifyProgress(playerUUID, -1, "World not found");
                    callback.accept(blockLocation);
                    return;
                }

                IndexedTile indexMap1 = indexedBlocks.get(initialTileKey);
                if (indexMap1 != null) {
                    int minYInTile = indexMap1.voxels().stream()
                            .mapToInt(Voxel::y)
                            .min()
                            .orElse(0);

                    yOffset.set(desiredY - minYInTile);
                debug("Computed yOffset: " + yOffset.get());

                if (isVisit) {
                    double[] discoveredOrigin = tileDownloader.getOrigin();
                    if (discoveredOrigin != null) {
                        double[] originCopy = Arrays.copyOf(discoveredOrigin, discoveredOrigin.length);
                        playerOrigins.put(playerUUID, originCopy);
                        debug("Storing player origin from TileDownloader: " + Arrays.toString(originCopy));
                    } else {
                        debug("TileDownloader did not report an origin for this download.");
                    }
                    playerYOffsets.put(playerUUID, yOffset.get());
                } else {
                    Integer storedYOffset = playerYOffsets.get(playerUUID);
                    if (storedYOffset != null) {
                        yOffset.set(storedYOffset);
                        debug("Using stored yOffset: " + yOffset.get());
                    }
                }

                    if (!indexMap1.isPlaced()) {
                        debug("Placing blocks for initial tile...");
                        notifyProgress(playerUUID, 92, "Placing first tile ...");
                        placeBlocks(world, indexMap1.voxels(), yOffset.get());
                        indexMap1.markPlaced();
                    }

                    if (!indexMap1.voxels().isEmpty()) {
                        Voxel first = indexMap1.voxels().get(0);
                        blockLocation[0] = first.x();
                        blockLocation[1] = first.y() + yOffset.get();
                        blockLocation[2] = first.z();

                        debug("First block location: " + Arrays.toString(blockLocation));
                    }
                }

                final String finalInitialTileKey = initialTileKey;

                indexedBlocks.forEach((tileKey, indexMap) -> {
                    if (!tileKey.equals(finalInitialTileKey) && indexMap != null && !indexMap.isPlaced()) {
                        debug("Placing blocks for secondary tile: " + tileKey);
                        // Avoid long filenames in HUD; keep it tidy.
                        notifyProgress(playerUUID, 94, "Placing blocks ...");
                        placeBlocks(world, indexMap.voxels(), yOffset.get());
                        indexMap.markPlaced();
                    }
                });

                debug("Chunk regeneration completed.");
                if (isVisit) {
                    notifyProgress(playerUUID, 98, "Teleporting ...");
                } else {
                    // Movement loads shouldn't get stuck--settle on Idle.
                    notifyProgress(playerUUID, 0, "Idle");
                }
                callback.accept(blockLocation);

            } catch (IOException | InterruptedException e) {
                debug("Exception in loadChunk:");
                e.printStackTrace();
                int[] blockLocation = new int[]{210, 70, 0};
                notifyProgress(playerUUID, -1, "Load failed: " + e.getMessage());
                callback.accept(blockLocation);
            }
        });
    }

    private void placeBlocks(World world, List<Voxel> blockList, int yOffset) {
        if (blockList == null || blockList.isEmpty()) {
            return;
        }
        if (faweAvailable && placeBlocksWithFaweSession(world, blockList, yOffset)) {
            return;
        }
        fallbackPlaceBlocksWithBlockChanger(world, blockList, yOffset);
    }

    private boolean placeBlocksWithFaweSession(World world, List<Voxel> blockList, int yOffset) {
        if (world == null) {
            return false;
        }
        Set<Chunk> modifiedChunks = ConcurrentHashMap.newKeySet();
        try (EditSession editSession = WorldEdit.getInstance()
                .newEditSessionBuilder()
                .world(BukkitAdapter.adapt(world))
                .build()) {
            for (Voxel voxel : blockList) {
                int x = voxel.x();
                int y = voxel.y() + yOffset;
                int z = voxel.z();
                if (y < world.getMinHeight() || y >= world.getMaxHeight()) {
                    continue;
                }
                Material material = voxel.material();
                if (material == null || !material.isBlock()) {
                    continue;
                }
                BlockState state = BukkitAdapter.adapt(material.createBlockData());
                editSession.setBlock(BlockVector3.at(x, y, z), state);
                modifiedChunks.add(world.getChunkAt(x >> 4, z >> 4));
            }
        } catch (Throwable t) {
            debug("placeBlocksWithFaweSession error: " + t);
            return false;
        }
        return true;
    }

    private void fallbackPlaceBlocksWithBlockChanger(World world, List<Voxel> blockList, int yOffset) {
        Set<Chunk> modifiedChunks = ConcurrentHashMap.newKeySet();
        for (Voxel voxel : blockList) {
            int newX = voxel.x();
            int newY = voxel.y() + yOffset;
            int newZ = voxel.z();

            if (world == null) continue;
            if (newY < world.getMinHeight() || newY >= world.getMaxHeight()) continue;

            int blockChunkX = newX >> 4;
            int blockChunkZ = newZ >> 4;
            Chunk chunk = world.getChunkAt(blockChunkX, blockChunkZ);
            if (!chunk.isLoaded()) chunk.load();

            int localX = newX & 15;
            int localZ = newZ & 15;

            Material material = voxel.material();
            if (material == null || !material.isBlock()) {
                throw new IllegalArgumentException("Invalid block material: " + material);
            }

            ItemStack itemStack = new ItemStack(material);
            BlockChanger.setSectionBlockAsynchronously(
                chunk.getBlock(localX, newY, localZ).getLocation(),
                itemStack,
                false
            );

            modifiedChunks.add(world.getChunkAt(blockChunkX, blockChunkZ));
        }
    }

    private static long encodeBlockKey(int x, int y, int z) {
        long lx = ((long) x) & 0x3FFFFFFL;
        long ly = ((long) y) & 0xFFFL;
        long lz = ((long) z) & 0x3FFFFFFL;
        return (lx << 38) | (lz << 12) | ly;
    }

    private static final double EARTH_RADIUS = 6378137.0;  
    private static final int CHUNK_SIZE = 16;  

    // private double[] latLngToMeters(double lat, double lng) {
    //     double x = lng * (Math.PI / 180) * EARTH_RADIUS;
    //     double z = Math.log(Math.tan((Math.PI / 4) + Math.toRadians(lat) / 2)) * EARTH_RADIUS;
    //     return new double[]{x, z};
    // }

    int oldOffsetXX = 7677201 - 7677296; // -95
    int oldOffsetZZ = -11936601 - (-11937070); // 469

    // int newOffsetXX = oldOffsetXX * 5;
    // int newOffsetZZ = oldOffsetZZ * 5;
    
// Decide on final constants:
// metersPerBlock = 2.1
// metersPerChunk = 2.1 * 16 = 33.6
// Suppose old offsets were chosen for the old scale; now multiply them by 5 to compensate.
int newOffsetXX = oldOffsetXX *0;//* 5; // -475
int newOffsetZZ = oldOffsetZZ *0;//* 5; // 2345

// Try removing 1.00037 and 0.99999. If you must keep them, ensure they are used in both directions consistently.

private static final double BLOCKS_PER_METER = 2.1;

// So the inverse must be used when turning *blocks -> meters* for lat/lng:
private static final double METERS_PER_BLOCK = 1.0 / BLOCKS_PER_METER; // 0.476190476...
private double metersPerChunk() {
    return CHUNK_SIZE * METERS_PER_BLOCK;  // 16 / 2.1 = 7.6190476 m per chunk
}

public int[] computeIslandBaseFor(double lat, double lng) {
    int gNorth = (int)Math.floor((lat + 90.0)  / 180.0 * ISLAND_GRID_SPAN) - ISLAND_GRID_SPAN / 2;
    int gEast  = (int)Math.floor((lng + 180.0) / 360.0 * ISLAND_GRID_SPAN) - ISLAND_GRID_SPAN / 2;

    int baseChunkX = gNorth * ISLAND_STRIDE_CHUNKS; // X <- latitude (north/south)
    int baseChunkZ = gEast  * ISLAND_STRIDE_CHUNKS; // Z <- longitude (east/west)
    return new int[]{ baseChunkX, baseChunkZ };
}

private void refillIslandBagLocked() {
    List<int[]> fresh = new ArrayList<>(ISLAND_GRID_SPAN * ISLAND_GRID_SPAN);
    int half = ISLAND_GRID_SPAN / 2;
    for (int gx = -half; gx < half; gx++) {
        for (int gz = -half; gz < half; gz++) {
            fresh.add(new int[]{ gx * ISLAND_STRIDE_CHUNKS, gz * ISLAND_STRIDE_CHUNKS });
        }
    }
    Collections.shuffle(fresh, islandRandom);
    islandBag.clear();
    islandBag.addAll(fresh);
}

public int[] allocateNewIslandBase() {
    synchronized (islandBagLock) {
        if (islandBag.isEmpty()) {
            refillIslandBagLocked();
        }
        int[] coords = islandBag.pollFirst();
        if (coords == null) {
            // This should never happen, but fall back to origin to avoid NPEs.
            return new int[]{0, 0};
        }
        return new int[]{ coords[0], coords[1] };
    }
}




public void setPlayerAnchor(UUID playerId, double lat, double lng, int baseChunkX, int baseChunkZ) {

    if (playerId == null) return;



    double mx = Math.toRadians(lng) * EARTH_RADIUS;

    double my = Math.log(Math.tan(Math.PI / 4.0 + Math.toRadians(lat) / 2.0)) * EARTH_RADIUS;



    double metersZ = -mx;

    double metersX = -my;



    double metersPerChunk = metersPerChunk();

    double offXX = metersX - baseChunkX * metersPerChunk;

    double offZZ = metersZ - baseChunkZ * metersPerChunk;



    anchorXXm.put(playerId, offXX);

    anchorZZm.put(playerId, offZZ);

}



public double[] minecraftToLatLng(UUID playerId, int chunkX, int chunkZ) {

    if (playerId == null) {

        return minecraftToLatLng(chunkX, chunkZ);

    }



    Double offXX = anchorXXm.get(playerId);

    Double offZZ = anchorZZm.get(playerId);

    if (offXX == null || offZZ == null) {

        return minecraftToLatLng(chunkX, chunkZ);

    }



    double metersPerChunk = metersPerChunk();

    double metersZ = (chunkX * metersPerChunk + offXX);

    double metersX = ((chunkZ * metersPerChunk + offZZ));



    metersX = -metersX;

    metersZ = -metersZ;



    double lng = (metersX / EARTH_RADIUS) * (180 / Math.PI);

    double lat = (2 * Math.atan(Math.exp(metersZ / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI);



    return new double[]{lat, lng};

}



public int[] latLngToMinecraft(UUID playerId, double lat, double lng) {

    if (playerId == null) {

        return latLngToMinecraft(lat, lng);

    }



    Double offXX = anchorXXm.get(playerId);

    Double offZZ = anchorZZm.get(playerId);

    if (offXX == null || offZZ == null) {

        return latLngToMinecraft(lat, lng);

    }



    double mx = Math.toRadians(lng) * EARTH_RADIUS;

    double my = Math.log(Math.tan(Math.PI / 4.0 + Math.toRadians(lat) / 2.0)) * EARTH_RADIUS;



    double metersZ = -mx;

    double metersX = -my;



    double metersPerChunk = metersPerChunk();

    int chunkZ = (int) Math.floor((metersZ - offZZ) / metersPerChunk);

    int chunkX = (int) Math.floor((metersX - offXX) / metersPerChunk);



    return new int[]{chunkX, chunkZ};

}



public double[] minecraftToLatLng(int chunkX, int chunkZ) {
    double metersPerChunk = metersPerChunk();

    // Convert chunk coords to meters
    double metersZ = (chunkX * metersPerChunk + newOffsetXX);
    double metersX = ((chunkZ * metersPerChunk + newOffsetZZ)); // Removed the negative

    // Invert metersX and metersZ to reverse the signs
    metersX = -metersX;
    metersZ = -metersZ;

    // Now convert metersX, metersZ (Web Mercator) back to lat/lng
    double lng = (metersX / EARTH_RADIUS) * (180 / Math.PI);
    double lat = (2 * Math.atan(Math.exp(metersZ / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI);

    return new double[]{lat, lng};
}

public int[] latLngToMinecraft(double lat, double lng) {
    double[] meters = latLngToMeters(lat, lng);
    double metersPerChunk = metersPerChunk();

    double metersZ = meters[0];
    double metersX = meters[1];

    // Invert metersX and metersZ to reverse the signs
    metersX = -metersX;
    metersZ = -metersZ;

    int chunkX = (int)((metersX - newOffsetXX) / metersPerChunk);
    int chunkZ = (int)((metersZ - newOffsetZZ) / metersPerChunk); // Removed the negation from here as well

    return new int[]{chunkX, chunkZ};
}

private double[] latLngToMeters(double lat, double lng) {
    double x = lng * (Math.PI / 180) * EARTH_RADIUS;
    double z = Math.log(Math.tan((Math.PI / 4) + Math.toRadians(lat) / 2)) * EARTH_RADIUS;
    return new double[]{x, z};
}


    private double sinLat0, cosLat0, sinLon0, cosLon0;

    private static final double a = 6378137.0; 
    private static final double f = 1 / 298.257223563; 
    private static final double b = a * (1 - f); 
    private static final double eSq = (a * a - b * b) / (a * a); 
    private static final double eSqPrime = (a * a - b * b) / (b * b); 

    private double[] enuToEcef(double east, double north, double up) {
        double sinLat0 = Math.sin(Math.toRadians(LAT_ORIGIN));
        double cosLat0 = Math.cos(Math.toRadians(LAT_ORIGIN));
        double sinLon0 = Math.sin(Math.toRadians(LNG_ORIGIN));
        double cosLon0 = Math.cos(Math.toRadians(LNG_ORIGIN));

        double xEast = -sinLon0 * east - sinLat0 * cosLon0 * north + cosLat0 * cosLon0 * up;
        double yNorth = cosLon0 * east - sinLat0 * sinLon0 * north + cosLat0 * sinLon0 * up;
        double zUp = cosLat0 * north + sinLat0 * up;

        double xEcef = xEast + originEcef[0];
        double yEcef = yNorth + originEcef[1];
        double zEcef = zUp + originEcef[2];

        return new double[]{xEcef, yEcef, zEcef};
    }

    private double[] ecefToLatLng(double x, double y, double z) {
        double longitude = Math.atan2(y, x);

        double p = Math.sqrt(x * x + y * y);
        double theta = Math.atan2(z * a, p * b);

        double sinTheta = Math.sin(theta);
        double cosTheta = Math.cos(theta);

        double latitude = Math.atan2(
            z + eSqPrime * b * sinTheta * sinTheta * sinTheta,
            p - eSq * a * cosTheta * cosTheta * cosTheta
        );

        latitude = Math.toDegrees(latitude);
        longitude = Math.toDegrees(longitude);

        return new double[]{latitude, longitude};
    }

    private double[] latLngToEcef(double lat, double lon) {
        double latRad = Math.toRadians(lat);
        double lonRad = Math.toRadians(lon);

        double N = a / Math.sqrt(1 - eSq * Math.sin(latRad) * Math.sin(latRad));

        double x = N * Math.cos(latRad) * Math.cos(lonRad);
        double y = N * Math.cos(latRad) * Math.sin(lonRad);
        double z = (N * (1 - eSq)) * Math.sin(latRad);

        return new double[]{x, y, z};
    }

    private double[] ecefToEnu(double xEcef, double yEcef, double zEcef) {
        double sinLat0 = Math.sin(Math.toRadians(LAT_ORIGIN));
        double cosLat0 = Math.cos(Math.toRadians(LAT_ORIGIN));
        double sinLon0 = Math.sin(Math.toRadians(LNG_ORIGIN));
        double cosLon0 = Math.cos(Math.toRadians(LNG_ORIGIN));

        double dx = xEcef - originEcef[0];
        double dy = yEcef - originEcef[1];
        double dz = zEcef - originEcef[2];

        double east = -sinLon0 * dx + cosLon0 * dy;
        double north = -sinLat0 * cosLon0 * dx - sinLat0 * sinLon0 * dy + cosLat0 * dz;
        double up = cosLat0 * cosLon0 * dx + cosLat0 * sinLon0 * dy + sinLat0 * dz;

        return new double[]{east, north, up};
    }

    public double[] blockToLatLng(double x, double z) {
        if(originEcef == null) {
            debug("Block Origin ECEF not set.");
            return new double[]{210, 70, 0};
        }

        double lat0Rad = Math.toRadians(LAT_ORIGIN);
        double lon0Rad = Math.toRadians(LNG_ORIGIN);
        sinLat0 = Math.sin(lat0Rad);
        cosLat0 = Math.cos(lat0Rad);
        sinLon0 = Math.sin(lon0Rad);
        cosLon0 = Math.cos(lon0Rad);

        double east = x * metersPerBlock;
        double north = -z * metersPerBlock;
        double up = 0;

        double[] ecef = enuToEcef(east, north, up);
        return ecefToLatLng(ecef[0], ecef[1], ecef[2]);
    }

    public int[] latLngToBlock(double lat, double lng) {
        if(originEcef == null) {
            debug("Origin ECEF not set.");
            return new int[]{0, 0};
        }

        double lat0Rad = Math.toRadians(LAT_ORIGIN);
        double lon0Rad = Math.toRadians(LNG_ORIGIN);
        sinLat0 = Math.sin(lat0Rad);
        cosLat0 = Math.cos(lat0Rad);
        sinLon0 = Math.sin(lon0Rad);
        cosLon0 = Math.cos(lon0Rad);

        double[] ecef = latLngToEcef(lat, lng);
        double[] enu = ecefToEnu(ecef[0], ecef[1], ecef[2]);

        int x = (int) enu[0];
        int z = (int) enu[1];

        return new int[]{x, z};
    }

    @Override
    public boolean shouldGenerateNoise() { return false; }
    @Override
    public boolean shouldGenerateSurface() { return true; }
    @Override
    public boolean shouldGenerateBedrock() { return false; }
    @Override
    public boolean shouldGenerateCaves() { return false; }
    @Override
    public boolean shouldGenerateDecorations() { return false; }
    @Override
    public boolean shouldGenerateMobs() { return false; }
    @Override
    public boolean shouldGenerateStructures() { return false; }
}
