package com.example.voxelearth;

import org.bukkit.event.Listener;
import org.bukkit.event.EventHandler;
import org.bukkit.event.player.PlayerMoveEvent;
import org.bukkit.entity.Player;
import org.bukkit.Location;
import java.util.HashMap;
import java.util.Map;

public class PlayerMovementListener implements Listener {

    private VoxelEarth plugin;
    private Map<Player, Location> lastLoadedLocations = new HashMap<>();
    private static final double LOAD_THRESHOLD = 50.0;

    public PlayerMovementListener(VoxelEarth plugin) {
        this.plugin = plugin;
        plugin.getLogger().info("PlayerMovementListener has been created");
    }

    @EventHandler
    public void onPlayerMove(PlayerMoveEvent event) {
        Player player = event.getPlayer();
        Location from = event.getFrom();
        Location to = event.getTo();

        // Check if the player has moved a meaningful amount (not just head movement)
        if (from.getBlockX() == to.getBlockX() &&
            from.getBlockY() == to.getBlockY() &&
            from.getBlockZ() == to.getBlockZ()) {
            return; // Ignore small movements
        }

        VoxelChunkGenerator generator = plugin.getVoxelChunkGenerator();

        // Get the player's current position (XYZ)
        double x = to.getX();
        double z = to.getZ();

        // Convert player's position to tile coordinates
        int tileX = (int) Math.floor(x / 16);
        int tileZ = (int) Math.floor(z / 16);
        double[] latLng = generator.minecraftToLatLng(tileX, tileZ); // Assume 1 meter per block

        // System.out.println("Player moved to: " + x + ", " + z);
        // double[] latLng = generator.blockToLatLng(x, z);
        // System.out.println("Player's latitude and longitude: " + latLng[0] + ", " + latLng[1]);
    
        // Get the last location where tiles were loaded for this player
        Location lastLocation = lastLoadedLocations.get(player);

        // If no tiles have been loaded yet, or if the player has moved beyond the threshold
        if (lastLocation == null || lastLocation.distance(to) >= LOAD_THRESHOLD) {
            // Update the last loaded location
            lastLoadedLocations.put(player, to.clone());

            // Loading chunks at
            System.out.println("Player loaded new latlng: " + latLng[0] + ", " + latLng[1]);

            // Load the chunk asynchronously
            // generator.loadChunk(player.getUniqueId(), tileX, tileZ, false, (blockLocation) -> {
            // });

        }


        // Check if the player is near the edge of loaded tiles
        // if (generator.isNearEdge(x, z)) {
        //     // Convert player's position to latitude/longitude
        //     double[] latLng = generator.minecraftToLatLng(x, 0, z);
        //     double lat = latLng[0];
        //     double lng = latLng[1];

        //     // Load new tiles dynamically based on the new lat/lng
        //     generator.loadTilesAt(lat, lng);
        // }
    }
}
