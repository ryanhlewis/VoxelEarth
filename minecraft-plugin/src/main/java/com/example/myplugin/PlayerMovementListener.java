package com.example.voxelearth;

import org.bukkit.event.Listener;
import org.bukkit.event.EventHandler;
import org.bukkit.event.player.PlayerMoveEvent;
import org.bukkit.entity.Player;
import org.bukkit.Location;

public class PlayerMovementListener implements Listener {

    private VoxelEarth plugin;

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
        System.out.println("Player moved to: " + x + ", " + z);
        double[] latLng = generator.blockToLatLng(x, z);
        System.out.println("Player's latitude and longitude: " + latLng[0] + ", " + latLng[1]);
    

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
