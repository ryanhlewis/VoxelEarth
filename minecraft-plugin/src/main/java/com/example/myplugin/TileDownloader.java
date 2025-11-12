package com.example.voxelearth;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * TileDownloader that prefers the Node.js pipeline (fast) and falls back
 * to the Java downloader + Assimp/Draco rotate if Node is missing or fails.
 */
public class TileDownloader {

    private String apiKey;
    private double latitude;
    private double longitude;
    private double radius;
    private double[] origin; // Optional origin (ECEF) passed to rotates

    // Global registry of tiles that have already been *placed* in the world.
    // Keyed by SHA (base name from SHA.glb).
    private static final Set<String> PROCESSED_SHA = ConcurrentHashMap.newKeySet();

    /** Lightweight container for fully in-memory tiles. */
    public static final class TilePayload {
        private final String tileId;
        private final byte[] glbBytes;
        private final double[] translation;

        public TilePayload(String tileId, byte[] glbBytes, double[] translation) {
            this.tileId = tileId;
            this.glbBytes = glbBytes;
            this.translation = (translation == null) ? null : translation.clone();
        }

        public String tileId() {
            return tileId;
        }

        public byte[] glbBytes() {
            return glbBytes;
        }

        public double[] translation() {
            return (translation == null) ? null : translation.clone();
        }
    }

    // ========= GLOBAL PROCESSED TILE HELPERS =========
    private static String extractShaFromTileId(String tileId) {
        if (tileId == null || tileId.isBlank()) return null;
        String base = tileId;
        if (base.endsWith("-decoded")) {
            base = base.substring(0, base.length() - "-decoded".length());
        }
        return base; // this is the SHA string
    }

    public static void markTileProcessed(String tileId) {
        String sha = extractShaFromTileId(tileId);
        if (sha != null && !sha.isBlank()) {
            PROCESSED_SHA.add(sha);
            Log.info("[TileDownloader] Marked tile as processed (sha=" + sha + ", tileId=" + tileId + ")");
        }
    }

    public static boolean isTileProcessed(String tileId) {
        String sha = extractShaFromTileId(tileId);
        return sha != null && PROCESSED_SHA.contains(sha);
    }

    public static boolean isShaProcessed(String sha) {
        return sha != null && PROCESSED_SHA.contains(sha);
    }

    public static void clearProcessedTiles() {
        PROCESSED_SHA.clear();
        Log.info("[TileDownloader] Cleared global processed tile set.");
    }

    // ========= INSTANCE PIPELINE =========

