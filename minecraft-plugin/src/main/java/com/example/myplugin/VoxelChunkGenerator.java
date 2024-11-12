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

public class VoxelChunkGenerator extends ChunkGenerator {

    private static final double LAT_ORIGIN = 50.081033020810736;
    private static final double LNG_ORIGIN = 14.451093643141064;
    private static final String API_KEY = "AIzaSy..."; // Your API key here
    private TileDownloader tileDownloader;
    private ConcurrentHashMap<String, Map<String, Object>> indexedBlocks = new ConcurrentHashMap<>();
    private static final List<MaterialColor> MATERIAL_COLORS = new ArrayList<>();
    private Map<Integer, Material> colorToMaterialCache = new HashMap<>();

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
                        block.setType(Material.AIR, false); // Remove block (setting to AIR)
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
            chunk.getBlock(x, y, z).setType(material, false); // Place new block
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
            // Print "Calling downloadTiles" to the console
            System.out.println("Calling downloadTiles");

            // String outputDirectory = "tiles" + chunkX + "_" + chunkZ;
            String outputDirectory = SESSION_DIR;  // Use the session directory for all tiles
            
            tileDownloader.setCoordinates(LNG_ORIGIN, LAT_ORIGIN);
            tileDownloader.downloadTiles(outputDirectory);
            runGpuVoxelizer(outputDirectory);
            loadIndexedJson(new File(outputDirectory));
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }

