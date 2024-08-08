package com.example.voxelearth;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.WorldCreator;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.plugin.java.JavaPlugin;

public class VoxelEarth extends JavaPlugin {

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
        }
        return false;
    }
}
