package com.example.voxelearth;

import org.bukkit.plugin.java.JavaPlugin;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Objects;
import java.util.logging.Level;

/**
 * Handles the Google API key used for both geocoding and tiles.
 * Stores a user-supplied key on disk while keeping the built-in default in memory only.
 */
public class ApiKeyManager {

    private final JavaPlugin plugin;
    private final String defaultApiKey;
    private final Path keyFile;
    private volatile String customApiKey;

    public ApiKeyManager(JavaPlugin plugin, String defaultApiKey) {
        this.plugin = Objects.requireNonNull(plugin, "plugin");
        this.defaultApiKey = Objects.requireNonNull(defaultApiKey, "defaultApiKey");
        this.keyFile = plugin.getDataFolder().toPath().resolve("custom-api-key.txt");
        reloadFromDisk();
    }

    public synchronized void reloadFromDisk() {
        customApiKey = null;
        if (!Files.exists(keyFile)) {
            return;
        }
        try {
            String contents = Files.readString(keyFile, StandardCharsets.UTF_8).trim();
            if (!contents.isEmpty()) {
                customApiKey = contents;
                plugin.getLogger().info("[ApiKeyManager] Loaded custom API key supplied by server owner.");
            }
        } catch (IOException e) {
            plugin.getLogger().log(Level.WARNING, "Failed to load custom API key file: " + keyFile, e);
        }
    }

    public synchronized void setCustomApiKey(String apiKey) throws IOException {
        String trimmed = apiKey == null ? "" : apiKey.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("API key cannot be empty.");
        }
        File dataFolder = plugin.getDataFolder();
        if (!dataFolder.exists() && !dataFolder.mkdirs()) {
            throw new IOException("Could not create plugin data directory: " + dataFolder);
        }
        Files.writeString(
                keyFile,
                trimmed,
                StandardCharsets.UTF_8,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING,
                StandardOpenOption.WRITE
        );
        customApiKey = trimmed;
        plugin.getLogger().info("[ApiKeyManager] Stored custom API key provided via command.");
    }

    public String getCurrentApiKey() {
        String cached = customApiKey;
        if (cached != null && !cached.isBlank()) {
            return cached;
        }
        return defaultApiKey;
    }

    public boolean hasCustomKey() {
        String cached = customApiKey;
        return cached != null && !cached.isBlank();
    }
}
