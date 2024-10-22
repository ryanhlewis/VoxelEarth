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

public class VoxelChunkGenerator extends ChunkGenerator {

    private static final double LAT_ORIGIN = 50.081033020810736;
    private static final double LNG_ORIGIN = 14.451093643141064;
    private static final String API_KEY = "AIzaSy..."; // Your API key here
    private TileDownloader tileDownloader;
    private Map<String, Map<String, Material>> indexedBlocks = new HashMap<>();
    private static final List<MaterialColor> MATERIAL_COLORS = new ArrayList<>();
    private Map<Integer, Material> colorToMaterialCache = new HashMap<>();

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
    indexedBlocks = new HashMap<>();
    loadMaterialColors();
    System.out.println("MAT SIZE: " + MATERIAL_COLORS.size());
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


public void loadJson(String filename, double scaleX, double scaleY, double scaleZ, double offsetX, double offsetY, double offsetZ) throws IOException {
    File file = new File(filename);
    if (!file.exists()) {
        System.out.println("File " + filename + " does not exist.");
        return;
    }

indexedBlocks = new HashMap<>();

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

                indexedBlocks.put(baseName, blockMap);





        Bukkit.getScheduler().runTask(Bukkit.getPluginManager().getPlugin("VoxelEarth"), () -> {
            System.out.println("Starting chunk regeneration...");
            System.out.println("Indexblocks length " + indexedBlocks.size());

            for (Map.Entry<String, Map<String, Material>> tileEntry : indexedBlocks.entrySet()) {
                Map<String, Material> blockMap1 = tileEntry.getValue();

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
