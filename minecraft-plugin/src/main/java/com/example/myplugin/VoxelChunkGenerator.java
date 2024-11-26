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

import java.io.FileOutputStream;
import java.io.ObjectOutputStream;
import java.io.FileInputStream;
import java.io.ObjectInputStream;

import java.util.List;
import java.util.ArrayList;
import java.io.InputStream;
import java.awt.Color;
import org.bukkit.Material;

import java.util.Iterator;

import java.nio.file.*;
import java.util.concurrent.TimeUnit;

// set andhashset
import java.util.HashSet;
import java.util.Set;

//atomicinteger
import java.util.concurrent.atomic.AtomicInteger;

//Arrays
import java.util.Arrays;

// Block
import org.bukkit.block.Block;

// ConcurrentHashMap
import java.util.concurrent.ConcurrentHashMap;

// atomicboolean
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

// blockchanger dep
import org.bukkit.inventory.ItemStack;

// parallel
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ExecutionException;

public class VoxelChunkGenerator extends ChunkGenerator {

    private static final double LAT_ORIGIN = 50.081033020810736;
    private static final double LNG_ORIGIN = 14.451093643141064;
    private static final String API_KEY = "AIzaSy..."; // Your API key here
    private TileDownloader tileDownloader;
    private ConcurrentHashMap<String, Map<String, Object>> indexedBlocks = new ConcurrentHashMap<>();
    private static final List<MaterialColor> MATERIAL_COLORS = new ArrayList<>();
    private Map<Integer, Material> colorToMaterialCache = new HashMap<>();

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
public void regenChunks(World world, 
                        double scaleX, double scaleY, double scaleZ, 
                        double newOffsetX, double newOffsetY, double newOffsetZ) {

    indexedBlocks = new ConcurrentHashMap<>();
    loadMaterialColors();
    System.out.println("MAT SIZE: " + MATERIAL_COLORS.size());

    this.offsetX = newOffsetX;
    this.offsetY = newOffsetY;
    this.offsetZ = newOffsetZ;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.scaleZ = scaleZ;

    System.out.println("Starting block removal and regeneration...");
    List<Chunk> chunksToProcess = new ArrayList<>();

    // Load chunks to process (both remove and place blocks in one step)
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
        System.out.println("Failed to load indexed JSON blocks.");
        e.printStackTrace();
    }


    // Process chunks (remove and place blocks) in one combined step
    processChunksInBatches(chunksToProcess, world);
}

private void processChunksInBatches(List<Chunk> chunks, World world) {
    AtomicInteger currentIndex = new AtomicInteger(0);
    int batchSize = 1; // Process one chunk at a time to avoid lag

    // Schedule to run more frequently: every 0.1 ticks (2 ms)
    Bukkit.getScheduler().runTaskTimer(Bukkit.getPluginManager().getPlugin("VoxelEarth"), task -> {
        if (currentIndex.get() >= chunks.size()) {
            System.out.println("All chunks processed and blocks placed.");
            task.cancel();
            return;
        }

        Chunk chunk = chunks.get(currentIndex.getAndIncrement());

        // Process each block in the chunk
        for (int x = 0; x < 16; x++) {
            for (int y = 0; y < world.getMaxHeight(); y++) {
                for (int z = 0; z < 16; z++) {
                    Block block = chunk.getBlock(x, y, z);

                    // Check if the block is not AIR before placing
                    if (block.getType() != Material.AIR) {
                        // block.setType(Material.AIR, false); // Remove block (setting to AIR)
                        BlockChanger.setSectionBlockAsynchronously(block.getLocation(), new ItemStack(Material.AIR), false);
                    }

                    // Now place the new block (if there's one to place)
                    placeNewBlock(chunk, x, y, z, world);
                }
            }
        }
    }, 0L, 2L); // Run every 0.1 ticks (2 ms)
}

private void placeNewBlock(Chunk chunk, int x, int y, int z, World world) {
    String blockKey = x + "," + y + "," + z;

    // Check if there is a block to place at this position
    for (ConcurrentHashMap.Entry<String, Map<String, Object>> tileEntry : indexedBlocks.entrySet()) {
        Map<String, Object> indexMap = tileEntry.getValue();
        if (indexMap == null || (boolean) indexMap.getOrDefault("isPlaced", false)) continue;

        Map<String, Material> blockMap = (Map<String, Material>) indexMap.get("blocks");
        Material material = blockMap.get(blockKey);

        if (material != null) {
            // chunk.getBlock(x, y, z).setType(material, false); // Place new block
            BlockChanger.setSectionBlockAsynchronously(chunk.getBlock(x, y, z).getLocation(), new ItemStack(material), false);
            indexMap.put("isPlaced", true); // Mark as placed
        }
    }
}


