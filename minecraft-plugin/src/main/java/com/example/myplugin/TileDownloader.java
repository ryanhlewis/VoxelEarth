package com.example.voxelearth;

import java.io.*;

public class TileDownloader {
    private String apiKey;
    private double latitude;
    private double longitude;
    private double radius;

    public TileDownloader(String apiKey, double latitude, double longitude, double radius) {
        this.apiKey = apiKey;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radius = radius;
    }

    public void downloadTiles(String outputDirectory) throws IOException, InterruptedException {
        // Construct the command
        String[] command = {
            "python3",
            "-m", "scripts.download_tiles",
            "-k", apiKey,
            "-c", String.valueOf(latitude), String.valueOf(longitude),
            "-r", String.valueOf(radius),
            "-o", outputDirectory
        };

        // Run the command using Runtime.exec()
        Process process = Runtime.getRuntime().exec(command);
        
        // Capture the output from the command
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        while ((line = reader.readLine()) != null) {
            System.out.println(line);
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
    }

    public static void main(String[] args) {
        try {
            // Example usage
            TileDownloader downloader = new TileDownloader("your_api_key_here", 37.7749, -122.4194, 10.0);
            downloader.downloadTiles("/path/to/output/directory");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
