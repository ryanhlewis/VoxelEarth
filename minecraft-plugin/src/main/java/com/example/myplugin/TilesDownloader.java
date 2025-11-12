package com.example.voxelearth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpClient.Redirect;
import java.net.http.HttpClient.Version;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

final class TilesDownloader implements AutoCloseable {

    // --- HTTP + JSON ---
    private final HttpClient http;
    private final ExecutorService httpExec; // daemon executor for HttpClient
    private final ObjectMapper om = new ObjectMapper();
    private final boolean verbose;

    // --- concurrency pools ---
    private final ExecutorService parsePool;
    private final ExecutorService downloadPool;
    private final int parallel;

    TilesDownloader(int parallel, boolean verbose) {
        this.parallel = Math.max(1, parallel);
        this.verbose = verbose;

        // Daemon executor so lingering HTTP/2 keepalive threads don't keep the JVM alive
        this.httpExec = Executors.newCachedThreadPool(r -> {
            Thread t = new Thread(r, "httpclient");
            t.setDaemon(true);
            return t;
        });

        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .followRedirects(Redirect.NORMAL)
                .version(Version.HTTP_2)
                .executor(httpExec)
                .build();

        this.parsePool = new ThreadPoolExecutor(
                this.parallel, this.parallel, 60, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(),
                r -> { Thread t = new Thread(r, "tiles-parse"); t.setDaemon(true); return t; });

        this.downloadPool = new ThreadPoolExecutor(
                this.parallel, this.parallel, 60, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(),
                r -> { Thread t = new Thread(r, "tiles-dl"); t.setDaemon(true); return t; });
    }

    // =================== Public entry ===================
    List<String> downloadAll(String apiKey, double latDeg, double lngDeg, double radiusMeters, File outDir, boolean useElevation) throws Exception {
        double elevation = 0.0;
        if (useElevation) {
            try { elevation = getElevation(apiKey, latDeg, lngDeg); }
            catch (Throwable t) { log("[WARN] Elevation fetch failed => using 0; %s", t.getMessage()); }
        }
        double[] centerECEF = cartesianFromDegrees(lngDeg, latDeg, elevation);
        Sphere region = new Sphere(centerECEF, radiusMeters);

        // Gather .glb URLs via BFS over tilesets (fully parallel, bounded)
        List<URI> glbUris = collectGlbUris(apiKey, region);

        System.out.println("[INFO] Found " + glbUris.size() + " .glb tile(s).");
        if (glbUris.isEmpty()) return List.of();

        // Download all .glb (parallel)
        List<Future<String>> futures = new ArrayList<>(glbUris.size());
        for (URI u : glbUris) futures.add(downloadPool.submit(() -> downloadOne(u, outDir)));

        List<String> files = new ArrayList<>(glbUris.size());
        for (Future<String> f : futures) {
            try { String s = f.get(); if (s != null) files.add(s); }
            catch (ExecutionException ee){ log("[ERR] Download failed: %s", ee.getCause()); }
        }
        return files; // pools are closed in close()
    }

    Map<String, byte[]> downloadAllToMemory(String apiKey,
                                            double latDeg,
                                            double lngDeg,
                                            double radiusMeters,
                                            boolean useElevation) throws Exception {
        double elevation = 0.0;
        if (useElevation) {
            try { elevation = getElevation(apiKey, latDeg, lngDeg); }
            catch (Throwable t) { log("[WARN] Elevation fetch failed => using 0; %s", t.getMessage()); }
        }
        double[] centerECEF = cartesianFromDegrees(lngDeg, latDeg, elevation);
        Sphere region = new Sphere(centerECEF, radiusMeters);

        List<URI> glbUris = collectGlbUris(apiKey, region);
        System.out.println("[INFO] Found " + glbUris.size() + " .glb tile(s).");
        Map<String, byte[]> out = new ConcurrentHashMap<>();
        if (glbUris.isEmpty()) return out;

        int workers = Math.max(4, Math.min(Runtime.getRuntime().availableProcessors(), 16));
        ExecutorService pool = Executors.newFixedThreadPool(workers, r -> {
            Thread t = new Thread(r, "tiles-dl-mem");
            t.setDaemon(true);
            return t;
        });

        List<Future<?>> futures = new ArrayList<>(glbUris.size());
        for (URI uri : glbUris) {
            futures.add(pool.submit(() -> {
                try {
                    String id = tileIdentifier(uri);
                    String sha = sha1Hex(id);
                    HttpRequest req = HttpRequest.newBuilder(uri)
                            .timeout(Duration.ofSeconds(60))
                            .GET().build();
                    HttpResponse<byte[]> rsp = http.send(req, HttpResponse.BodyHandlers.ofByteArray());
                    if (rsp.statusCode() != 200) {
                        log("[WARN] HTTP %d for %s", rsp.statusCode(), uri);
                        return;
                    }
                    out.put(sha + ".glb", rsp.body());
                } catch (Throwable t) {
                    log("[ERR] Memory download failed for %s: %s", uri, t.getMessage());
                }
            }));
        }

        for (Future<?> f : futures) {
            try { f.get(); } catch (Exception ignored) {}
        }
        pool.shutdown();
        return out;
    }