    public TileDownloader(String apiKey, double latitude, double longitude, int radius) {
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

    public double[] getOrigin() {
        return origin;
    }

    /**
     * Fully in-memory pipeline: download, rotate (Assimp/Draco), and return tile payloads.
     */
    public List<TilePayload> downloadTiles() throws IOException, InterruptedException {
        long start = System.currentTimeMillis();
        List<TilePayload> javaResult = downloadAndRotateWithJava();
        long end = System.currentTimeMillis();
        Log.info("[PERF] In-memory Java pipeline took " + (end - start) + " ms, tiles=" + javaResult.size());
        return javaResult;
    }

    private List<TilePayload> downloadAndRotateWithJava() {
        final int threads = Math.max(2, Math.min(Runtime.getRuntime().availableProcessors(), 8));
        List<TilePayload> rotatedTiles = Collections.synchronizedList(new ArrayList<>());

        Map<String, byte[]> rawFiles;
        try (TilesDownloader downloader = new TilesDownloader(threads, false)) {
            rawFiles = downloader.downloadAllToMemory(apiKey, longitude, latitude, radius, true);
        } catch (Exception e) {
            throw new RuntimeException("Java downloader (memory) failed: " + e.getMessage(), e);
        }

        if (rawFiles.isEmpty()) return Collections.emptyList();

        // Stable order so “first” is deterministic
        List<Map.Entry<String, byte[]>> entries = new ArrayList<>(rawFiles.entrySet());
        entries.sort(Map.Entry.comparingByKey());

        // Filter out tiles that have already been globally processed
        entries.removeIf(e -> {
            String base = normalizeBaseName(e.getKey()); // SHA part of "sha.glb"
            if (isShaProcessed(base)) {
                Log.info("[SKIP] TileDownloader: already processed tile sha=" + base + " (" + e.getKey() + ")");
                return true;
            }
            return false;
        });

        if (entries.isEmpty()) {
            Log.info("[TileDownloader] No new tiles to rotate; all tiles already processed.");
            return Collections.emptyList();
        }

        // 2a) If no origin provided, adopt from the first tile (Node parity)
        if (this.origin == null) {
            Map.Entry<String, byte[]> first = entries.get(0);
            try {
                this.origin = AssimpDracoDecode.measureOriginCenterFromGlbBytes(first.getValue());
                Log.info(String.format("[INFO] Adopted shared origin from first tile: (%.6f, %.6f, %.6f)",
                        origin[0], origin[1], origin[2]));
            } catch (Exception e) {
                Log.warning("[WARN] Could not derive origin from first tile; continuing with per-tile centers.");
            }
        }

        // 2b) Process the first tile immediately (with the chosen origin)
        Map.Entry<String, byte[]> pivot = entries.remove(0);
        rotatedTiles.add(rotateTileInMemory(pivot.getKey(), pivot.getValue()));

        // Process the rest in parallel, using the SAME origin
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        List<Future<?>> futures = new ArrayList<>();

        for (Map.Entry<String, byte[]> entry : entries) {
            futures.add(pool.submit(() -> {
                TilePayload payload = rotateTileInMemory(entry.getKey(), entry.getValue());
                rotatedTiles.add(payload);
            }));
        }

        for (Future<?> f : futures) {
            try { f.get(); } catch (Exception ignored) {}
        }
        pool.shutdown();
        rotatedTiles.sort(Comparator.comparing(TilePayload::tileId));
        return rotatedTiles;

    }

    private TilePayload rotateTileInMemory(String inputName, byte[] glbBytes) {
        String base = normalizeBaseName(inputName); // base is sha
        try {
            byte[] outBytes = AssimpDracoDecode.decodeToUncompressedGlbBytes(
                    glbBytes, false, true, false, this.origin);
            String tileId = base.endsWith("-decoded") ? base : base + "-decoded";
            double[] translation = tryReadRootTranslationFromBytes(outBytes);
            return new TilePayload(tileId, outBytes, translation);
        } catch (Throwable t) {
            Log.warning("[WARN] Assimp rotation failed for " + inputName + " : " + t.getMessage());
            double[] translation = tryReadRootTranslationFromBytes(glbBytes);
            return new TilePayload(base, glbBytes, translation);
        }
    }

    private static String normalizeBaseName(String rawName) {
        if (rawName == null || rawName.isBlank()) return "tile";
        return rawName.replaceFirst("\\.glb.*$", "");
    }

    private static double[] tryReadRootTranslationFromBytes(byte[] glb) {
        try {
            if (glb.length < 12) return null;
            if (leI(glb, 0) != 0x46546c67 || leI(glb, 4) != 2) return null;
            int totalLen = leI(glb, 8);
            int offset = 12;
            while (offset + 8 <= totalLen && offset + 8 <= glb.length) {
                int clen = leI(glb, offset); offset += 4;
                int ctype = leI(glb, offset); offset += 4;
                if (ctype == 0x4E4F534A && offset + clen <= glb.length) {
                    String json = new String(glb, offset, clen, StandardCharsets.UTF_8);
                    return parseTranslationFromJson(json);
                }
                offset += clen;
            }
        } catch (Throwable ignored) {}
        return null;
    }

    private static double[] parseTranslationFromJson(String json) {
        if (json == null || json.isBlank()) return new double[]{0,0,0};
        JSONObject root = new JSONObject(json.trim());

        JSONArray nodes = root.optJSONArray("nodes");
        if (nodes == null || nodes.length() == 0) return new double[]{0,0,0};

        int sceneIndex = root.optInt("scene", 0);
        JSONArray scenes = root.optJSONArray("scenes");
        JSONArray sceneNodes = (scenes != null && scenes.length() > sceneIndex)
                ? scenes.optJSONObject(sceneIndex).optJSONArray("nodes")
                : null;
        if (sceneNodes == null || sceneNodes.length() == 0) return new double[]{0,0,0};

        // BFS through scene roots and their descendants
        java.util.Deque<Integer> q = new java.util.ArrayDeque<>();
        for (int i = 0; i < sceneNodes.length(); i++) q.addLast(sceneNodes.optInt(i, -1));

        double[] firstSeen = null; // keep the first zero candidate as a fallback
        while (!q.isEmpty()) {
            int idx = q.removeFirst();
            if (idx < 0 || idx >= nodes.length()) continue;

            JSONObject n = nodes.getJSONObject(idx);

            // 1) Preferred: explicit TRS translation
            JSONArray t = n.optJSONArray("translation");
            if (t != null && t.length() >= 3) {
                double tx = t.getDouble(0), ty = t.getDouble(1), tz = t.getDouble(2);
                if (tx != 0 || ty != 0 || tz != 0) return new double[]{tx, ty, tz};
                if (firstSeen == null) firstSeen = new double[]{tx, ty, tz};
            }

            // 2) Fallback: matrix with translation in elements 12..14 (column-major)
            JSONArray m = n.optJSONArray("matrix");
            if (m != null && m.length() == 16) {
                double tx = m.getDouble(12), ty = m.getDouble(13), tz = m.getDouble(14);
                if (tx != 0 || ty != 0 || tz != 0) return new double[]{tx, ty, tz};
                if (firstSeen == null) firstSeen = new double[]{tx, ty, tz};
            }

            // Continue down the graph
            JSONArray children = n.optJSONArray("children");
            if (children != null) for (int i = 0; i < children.length(); i++) q.addLast(children.optInt(i, -1));
        }

        return firstSeen != null ? firstSeen : new double[]{0,0,0};
    }

    private static int leI(byte[] b, int o) {
        return (b[o] & 0xFF)
                | ((b[o + 1] & 0xFF) << 8)
                | ((b[o + 2] & 0xFF) << 16)
                | ((b[o + 3] & 0xFF) << 24);
    }
}