public void loadMaterialColors() {
    try (InputStream is = getClass().getResourceAsStream("/vanilla.atlas")) {
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
            System.out.printf("Loaded material: %s with color: (%d, %d, %d)%n", material, r, g, b);
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
}

private Material getMaterial(String blockName) {
    // Format the block name to match Material enum format
    String formattedName = blockName.replace("minecraft:", "").toUpperCase()
                                    .replace("_", " ").replace(" ", "_");

    Material material = Material.matchMaterial(formattedName);

    // Handle known variants or provide fallback materials
    if (material == null) {
        if (formattedName.contains("LOG_HORIZONTAL")) {
            material = Material.matchMaterial(formattedName.replace("_HORIZONTAL", ""));
        } else if (formattedName.matches("FROSTED_ICE_\\d")) {
            material = Material.ICE;  // Use regular ice as a fallback
        } else {
            System.out.printf("Material not found for block: %s. Using STONE as fallback.%n", formattedName);
            material = Material.STONE;  // Default fallback material
        }
    }
    return material;
}


    private static final String SESSION_DIR = "./session";
    private static final long CLEANUP_INTERVAL = TimeUnit.HOURS.toMillis(1); // 1 hour


    public VoxelChunkGenerator() {
        System.out.println("VoxelEarth is making TileDownloader");
        tileDownloader = new TileDownloader(API_KEY, LNG_ORIGIN, LAT_ORIGIN, 100); //15

        // Ensure the session directory exists and schedule cleanup
        initializeSessionDirectory();
        scheduleSessionCleanup();

    }


    private void initializeSessionDirectory() {
        File sessionDir = new File(SESSION_DIR);
        if (!sessionDir.exists()) {
            sessionDir.mkdirs();
        }
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


    private void downloadAndProcessTiles(int chunkX, int chunkZ) {
        try {
            System.out.println("Calling downloadTiles");
    
            String outputDirectory = SESSION_DIR;  // Use the session directory for all tiles
    
            tileDownloader.setCoordinates(LNG_ORIGIN, LAT_ORIGIN);
            List<String> downloadedTileFiles = tileDownloader.downloadTiles(outputDirectory);
    
            if (downloadedTileFiles.isEmpty()) {
                System.out.println("No new tiles were downloaded.");
                return;
            }
    
            // Run voxelizer only on the downloaded tiles
            runGpuVoxelizer(outputDirectory, downloadedTileFiles);
    
            // Load only the new tiles
            loadIndexedJson(new File(outputDirectory), downloadedTileFiles, chunkX, chunkZ);
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }
    

    private void runGpuVoxelizer(String directory, List<String> tileFiles) throws IOException, InterruptedException {
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
    
        // Wait for all tasks to complete
        for (Future<?> future : futures) {
            try {
                future.get();
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        }
    
        executor.shutdown();
    }
    
    private void processVoxelizerFile(String directory, String tileFileName) throws IOException, InterruptedException {
        File file = new File(directory, tileFileName);
        String baseName = file.getName();
        String outputJson = baseName + "_128.json";
        File outputFile = new File(directory, outputJson);
    
        // Check if the _128.json file already exists
        if (outputFile.exists()) {
            System.out.println("Skipping voxelization, " + outputJson + " already exists.");
            return; // Skip processing this file
        }
    
        System.out.println("Running voxelizer on " + file.getName());
    
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
    
        System.out.println("Voxelization completed: " + outputJson);
    }
    


private static final double MAX_COLOR_DISTANCE = 30.0;
private Map<Integer, Material> colorIndexToMaterialCache = new HashMap<>();

private Material mapRgbaToMaterial(JSONArray rgbaArray) {
    int r = rgbaArray.getInt(0);
    int g = rgbaArray.getInt(1);
    int b = rgbaArray.getInt(2);
    // int a = rgbaArray.getInt(3); 

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

    if (bestMatch != null && minDeltaE <= 10.0) { // Lower threshold for CIEDE2000
        return bestMatch.getMaterial();
    } else {
        System.out.printf("No suitable match found for color (%d, %d, %d). Using default material: STONE%n", r, g, b);
        return Material.STONE;
    }
}



// Helper method to compute color distance
private double colorDistance(Color c1, Color c2) {
    int dr = c1.getRed() - c2.getRed();
    int dg = c1.getGreen() - c2.getGreen();
    int db = c1.getBlue() - c2.getBlue();
    // Optionally include alpha channel in distance calculation
    return Math.sqrt(dr * dr + dg * dg + db * db);
}


private void loadIndexedJson(File directory, List<String> tileFiles, int chunkX, int chunkZ) throws IOException {
    // Determine the number of threads; you can adjust this based on your system's capabilities
    int numThreads = Runtime.getRuntime().availableProcessors();
    ExecutorService executor = Executors.newFixedThreadPool(numThreads);

    List<Future<?>> futures = new ArrayList<>();

    for (String tileFileName : tileFiles) {
        String baseName = tileFileName;
        File jsonFile = new File(directory, baseName + "_128.json");

        // If baseName already exists, skip loading the file
        if (indexedBlocks.containsKey(baseName)) {
            continue;
        }

        // Submit a task for each JSON file
        Future<?> future = executor.submit(() -> {
            try {
                // Your existing code to process each JSON file
                processJsonFile(jsonFile, baseName, chunkX, chunkZ);
            } catch (Exception e) {
                System.out.println("Error loading JSON file: " + jsonFile.getName());
                e.printStackTrace();
            }
        });
        futures.add(future);
    }

    // Wait for all tasks to complete
    for (Future<?> future : futures) {
        try {
            future.get();
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }
    }

    // Shutdown the executor
    executor.shutdown();
}

private void processJsonFile(File jsonFile, String baseName, int chunkX, int chunkZ) throws IOException {
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

                    tileTranslation[0] = (translationArray.getDouble(0) * scaleX) + offsetX + (chunkX * 16);
                    tileTranslation[1] = (translationArray.getDouble(1) * scaleY) + offsetY;
                    tileTranslation[2] = (translationArray.getDouble(2) * scaleZ) + offsetZ + (chunkZ * 16);
                }
            }
        }

        if (!json.has("blocks") || !json.has("xyzi")) {
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

            // Swap axes and apply translation
            int translatedX = (int) ((x + tileTranslation[0]));
            int translatedY = (int) ((y + tileTranslation[1]));
            int translatedZ = (int) ((z + tileTranslation[2]));

            String blockName = translatedX + "," + translatedY + "," + translatedZ;
            Material material = colorIndexToMaterial.get(colorIndex);

            if (material != null) {
                blockMap.put(blockName, material);
            }
        }

        HashMap<String, Object> indexMap = new HashMap<>();
        indexMap.put("isPlaced", false); // Initialize to false
        indexMap.put("blocks", blockMap);

        // Thread-safe put operation
        indexedBlocks.putIfAbsent(baseName, indexMap);
    }
}