    // =================== BFS collect ===================
    private List<URI> collectGlbUris(String apiKey, Sphere region) throws Exception {
        List<URI> results = Collections.synchronizedList(new ArrayList<>());
        AtomicReference<String> sessionRef = new AtomicReference<>(null);

        CountDownLatch done = new CountDownLatch(1);
        AtomicInteger tasks = new AtomicInteger(0);

        Runnable submitRoot = () -> submitTileset(
                withParam(URI.create("https://tile.googleapis.com/v1/3dtiles/root.json"), "key", apiKey, null),
                apiKey, sessionRef, region, results, tasks, done);

        submitRoot.run();
        done.await(); // until all fan-out tasks complete
        return results;
    }

    private void submitTileset(URI tilesetUri,
                               String apiKey,
                               AtomicReference<String> sessionRef,
                               Sphere region,
                               List<URI> results,
                               AtomicInteger tasks,
                               CountDownLatch done) {
        tasks.incrementAndGet();
        parsePool.submit(() -> {
            try {
                fetchTilesetAndParse(tilesetUri, apiKey, sessionRef, region, results, tasks, done);
            } catch (Throwable t) {
                log("[WARN] fetchTileset failed for %s: %s", tilesetUri, t.getMessage());
            } finally {
                if (tasks.decrementAndGet() == 0) done.countDown();
            }
        });
    }

    private void fetchTilesetAndParse(URI tilesetUri,
                                      String apiKey,
                                      AtomicReference<String> sessionRef,
                                      Sphere region,
                                      List<URI> results,
                                      AtomicInteger tasks,
                                      CountDownLatch done) throws Exception {
        tilesetUri = ensureKeySession(tilesetUri, apiKey, sessionRef.get());
        HttpRequest req = HttpRequest.newBuilder(tilesetUri)
                .timeout(Duration.ofSeconds(30))
                .GET().build();

        HttpResponse<byte[]> rsp = http.send(req, HttpResponse.BodyHandlers.ofByteArray());
        if (rsp.statusCode() != 200) {
            log("[WARN] HTTP %d for %s", rsp.statusCode(), tilesetUri);
            return;
        }

        Optional<String> ctype = rsp.headers().firstValue("content-type");
        if (ctype.isPresent() && !ctype.get().toLowerCase(Locale.ROOT).contains("application/json")) {
            // Some leaves are binary GLBs; treat this URL as a GLB to download later
            results.add(tilesetUri);
            return;
        }

        JsonNode root = om.readTree(rsp.body());
        JsonNode r = root.get("root");
        if (r == null || r.isNull()) {
            log("[WARN] No 'root' in %s", tilesetUri);
            return;
        }

        traverseNode(r, tilesetUri, apiKey, sessionRef, region, results, tasks, done);
    }

    private void traverseNode(JsonNode node,
                              URI base,
                              String apiKey,
                              AtomicReference<String> sessionRef,
                              Sphere region,
                              List<URI> results,
                              AtomicInteger tasks,
                              CountDownLatch done) {
        // coarse culling via boundingVolume.box ~ sphere
        boolean intersects = true;
        JsonNode bv = node.get("boundingVolume");
        if (bv != null && bv.get("box") != null && bv.get("box").isArray() && bv.get("box").size() == 12) {
            double[] box = new double[12];
            for (int i = 0; i < 12; i++) box[i] = bv.get("box").get(i).asDouble();
            Sphere s = obbToSphere(box);
            intersects = region.intersects(s);
        }
        if (!intersects) return;

        // If has children → recurse; else treat as leaf with contents
        JsonNode children = node.get("children");
        if (children != null && children.isArray() && children.size() > 0) {
            for (JsonNode ch : children) traverseNode(ch, base, apiKey, sessionRef, region, results, tasks, done);
            return;
        }

        // collect content(s)
        List<JsonNode> contents = new ArrayList<>();
        JsonNode content = node.get("content");
        if (content != null && content.has("uri")) contents.add(content);
        JsonNode contentsArr = node.get("contents");
        if (contentsArr != null && contentsArr.isArray()) {
            for (JsonNode c : contentsArr) if (c != null && c.has("uri")) contents.add(c);
        }

        for (JsonNode c : contents) {
            String rel = c.get("uri").asText();
            URI contentUri = resolve(base, rel);

            // adopt child session if present
            String childSession = getQueryParam(contentUri, "session");
            if (childSession != null) sessionRef.set(childSession);

            // ensure key+session
            contentUri = ensureKeySession(contentUri, apiKey, sessionRef.get());

            String s = contentUri.toString().toLowerCase(Locale.ROOT);
            if (s.endsWith(".glb")) {
                results.add(contentUri);
            } else {
                // sub-tileset; fan out
                submitTileset(contentUri, apiKey, sessionRef, region, results, tasks, done);
            }
        }
    }

