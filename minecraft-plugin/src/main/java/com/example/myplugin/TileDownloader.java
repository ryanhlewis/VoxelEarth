package com.example.voxelearth;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.UUID;

// arrays
import java.util.Arrays;


/**
 * Profiled version of TileDownloader that times tile downloads.
 *
 * Now also parses lines for:
 *   TILE_TRANSLATION <filename> [tx, ty, tz]
 * ... so you can retrieve them afterward if needed.
 */
public class TileDownloader {

    // private VoxelEarth plugin;

    private String apiKey;
    private double latitude;
    private double longitude;
    private double radius;
    private double[] origin; // If not null, we pass --origin to the Node script
    private final String nodeScriptPath;

    // We'll keep a map from tileFilename => local translation [x,y,z].
    // (tileFilename is the final .glb name, e.g. "a1b2c3.glb")
    private Map<String, double[]> tileTranslations = new HashMap<>();

    public TileDownloader(/*VoxelEarth plugin,*/ String apiKey, double latitude, double longitude, int radius) {
        // this.plugin = plugin;
        this.apiKey = apiKey;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radius = radius;
        this.nodeScriptPath = resolveNodeScriptPath();
    }

    public void setCoordinates(double latitude, double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void setRadius(double radius) {
        this.radius = radius;
    }

    public void setOrigin(double[] origin) {
        this.origin = origin;
    }

    public double[] getOrigin() {
        return origin;
    }

    /**
     * Return the per-tile local translations that the Node script printed.
     * Map of .glb filename => [tx, ty, tz].
     */
    public Map<String, double[]> getTileTranslations() {
        return tileTranslations;
    }

    private String resolveNodeScriptPath() {
        String[] candidates = new String[] {
                "server-folder-items/scripts/download_and_rotate.js",
                "scripts/download_and_rotate.js",
                "download_and_rotate.js"
        };
        for (String candidate : candidates) {
            File script = new File(candidate);
            if (script.exists()) {
                System.out.println("[TileDownloader] Using Node script at " + script.getPath());
                return script.getPath();
            }
        }
        // Fall back to the first candidate so Runtime.exec still has something to run.
        System.out.println("[TileDownloader] Could not verify Node script path, defaulting to " + candidates[0]);
        return candidates[0];
    }

    private void parseCopyrightLine(String line, UUID playerId) {
        // Expected format: "ASSET_COPYRIGHT <filename>.glb Google;Airbus"
        String rest = line.substring("ASSET_COPYRIGHT".length()).trim();
        int spaceIndex = rest.indexOf(' ');
        if (spaceIndex < 0) return; // malformed
        String tileFile = rest.substring(0, spaceIndex).trim();
        String namesPart = rest.substring(spaceIndex).trim(); 
        String[] owners = namesPart.split(";");
        if (owners.length > 0) {
            // Notify the plugin for this player.
            // plugin.addCopyrightAttributions(playerId, Arrays.asList(owners));
        }
    }
    
    /**
     * Call the Node.js script to fetch & rotate tiles.
     * Returns the .glb filenames that were downloaded, in the order the script printed them.
     */
    public List<String> downloadTiles(String outputDirectory/*, UUID playerId*/) throws IOException, InterruptedException {
        long start = System.currentTimeMillis();

        // Build the command
        List<String> cmd = new ArrayList<>();
        cmd.add("node");
        cmd.add(nodeScriptPath);
        cmd.add("--key");
        cmd.add(apiKey);
        cmd.add("--lat");
        cmd.add(String.valueOf(longitude));
        cmd.add("--lng");
        cmd.add(String.valueOf(latitude));
        cmd.add("--radius");
        cmd.add(String.valueOf(radius));
        cmd.add("--out");
        cmd.add(outputDirectory);

        if (origin != null) {
            cmd.add("--origin");
            cmd.add(String.valueOf(origin[0]));
            cmd.add(String.valueOf(origin[1]));
            cmd.add(String.valueOf(origin[2]));
        }

        // print the command for debugging
        System.out.println("Running command: " + String.join(" ", cmd));

        String[] command = cmd.toArray(new String[0]);
        Process process = Runtime.getRuntime().exec(command);

        List<String> downloadedTiles = new ArrayList<>();
        double[] capturedOrigin = null;

        // Clear tileTranslations each time we call downloadTiles()
        tileTranslations.clear();

        try (
            BufferedReader stdOut = new BufferedReader(new InputStreamReader(process.getInputStream()));
            BufferedReader stdErr = new BufferedReader(new InputStreamReader(process.getErrorStream()))
        ) {
            String line;
            while ((line = stdOut.readLine()) != null) {
                // if line starts with ORIGIN_TRANSLATION ...
                if (line.startsWith("ORIGIN_TRANSLATION")) {
                    String jsonPart = line.substring("ORIGIN_TRANSLATION".length()).trim();
                    JSONArray arr = new JSONArray(jsonPart);
                    capturedOrigin = new double[]{ arr.getDouble(0), arr.getDouble(1), arr.getDouble(2) };
                }
                else if (line.startsWith("ASSET_COPYRIGHT")) {
                    // Format: "ASSET_COPYRIGHT <filename>.glb name1;name2;..."
                    // e.g.   "ASSET_COPYRIGHT 0667e62652ab550c8d1858cbfc6307f74c304110.glb Google;Airbus"
                    // parseCopyrightLine(line, playerId);
                }
                // if line starts with TILE_TRANSLATION ...
                else if (line.startsWith("TILE_TRANSLATION")) {
                    // e.g. "TILE_TRANSLATION a1b2c3.glb [12.3,4.56,7.89]"
                    // We'll parse the pieces. 
                    // E.g. line might be: "TILE_TRANSLATION a1b2c3.glb [1.234, 5.678, -9.01]"
                    // We'll split by space or use a substring approach.

                    String trimmed = line.substring("TILE_TRANSLATION".length()).trim();
                    // trimmed => "a1b2c3.glb [1.234, 5.678, -9.01]"

                    int spaceIndex = trimmed.indexOf(' ');
                    if (spaceIndex > 0) {
                        String tileFile = trimmed.substring(0, spaceIndex).trim(); 
                        String coordsPart = trimmed.substring(spaceIndex).trim(); 
                        // coordsPart => "[1.234,5.678,-9.01]"
                        JSONArray arr = new JSONArray(coordsPart);
                        double tx = arr.getDouble(0);
                        double ty = arr.getDouble(1);
                        double tz = arr.getDouble(2);
                        tileTranslations.put(tileFile, new double[]{ tx, ty, tz });
                    }
                }
                // if line starts with DOWNLOADED_TILES:
                else if (line.startsWith("DOWNLOADED_TILES:")) {
                    String jsonString = line.substring("DOWNLOADED_TILES:".length()).trim();
                    JSONArray arr = new JSONArray(jsonString);
                    for (int i = 0; i < arr.length(); i++) {
                        downloadedTiles.add(arr.getString(i));
                    }
                }
                else {
                    // optional: debug printing or ignore
                    // System.out.println("[NodeJS] " + line);
                }
            }

            // read stderr
            while ((line = stdErr.readLine()) != null) {
                System.err.println("[NodeJS ERR] " + line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Node.js script failed with exit code " + exitCode);
        }

        // If we did not pass an origin, but the script discovered one, store it.
        if (this.origin == null && capturedOrigin != null) {
            this.origin = capturedOrigin;
        }

        long end = System.currentTimeMillis();
        System.out.println("[PERF] downloadTiles() took " + (end - start) 
                           + " ms with " + downloadedTiles.size() + " tiles.");

        return downloadedTiles;
    }
}