public void loadJson(String filename, double scaleX, double scaleY, double scaleZ, double offsetX, double offsetY, double offsetZ) throws IOException {
    File file = new File(filename);
    if (!file.exists()) {
        System.out.println("File " + filename + " does not exist.");
        return;
    }

indexedBlocks = new ConcurrentHashMap<>();

    String baseName = file.getName().replace(".json", "");
    try (FileReader reader = new FileReader(file)) {
        JSONObject json = new JSONObject(new JSONTokener(reader));

        // Assume tileTranslation is zero if no pos file
        double[] tileTranslation = new double[3];

        if (!json.has("blocks") || !json.has("xyzi")) {
            System.out.println("JSON file " + filename + " does not contain 'blocks' or 'xyzi'.");
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

                    // Swap axes and apply translation
                    int translatedX = (int) ((x * scaleX + offsetX) );
                    int translatedY = (int) ((y * scaleY + offsetY) );
                    int translatedZ = (int) ((z * scaleZ + offsetZ) );

                    String blockName = translatedX + "," + translatedY + "," + translatedZ;
                    // System.out.println(blockName);

                    Material material = colorIndexToMaterial.get(colorIndex);

                    if (material != null) {
                        blockMap.put(blockName, material);
                    }
                }


                HashMap<String, Object> indexMap = new HashMap<>();
                indexMap.put("isPlaced", false); // Initialize to false
                indexMap.put("blocks", blockMap);

                indexedBlocks.put(baseName, indexMap);





        Bukkit.getScheduler().runTask(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
            System.out.println("Starting chunk regeneration...");
            System.out.println("Indexblocks length " + indexedBlocks.size());

            for (ConcurrentHashMap.Entry<String, Map<String, Object>> tileEntry : indexedBlocks.entrySet()) {


            Map<String, Object> indexMap1 = tileEntry.getValue();

            if (indexMap1 != null && !(boolean) indexMap1.get("isPlaced")) {
                // Place the blocks here
                indexMap1.put("isPlaced", true); // Mark as placed
            }
            else {
                continue;
            }

            Map<String, Material> blockMap1 = (Map<String, Material>) indexMap1.get("blocks");

                // Map<String, Material> blockMap1 = tileEntry.getValue();

                for (Map.Entry<String, Material> blockEntry : blockMap1.entrySet()) {
                    String[] parts = blockEntry.getKey().split(",");
                    int originalX = Integer.parseInt(parts[0]);
                    int originalY = Integer.parseInt(parts[1]);
                    int originalZ = Integer.parseInt(parts[2]);

                    int newX = (int) (originalX);
                    int newY = (int) (originalY);
                    int newZ = (int) (originalZ);

                    int blockChunkX = newX >> 4;
                    int blockChunkZ = newZ >> 4;

                World world = Bukkit.getWorld("world"); // future- custom world or world of player?
                if (world == null) {

                }
                    Chunk chunk = world.getChunkAt(blockChunkX, blockChunkZ);
                    if (!chunk.isLoaded()) {
                        chunk.load();
                    }

                    int localX = newX & 15;
                    int localZ = newZ & 15;

                    // chunk.getBlock(localX, newY, localZ).setType(blockEntry.getValue(), false);
                    BlockChanger.setSectionBlockAsynchronously(
                        chunk.getBlock(localX, newY, localZ).getLocation(), 
                        new ItemStack(blockEntry.getValue()), 
                        false
                    );

                    // System.out.println("Set block at " + localX + ", " + newY + ", " + localZ);
                }
            }
            System.out.println("JSON generated.");
        });






        System.out.println("Loaded JSON file: " + filename);
    }
}



    @Override
    public void generateSurface(WorldInfo worldInfo, Random random, int chunkX, int chunkZ, ChunkData chunkData) {
        // System.out.println("VoxelEarth is Generating Surface");

        // // Only download and process tiles once for the initial chunks
        // if (chunkX == 0 && chunkZ == 0) {
        //     System.out.println("Performing Voxel Earth on initial chunk: " + chunkX + ", " + chunkZ);
        //     // downloadAndProcessTiles(chunkX, chunkZ);

        //     // System.out.println("saving indexed blocks");

        // }

        // // downloadAndProcessTiles(chunkX, chunkZ);


        // // Now process the blocks, allowing them to extend across all relevant chunks
        // for (Map.Entry<String, Map<String, Object>> chunkEntry : indexedBlocks.entrySet()) {
        //     // Map<String, Material> blockMap = chunkEntry.getValue();
        //     Map<String, Object> indexMap = chunkEntry.getValue();

        //     if (indexMap != null && !(boolean) indexMap.get("isPlaced")) {
        //         // Place the blocks here
        //         indexMap.put("isPlaced", true); // Mark as placed
        //     }
        //     else {
        //         continue;
        //     }

        //     Map<String, Material> blockMap = (Map<String, Material>) indexMap.get("blocks");

        //     for (Map.Entry<String, Material> blockEntry : blockMap.entrySet()) {
        //         String[] parts = blockEntry.getKey().split(",");
        //         int x = Integer.parseInt(parts[0]);
        //         int y = Integer.parseInt(parts[1]);
        //         int z = Integer.parseInt(parts[2]);
    
        //         // Calculate the chunk coordinates for the block
        //         int blockChunkX = x >> 4;  // equivalent to x / 16
        //         int blockChunkZ = z >> 4;  // equivalent to z / 16
    
        //         // Check if this block belongs to the current chunk being generated
        //         if (blockChunkX == chunkX && blockChunkZ == chunkZ) {
        //             // Calculate local coordinates within the chunk
        //             int localX = x & 15;  // equivalent to x % 16
        //             int localZ = z & 15;  // equivalent to z % 16
    
        //             chunkData.setBlock(localX, y, localZ, blockEntry.getValue());
        //             // System.out.println("Setting block at " + localX + ", " + y + ", " + localZ + " in chunk (" + chunkX + ", " + chunkZ + ") with material: " + blockEntry.getValue());
        //         }
        //     }
        // }
    }


    public void loadChunk(int tileX, int tileZ, Consumer<int[]> callback) {
        Bukkit.getScheduler().runTaskAsynchronously(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
            try {
                // 1. Read originEcef from origin_translation.json
                File originTranslationFile = new File("origin_translation.json");
                if (originTranslationFile.exists()) {
                    try (FileReader reader = new FileReader(originTranslationFile)) {
                        JSONArray originArray = new JSONArray(new JSONTokener(reader));
                        originEcef = new double[3];
                        originEcef[0] = originArray.getDouble(0); // ECEF X
                        originEcef[1] = -originArray.getDouble(2); // ECEF Y (negative of GLTF Z)
                        originEcef[2] = originArray.getDouble(1); // ECEF Z
                        System.out.println("Adjusted origin ECEF: " + Arrays.toString(originEcef));
                    }
                }
    
                int[] blockLocation = new int[]{210, 70, 0}; // Default location
    
                String outputDirectory = SESSION_DIR; // Use the session directory for all tiles
    
                // 2. Set the coordinates for the specific tile
                double[] latLng = minecraftToLatLng(tileX, tileZ); // Assume 1 meter per block
                tileDownloader.setCoordinates(latLng[1], latLng[0]); // lng, lat
                tileDownloader.setRadius(50);
    
                // 3. Download only one tile
                // tileDownloader.downloadTiles(outputDirectory);
                List<String> downloadedTileFiles = tileDownloader.downloadTiles(outputDirectory);

                if (downloadedTileFiles.isEmpty()) {
                    System.out.println("No new tiles were downloaded.");
                    return;
                }

                // 4. Voxelize the downloaded tile
                // runGpuVoxelizer(outputDirectory);
                runGpuVoxelizer(outputDirectory, downloadedTileFiles);

                // 5. Load the JSON for the specific tile
                Set<String> previousKeys = new HashSet<>(indexedBlocks.keySet());
                // loadIndexedJson(new File(outputDirectory));
                loadIndexedJson(new File(outputDirectory), downloadedTileFiles, tileX, tileZ);
                Set<String> currentKeys = new HashSet<>(indexedBlocks.keySet());
                currentKeys.removeAll(previousKeys);
    
                // 6. Determine the initial tile key
                String initialTileKey = null;
                if (!currentKeys.isEmpty()) {
                    initialTileKey = currentKeys.iterator().next();
                } else if (!indexedBlocks.isEmpty()) {
                    initialTileKey = indexedBlocks.keySet().iterator().next();
                } else {
                    System.out.println("No tiles are loaded. Cannot compute block location.");
                    callback.accept(blockLocation);
                    return;
                }
    
                // 7. Compute yOffset and prepare for block placement
                final AtomicInteger yOffset = new AtomicInteger(0);
                final int desiredY = 70; // The Y-level where you want the base of your initial tile to be placed
    
                // 8. Schedule Bukkit task for block placement
                String finalInitialTileKey = initialTileKey;
                // Bukkit.getScheduler().runTask(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
                    System.out.println("Starting chunk regeneration...");
                    System.out.println("Indexblocks size: " + indexedBlocks.size());
    
                    World world = Bukkit.getWorld("world"); // Adjust as necessary
                    if (world == null) {
                        System.out.println("World 'world' not found.");
                        callback.accept(blockLocation);
                        return;
                    }
    
                    // Process the initial tile
                    Map<String, Object> indexMap1 = indexedBlocks.get(finalInitialTileKey);
                    if (indexMap1 != null) {
                        Map<String, Material> blockMap1 = (Map<String, Material>) indexMap1.get("blocks");
    
                        // Compute minYInTile for the initial tile
                        int minYInTile = blockMap1.keySet().stream()
                                .mapToInt(key -> Integer.parseInt(key.split(",")[1]))
                                .min()
                                .orElse(0);
    
                        yOffset.set(desiredY - minYInTile);
                        System.out.println("Computed yOffset: " + yOffset.get());
    
                        // Place the blocks only if they haven't been placed yet
                        if (!(boolean) indexMap1.get("isPlaced")) {
                            placeBlocks(world, blockMap1, yOffset.get());
                            indexMap1.put("isPlaced", true); // Mark as placed
                        }
    
                        // Get first block location as reference point
                        if (!blockMap1.isEmpty()) {
                            String firstBlock = blockMap1.keySet().iterator().next();
                            String[] coords = firstBlock.split(",");
                            blockLocation[0] = Integer.parseInt(coords[0]);
                            blockLocation[1] = Integer.parseInt(coords[1]) + yOffset.get();
                            blockLocation[2] = Integer.parseInt(coords[2]);
                        }
                    }
    
                    // Process other tiles
                    indexedBlocks.forEach((tileKey, indexMap) -> {
                        if (!tileKey.equals(finalInitialTileKey) && indexMap != null && !(boolean) indexMap.get("isPlaced")) {
                            Map<String, Material> blockMap = (Map<String, Material>) indexMap.get("blocks");
                            placeBlocks(world, blockMap, yOffset.get());
                            indexMap.put("isPlaced", true); // Mark as placed
                        }
                    });
    
                    System.out.println("Chunk regeneration completed.");
                    callback.accept(blockLocation);
                // });
    
            } catch (IOException | InterruptedException e) {
                e.printStackTrace();
                int[] blockLocation = new int[]{210, 70, 0}; // Default location
                callback.accept(blockLocation);
            }
        });
    }
    
    