    // =================== Download one GLB ===================
    private String downloadOne(URI glbUri, File outDir) {
        try {
            String id = tileIdentifier(glbUri); // path+query minus key/session
            String sha = sha1Hex(id);
            File out = new File(outDir, sha + ".glb");

            if (out.isFile()) {
                log("[SKIP] %s already exists.", out.getName());
                return out.getName();
            }

            HttpRequest req = HttpRequest.newBuilder(glbUri)
                    .timeout(Duration.ofSeconds(60))
                    .GET().build();
            HttpResponse<byte[]> rsp = http.send(req, HttpResponse.BodyHandlers.ofByteArray());
            if (rsp.statusCode() != 200) {
                log("[WARN] HTTP %d for %s", rsp.statusCode(), glbUri);
                return null;
            }
            Files.write(out.toPath(), rsp.body());
            log("[INFO] Wrote %s", out.getName());
            return out.getName();
        } catch (Throwable t) {
            log("[ERR] Download failed for %s: %s", glbUri, t.getMessage());
            return null;
        }
    }

    // =================== HTTP helpers ===================
    private double getElevation(String apiKey, double lat, double lng) throws Exception {
        URI u = URI.create("https://maps.googleapis.com/maps/api/elevation/json?locations="
                + url(lat + "," + lng) + "&key=" + url(apiKey));
        HttpRequest req = HttpRequest.newBuilder(u)
                .timeout(Duration.ofSeconds(20)).GET().build();
        HttpResponse<byte[]> rsp = http.send(req, HttpResponse.BodyHandlers.ofByteArray());
        if (rsp.statusCode() != 200) throw new IOException("HTTP " + rsp.statusCode());
        JsonNode j = om.readTree(rsp.body());
        if (j == null || !"OK".equals(j.path("status").asText())) throw new IOException("Elevation API error");
        JsonNode arr = j.get("results");
        if (arr == null || !arr.isArray() || arr.size() == 0) return 0.0;
        return arr.get(0).path("elevation").asDouble(0.0);
    }

    // =================== Math / Geo ===================
    private static double[] cartesianFromDegrees(double lonDeg, double latDeg, double hMeters) {
        // WGS84
        double a = 6378137.0;
        double f = 1.0 / 298.257223563;
        double e2 = f * (2 - f);
        double radLat = Math.toRadians(latDeg);
        double radLon = Math.toRadians(lonDeg);
        double sinLat = Math.sin(radLat);
        double cosLat = Math.cos(radLat);
        double N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
        double x = (N + hMeters) * cosLat * Math.cos(radLon);
        double y = (N + hMeters) * cosLat * Math.sin(radLon);
        double z = (N * (1 - e2) + hMeters) * sinLat;
        return new double[]{x, y, z};
    }

    private static final class Sphere {
        final double[] c; final double r;
        Sphere(double[] center, double radius) { this.c = center; this.r = radius; }
        boolean intersects(Sphere o){
            double dx=o.c[0]-c[0], dy=o.c[1]-c[1], dz=o.c[2]-c[2];
            double d = Math.sqrt(dx*dx + dy*dy + dz*dz);
            return d < (r + o.r);
        }
    }

