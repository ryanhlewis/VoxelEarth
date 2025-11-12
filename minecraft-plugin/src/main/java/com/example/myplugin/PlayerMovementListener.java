package com.example.voxelearth;

import org.bukkit.event.Listener;
import org.bukkit.event.EventHandler;
import org.bukkit.event.player.PlayerMoveEvent;
import org.bukkit.entity.Player;
import org.bukkit.Location;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

public class PlayerMovementListener implements Listener {

    private final VoxelEarth plugin;

    // Per-player last location we used to trigger a load
    private final Map<UUID, Location> lastLoadedLocations = new ConcurrentHashMap<>();

    // Track a per-player "origin tile" we anchor quadrant math to
    private final Map<UUID, Integer> originTileX = new ConcurrentHashMap<>();
    private final Map<UUID, Integer> originTileZ = new ConcurrentHashMap<>();
    // Remember the real-world lat/lng (sign) of the current visit destination so we
    // can classify quadrants even if minecraftToLatLng is distorted by offsets.
    private final Map<UUID, double[]> referenceLatLng = new ConcurrentHashMap<>();

    // NEW: configurable threshold in BLOCKS (distance between lastLoadedLocation and current)
    private volatile double moveThresholdBlocks = 50.0;

    // NEW: per-player opt-in/out for movement load (default ON)
    private final Set<UUID> moveLoadEnabled = ConcurrentHashMap.newKeySet();

    // NEW: per-player cooldown + in-flight guard
    private final Map<UUID, Long> lastLoadMs = new ConcurrentHashMap<>();
    private final Map<UUID, AtomicBoolean> inFlight = new ConcurrentHashMap<>();
    private static final long COOLDOWN_MS = 3000L; // 3s between loads per player

    // Keep track of explicit off to preserve intent across joins (optional)
    private final Set<UUID> explicitlyDisabled = ConcurrentHashMap.newKeySet();

    // Gating for visit workflow
    private final Set<UUID> hasCompletedInitialVisit = ConcurrentHashMap.newKeySet();
    private final Set<UUID> visitInProgress = ConcurrentHashMap.newKeySet();

    public PlayerMovementListener(VoxelEarth plugin) {
        this.plugin = plugin;
        plugin.getLogger().info("PlayerMovementListener has been created");
    }

    // --- Admin/player controls ------------------------------------------------

    public void setMoveThresholdBlocks(double blocks) {
        moveThresholdBlocks = Math.max(4.0, blocks); // prevent silly small values
    }

    public double getMoveThresholdBlocks() {
        return moveThresholdBlocks;
    }

    public boolean isMoveLoadEnabled(UUID playerId) {
        // default ON
        return moveLoadEnabled.contains(playerId) || !moveLoadEnabled.contains(playerId) && !explicitlyDisabled.contains(playerId);
    }

    public void setMoveLoad(UUID playerId, boolean enabled) {
        if (enabled) {
            moveLoadEnabled.add(playerId);
            explicitlyDisabled.remove(playerId);
        } else {
            moveLoadEnabled.remove(playerId);
            explicitlyDisabled.add(playerId);
        }
    }

    public void toggleMoveLoad(UUID playerId) {
        setMoveLoad(playerId, !isMoveLoadEnabled(playerId));
    }

    // --- Visit gating -------------------------------------------------------

    public void suspendMoveLoadForVisit(UUID id) {
        visitInProgress.add(id);
        resetPlayerOrigin(id);
    }

public void markVisitArrived(UUID id) {
    visitInProgress.remove(id);
    hasCompletedInitialVisit.add(id);
    // Only reset the origin tiles; keep the quadrant anchor.
    originTileX.remove(id);
    originTileZ.remove(id);
    inFlight.computeIfAbsent(id, k -> new AtomicBoolean(false)).set(false);
    lastLoadedLocations.remove(id);
    lastLoadMs.remove(id);
}


    public void cancelVisit(UUID id) {
        visitInProgress.remove(id);
    }

    private boolean gateAllowsMoveLoad(UUID id) {
        return isMoveLoadEnabled(id)
                && !visitInProgress.contains(id)
                && hasCompletedInitialVisit.contains(id);
    }

    public void resetPlayerOrigin(UUID playerId) {
        if (playerId == null) return;
        originTileX.remove(playerId);
        originTileZ.remove(playerId);
        // referenceLatLng.remove(playerId);
    }

    public void setReferenceLatLng(UUID playerId, double lat, double lng) {
        if (playerId == null) return;
        referenceLatLng.put(playerId, new double[]{ lat, lng });
    }

    // --- Movement handling ----------------------------------------------------

    @EventHandler
    public void onPlayerMove(PlayerMoveEvent event) {
        Player player = event.getPlayer();
        UUID pid = player.getUniqueId();

        Location from = event.getFrom();
        Location to = event.getTo();
        if (to == null) return;

        // Ignore tiny head rotations
        if (from.getBlockX() == to.getBlockX() &&
            from.getBlockY() == to.getBlockY() &&
            from.getBlockZ() == to.getBlockZ()) {
            return;
        }

        // Respect visit gating and per-player toggles
        if (!gateAllowsMoveLoad(pid)) return;

        // Cooldown
        long now = System.currentTimeMillis();
        long last = lastLoadMs.getOrDefault(pid, 0L);
        if (now - last < COOLDOWN_MS) return;

        // Distance threshold
        Location lastLocation = lastLoadedLocations.get(pid);
        if (lastLocation != null && lastLocation.distanceSquared(to) < moveThresholdBlocks * moveThresholdBlocks) {
            return;
        }

        // Mark as in-flight (once)
        AtomicBoolean flag = inFlight.computeIfAbsent(pid, k -> new AtomicBoolean(false));
        if (!flag.compareAndSet(false, true)) {
            // a load is already running for this player
            return;
        }

        // Update the markers optimistically
        lastLoadedLocations.put(pid, to.clone());
        lastLoadMs.put(pid, now);

        // Convert player's position to chunk-ish "tile" coordinates (16 blocks = 1 chunk)
        int absTileX = to.getBlockX() >> 4;
        int absTileZ = to.getBlockZ() >> 4;

        VoxelChunkGenerator generator = plugin.getVoxelChunkGenerator();

        // Establish per-player origin tile the first time we see them (after visit completes)
        int originX = originTileX.computeIfAbsent(pid, k -> absTileX);
        int originZ = originTileZ.computeIfAbsent(pid, k -> absTileZ);

        // Determine which quadrant of the globe we're in and swap axes if needed.
        // double[] latLng = referenceLatLng.get(pid);
        // if (latLng == null) {
        //     latLng = generator.minecraftToLatLng(absTileX, absTileZ);
        // }
        double[] latLng = generator.minecraftToLatLng(pid, absTileX, absTileZ);
        double lat = latLng[0];
        double lng = latLng[1];

int dx = absTileX - originX;
int dz = absTileZ - originZ;

// Old, working transform (use *live* lat/lng computed above)
if (lat >= 0 && lng < 0) {          // NW
    int t = dx; dx = dz; dz = -t;
} else if (lat < 0 && lng >= 0) {   // SE
    // no-op
} else if (lat < 0 && lng < 0) {    // SW
    int t = dx; dx = dz; dz = -t;
} else {                            // NE
    // no-op
}

int tileX = originX + dx;
int tileZ = originZ + dz;
generator.loadChunk(pid, tileX, tileZ, false, (ignore) -> flag.set(false));

    }
}
