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

public class VoxelChunkGenerator extends ChunkGenerator {

    private static final double LAT_ORIGIN = 50.081033020810736;
    private static final double LNG_ORIGIN = 14.451093643141064;
    private static final String API_KEY = "AIzaSy..."; // Your API key here
    private TileDownloader tileDownloader;
    private Map<String, Map<String, Material>> indexedBlocks = new HashMap<>();


    // Default values for scale and offsets
    private double scaleFactor = 1.0;
    private double offsetX = 0.0;
    private double offsetY = 0.0;
    private double offsetZ = 0.0;
    private double scaleX = 0.0;
    private double scaleY = 0.0;
    private double scaleZ = 0.0;

public void regenChunks(World world, 
                        double scaleX, double scaleY, double scaleZ, 
                        double newOffsetX, double newOffsetY, double newOffsetZ) {
    // Update the parameters for each axis separately
    this.offsetX = newOffsetX;
    this.offsetY = newOffsetY;
    this.offsetZ = newOffsetZ;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.scaleZ = scaleZ;

    System.out.println("Clearing existing blocks...");
    for (int chunkX = -20; chunkX <= 20; chunkX++) {
        for (int chunkZ = -20; chunkZ <= 20; chunkZ++) {
            Chunk chunk = world.getChunkAt(chunkX, chunkZ);
            if (!chunk.isLoaded()) {
                chunk.load();
            }

            for (int x = 0; x < 16; x++) {
                for (int y = 0; y < world.getMaxHeight(); y++) {
                    for (int z = 0; z < 16; z++) {
                        chunk.getBlock(x, y, z).setType(Material.AIR, false);
                    }
                }
            }
        }
    }
    System.out.println("All blocks cleared. Loading and regenerating new blocks...");

    try {
        loadIndexedJson(new File("tiles0_0")); // Adjust path if needed
    } catch (IOException e) {
        System.out.println("Failed to load indexed JSON blocks.");
        e.printStackTrace();
    }

    Bukkit.getScheduler().runTask(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
        System.out.println("Starting chunk regeneration...");
        System.out.println("Indexblocks length " + indexedBlocks.size());

        for (Map.Entry<String, Map<String, Material>> tileEntry : indexedBlocks.entrySet()) {
            Map<String, Material> blockMap = tileEntry.getValue();

            for (Map.Entry<String, Material> blockEntry : blockMap.entrySet()) {
                String[] parts = blockEntry.getKey().split(",");
                int originalX = Integer.parseInt(parts[0]);
                int originalY = Integer.parseInt(parts[1]);
                int originalZ = Integer.parseInt(parts[2]);

                int newX = (int) (originalX);
                int newY = (int) (originalY);
                int newZ = (int) (originalZ);

                int blockChunkX = newX >> 4;
                int blockChunkZ = newZ >> 4;

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
        System.out.println("Chunks regenerated with new parameters.");
    });
}





    public VoxelChunkGenerator() {
        System.out.println("VoxelEarth is making TileDownloader");
        tileDownloader = new TileDownloader(API_KEY, LNG_ORIGIN, LAT_ORIGIN, 100); //15
    }

    private void downloadAndProcessTiles(int chunkX, int chunkZ) {
        try {
            String outputDirectory = "tiles" + chunkX + "_" + chunkZ;
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
                String outputFile = file.getAbsolutePath().replace(".glb", ".json");
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
            }
        }
    }

    private Material mapRgbaToMaterial(JSONArray rgbaArray) {
        // Custom logic to map RGBA values to a Material type.
        // This is just a placeholder for right now-
        // 
        int r = rgbaArray.getInt(0);
        int g = rgbaArray.getInt(1);
        int b = rgbaArray.getInt(2);
        int a = rgbaArray.getInt(3);
    
        // Example: Map specific RGBA values to a MC Blocks
        if (r == 126 && g == 137 && b == 141 && a == 255) {
            return Material.STONE;
        }
        // Add more mappings as needed...
    
        // return Material.AIR;  // Default to AIR if no match is found
        return Material.STONE;
    }

private void loadIndexedJson(File directory) throws IOException {
    File[] jsonFiles = directory.listFiles((dir, name) -> name.endsWith(".json") && !name.contains("_position"));
    if (jsonFiles != null) {
        for (File file : jsonFiles) {
            String baseName = file.getName().replace(".json", "");
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

                JSONArray blocksArray = json.getJSONArray("blocks");
                JSONArray xyziArray = json.getJSONArray("xyzi");
                Map<String, Material> blockMap = new HashMap<>();

                Map<Integer, Material> colorIndexToMaterial = new HashMap<>();
                for (int i = 0; i < blocksArray.length(); i++) {
                    JSONArray blockEntry = blocksArray.getJSONArray(i);
                    int colorIndex = blockEntry.getInt(0);
                    JSONArray rgbaArray = blockEntry.getJSONArray(1);

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

                indexedBlocks.put(baseName, blockMap);
            }
        }
    }
}



// Save indexedBlocks to a file
public void saveIndexedBlocks(String filename) throws IOException {
    try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream(filename))) {
        out.writeObject(indexedBlocks);
    }
}

// Load indexedBlocks from a file
public void loadIndexedBlocks(String filename) throws IOException, ClassNotFoundException {
    try (ObjectInputStream in = new ObjectInputStream(new FileInputStream(filename))) {
        indexedBlocks = (Map<String, Map<String, Material>>) in.readObject();
    }
}


    @Override
    public void generateSurface(WorldInfo worldInfo, Random random, int chunkX, int chunkZ, ChunkData chunkData) {
        // System.out.println("VoxelEarth is Generating Surface");

        // Only download and process tiles once for the initial chunks
        if (chunkX == 0 && chunkZ == 0) {
            System.out.println("Performing Voxel Earth on initial chunk: " + chunkX + ", " + chunkZ);
            downloadAndProcessTiles(chunkX, chunkZ);

            System.out.println("saving indexed blocks");
            try {
                saveIndexedBlocks("tiles_0");  // Adjust path as needed
            } catch (Exception e) {
                        e.printStackTrace();
                    }
            
        }

        // Now process the blocks, allowing them to extend across all relevant chunks
        for (Map.Entry<String, Map<String, Material>> chunkEntry : indexedBlocks.entrySet()) {
            Map<String, Material> blockMap = chunkEntry.getValue();
    
            for (Map.Entry<String, Material> blockEntry : blockMap.entrySet()) {
                String[] parts = blockEntry.getKey().split(",");
                int x = Integer.parseInt(parts[0]);
                int y = Integer.parseInt(parts[1]);
                int z = Integer.parseInt(parts[2]);
    
                // Calculate the chunk coordinates for the block
                int blockChunkX = x >> 4;  // equivalent to x / 16
                int blockChunkZ = z >> 4;  // equivalent to z / 16
    
                // Check if this block belongs to the current chunk being generated
                if (blockChunkX == chunkX && blockChunkZ == chunkZ) {
                    // Calculate local coordinates within the chunk
                    int localX = x & 15;  // equivalent to x % 16
                    int localZ = z & 15;  // equivalent to z % 16
    
                    chunkData.setBlock(localX, y, localZ, blockEntry.getValue());
                    // System.out.println("Setting block at " + localX + ", " + y + ", " + localZ + " in chunk (" + chunkX + ", " + chunkZ + ") with material: " + blockEntry.getValue());
                }
            }
        }
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
