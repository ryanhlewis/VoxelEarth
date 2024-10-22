package com.example.voxelearth;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.plugin.java.JavaPlugin;

public class VoxelEarth extends JavaPlugin {

    // Hold a single instance of VoxelChunkGenerator
    private VoxelChunkGenerator voxelChunkGenerator;

    @Override
    public void onEnable() {
        getLogger().info("VoxelEarth has been enabled");
    }

    @Override
    public void onDisable() {
        getLogger().info("VoxelEarth has been disabled");
    }

    @Override
    public ChunkGenerator getDefaultWorldGenerator(String worldName, String id) {
        if (voxelChunkGenerator == null) {
            getLogger().info("VoxelEarth making new Chunk Generator");
            voxelChunkGenerator = new VoxelChunkGenerator();
        }
        getLogger().info("VoxelEarth is returning Default World Generator");
        return new VoxelChunkGenerator();
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (command.getName().equalsIgnoreCase("createcustomworld")) {
            if (args.length == 1) {
                String worldName = args[0];
                WorldCreator worldCreator = new WorldCreator(worldName);
                worldCreator.generator(new VoxelChunkGenerator());
                World world = Bukkit.createWorld(worldCreator);
                sender.sendMessage("Custom world '" + worldName + "' created!");
                return true;
            } else {
                sender.sendMessage("Usage: /createcustomworld <worldname>");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("regenchunks")) {
            if (args.length == 6) {  // Updated to expect 6 arguments
                double scaleX = Double.parseDouble(args[0]);
                double scaleY = Double.parseDouble(args[1]);
                double scaleZ = Double.parseDouble(args[2]);
                double newOffsetX = Double.parseDouble(args[3]);
                double newOffsetY = Double.parseDouble(args[4]);
                double newOffsetZ = Double.parseDouble(args[5]);

                World world = Bukkit.getWorld("world"); // Replace with your world name
                if (world == null) {
                    sender.sendMessage("World not found!");
                    return false;
                }

                if (voxelChunkGenerator == null) {
                    getLogger().info("VoxelEarth making new Chunk Generator");
                    voxelChunkGenerator = new VoxelChunkGenerator();
                }

                // Call regenChunks with individual scaling and offsets for each axis
                voxelChunkGenerator.regenChunks(world, scaleX, scaleY, scaleZ, newOffsetX, newOffsetY, newOffsetZ);

                sender.sendMessage("Chunks regenerated with new parameters.");
                return true;
            } else {
                sender.sendMessage("Usage: /regenchunks <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>");
                return false;
            }
        } else if (command.getName().equalsIgnoreCase("loadjson")) {
            if (args.length == 7) {
                String filename = args[0];
                double scaleX = Double.parseDouble(args[1]);
                double scaleY = Double.parseDouble(args[2]);
                double scaleZ = Double.parseDouble(args[3]);
                double offsetX = Double.parseDouble(args[4]);
                double offsetY = Double.parseDouble(args[5]);
                double offsetZ = Double.parseDouble(args[6]);

                World world = Bukkit.getWorld("world"); // future - player's world or custom?
                if (world == null) {
                    sender.sendMessage("World not found!");
                    return false;
                }

                if (voxelChunkGenerator == null) {
                    getLogger().info("Creating new VoxelChunkGenerator");
                    voxelChunkGenerator = new VoxelChunkGenerator();
                }

                try {
                    voxelChunkGenerator.loadMaterialColors();
                    voxelChunkGenerator.loadJson(filename, scaleX, scaleY, scaleZ, offsetX, offsetY, offsetZ);
                    // voxelChunkGenerator.regenChunks(world);
                    sender.sendMessage("JSON file loaded and chunks regenerated.");
                } catch (Exception e) {
                    sender.sendMessage("Failed to load JSON file: " + filename);
                    e.printStackTrace();
                }
                return true;
            } else {
                sender.sendMessage("Usage: /loadjson <filename> <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>");
                return false;
            }
        }
        return false;
    }
}