private void runGpuVoxelizer(String directory) throws IOException, InterruptedException {
    File dir = new File(directory);
    File[] files = dir.listFiles((d, name) -> name.endsWith(".glb"));

    if (files != null) {
        for (File file : files) {
            String baseName = file.getName();
            String outputJson = baseName + "_128.json";
            File outputFile = new File(directory, outputJson);

            // Check if the _128.json file already exists
            if (outputFile.exists()) {
                System.out.println("Skipping voxelization, " + outputJson + " already exists.");
                continue; // Skip processing this file
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
    }
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


private void loadIndexedJson(File directory) throws IOException {
    File[] jsonFiles = directory.listFiles((dir, name) -> name.endsWith(".json") && !name.contains("_position"));
    if (jsonFiles != null) {
        for (File file : jsonFiles) {
            try {

            String baseName = file.getName().replace(".json", "");

            // If basename already exists, skip loading the file
            if (indexedBlocks.containsKey(baseName)) {
                continue;
            }


            // // print json files
            // for (int i = 0; i < jsonFiles.length; i++) {
            //     System.out.println(jsonFiles[i].getName());
            // }

            // // remove files from jSonfiles list except for the one that starts with ea7
            // for (int i = 0; i < jsonFiles.length; i++) {
            //     if (jsonFiles[i] != null && !jsonFiles[i].getName().startsWith("ea7")) {
            //         jsonFiles[i] = null;
            //     }
            // }

            // // print json files
            // // print divier
            // System.out.println("=====================================");
            // for (int i = 0; i < jsonFiles.length; i++) {
            //     if (jsonFiles[i] != null) {
            //         System.out.println(jsonFiles[i].getName());
            //     }
            // }




            try (FileReader reader = new FileReader(file)) {
                JSONObject json = new JSONObject(new JSONTokener(reader));

                File positionFile = new File(directory, baseName.replaceFirst("\\.glb.*$", "") + "_position.json");
                double[] tileTranslation = new double[3];
                if (positionFile.exists()) {
                    try (FileReader posReader = new FileReader(positionFile)) {
                        JSONArray positionArray = new JSONArray(new JSONTokener(posReader));
                        if (positionArray.length() > 0) {
                            JSONObject positionData = positionArray.getJSONObject(0);
                            JSONArray translationArray = positionData.getJSONArray("translation");

                            tileTranslation[0] = (translationArray.getDouble(0) * scaleX) + offsetX;
                            tileTranslation[1] = (translationArray.getDouble(1) * scaleY) + offsetY;
                            tileTranslation[2] = (translationArray.getDouble(2) * scaleZ) + offsetZ;
                        }
                    }
                }

                if (!json.has("blocks") || !json.has("xyzi")) {
                    continue;
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
                    int translatedX = (int) ((x + tileTranslation[0]) );
                    int translatedY = (int) ((y + tileTranslation[1]) );
                    int translatedZ = (int) ((z + tileTranslation[2]) );

                    String blockName = translatedX + "," + translatedY + "," + translatedZ;
                    Material material = colorIndexToMaterial.get(colorIndex);

                    if (material != null) {
                        blockMap.put(blockName, material);
                    }
                }

                HashMap<String, Object> indexMap = new HashMap<>();
                indexMap.put("isPlaced", false); // Initialize to false
                indexMap.put("blocks", blockMap);

                indexedBlocks.putIfAbsent(baseName, indexMap);
            } catch (Exception e) {
                System.out.println("Error loading JSON file: " + file.getName());
                e.printStackTrace();
            }
                        } catch (Exception e) {
                System.out.println("Error removing files from jsonFiles list");
            }

        }
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

                    chunk.getBlock(localX, newY, localZ).setType(blockEntry.getValue(), false);
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
        try {
            int[] blockLocation = new int[]{210, 70, 0}; // Default location
    
            String outputDirectory = SESSION_DIR; // Use the session directory for all tiles
    
            // Set the coordinates for the specific tile
            double[] latLng = minecraftToLatLng(tileX, tileZ);  // Assume 1 meter per block
            tileDownloader.setCoordinates(latLng[1], latLng[0]);  // lng, lat
    
            tileDownloader.setRadius(25);
    
            // Download only one tile
            tileDownloader.downloadTiles(outputDirectory);
    
            // Voxelize the downloaded tile
            runGpuVoxelizer(outputDirectory);
    
            // Before loading new tiles, get the keys of existing tiles
            Set<String> previousKeys = new HashSet<>(indexedBlocks.keySet());
    
            // Load the JSON for the specific tile
            loadIndexedJson(new File(outputDirectory));
    
            // After loading, get the new keys
            Set<String> currentKeys = new HashSet<>(indexedBlocks.keySet());
            currentKeys.removeAll(previousKeys);
    
            // Get the initial tile key
            String initialTileKey = null;
            if (!currentKeys.isEmpty()) {
                initialTileKey = currentKeys.iterator().next();
            } else if (!indexedBlocks.isEmpty()) {
                // No new tiles were loaded, but tiles exist in indexedBlocks
                initialTileKey = indexedBlocks.keySet().iterator().next();
            } else {
                // No tiles at all; cannot proceed
                System.out.println("No tiles are loaded. Cannot compute block location.");
                callback.accept(blockLocation);
                return;
            }
    
            // Now we need to compute yOffset within this method
            final AtomicBoolean yOffsetComputed = new AtomicBoolean(false);
            final AtomicInteger yOffset = new AtomicInteger(0);
            final int desiredY = 70; // The Y-level where you want the base of your initial tile to be placed
    
            final String initialTileKeyFinal = initialTileKey; // For use inside the lambda
    
            Bukkit.getScheduler().runTask(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
                System.out.println("Starting chunk regeneration...");
                System.out.println("Indexblocks length " + indexedBlocks.size());
    
                World world = Bukkit.getWorld("world"); // Adjust as necessary
    
                // Process the initial tile
                if (initialTileKeyFinal != null) {
                    Map<String, Object> indexMap1 = indexedBlocks.get(initialTileKeyFinal);
    
                    if (indexMap1 != null) {
                        Map<String, Material> blockMap1 = (Map<String, Material>) indexMap1.get("blocks");
    
                        // Compute minYInTile for the initial tile
                        int minYInTile = Integer.MAX_VALUE;
    
                        for (Map.Entry<String, Material> blockEntry : blockMap1.entrySet()) {
                            String[] parts = blockEntry.getKey().split(",");
                            int originalY = Integer.parseInt(parts[1]);
    
                            if (originalY < minYInTile) {
                                minYInTile = originalY;
                            }
                        }
    
                        yOffset.set(desiredY - minYInTile);
                        yOffsetComputed.set(true);
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
                }
    
                // Now process the other tiles
                for (Map.Entry<String, Map<String, Object>> tileEntry : indexedBlocks.entrySet()) {
                    String tileKey = tileEntry.getKey();
                    if (tileKey.equals(initialTileKeyFinal)) {
                        continue; // Already processed
                    }
    
                    Map<String, Object> indexMap1 = tileEntry.getValue();
    
                    if (indexMap1 != null && !(boolean) indexMap1.get("isPlaced")) {
                        // Place the blocks here
                        indexMap1.put("isPlaced", true); // Mark as placed
    
                        Map<String, Material> blockMap1 = (Map<String, Material>) indexMap1.get("blocks");
    
                        // Use the same yOffset
                        placeBlocks(world, blockMap1, yOffset.get());
                    }
                }
    
                System.out.println("JSON generated.");
                callback.accept(blockLocation);
    
            });
    
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
            int[] blockLocation = new int[]{210, 70, 0}; // Default location
            callback.accept(blockLocation);
        }
    }
    

// Helper method to place blocks
private void placeBlocks(World world, Map<String, Material> blockMap, int yOffset) {
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

        chunk.getBlock(localX, newY, localZ).setType(blockEntry.getValue(), false);
        // Log the absolute coordinates
        System.out.println("Set block at " + newX + ", " + newY + ", " + newZ + " in chunk (" + blockChunkX + ", " + blockChunkZ + ") with material: " + blockEntry.getValue());
        
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
        double metersPerChunk = metersPerBlock * CHUNK_SIZE;
        double metersX = chunkX * metersPerChunk;
        double metersZ = chunkZ * metersPerChunk;

        double lng = (metersX / EARTH_RADIUS) * (180 / Math.PI);
        double lat = (2 * Math.atan(Math.exp(metersZ / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI);

        return new double[]{lat, lng};
    }

    // Convert lat/lng to Minecraft chunk coordinates
    public int[] latLngToMinecraft(double lat, double lng) {
        double[] meters = latLngToMeters(lat, lng);
        double metersPerChunk = metersPerBlock * CHUNK_SIZE;

        int chunkX = (int) Math.floor(meters[0] / metersPerChunk);
        int chunkZ = (int) Math.floor(meters[1] / metersPerChunk);

        return new int[]{chunkX, chunkZ};
    }

    public double[] blockToLatLng(double x, double z) {
        double metersX = x * metersPerBlock;
        double metersZ = z * metersPerBlock;

        double lng = (metersX / EARTH_RADIUS) * (180 / Math.PI);
        double lat = (2 * Math.atan(Math.exp(metersZ / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI);

        return new double[]{lat, lng};
    }

    public int[] latLngToBlock(double lat, double lng) {
        double[] meters = latLngToMeters(lat, lng);
        double x = meters[0] / metersPerBlock;
        double z = meters[1] / metersPerBlock;

        return new int[]{(int) x, (int) z};
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