    // Convert OBB (12 floats) to a conservative sphere (AABB of corners → radius)
    private static Sphere obbToSphere(double[] box){
        double cx=box[0], cy=box[1], cz=box[2];
        double[] h1={box[3],box[4],box[5]}, h2={box[6],box[7],box[8]}, h3={box[9],box[10],box[11]};
        double minX=Double.POSITIVE_INFINITY, minY=Double.POSITIVE_INFINITY, minZ=Double.POSITIVE_INFINITY;
        double maxX=Double.NEGATIVE_INFINITY, maxY=Double.NEGATIVE_INFINITY, maxZ=Double.NEGATIVE_INFINITY;

        for (int i=0;i<8;i++){
            int s1=((i&1)!=0)?1:-1, s2=((i&2)!=0)?1:-1, s3=((i&4)!=0)?1:-1;
            double x=cx+s1*h1[0]+s2*h2[0]+s3*h3[0];
            double y=cy+s1*h1[1]+s2*h2[1]+s3*h3[1];
            double z=cz+s1*h1[2]+s2*h2[2]+s3*h3[2];
            if (x<minX) minX=x; if (y<minY) minY=y; if (z<minZ) minZ=z;
            if (x>maxX) maxX=x; if (y>maxY) maxY=y; if (z>maxZ) maxZ=z;
        }
        double dx=maxX-minX, dy=maxY-minY, dz=maxZ-minZ;
        double radius = 0.5 * Math.sqrt(dx*dx + dy*dy + dz*dz);
        return new Sphere(new double[]{ (minX+maxX)*0.5, (minY+maxY)*0.5, (minZ+maxZ)*0.5 }, radius);
    }

    // =================== URL helpers ===================
    private static URI resolve(URI base, String rel){
        return base.resolve(rel);
    }

    private static String getQueryParam(URI u, String key){
        if (u.getQuery()==null) return null;
        String[] parts = u.getQuery().split("&");
        for (String p : parts){
            int idx = p.indexOf('=');
            String k = (idx>=0)? p.substring(0,idx) : p;
            if (k.equalsIgnoreCase(key)){
                return (idx>=0)? decode(p.substring(idx+1)) : "";
            }
        }
        return null;
    }

    private static URI ensureKeySession(URI u, String apiKey, String session){
        Map<String,String> q = parseQuery(u.getRawQuery());
        if (!q.containsKey("key")) q.put("key", apiKey);
        if (session != null && !session.isBlank() && !q.containsKey("session")) q.put("session", session);
        return withParams(u, q);
    }

    private static URI withParam(URI u, String k, String v, String sessionIfAny){
        Map<String,String> q = parseQuery(u.getRawQuery());
        q.put(k, v);
        if (sessionIfAny!=null && !sessionIfAny.isBlank()) q.putIfAbsent("session", sessionIfAny);
        return withParams(u, q);
    }

    private static Map<String,String> parseQuery(String raw){
        Map<String,String> m = new LinkedHashMap<>();
        if (raw==null || raw.isBlank()) return m;
        for (String p : raw.split("&")){
            if (p.isEmpty()) continue;
            int i = p.indexOf('=');
            if (i<0) m.put(decode(p), "");
            else m.put(decode(p.substring(0,i)), decode(p.substring(i+1)));
        }
        return m;
    }

    private static URI withParams(URI base, Map<String,String> params){
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (var e : params.entrySet()){
            if (!first) sb.append('&'); first=false;
            sb.append(url(e.getKey())).append('=').append(url(e.getValue()));
        }
        String query = sb.toString();
        try {
            return new URI(base.getScheme(), base.getAuthority(), base.getPath(), query, base.getFragment());
        } catch (Exception e) {
            return base;
        }
    }

    // For naming: path + query (without key/session)
    private static String tileIdentifier(URI u){
        Map<String,String> q = parseQuery(u.getRawQuery());
        q.remove("key"); q.remove("session");
        URI v = withParams(u, q);
        String s = v.getPath();
        if (v.getQuery()!=null && !v.getQuery().isBlank()) s += "?" + v.getQuery();
        return s;
    }

    private static String sha1Hex(String s){
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] d = md.digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(d.length*2);
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String url(String s){
        try { return URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8); }
        catch (Exception e){ return s; }
    }
    private static String decode(String s){
        try { return java.net.URLDecoder.decode(s, java.nio.charset.StandardCharsets.UTF_8); }
        catch (Exception e){ return s; }
    }

    private void log(String fmt, Object... args){
        if (verbose) System.out.println(String.format(Locale.ROOT, fmt, args));
    }

    // ---- graceful shutdown (AutoCloseable) ----
    @Override public void close() {
        shutdownAndAwait(downloadPool, "downloadPool");
        shutdownAndAwait(parsePool, "parsePool");
        if (httpExec != null) {
            httpExec.shutdownNow(); // terminate any idle HTTP tasks/keepers
        }
    }

    private void shutdownAndAwait(ExecutorService es, String name) {
        es.shutdown();
        try {
            if (!es.awaitTermination(30, TimeUnit.SECONDS)) {
                es.shutdownNow();
                es.awaitTermination(10, TimeUnit.SECONDS);
            }
        } catch (InterruptedException ie) {
            es.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
