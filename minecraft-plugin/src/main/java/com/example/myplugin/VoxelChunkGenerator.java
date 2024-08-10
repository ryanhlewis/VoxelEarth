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

public class VoxelChunkGenerator extends ChunkGenerator {

    private static final double LAT_ORIGIN = 50.081033020810736;
    private static final double LNG_ORIGIN = 14.451093643141064;
    private static final String API_KEY = "AIzaSy..."; // Your API key here
    private TileDownloader tileDownloader;
    private Map<String, Map<String, Material>> indexedBlocks = new HashMap<>();

    public VoxelChunkGenerator() {
        tileDownloader = new TileDownloader(API_KEY, LNG_ORIGIN, LAT_ORIGIN, 15);
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
        File[] files = directory.listFiles((dir, name) -> name.endsWith(".json"));
        if (files != null) {
            System.out.println("Found " + files.length + " JSON files in directory " + directory);
            for (File file : files) {
                String chunkKey = file.getName().replace(".json", "");
                try (FileReader reader = new FileReader(file)) {
                    JSONObject json = new JSONObject(new JSONTokener(reader));
    
                    // Debug the JSON object
                    // System.out.println("JSON content from file: " + file.getName());
                    // System.out.println(json.toString(2)); // Pretty print with indentation
    
                    // Check if the "blocks" and "xyzi" keys exist
                    if (!json.has("blocks") || !json.has("xyzi")) {
                        System.out.println("No 'blocks' or 'xyzi' key found in JSON file: " + file.getName());
                        continue; // Skip this file and move to the next
                    }
    
                    JSONArray blocksArray = json.getJSONArray("blocks");
                    JSONArray xyziArray = json.getJSONArray("xyzi");
                    Map<String, Material> blockMap = new HashMap<>();
    
                    // Map color indices to materials
                    Map<Integer, Material> colorIndexToMaterial = new HashMap<>();
                    for (int i = 0; i < blocksArray.length(); i++) {
                        JSONArray blockEntry = blocksArray.getJSONArray(i);
                        int colorIndex = blockEntry.getInt(0);
                        JSONArray rgbaArray = blockEntry.getJSONArray(1);
    
                        // Create a material based on the RGBA values
                        Material material = mapRgbaToMaterial(rgbaArray);
                        colorIndexToMaterial.put(colorIndex, material);
                    }
    
                    // Now parse the "xyzi" array
                    for (int i = 0; i < xyziArray.length(); i++) {
                        JSONArray xyziEntry = xyziArray.getJSONArray(i);
                        int x = xyziEntry.getInt(0);
                        int y = xyziEntry.getInt(1);
                        int z = xyziEntry.getInt(2);
                        int colorIndex = xyziEntry.getInt(3);
    
                        String blockName = x + "," + y + "," + z;
                        Material material = colorIndexToMaterial.get(colorIndex);
    
                        if (material != null) {
                            blockMap.put(blockName, material);
                            System.out.println("Adding block at " + blockName + " with material: " + material);
                        } else {
                            System.out.println("Unknown material for color index: " + colorIndex);
                        }
                    }
                    int chunkX = 0; // Calculate or extract chunkX from the file or data
                    int chunkZ = -1; // Calculate or extract chunkZ from the file or data
                    chunkKey = chunkX + "_" + chunkZ;
                    System.out.println("Storing block data with chunkKey: " + chunkKey);
                    indexedBlocks.put(chunkKey, blockMap);
                } catch (Exception e) {
                    System.err.println("Error reading or parsing JSON file: " + file.getName());
                    e.printStackTrace();
                }
            }
        } else {
            System.out.println("No files found in directory " + directory);
        }
    }
    

    @Override
    public void generateSurface(WorldInfo worldInfo, Random random, int chunkX, int chunkZ, ChunkData chunkData) {
        
        // Only download and process tiles once for the initial chunks
        if (chunkX == 0 && chunkZ == 0) {
            System.out.println("Performing Voxel Earth on initial chunk: " + chunkX + ", " + chunkZ);
            downloadAndProcessTiles(chunkX, chunkZ);
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
                    System.out.println("Setting block at " + localX + ", " + y + ", " + localZ + " in chunk (" + chunkX + ", " + chunkZ + ") with material: " + blockEntry.getValue());
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
