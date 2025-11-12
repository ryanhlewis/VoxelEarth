package com.example.voxelearth;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

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
    private final String nodeScriptPath;

    // tileFilename (.glb) => translation [tx,ty,tz]
    private final Map<String, double[]> tileTranslations = new ConcurrentHashMap<>();

    public TileDownloader(String apiKey, double latitude, double longitude, int radius) {
        this.apiKey = apiKey;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radius = radius;
        this.nodeScriptPath = resolveNodeScriptPath();
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

    /** Per-tile translations (if available). */
    public Map<String, double[]> getTileTranslations() {
        return tileTranslations;
    }

    private String resolveNodeScriptPath() {
        String[] candidates = new String[] {
                "server-folder-items/scripts/download_and_rotate.js",
                "scripts/download_and_rotate.js",
                "download_and_rotate.js"
        };
        for (String candidate : candidates) {
            File script = new File(candidate);
            if (script.exists()) {
                System.out.println("[TileDownloader] Using Node script at " + script.getPath());
                return script.getPath();
            }
        }
        System.out.println("[TileDownloader] Node script not found; will attempt Java fallback if Node path fails.");
        return candidates[0];
    }

    private boolean nodeScriptLooksUsable() {
        File f = new File(nodeScriptPath);
        if (!f.isFile()) return false;
        try {
            Process p = new ProcessBuilder("node", "-v").start();
            p.waitFor(2, TimeUnit.SECONDS);
            return p.exitValue() == 0;
        } catch (Throwable t) {
            return false;
        }
    }

    /**
     * Try Node first; fallback to Java downloader + Assimp rotate if needed.
     */
    public List<String> downloadTiles(String outputDirectory) throws IOException, InterruptedException {
        long start = System.currentTimeMillis();
        tileTranslations.clear();

        if (nodeScriptLooksUsable()) {
            try {
                List<String> nodeResult = tryNodeDownload(outputDirectory);
                if (!nodeResult.isEmpty()) {
                    long now = System.currentTimeMillis();
                    System.out.println("[PERF] Node pipeline took " + (now - start) + " ms, tiles=" + nodeResult.size());
                    return nodeResult;
                }
                System.out.println("[WARN] Node pipeline returned no tiles; attempting Java fallback …");
            } catch (Throwable t) {
                System.out.println("[WARN] Node pipeline failed (" + t.getMessage() + "); attempting Java fallback …");
            }
        } else {
            System.out.println("[INFO] Node not available; using Java downloader + Assimp/Draco rotate.");
        }

        List<String> javaResult = downloadAndRotateWithJava(outputDirectory);
        long end = System.currentTimeMillis();
        System.out.println("[PERF] Java pipeline took " + (end - start) + " ms, tiles=" + javaResult.size());
        return javaResult;
    }

    private List<String> tryNodeDownload(String outputDirectory) throws IOException, InterruptedException {
        List<String> cmd = new ArrayList<>();
        cmd.add("node");
        cmd.add(nodeScriptPath);
        cmd.add("--key");    cmd.add(apiKey);
        cmd.add("--lat");    cmd.add(String.valueOf(longitude));
        cmd.add("--lng");    cmd.add(String.valueOf(latitude));
        cmd.add("--radius"); cmd.add(String.valueOf(radius));
        cmd.add("--out");    cmd.add(outputDirectory);

        if (origin != null) {
            cmd.add("--origin");
            cmd.add(String.valueOf(origin[0]));
            cmd.add(String.valueOf(origin[1]));
            cmd.add(String.valueOf(origin[2]));
        }

        System.out.println("[TileDownloader] Running: " + String.join(" ", cmd));
        Process process = new ProcessBuilder(cmd).redirectErrorStream(true).start();

        List<String> downloadedTiles = new ArrayList<>();
        double[] capturedOrigin = null;

        try (BufferedReader out = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = out.readLine()) != null) {
                if (line.startsWith("ORIGIN_TRANSLATION")) {
                    String json = line.substring("ORIGIN_TRANSLATION".length()).trim();
                    JSONArray arr = new JSONArray(json);
                    capturedOrigin = new double[]{arr.getDouble(0), arr.getDouble(1), arr.getDouble(2)};
                } else if (line.startsWith("TILE_TRANSLATION")) {
                    String trimmed = line.substring("TILE_TRANSLATION".length()).trim();
                    int space = trimmed.indexOf(' ');
                    if (space > 0) {
                        String file = trimmed.substring(0, space).trim();
                        JSONArray vec = new JSONArray(trimmed.substring(space).trim());
                        tileTranslations.put(file, new double[]{
                                vec.getDouble(0), vec.getDouble(1), vec.getDouble(2)
                        });
                    }
                } else if (line.startsWith("DOWNLOADED_TILES:")) {
                    String json = line.substring("DOWNLOADED_TILES:".length()).trim();
                    JSONArray arr = new JSONArray(json);
                    for (int i = 0; i < arr.length(); i++) downloadedTiles.add(arr.getString(i));
                }
            }
        }

        int code = process.waitFor();
        if (code != 0) throw new IOException("Node process exited with code " + code);

        if (this.origin == null && capturedOrigin != null) this.origin = capturedOrigin;
        return downloadedTiles;
    }

    private List<String> downloadAndRotateWithJava(String outputDirectory) {
        File outDir = new File(outputDirectory);
        outDir.mkdirs();

        final int threads = Math.max(2, Math.min(Runtime.getRuntime().availableProcessors(), 8));
        List<String> rotatedNames = Collections.synchronizedList(new ArrayList<>());

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

        // 2a) If no origin provided, adopt from the first tile (Node parity)
        if (this.origin == null) {
            Map.Entry<String, byte[]> first = entries.get(0);
            try {
                this.origin = AssimpDracoDecode.measureOriginCenterFromGlbBytes(first.getValue());
                System.out.printf("[INFO] Adopted shared origin from first tile: (%.6f, %.6f, %.6f)%n",
                        origin[0], origin[1], origin[2]);
            } catch (Exception e) {
                System.out.println("[WARN] Could not derive origin from first tile; continuing with per-tile centers.");
            }
        }

        // 2b) Process the first tile immediately (with the chosen origin)
        Map.Entry<String, byte[]> pivot = entries.remove(0);
        try {
            String inName = pivot.getKey();
            byte[] inBytes = pivot.getValue();

            byte[] outBytes = AssimpDracoDecode.decodeToUncompressedGlbBytes(
                    inBytes, /*verbose*/ false, /*rotateFlat*/ true, /*scaleOn*/ false, this.origin);

            String base = inName.endsWith(".glb") ? inName.substring(0, inName.length() - 4) : inName;
            String outName = base + "-decoded.glb";
            File outFile = new File(outDir, outName);

            if (!outFile.isFile()) {
                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    fos.write(outBytes);
                }
            }
            rotatedNames.add(outName);

            double[] t0 = tryReadRootTranslationFromBytes(outBytes);
            if (t0 != null) tileTranslations.put(outName, t0);
        } catch (Throwable t) {
            System.out.println("[WARN] Assimp rotation failed for first tile: " + t.getMessage());
        }

        // 2c) Process the rest in parallel, using the SAME origin
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        List<Future<?>> futures = new ArrayList<>();

        for (Map.Entry<String, byte[]> entry : entries) {
            futures.add(pool.submit(() -> {
                String inName = entry.getKey();
                byte[] inBytes = entry.getValue();
                try {
                    byte[] outBytes = AssimpDracoDecode.decodeToUncompressedGlbBytes(
                            inBytes, false, true, false, this.origin);

                    String base = inName.endsWith(".glb") ? inName.substring(0, inName.length() - 4) : inName;
                    String outName = base + "-decoded.glb";
                    File outFile = new File(outDir, outName);

                    if (!outFile.isFile()) {
                        try (FileOutputStream fos = new FileOutputStream(outFile)) {
                            fos.write(outBytes);
                        }
                    }
                    rotatedNames.add(outName);

                    double[] t = tryReadRootTranslationFromBytes(outBytes);
                    if (t != null) tileTranslations.put(outName, t);
                } catch (Throwable t) {
                    System.out.println("[WARN] Assimp rotation failed for " + inName + " : " + t.getMessage());
                    File rawOut = new File(outDir, inName);
                    if (!rawOut.isFile()) {
                        try (FileOutputStream fos = new FileOutputStream(rawOut)) {
                            fos.write(inBytes);
                        } catch (IOException ignored) {}
                    }
                    rotatedNames.add(inName);
                }
            }));
        }

        for (Future<?> f : futures) {
            try { f.get(); } catch (Exception ignored) {}
        }
        pool.shutdown();
        return rotatedNames;

    }

    private static double[] tryReadRootTranslation(File glb) {
        try (RandomAccessFile raf = new RandomAccessFile(glb, "r")) {
            byte[] hdr = new byte[12];
            raf.readFully(hdr);
            if (leI(hdr, 0) != 0x46546c67 || leI(hdr, 4) != 2) return null;

            int totalLen = leI(hdr, 8);
            int read = 12;
            while (read + 8 <= totalLen) {
                byte[] ch = new byte[8];
                raf.readFully(ch); read += 8;
                int clen = leI(ch, 0);
                int ctype = leI(ch, 4);
                byte[] payload = new byte[clen];
                raf.readFully(payload); read += clen;

                if (ctype == 0x4E4F534A) {
                    return parseTranslationFromJson(new String(payload, StandardCharsets.UTF_8));
                }
            }
        } catch (Throwable ignored) {}
        return null;
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
