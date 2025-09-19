package com.example.voxelearth;

import org.bukkit.Material;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.generator.WorldInfo;
import org.bukkit.generator.ChunkGenerator.ChunkData;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import org.json.JSONTokener;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.Chunk;
import java.util.function.BiConsumer;

import java.io.InputStream;
import java.awt.Color;
import java.util.Iterator;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Consumer;

import org.bukkit.block.Block;
import org.bukkit.inventory.ItemStack;

import org.bukkit.Material;

// player
import java.util.UUID;

public class VoxelChunkGenerator extends ChunkGenerator {

    private static final double LAT_ORIGIN = 50.081033020810736;
    private static final double LNG_ORIGIN = 14.451093643141064;
    private static final String API_KEY = "AIzaSy..."; // Your API key here
    private TileDownloader tileDownloader;
    private ConcurrentHashMap<String, Map<String, Object>> indexedBlocks = new ConcurrentHashMap<>();
    private static final List<MaterialColor> MATERIAL_COLORS = new ArrayList<>();
    private Map<Integer, Material> colorToMaterialCache = new HashMap<>();
    private Map<UUID, double[]> playerOrigins = new ConcurrentHashMap<>();

    private Map<UUID, Integer> playerXOffsets = new ConcurrentHashMap<>();
    private Map<UUID, Integer> playerYOffsets = new ConcurrentHashMap<>();
    private Map<UUID, Integer> playerZOffsets = new ConcurrentHashMap<>();

    // origin ecef
    private double[] originEcef; // [x0, y0, z0]

    // Default values for scale and offsets
    private double scaleFactor = 2.1;
    private double metersPerBlock = scaleFactor;

    private double offsetX = 0.0;
    private double offsetY = 0.0;
    private double offsetZ = 0.0;
    private double scaleX = scaleFactor;
    private double scaleY = scaleFactor;
    private double scaleZ = scaleFactor;

    private static final String SESSION_DIR = "./session";
    private static final long CLEANUP_INTERVAL = TimeUnit.HOURS.toMillis(1); // 1 hour

    public VoxelChunkGenerator() {
        System.out.println("[DEBUG] VoxelChunkGenerator initialized");
        System.out.println("[DEBUG] LAT_ORIGIN: " + LAT_ORIGIN + ", LNG_ORIGIN: " + LNG_ORIGIN);
        System.out.println("[DEBUG] Default scaleFactor (metersPerBlock): " + scaleFactor);
        System.out.println("[DEBUG] Using a tile radius of 25 for single tile loading.");

        tileDownloader = new TileDownloader(API_KEY, LNG_ORIGIN, LAT_ORIGIN, 25); 
        initializeSessionDirectory();
        scheduleSessionCleanup();
        loadMaterialColors();
    }

    private void initializeSessionDirectory() {
        File sessionDir = new File(SESSION_DIR);
        if (!sessionDir.exists()) {
            sessionDir.mkdirs();
        }
        System.out.println("[DEBUG] Session directory initialized at: " + sessionDir.getAbsolutePath());
    }

    private void scheduleSessionCleanup() {
        Bukkit.getScheduler().runTaskTimerAsynchronously(
                Bukkit.getPluginManager().getPlugin("VoxelEarth"),
                this::clearSessionDirectory,
                CLEANUP_INTERVAL, CLEANUP_INTERVAL
        );
    }

