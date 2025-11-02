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
    }

    public void markVisitArrived(UUID id) {
        visitInProgress.remove(id);
        hasCompletedInitialVisit.add(id);
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
        int tileX = to.getBlockX() >> 4;
        int tileZ = to.getBlockZ() >> 4;

        // Kick the async load
        VoxelChunkGenerator generator = plugin.getVoxelChunkGenerator();

        // false => not a /visit (so we reuse stored origin once established)
        generator.loadChunk(pid, tileX, tileZ, false, (blockLocation) -> {
            // When the async work is done, allow another request
            flag.set(false);
        });
    }
}