// Helper method to place blocks
private void placeBlocks(World world, Map<String, Material> blockMap, int yOffset) {
    Set<Chunk> modifiedChunks = ConcurrentHashMap.newKeySet();

    for (Map.Entry<String, Material> blockEntry : blockMap.entrySet()) {
        String[] parts = blockEntry.getKey().split(",");
        int originalX = Integer.parseInt(parts[0]);
        int originalY = Integer.parseInt(parts[1]);
        int originalZ = Integer.parseInt(parts[2]);

        int newX = originalX;
        int newY = originalY + yOffset; // Apply yOffset
        int newZ = originalZ;

        int blockChunkX = newX >> 4;
        int blockChunkZ = newZ >> 4;

        if (world == null) {
            continue;
        }

        // Ensure newY is within valid range
        if (newY < world.getMinHeight() || newY >= world.getMaxHeight()) {
            // log the coordinates
            System.out.println("Skipping block at " + newX + ", " + newY + ", " + newZ + " due to Y out of bounds.");
            continue; // Skip this block
        }

        Chunk chunk = world.getChunkAt(blockChunkX, blockChunkZ);
        if (!chunk.isLoaded()) {
            chunk.load();
        }

        int localX = newX & 15;
        int localZ = newZ & 15;

        // chunk.getBlock(localX, newY, localZ).setType(blockEntry.getValue(), false);
        // BlockChanger.setSectionBlockAsynchronously(
        //     chunk.getBlock(localX, newY, localZ).getLocation(), 
        //     new ItemStack(blockEntry.getValue()), 
        //     false
        // );
        // Ensure blockEntry.getValue() is valid
        Material material = blockEntry.getValue();
        if (material == null || !material.isBlock()) {
            throw new IllegalArgumentException("Invalid block material: " + material);
        }

        // Create ItemStack
        ItemStack itemStack = new ItemStack(material);

        // Pass the properly initialized ItemStack
        BlockChanger.setSectionBlockAsynchronously(
            chunk.getBlock(localX, newY, localZ).getLocation(),
            itemStack,
            false
        );


        // Log the absolute coordinates
        System.out.println("Set block at " + newX + ", " + newY + ", " + newZ + " in chunk (" + blockChunkX + ", " + blockChunkZ + ") with material: " + blockEntry.getValue());

        
        modifiedChunks.add(chunk);

    }

    updateLighting(world, modifiedChunks);

}

