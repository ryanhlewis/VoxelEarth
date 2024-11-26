package com.example.voxelearth;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;

public class TileDownloader {
    private String apiKey;
    private double latitude;
    private double longitude;
    private double radius;
    private double[] origin;

    public TileDownloader(String apiKey, double latitude, double longitude, double radius) {
        System.out.println("Made TileDownloader");
        this.apiKey = apiKey;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radius = radius;
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

    public List<String> downloadTiles(String outputDirectory) throws IOException, InterruptedException {
        List<String> downloadedTiles = new ArrayList<>();

        // Construct the command
        String[] command = origin != null
        ? new String[] {
            "python3",
            "-m", "scripts.download_tiles",
            "-k", apiKey,
            "-c", String.valueOf(latitude), String.valueOf(longitude),
            "-r", String.valueOf(radius),
            "-o", outputDirectory,
            "--origin", String.valueOf(origin[0]), String.valueOf(origin[1]), String.valueOf(origin[2])
        }
        : new String[] {
            "python3",
            "-m", "scripts.download_tiles",
            "-k", apiKey,
            "-c", String.valueOf(latitude), String.valueOf(longitude),
            "-r", String.valueOf(radius),
            "-o", outputDirectory
        };
    

        // Print the command for debugging
        System.out.println("[I/O] Running command: " + String.join(" ", command));

        // Run the command using Runtime.exec()
        Process process = Runtime.getRuntime().exec(command);

        // Capture the output from the command
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        while ((line = reader.readLine()) != null) {
            System.out.println(line);  // Keep printing logs for debugging
            if (line.startsWith("DOWNLOADED_TILES:")) {
                String jsonString = line.substring("DOWNLOADED_TILES:".length()).trim();
                JSONArray jsonArray = new JSONArray(jsonString);
                for (int i = 0; i < jsonArray.length(); i++) {
                    String tileFilename = jsonArray.getString(i);
                    downloadedTiles.add(tileFilename);
                }
            }
        }

        // Capture any errors from the command
        BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
        while ((line = errorReader.readLine()) != null) {
            System.err.println(line);
        }

        // Wait for the process to complete and get the exit value
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Python script execution failed with exit code " + exitCode);
        }

        System.out.println("[I/O] Python script executed successfully.");

        return downloadedTiles;  // Return the list of downloaded tiles
    }
}
