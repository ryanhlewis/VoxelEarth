package com.example.voxelearth;

import org.bukkit.Bukkit;

import java.util.logging.Level;
import java.util.logging.Logger;

final class Log {
    private Log() {}

    private static Logger pluginLogger() {
        VoxelEarth plugin = VoxelEarth.getInstance();
        if (plugin != null) {
            return plugin.getLogger();
        }
        return Bukkit.getLogger();
    }

    static void info(String message) {
        pluginLogger().info(message);
    }

    static void warning(String message) {
        pluginLogger().warning(message);
    }

    static void severe(String message) {
        pluginLogger().severe(message);
    }

    static void debug(String message) {
        pluginLogger().fine(message);
    }

    static void log(Level level, String message) {
        pluginLogger().log(level, message);
    }

    static void log(Level level, String message, Throwable throwable) {
        pluginLogger().log(level, message, throwable);
    }
}