private void updateLighting(World world, Set<Chunk> modifiedChunks) {
    for (Chunk chunk : modifiedChunks) {
        int chunkX = chunk.getX();
        int chunkZ = chunk.getZ();

        // Recalculate lighting for the chunk
        world.refreshChunk(chunkX, chunkZ);

        // Alternatively, trigger light updates for specific blocks
        // This can be more efficient if you have specific blocks
        // chunk.getWorld().getBlockAt(chunkX << 4, 0, chunkZ << 4).getChunk().relightChunk();
    }
}


    private static final double EARTH_RADIUS = 6378137.0;  // in meters
    private static final int CHUNK_SIZE = 16;  // Each Minecraft chunk is 16x16 blocks

    // Convert lat/lng to meters using Web Mercator projection
    private double[] latLngToMeters(double lat, double lng) {
        double x = lng * (Math.PI / 180) * EARTH_RADIUS;
        double z = Math.log(Math.tan((Math.PI / 4) + Math.toRadians(lat) / 2)) * EARTH_RADIUS;
        return new double[]{x, z};
    }

    // Convert Minecraft chunks to lat/lng
    public double[] minecraftToLatLng(int chunkX, int chunkZ) {
        double metersPerChunk = (metersPerBlock / 4) * CHUNK_SIZE;
        double metersX = chunkX * metersPerChunk;
        double metersZ = chunkZ * metersPerChunk;

        double lng = (metersX / EARTH_RADIUS) * (180 / Math.PI);
        double lat = (2 * Math.atan(Math.exp(metersZ / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI);

        return new double[]{lat, lng};
    }

    // Convert lat/lng to Minecraft chunk coordinates
    public int[] latLngToMinecraft(double lat, double lng) {
        double[] meters = latLngToMeters(lat, lng);
        double metersPerChunk = (metersPerBlock / 4) * CHUNK_SIZE;

        int chunkX = (int) Math.floor(meters[0] / metersPerChunk);
        int chunkZ = (int) Math.floor(meters[1] / metersPerChunk);

        return new int[]{chunkX, chunkZ};
    }


    private double sinLat0, cosLat0, sinLon0, cosLon0;
    
    private static final double a = 6378137.0; // Equatorial radius in meters
    private static final double f = 1 / 298.257223563; // Flattening
    private static final double b = a * (1 - f); // Polar radius
    private static final double eSq = (a * a - b * b) / (a * a); // First eccentricity squared
    private static final double eSqPrime = (a * a - b * b) / (b * b); // Second eccentricity squared
    


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
    
        // Convert radians to degrees
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

        // originEcef = latLngToEcef(LAT_ORIGIN, LNG_ORIGIN);
        // System.out.println("EEE Origin ECEF: " + Arrays.toString(originEcef));

        if(originEcef == null) {
            System.out.println("Block Origin ECEF not set.");
            return new double[]{210, 70, 0};
        }

        double lat0Rad = Math.toRadians(LNG_ORIGIN);
        double lon0Rad = Math.toRadians(LAT_ORIGIN);
        sinLat0 = Math.sin(lat0Rad);
        cosLat0 = Math.cos(lat0Rad);
        sinLon0 = Math.sin(lon0Rad);
        cosLon0 = Math.cos(lon0Rad);

        // Minecraft block coordinates correspond to ENU east and north
        double east = x * metersPerBlock;
        double north = -z * metersPerBlock; // North coordinate in meters
        double up = 0; // Assuming ground level
    
        // Convert ENU to ECEF
        double[] ecef = enuToEcef(east, north, up);
    
        // Convert ECEF to latitude and longitude
        return ecefToLatLng(ecef[0], ecef[1], ecef[2]);
    }
    

    public int[] latLngToBlock(double lat, double lng) {

        if(originEcef == null) {
            System.out.println("Origin ECEF not set.");
            return new int[]{0, 0};
        }

        double lat0Rad = Math.toRadians(LAT_ORIGIN);
        double lon0Rad = Math.toRadians(LNG_ORIGIN);
        sinLat0 = Math.sin(lat0Rad);
        cosLat0 = Math.cos(lat0Rad);
        sinLon0 = Math.sin(lon0Rad);
        cosLon0 = Math.cos(lon0Rad);

        // Convert latitude and longitude to ECEF
        double[] ecef = latLngToEcef(lat, lng);
    
        // Convert ECEF to ENU
        double[] enu = ecefToEnu(ecef[0], ecef[1], ecef[2]);
    
        // Minecraft block coordinates correspond to ENU east and north
        int x = (int) enu[0]; // East coordinate in meters
        int z = (int) enu[1]; // North coordinate in meters
    
        return new int[]{x, z};
    }
    

    @Override
    public boolean shouldGenerateNoise() {
        return false;
    }

    @Override
    public boolean shouldGenerateSurface() {
        return true;
    }

    @Override
    public boolean shouldGenerateBedrock() {
        return false;
    }

    @Override
    public boolean shouldGenerateCaves() {
        return false;
    }

    @Override
    public boolean shouldGenerateDecorations() {
        return false;
    }

    @Override
    public boolean shouldGenerateMobs() {
        return false;
    }

    @Override
    public boolean shouldGenerateStructures() {
        return false;
    }
}