    private void clearSessionDirectory() {
        System.out.println("[Session Cleanup] Clearing session directory...");
        try {
            Files.walk(Paths.get(SESSION_DIR))
                    .filter(Files::isRegularFile)
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            System.out.println("[Session Cleanup] Deleted: " + path);
                        } catch (IOException e) {
                            System.err.println("[Session Cleanup] Failed to delete: " + path);
                        }
                    });
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void regenChunks(World world, 
                            double scaleX, double scaleY, double scaleZ, 
                            double newOffsetX, double newOffsetY, double newOffsetZ) {

        System.out.println("[DEBUG] regenChunks called with scaleX=" + scaleX + ", scaleY=" + scaleY + ", scaleZ=" + scaleZ);
        System.out.println("[DEBUG] offsets: X=" + newOffsetX + ", Y=" + newOffsetY + ", Z=" + newOffsetZ);

        indexedBlocks = new ConcurrentHashMap<>();
        loadMaterialColors();
        System.out.println("[DEBUG] MATERIAL_COLORS size: " + MATERIAL_COLORS.size());

        this.offsetX = newOffsetX;
        this.offsetY = newOffsetY;
        this.offsetZ = newOffsetZ;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.scaleZ = scaleZ;

        System.out.println("[DEBUG] Starting block removal and regeneration...");
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
            System.out.println("[DEBUG] Failed to load indexed JSON blocks.");
            e.printStackTrace();
        }

        processChunksInBatches(chunksToProcess, world);
    }

    private void processChunksInBatches(List<Chunk> chunks, World world) {
        AtomicInteger currentIndex = new AtomicInteger(0);
        int batchSize = 1;

        Bukkit.getScheduler().runTaskTimer(Bukkit.getPluginManager().getPlugin("VoxelEarth"), task -> {
            if (currentIndex.get() >= chunks.size()) {
                System.out.println("[DEBUG] All chunks processed and blocks placed.");
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
        String blockKey = x + "," + y + "," + z;

        for (ConcurrentHashMap.Entry<String, Map<String, Object>> tileEntry : indexedBlocks.entrySet()) {
            Map<String, Object> indexMap = tileEntry.getValue();
            if (indexMap == null || (boolean) indexMap.getOrDefault("isPlaced", false)) continue;

            Map<String, Material> blockMap = (Map<String, Material>) indexMap.get("blocks");
            Material material = blockMap.get(blockKey);

            if (material != null) {
                BlockChanger.setSectionBlockAsynchronously(chunk.getBlock(x, y, z).getLocation(), new ItemStack(material), false);
                indexMap.put("isPlaced", true);
            }
        }
    }

    public void loadMaterialColors() {
        System.out.println("[DEBUG] Loading material colors...");
        try (InputStream is = getClass().getResourceAsStream("/vanilla.atlas")) {
            if (is == null) {
                System.out.println("[DEBUG] vanilla.atlas not found in resources.");
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
                System.out.printf("[DEBUG] Loaded material: %s with color: (%d, %d, %d)%n", material, r, g, b);
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
                System.out.printf("[DEBUG] Material not found for block: %s. Using STONE as fallback.%n", formattedName);
                material = Material.STONE;
            }
        }
        return material;
    }

    private void downloadAndProcessTiles(int chunkX, int chunkZ) {
        try {
            System.out.println("[DEBUG] Calling downloadTiles for single tile load at radius 25");
            String outputDirectory = SESSION_DIR;

            System.out.println("[DEBUG] Set coordinates: lng=" + LNG_ORIGIN + ", lat=" + LAT_ORIGIN);
            tileDownloader.setCoordinates(LNG_ORIGIN, LAT_ORIGIN);

            List<String> downloadedTileFiles = tileDownloader.downloadTiles(outputDirectory);
            System.out.println("[DEBUG] Downloaded tiles: " + downloadedTileFiles);

            if (downloadedTileFiles.isEmpty()) {
                System.out.println("[DEBUG] No new tiles were downloaded.");
                return;
            }

            System.out.println("[DEBUG] Running voxelizer on downloaded tiles...");
            runGpuVoxelizer(outputDirectory, downloadedTileFiles);

            System.out.println("[DEBUG] Loading indexed JSON...");
            loadIndexedJson(new File(outputDirectory), downloadedTileFiles, chunkX, chunkZ);
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }

    private void runGpuVoxelizer(String directory, List<String> tileFiles) throws IOException, InterruptedException {
        System.out.println("[DEBUG] runGpuVoxelizer started...");
        int numThreads = Runtime.getRuntime().availableProcessors();
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);

        List<Future<?>> futures = new ArrayList<>();

        for (String tileFileName : tileFiles) {
            Future<?> future = executor.submit(() -> {
                try {
                    processVoxelizerFile(directory, tileFileName);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
            futures.add(future);
        }

        for (Future<?> future : futures) {
            try {
                future.get();
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        }

        executor.shutdown();
        System.out.println("[DEBUG] runGpuVoxelizer completed.");
    }

    private void processVoxelizerFile(String directory, String tileFileName) throws IOException, InterruptedException {
        File file = new File(directory, tileFileName);
        String baseName = file.getName();
        String outputJson = baseName + "_128.json";
        File outputFile = new File(directory, outputJson);

        if (outputFile.exists()) {
            System.out.println("[DEBUG] Skipping voxelization, " + outputJson + " already exists.");
            return;
        }

        System.out.println("[DEBUG] Running voxelizer on " + file.getName());

        ProcessBuilder processBuilder = new ProcessBuilder(
                "./cuda_voxelizer",
                "-f", file.getAbsolutePath(),
                "-o", "json",
                "-s", "128",
                "-output", directory
        );

        processBuilder.directory(new File(System.getProperty("user.dir")));
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("Voxelizer process failed with exit code " + exitCode);
        }

        System.out.println("[DEBUG] Voxelization completed: " + outputJson);
    }

    private static final double MAX_COLOR_DISTANCE = 30.0;
    private Map<Integer, Material> colorIndexToMaterialCache = new HashMap<>();

    private Material mapRgbaToMaterial(JSONArray rgbaArray) {
        int r = rgbaArray.getInt(0);
        int g = rgbaArray.getInt(1);
        int b = rgbaArray.getInt(2);

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
            System.out.printf("[DEBUG] No suitable match for color (%d, %d, %d). Using STONE%n", r, g, b);
            return Material.STONE;
        }
    }

    private double colorDistance(Color c1, Color c2) {
        int dr = c1.getRed() - c2.getRed();
        int dg = c1.getGreen() - c2.getGreen();
        int db = c1.getBlue() - c2.getBlue();
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    private void loadIndexedJson(File directory, List<String> tileFiles, int chunkX, int chunkZ) throws IOException {
        System.out.println("[DEBUG] loadIndexedJson called. Loading tiles into memory.");
        int numThreads = Runtime.getRuntime().availableProcessors();
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);

        List<Future<?>> futures = new ArrayList<>();

        for (String tileFileName : tileFiles) {
            String baseName = tileFileName;
            File jsonFile = new File(directory, baseName + "_128.json");

            if (indexedBlocks.containsKey(baseName)) {
                continue;
            }

            Future<?> future = executor.submit(() -> {
                try {
                    processJsonFile(jsonFile, baseName, chunkX, chunkZ);
                } catch (Exception e) {
                    System.out.println("[DEBUG] Error loading JSON file: " + jsonFile.getName());
                    e.printStackTrace();
                }
            });
            futures.add(future);
        }

        for (Future<?> future : futures) {
            try {
                future.get();
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        }

        executor.shutdown();
        System.out.println("[DEBUG] Finished loadIndexedJson.");
    }

    private void processJsonFile(File jsonFile, String baseName, int chunkX, int chunkZ) throws IOException {
        System.out.println("[DEBUG] processJsonFile: " + jsonFile.getName());
        try (FileReader reader = new FileReader(jsonFile)) {
            JSONObject json = new JSONObject(new JSONTokener(reader));

            File positionFile = new File(jsonFile.getParent(), baseName.replaceFirst("\\.glb.*$", "") + "_position.json");
            double[] tileTranslation = new double[3];
            if (positionFile.exists()) {
                try (FileReader posReader = new FileReader(positionFile)) {
                    JSONArray positionArray = new JSONArray(new JSONTokener(posReader));
                    if (positionArray.length() > 0) {
                        JSONObject positionData = positionArray.getJSONObject(0);
                        JSONArray translationArray = positionData.getJSONArray("translation");

                        double rawX = translationArray.getDouble(0);
                        double rawY = translationArray.getDouble(1);
                        double rawZ = translationArray.getDouble(2);

                        tileTranslation[0] = (rawX * scaleX) + offsetX + (chunkX * 16);
                        tileTranslation[1] = (rawY * scaleY) + offsetY;
                        tileTranslation[2] = (rawZ * scaleZ) + offsetZ + (chunkZ * 16);

                        System.out.println("[DEBUG] positionFile: " + positionFile.getName());
                        System.out.println("[DEBUG] Raw translation: (" + rawX + ", " + rawY + ", " + rawZ + ")");
                        System.out.println("[DEBUG] Computed tileTranslation: (" + tileTranslation[0] + ", " + tileTranslation[1] + ", " + tileTranslation[2] + ")");
                    }
                }
            } else {
                System.out.println("[DEBUG] No position file for: " + baseName);
            }

            if (!json.has("blocks") || !json.has("xyzi")) {
                System.out.println("[DEBUG] JSON missing 'blocks' or 'xyzi' for " + baseName);
                return;
            }

            JSONObject blocksObject = json.getJSONObject("blocks");
            JSONArray xyziArray = json.getJSONArray("xyzi");
            Map<String, Material> blockMap = new HashMap<>();

            Map<Integer, Material> colorIndexToMaterial = new HashMap<>();
            Iterator<String> keys = blocksObject.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                int colorIndex = Integer.parseInt(key);
                JSONArray rgbaArray = blocksObject.getJSONArray(key);

                Material material = mapRgbaToMaterial(rgbaArray);
                colorIndexToMaterial.put(colorIndex, material);
            }

            int minX = Integer.MAX_VALUE, minY = Integer.MAX_VALUE, minZ = Integer.MAX_VALUE;
            int maxX = Integer.MIN_VALUE, maxY = Integer.MIN_VALUE, maxZ = Integer.MIN_VALUE;

            for (int i = 0; i < xyziArray.length(); i++) {
                JSONArray xyziEntry = xyziArray.getJSONArray(i);
                int x = xyziEntry.getInt(0);
                int y = xyziEntry.getInt(1);
                int z = xyziEntry.getInt(2);
                int colorIndex = xyziEntry.getInt(3);

                int translatedX = (int) ((x + tileTranslation[0]));
                int translatedY = (int) ((y + tileTranslation[1]));
                int translatedZ = (int) ((z + tileTranslation[2]));

                String blockName = translatedX + "," + translatedY + "," + translatedZ;
                Material material = colorIndexToMaterial.get(colorIndex);

                if (material != null) {
                    blockMap.put(blockName, material);

                    if (translatedX < minX) minX = translatedX;
                    if (translatedY < minY) minY = translatedY;
                    if (translatedZ < minZ) minZ = translatedZ;
                    if (translatedX > maxX) maxX = translatedX;
                    if (translatedY > maxY) maxY = translatedY;
                    if (translatedZ > maxZ) maxZ = translatedZ;
                }
            }

            HashMap<String, Object> indexMap = new HashMap<>();
            indexMap.put("isPlaced", false);
            indexMap.put("blocks", blockMap);

            indexedBlocks.putIfAbsent(baseName, indexMap);

            System.out.println("[DEBUG] Loaded tile: " + baseName + " with " + blockMap.size() + " blocks.");
            System.out.println("[DEBUG] Block bounding box for " + baseName + ": X[" + minX + "," + maxX + "] Y[" + minY + "," + maxY + "] Z[" + minZ + "," + maxZ + "]");
        }
    }

    public void loadJson(String filename, double scaleX, double scaleY, double scaleZ, double offsetX, double offsetY, double offsetZ) throws IOException {
        File file = new File(filename);
        if (!file.exists()) {
            System.out.println("[DEBUG] File " + filename + " does not exist.");
            return;
        }

        indexedBlocks = new ConcurrentHashMap<>();

        String baseName = file.getName().replace(".json", "");
        try (FileReader reader = new FileReader(file)) {
            JSONObject json = new JSONObject(new JSONTokener(reader));

            double[] tileTranslation = new double[3];

            if (!json.has("blocks") || !json.has("xyzi")) {
                System.out.println("[DEBUG] JSON file " + filename + " missing 'blocks' or 'xyzi'.");
                return;
            }

            JSONObject blocksObject = json.getJSONObject("blocks");
            JSONArray xyziArray = json.getJSONArray("xyzi");
            Map<String, Material> blockMap = new HashMap<>();

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

                String blockName = translatedX + "," + translatedY + "," + translatedZ;
                Material material = colorIndexToMaterial.get(colorIndex);

                if (material != null) {
                    blockMap.put(blockName, material);
                }
            }

            HashMap<String, Object> indexMap = new HashMap<>();
            indexMap.put("isPlaced", false);
            indexMap.put("blocks", blockMap);

            indexedBlocks.put(baseName, indexMap);

            Bukkit.getScheduler().runTask(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
                System.out.println("[DEBUG] Starting chunk regeneration after loadJson...");
                System.out.println("[DEBUG] IndexedBlocks length: " + indexedBlocks.size());

                for (ConcurrentHashMap.Entry<String, Map<String, Object>> tileEntry : indexedBlocks.entrySet()) {
                    Map<String, Object> indexMap1 = tileEntry.getValue();

                    if (indexMap1 != null && !(boolean) indexMap1.get("isPlaced")) {
                        indexMap1.put("isPlaced", true);
                    } else {
                        continue;
                    }

                    Map<String, Material> blockMap1 = (Map<String, Material>) indexMap1.get("blocks");
                    for (Map.Entry<String, Material> blockEntry : blockMap1.entrySet()) {
                        String[] parts = blockEntry.getKey().split(",");
                        int originalX = Integer.parseInt(parts[0]);
                        int originalY = Integer.parseInt(parts[1]);
                        int originalZ = Integer.parseInt(parts[2]);

                        int newX = originalX;
                        int newY = originalY;
                        int newZ = originalZ;

                        int blockChunkX = newX >> 4;
                        int blockChunkZ = newZ >> 4;

                        World world = Bukkit.getWorld("world");
                        if (world == null) {
                            System.out.println("[DEBUG] World not found in loadJson placement.");
                            continue;
                        }

                        Chunk chunk = world.getChunkAt(blockChunkX, blockChunkZ);
                        if (!chunk.isLoaded()) {
                            chunk.load();
                        }

                        int localX = newX & 15;
                        int localZ = newZ & 15;

                        BlockChanger.setSectionBlockAsynchronously(
                            chunk.getBlock(localX, newY, localZ).getLocation(),
                            new ItemStack(blockEntry.getValue()),
                            false
                        );
                    }
                }
                System.out.println("[DEBUG] JSON generated.");
            });

            System.out.println("[DEBUG] Loaded JSON file: " + filename);
        }
    }

    @Override
    public void generateSurface(WorldInfo worldInfo, Random random, int chunkX, int chunkZ, ChunkData chunkData) {
        // Not generating anything directly here
    }

    public void loadChunk(UUID playerUUID, int tileX, int tileZ, boolean isVisit, Consumer<int[]> callback) {
        Bukkit.getScheduler().runTaskAsynchronously(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
            try {
                File originTranslationFile = new File("origin_translation.json");
                if (originTranslationFile.exists()) {
                    try (FileReader reader = new FileReader(originTranslationFile)) {
                        JSONArray originArray = new JSONArray(new JSONTokener(reader));
                        originEcef = new double[3];
                        originEcef[0] = originArray.getDouble(0);
                        originEcef[1] = -originArray.getDouble(2);
                        originEcef[2] = originArray.getDouble(1);
                        System.out.println("[DEBUG] Adjusted origin ECEF: " + Arrays.toString(originEcef));
                    }
                } else {
                    System.out.println("[DEBUG] origin_translation.json not found, originEcef may not be set.");
                }

                double[] playerOrigin = playerOrigins.get(playerUUID);
                if (playerOrigin != null) {
                    tileDownloader.setOrigin(playerOrigin);
                    System.out.println("[DEBUG] Using player's stored origin: " + Arrays.toString(playerOrigin));
                } else {
                    tileDownloader.setOrigin(null);
                    System.out.println("[DEBUG] No player-specific origin, using global origin.");
                }

                int[] blockLocation = new int[]{210, 70, 0};

                String outputDirectory = SESSION_DIR;

                double[] latLng = minecraftToLatLng(tileX, tileZ);
                System.out.println("[DEBUG] loadChunk: tileX=" + tileX + ", tileZ=" + tileZ + " -> lat/lng=" + latLng[0] + "," + latLng[1]);

                tileDownloader.setCoordinates(latLng[1], latLng[0]);
                tileDownloader.setRadius(500);

                System.out.println("[DEBUG] Downloading single tile at lat=" + latLng[0] + ", lng=" + latLng[1] + " with radius 25");
                List<String> downloadedTileFiles = tileDownloader.downloadTiles(outputDirectory);
                System.out.println("[DEBUG] Downloaded tile files: " + downloadedTileFiles);

                if (downloadedTileFiles.isEmpty()) {
                    System.out.println("[DEBUG] No tiles downloaded.");
                    callback.accept(blockLocation);
                    return;
                }

                System.out.println("[DEBUG] Running voxelizer for single tile...");
                runGpuVoxelizer(outputDirectory, downloadedTileFiles);

                Set<String> previousKeys = new HashSet<>(indexedBlocks.keySet());

                int adjustedTileX = tileX;
                int adjustedTileZ = tileZ;

                if (isVisit) {
                    playerXOffsets.put(playerUUID, tileX);
                    playerZOffsets.put(playerUUID, tileZ);
                    System.out.println("[DEBUG] Visit mode: storing offsets tileX=" + tileX + ", tileZ=" + tileZ);
                } else {
                    Integer storedXOffset = playerXOffsets.get(playerUUID);
                    Integer storedZOffset = playerZOffsets.get(playerUUID);
                    if (storedXOffset != null) adjustedTileX = storedXOffset;
                    if (storedZOffset != null) adjustedTileZ = storedZOffset;
                    System.out.println("[DEBUG] Non-visit mode: using stored offsets adjustedTileX=" + adjustedTileX + ", adjustedTileZ=" + adjustedTileZ);
                }

                loadIndexedJson(new File(outputDirectory), downloadedTileFiles, adjustedTileX, adjustedTileZ);
                Set<String> currentKeys = new HashSet<>(indexedBlocks.keySet());
                currentKeys.removeAll(previousKeys);

                String initialTileKey = null;
                if (!currentKeys.isEmpty()) {
                    initialTileKey = currentKeys.iterator().next();
                } else if (!indexedBlocks.isEmpty()) {
                    initialTileKey = indexedBlocks.keySet().iterator().next();
                } else {
                    System.out.println("[DEBUG] No tiles loaded, cannot compute block location.");
                    callback.accept(blockLocation);
                    return;
                }

                System.out.println("[DEBUG] Initial tile key: " + initialTileKey);

                final AtomicInteger yOffset = new AtomicInteger(0);
                final int desiredY = 70;

                System.out.println("[DEBUG] Starting chunk regeneration...");
                System.out.println("[DEBUG] IndexedBlocks size: " + indexedBlocks.size());

                World world = Bukkit.getWorld("world");
                if (world == null) {
                    System.out.println("[DEBUG] World 'world' not found!");
                    callback.accept(blockLocation);
                    return;
                }

                Map<String, Object> indexMap1 = indexedBlocks.get(initialTileKey);
                if (indexMap1 != null) {
                    Map<String, Material> blockMap1 = (Map<String, Material>) indexMap1.get("blocks");

                    int minYInTile = blockMap1.keySet().stream()
                            .mapToInt(key -> Integer.parseInt(key.split(",")[1]))
                            .min()
                            .orElse(0);

                    yOffset.set(desiredY - minYInTile);
                    System.out.println("[DEBUG] Computed yOffset: " + yOffset.get());

                    if (isVisit) {
                        String positionFileName = initialTileKey.replaceFirst("\\.glb.*$", "") + "_position.json";
                        File positionFile = new File(outputDirectory, positionFileName);
                        if (positionFile.exists()) {
                            try (FileReader posReader = new FileReader(positionFile)) {
                                JSONArray positionArray = new JSONArray(new JSONTokener(posReader));
                                if (positionArray.length() > 0) {
                                    JSONObject positionData = positionArray.getJSONObject(0);
                                    JSONArray originArray = positionData.getJSONArray("origin");
                                    double[] origin = new double[3];
                                    origin[0] = originArray.getDouble(0);
                                    origin[1] = originArray.getDouble(1);
                                    origin[2] = originArray.getDouble(2);
                                    playerOrigins.put(playerUUID, origin);
                                    System.out.println("[DEBUG] Storing player origin: " + Arrays.toString(origin));
                                }
                            } catch (Exception e) {
                                System.out.println("[DEBUG] Error reading position file for origin:");
                                e.printStackTrace();
                            }
                        }

                        playerYOffsets.put(playerUUID, yOffset.get());
                    } else {
                        Integer storedYOffset = playerYOffsets.get(playerUUID);
                        if (storedYOffset != null) {
                            yOffset.set(storedYOffset);
                            System.out.println("[DEBUG] Using stored yOffset: " + yOffset.get());
                        }
                    }

                    if (!(boolean) indexMap1.get("isPlaced")) {
                        System.out.println("[DEBUG] Placing blocks for initial tile...");
                        placeBlocks(world, blockMap1, yOffset.get());
                        indexMap1.put("isPlaced", true);
                    }

                    if (!blockMap1.isEmpty()) {
                        String firstBlock = blockMap1.keySet().iterator().next();
                        String[] coords = firstBlock.split(",");
                        blockLocation[0] = Integer.parseInt(coords[0]);
                        blockLocation[1] = Integer.parseInt(coords[1]) + yOffset.get();
                        blockLocation[2] = Integer.parseInt(coords[2]);

                        System.out.println("[DEBUG] First block location: " + Arrays.toString(blockLocation));
                    }
                }

                final String finalInitialTileKey = initialTileKey;

                indexedBlocks.forEach((tileKey, indexMap) -> {
                    if (!tileKey.equals(finalInitialTileKey) && indexMap != null && !(boolean) indexMap.get("isPlaced")) {
                        Map<String, Material> blockMap = (Map<String, Material>) indexMap.get("blocks");
                        System.out.println("[DEBUG] Placing blocks for secondary tile: " + tileKey);
                        placeBlocks(world, blockMap, yOffset.get());
                        indexMap.put("isPlaced", true);
                    }
                });                

                System.out.println("[DEBUG] Chunk regeneration completed.");
                callback.accept(blockLocation);

            } catch (IOException | InterruptedException e) {
                System.out.println("[DEBUG] Exception in loadChunk:");
                e.printStackTrace();
                int[] blockLocation = new int[]{210, 70, 0};
                callback.accept(blockLocation);
            }
        });
    }

    private void placeBlocks(World world, Map<String, Material> blockMap, int yOffset) {
        Set<Chunk> modifiedChunks = ConcurrentHashMap.newKeySet();

        for (Map.Entry<String, Material> blockEntry : blockMap.entrySet()) {
            String[] parts = blockEntry.getKey().split(",");
            int originalX = Integer.parseInt(parts[0]);
            int originalY = Integer.parseInt(parts[1]);
            int originalZ = Integer.parseInt(parts[2]);

            int newX = originalX;
            int newY = originalY + yOffset;
            int newZ = originalZ;

            int blockChunkX = newX >> 4;
            int blockChunkZ = newZ >> 4;

            if (world == null) {
                continue;
            }

            if (newY < world.getMinHeight() || newY >= world.getMaxHeight()) {
                System.out.println("[DEBUG] Skipping block at " + newX + "," + newY + "," + newZ + " Y out of bounds.");
                continue;
            }

            Chunk chunk = world.getChunkAt(blockChunkX, blockChunkZ);
            if (!chunk.isLoaded()) {
                chunk.load();
            }

            int localX = newX & 15;
            int localZ = newZ & 15;

            Material material = blockEntry.getValue();
            if (material == null || !material.isBlock()) {
                throw new IllegalArgumentException("Invalid block material: " + material);
            }

            ItemStack itemStack = new ItemStack(material);
            BlockChanger.setSectionBlockAsynchronously(
                chunk.getBlock(localX, newY, localZ).getLocation(),
                itemStack,
                false
            );

            // System.out.println("[DEBUG] Set block at " + newX + "," + newY + "," + newZ + " in chunk (" + blockChunkX + "," + blockChunkZ + ") mat: " + material);
            
            // Get the chunk that corresponds to the block's real chunk coordinates
            Block pos = world.getBlockAt(newX, newY, newZ);
            Chunk realChunk = pos.getChunk();

            modifiedChunks.add(realChunk);
        }

        updateLighting(world, modifiedChunks);
    }

    private void updateLighting(World world, Set<Chunk> modifiedChunks) {
        System.out.println("[DEBUG] Updating lighting for modified chunks...");
        for (Chunk chunk : modifiedChunks) {
            int chunkX = chunk.getX();
            int chunkZ = chunk.getZ();
            world.refreshChunk(chunkX, chunkZ);
        }
    }

    private static final double EARTH_RADIUS = 6378137.0;  
    private static final int CHUNK_SIZE = 16;  

    // private double[] latLngToMeters(double lat, double lng) {
    //     double x = lng * (Math.PI / 180) * EARTH_RADIUS;
    //     double z = Math.log(Math.tan((Math.PI / 4) + Math.toRadians(lat) / 2)) * EARTH_RADIUS;
    //     return new double[]{x, z};
    // }

    int oldOffsetXX = 7677201 - 7677296;
    int oldOffsetZZ = -11936601 - (-11937070);

    // int newOffsetXX = oldOffsetXX * 5;
    // int newOffsetZZ = oldOffsetZZ * 5;
    
// Decide on final constants:
// metersPerBlock = 2.1
// metersPerChunk = 2.1 * 16 = 33.6
// Suppose old offsets were chosen for the old scale; now multiply them by 5 to compensate.
int newOffsetXX = oldOffsetXX * 5;
int newOffsetZZ = oldOffsetZZ * 5;

// Try removing 1.00037 and 0.99999. If you must keep them, ensure they are used in both directions consistently.

public double[] minecraftToLatLng(int chunkX, int chunkZ) {
    double metersPerChunk = CHUNK_SIZE * (metersPerBlock / 2.625); // 14 meters per chunk.

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
    double metersPerChunk = CHUNK_SIZE * (metersPerBlock / 2.625); // 14 meters per chunk.

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
            System.out.println("[DEBUG] Block Origin ECEF not set.");
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
            System.out.println("[DEBUG] Origin ECEF not set.");
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
