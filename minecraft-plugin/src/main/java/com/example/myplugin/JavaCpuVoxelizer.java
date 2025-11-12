package com.example.voxelearth;

import de.javagl.jgltf.impl.v2.Image;
import de.javagl.jgltf.model.*;
import de.javagl.jgltf.model.io.GltfModelReader;

import javax.imageio.ImageIO;

import org.json.JSONArray;
import org.json.JSONObject;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.awt.image.BufferedImage;
import java.awt.image.DataBufferInt;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileWriter;
import java.lang.invoke.MethodHandles;
import java.lang.invoke.VarHandle;
import java.nio.ByteBuffer;
import java.nio.IntBuffer;
import java.nio.file.Files;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.IntConsumer;

/**
 * Fast CPU voxelizer for GLB tiles:
 *  • No node transforms (matches original CPU translation).
 *  • 3D Tiles bbox → cube, unit = maxDim / grid, translation via Math.round((-min)/unit).
 *  • 2.5-D dominant-axis scan conversion with incremental barycentrics + plane depth, like the JS worker.
 *  • Parallelised by Z-slabs (disjoint write regions → no atomics in inner loop).
 *  • Single global texture = first GLB image (like CUDA path’s TriMesh “first texture”), sampled ARGB int[].
 *  • CUDA-style UV clamp [0,1], optional V-flip (off by default to match your tiles), bilinear with truncation.
 *  • Emits JSON: {"blocks":{idx:[r,g,b],…},"xyzi":[[x,y,z,idx],…]} and <base>_position.json with translation.
 */
public final class JavaCpuVoxelizer {

    // ---------- configuration ----------
    private final int grid;
    private final boolean tiles3d;
    private final boolean verbose;

    private static final boolean FLIP_V = false; // you reported “no V-flip” matches your CUDA build
    private static final int SLAB_HEIGHT = 8;     // number of z-slices per task (tune 4..16)
    private static final float EPS = 1e-6f;       // inside test epsilon
    private static final float NEAR_W_FRACTION = 0.15f; // second-slice threshold like worker (~0.15)

    // Hardcoded 3D Tiles rect → cube
    private static final float TILE_SCALE = 1.3f;
    private static final float TILE_X = 46.0f * TILE_SCALE;
    private static final float TILE_Y = 38.0f * TILE_SCALE;
    private static final float TILE_Z = 24.0f * TILE_SCALE;

    private static void logVerbose(boolean verbose, String message) {
        if (verbose) {
            Log.info(message);
        }
    }

    private static void logVerbosef(boolean verbose, String format, Object... args) {
        if (verbose) {
            Log.info(String.format(Locale.ROOT, format, args));
        }
    }

    public JavaCpuVoxelizer(int gridSize, boolean tiles3d, boolean verbose) {
        this.grid = Math.max(8, gridSize);
        this.tiles3d = tiles3d;
        this.verbose = verbose;
    }

    // ---------- public API ----------
    public static final class Stats {
        public final String baseName;
        public final int grid, triangles, filled, ox, oy, oz;
        Stats(String baseName, int grid, int triangles, int filled, int ox, int oy, int oz) {
            this.baseName = baseName; this.grid = grid; this.triangles = triangles; this.filled = filled;
            this.ox = ox; this.oy = oy; this.oz = oz;
        }
    }

    public static final class VoxelPayload {
        private final String tileId;
        private final Map<Integer, int[]> palette;
        private final List<int[]> xyzi;
        private final int grid;
        private final int triangles;
        private final int filled;

        VoxelPayload(String tileId,
                     Map<Integer, int[]> palette,
                     List<int[]> xyzi,
                     int grid,
                     int triangles,
                     int filled) {
            this.tileId = tileId;
            this.palette = Collections.unmodifiableMap(palette);
            this.xyzi = Collections.unmodifiableList(xyzi);
            this.grid = grid;
            this.triangles = triangles;
            this.filled = filled;
        }

        public String tileId() { return tileId; }
        public Map<Integer, int[]> palette() { return palette; }
        public List<int[]> xyzi() { return xyzi; }
        public int grid() { return grid; }
        public int triangles() { return triangles; }
        public int filled() { return filled; }
    }

    private static final class VoxelComputation {
        final String baseName;
        final BitSet occ;
        final int[] colors;
        final int ox, oy, oz;
        final int triangles;
        final int filled;

        VoxelComputation(String baseName,
                         BitSet occ,
                         int[] colors,
                         int ox,
                         int oy,
                         int oz,
                         int triangles,
                         int filled) {
            this.baseName = baseName;
            this.occ = occ;
            this.colors = colors;
            this.ox = ox;
            this.oy = oy;
            this.oz = oz;
            this.triangles = triangles;
            this.filled = filled;
        }
    }

    public Stats voxelizeSingleGLB(File glbFile, File outDir) throws Exception {

        logVerbose(verbose, "[Load] " + glbFile.getAbsolutePath());

        LoaderResult lr = GltfReader.loadTrianglesAndGlobalTexture(glbFile);

        VoxelComputation comp = computeVoxelData(baseName(glbFile), lr);

        File jsonOut = new File(outDir, comp.baseName + "_" + grid + ".json");

        emitJSON(jsonOut, comp.colors, comp.occ, grid, comp.ox, comp.oy, comp.oz);

        return new Stats(comp.baseName, grid, comp.triangles, comp.filled, comp.ox, comp.oy, comp.oz);

    }

    public VoxelPayload voxelizeToMemory(String tileId, byte[] glbBytes) throws Exception {

        logVerbose(verbose, "[Load] <memory> " + tileId);

        LoaderResult lr = GltfReader.loadTrianglesAndGlobalTexture(glbBytes);

        VoxelComputation comp = computeVoxelData(tileId, lr);

        return buildPayload(comp);

    }



    private VoxelComputation computeVoxelData(String label, LoaderResult lr) throws Exception {

        if (lr.triCount == 0) throw new IllegalStateException("No triangles in " + label);

        Aabb baseBox = Aabb.fromTrisObj(lr.vx0, lr.vy0, lr.vz0, lr.vx1, lr.vy1, lr.vz1, lr.vx2, lr.vy2, lr.vz2, lr.triCount);

        Aabb rect = tiles3d ? Aabb.tileAroundCenter(baseBox, TILE_X, TILE_Y, TILE_Z) : baseBox;

        Aabb cube = rect.toCube();

        logVerbosef(verbose, "[BBox] tiles=%s cube min=(%.6f,%.6f,%.6f) max=(%.6f,%.6f,%.6f)",
                String.valueOf(tiles3d), cube.minx, cube.miny, cube.minz, cube.maxx, cube.maxy, cube.maxz);

        float maxDim = Math.max(Math.max(cube.maxx - cube.minx, cube.maxy - cube.miny), (cube.maxz - cube.minz));

        float unit = maxDim / (float) grid;

        if (unit <= 0) throw new IllegalStateException("Non-positive unit");

        logVerbosef(verbose, "[Grid] %d^3  unit=%.6f", grid, unit);

        int ox = Math.round((-cube.minx) / unit);

        int oy = Math.round((-cube.miny) / unit);

        int oz = Math.round((-cube.minz) / unit);

        VoxelTriSOA soa = VoxelTriSOA.fromObjectSpace(lr, cube, unit);

        int slabH = Math.min(SLAB_HEIGHT, Math.max(1, grid));

        int slabCount = (grid + slabH - 1) / slabH;

        IntArray[] slabBins = new IntArray[slabCount];

        for (int s = 0; s < slabCount; ++s) slabBins[s] = new IntArray(1 << 12);

        for (int t = 0; t < soa.n; ++t) {

            int triMinZ = clamp((int)Math.floor(Math.min(soa.z0[t], Math.min(soa.z1[t], soa.z2[t]))), 0, grid - 1);

            int triMaxZ = clamp((int)Math.ceil (Math.max(soa.z0[t], Math.max(soa.z1[t], soa.z2[t]))), 0, grid - 1);

            int slabMin = triMinZ / slabH;

            int slabMax = triMaxZ / slabH;

            for (int slab = slabMin; slab <= slabMax; ++slab) slabBins[slab].add(t);

        }

        BitSet occ = new BitSet(grid * grid * grid);

        int totalVoxels = grid * grid * grid;

        int[] colors = new int[totalVoxels];

        float[] bestD2 = new float[totalVoxels];

        Arrays.fill(bestD2, Float.POSITIVE_INFINITY);

        int threads = Math.max(1, Math.min(Runtime.getRuntime().availableProcessors(), slabCount));

        logVerbosef(verbose, "[Raster] slabs=%d  threads=%d", slabCount, threads);

        ExecutorService pool = Executors.newWorkStealingPool(threads);

        List<Future<Integer>> futures = new ArrayList<>(slabCount);

        for (int s = 0; s < slabCount; ++s) {

            final int slabIndex = s;

            final int zStart = slabIndex * slabH;

            final int zEnd = Math.min(grid, zStart + slabH);

            final IntArray list = slabBins[slabIndex];

            futures.add(pool.submit(() ->

                rasterizeSlab(soa, list, zStart, zEnd, grid, unit, FLIP_V, occ, colors, bestD2)

            ));

        }

        int filled = 0;

        for (Future<Integer> f : futures) filled += f.get();

        pool.shutdown();

        logVerbosef(verbose, "[Raster] tri=%d  filled=%d", soa.n, filled);

        return new VoxelComputation(label, occ, colors, ox, oy, oz, soa.n, filled);

    }



    private VoxelPayload buildPayload(VoxelComputation comp) {

        Map<Integer, int[]> palette = new LinkedHashMap<>();

        Map<Integer, Integer> paletteIndex = new LinkedHashMap<>();

        List<int[]> xyzi = new ArrayList<>(Math.max(1, comp.filled));

        int nextIdx = 0;

        for (int idx = comp.occ.nextSetBit(0); idx >= 0; idx = comp.occ.nextSetBit(idx + 1)) {

            int z = idx / (grid * grid);

            int rem = idx - z * (grid * grid);

            int y = rem / grid;

            int x = rem - y * grid;

            int rgb = comp.colors[idx];

            Integer paletteIdx = paletteIndex.get(rgb);

            if (paletteIdx == null) {

                paletteIdx = nextIdx++;

                paletteIndex.put(rgb, paletteIdx);

                palette.put(paletteIdx, new int[]{ (rgb >>> 16) & 255, (rgb >>> 8) & 255, rgb & 255 });

            }

            xyzi.add(new int[]{ x - comp.ox, y - comp.oy, z - comp.oz, paletteIdx });

        }

        return new VoxelPayload(comp.baseName, palette, xyzi, grid, comp.triangles, comp.filled);

    }





    // ---------- rasterisation per slab ----------
    private static int rasterizeSlab(
            VoxelTriSOA T, IntArray triList, int z0, int z1, int G,
            float unit, boolean flipV,
            BitSet occ, int[] colors, float[] bestD2
    ) {
        final int NX = G, NY = G, NZ = G;
        final float eps = EPS;
        final float nearFrac = NEAR_W_FRACTION;

        final int[] tex = T.texPixels;
        final int texW = T.texW;
        final int texH = T.texH;
        final int texStride = T.texStride;

        final int[] triIdx = triList.data;
        final int triCount = triList.size;

        int filledHere = 0;

        for (int ii = 0; ii < triCount; ++ii) {
            int i = triIdx[ii];

            // triangle vertices
            float x0 = T.x0[i], y0 = T.y0[i], z00 = T.z0[i];
            float x1 = T.x1[i], y1 = T.y1[i], z1f = T.z1[i];
            float x2 = T.x2[i], y2 = T.y2[i], z2f = T.z2[i];

            // normal & edges
            float e10x = T.e10x[i], e10y = T.e10y[i], e10z = T.e10z[i];
            float e20x = T.e20x[i], e20y = T.e20y[i], e20z = T.e20z[i];
            float nx = T.nx[i], ny = T.ny[i], nz = T.nz[i];

            // tri AABB (voxel coords)
            int minX = clamp((int)Math.floor(Math.min(x0, Math.min(x1, x2))), 0, G-1);
            int minY = clamp((int)Math.floor(Math.min(y0, Math.min(y1, y2))), 0, G-1);
            int minZ = clamp((int)Math.floor(Math.min(z00, Math.min(z1f, z2f))), 0, G-1);
            int maxX = clamp((int)Math.ceil (Math.max(x0, Math.max(x1, x2))), 0, G-1);
            int maxY = clamp((int)Math.ceil (Math.max(y0, Math.max(y1, y2))), 0, G-1);
            int maxZ = clamp((int)Math.ceil (Math.max(z00, Math.max(z1f, z2f))), 0, G-1);

            // skip if no intersection with slab
            if (maxZ < z0 || minZ >= z1) continue;

            // choose dominant axis (Z, Y, X)
            float abx = Math.abs(nx), aby = Math.abs(ny), abz = Math.abs(nz);
            int wAxis, uAxis, vAxis; // W is depth axis, U/V are scan axes
            if (abz >= abx && abz >= aby) { // Z major → (u,v)=(x,y), w=z
                wAxis = 2; uAxis = 0; vAxis = 1;
            } else if (aby >= abx) {       // Y major → (u,v)=(z,x), w=y
                wAxis = 1; uAxis = 2; vAxis = 0;
            } else {                        // X major → (u,v)=(y,z), w=x
                wAxis = 0; uAxis = 1; vAxis = 2;
            }

            // Map vertex coords to (U,V,W)
            float U0, V0, W0, U1, V1, W1, U2, V2, W2;
            if (wAxis == 2) { // Z-major
                U0 = x0; V0 = y0; W0 = z00;
                U1 = x1; V1 = y1; W1 = z1f;
                U2 = x2; V2 = y2; W2 = z2f;
            } else if (wAxis == 1) { // Y-major: u=z, v=x, w=y
                U0 = z00; V0 = x0; W0 = y0;
                U1 = z1f; V1 = x1; W1 = y1;
                U2 = z2f; V2 = x2; W2 = y2;
            } else { // X-major: u=y, v=z, w=x
                U0 = y0; V0 = z00; W0 = x0;
                U1 = y1; V1 = z1f; W1 = x1;
                U2 = y2; V2 = z2f; W2 = x2;
            }

            // 2D bbox on (U,V)
            int uMin = clamp((int)Math.floor(Math.min(U0, Math.min(U1, U2))), 0, G-1);
            int vMin = clamp((int)Math.floor(Math.min(V0, Math.min(V1, V2))), 0, G-1);
            int uMax = clamp((int)Math.ceil (Math.max(U0, Math.max(U1, U2))), 0, G-1);
            int vMax = clamp((int)Math.ceil (Math.max(V0, Math.max(V1, V2))), 0, G-1);

            if (uMin > uMax || vMin > vMax) continue;

            // barycentric gradients on (U,V) plane
            float denom = (V1 - V2) * (U0 - U2) + (U2 - U1) * (V0 - V2);
            if (Math.abs(denom) < 1e-12f) continue;
            float invDen = 1.0f / denom;

            float dL0du = ( V1 - V2) * invDen;
            float dL0dv = ( U2 - U1) * invDen;
            float dL1du = ( V2 - V0) * invDen;
            float dL1dv = ( U0 - U2) * invDen;

            // W interpolation coefficients: W = L0*W0 + L1*W1 + L2*W2, L2=1-L0-L1
            float Wc0 = W0 - W2; // coeff for L0
            float Wc1 = W1 - W2; // coeff for L1
            float WcC = W2;      // constant term

            // Normal’s w-component for depth scale
            float nW = (wAxis == 2 ? nz : (wAxis == 1 ? ny : nx));
            float nLen2 = nx*nx + ny*ny + nz*nz;
            if (nLen2 < 1e-20f) continue;
            float depthScale = (nW * nW) / nLen2;

            // For UV interpolation we need tri uv’s:
            float tu0 = T.tu0[i], tv0 = T.tv0[i];
            float tu1 = T.tu1[i], tv1 = T.tv1[i];
            float tu2 = T.tu2[i], tv2 = T.tv2[i];
            boolean hasUV = T.hasUV[i] && tex != null;

            // Scan rows in V
            for (int v = vMin; v <= vMax; ++v) {
                float u0c = uMin + 0.5f, vc = v + 0.5f;

                // L0,L1 at (u0c, vc)
                float L0 = ( (V1 - V2) * (u0c - U2) + (U2 - U1) * (vc - V2) ) * invDen;
                float L1 = ( (V2 - V0) * (u0c - U2) + (U0 - U2) * (vc - V2) ) * invDen;
                float L2 = 1.0f - L0 - L1;

                // W at start of row and dW/du
                float W = Wc0*L0 + Wc1*L1 + WcC;
                float dWdu = dL0du*Wc0 + dL1du*Wc1;

                float L0du = dL0du, L1du = dL1du; // per-step increments

                for (int u = uMin; u <= uMax; ++u) {
                    // top-left rule tolerance
                    if (L0 >= -eps && L1 >= -eps && L2 >= -eps) {
                        int ix, iy, iz;
                        int wIdx = (int)Math.floor(W);

                        // map back to (x,y,z) from (u,v,w)
                        if (wAxis == 2) { // z = W
                            ix = u; iy = v; iz = wIdx;
                        } else if (wAxis == 1) { // y = W, z = u, x = v
                            ix = v; iy = wIdx; iz = u;
                        } else { // x = W, y = u, z = v
                            ix = wIdx; iy = u; iz = v;
                        }

                        if (iz >= z0 && iz < z1 && ix >= 0 && ix < G && iy >= 0 && iy < G) {
                            int lin = ix + G * (iy + G * iz);
                            float delta = W - ( (wAxis==2? iz: (wAxis==1? iy: ix)) + 0.5f ); // distance to center of that slice
                            float d2 = delta * delta * depthScale;

                            if (d2 < bestD2[lin]) {
                                bestD2[lin] = d2;
                                occ.set(lin);
                                colors[lin] = hasUV
                                        ? sampleCUDA(tex, texW, texH, texStride, clamp01(L0*tu0 + L1*tu1 + L2*tu2),
                                                clamp01(L0*tv0 + L1*tv1 + L2*tv2), FLIP_V)
                                        : 0xFFFFFF;
                            }
                        }

                        // secondary neighbor slice if near boundary
                        float frac = W - (float)Math.floor(W);
                        if (frac < nearFrac || frac > 1f - nearFrac) {
                            int w2 = (W - (wIdx + 0.5f)) < 0 ? (wIdx - 1) : (wIdx + 1);
                            int ix2, iy2, iz2;
                            if (wAxis == 2) { ix2 = u; iy2 = v; iz2 = w2; }
                            else if (wAxis == 1) { ix2 = v; iy2 = w2; iz2 = u; }
                            else { ix2 = w2; iy2 = u; iz2 = v; }

                            if (iz2 >= z0 && iz2 < z1 && ix2>=0 && ix2<G && iy2>=0 && iy2<G && w2>=0 && w2<G) {
                                int lin2 = ix2 + G * (iy2 + G * iz2);
                                float d2b = (W - (w2 + 0.5f));
                                float d2n = d2b * d2b * depthScale;
                                if (d2n < bestD2[lin2]) {
                                    bestD2[lin2] = d2n;
                                    occ.set(lin2);
                                    colors[lin2] = hasUV
                                            ? sampleCUDA(tex, texW, texH, texStride, clamp01(L0*tu0 + L1*tu1 + L2*tu2),
                                                    clamp01(L0*tv0 + L1*tv1 + L2*tv2), FLIP_V)
                                            : 0xFFFFFF;
                                }
                            }
                        }
                    }

                    // advance u
                    L0 += L0du;
                    L1 += L1du;
                    L2 = 1.0f - L0 - L1;
                    W  += dWdu;
                }

                // advance v: recompute at (uMin+0.5, v+1+0.5) for stability
                float u0n = uMin + 0.5f, vn = (v + 1) + 0.5f;
                L0 = ( (V1 - V2) * (u0n - U2) + (U2 - U1) * (vn - V2) ) * invDen;
                L1 = ( (V2 - V0) * (u0n - U2) + (U0 - U2) * (vn - V2) ) * invDen;
                L2 = 1.0f - L0 - L1;
                W  = Wc0*L0 + Wc1*L1 + WcC;
                // dWdu, L0du/L1du unchanged
            }
        }

        // count filled in this slab
        int count = 0;
        int idxStart = z0 * G * G;
        int idxEnd = z1 * G * G;
        for (int p = occ.nextSetBit(idxStart); p >= 0 && p < idxEnd; p = occ.nextSetBit(p+1)) {
            count++;
        }
        return count;
    }

    // ---------- CUDA-style bilinear sample ----------
    private static int sampleCUDA(int[] pix, int w, int h, int stride, float u, float v, boolean flipV) {
        if (pix == null || w <= 0 || h <= 0) return 0xFFFFFF;
        float U = u * (w - 1);
        float V = (flipV ? (1f - v) : v) * (h - 1);
        int x0 = (int) Math.floor(U);
        int y0 = (int) Math.floor(V);
        int x1 = Math.min(x0 + 1, w - 1);
        int y1 = Math.min(y0 + 1, h - 1);
        float dx = U - x0, dy = V - y0;

        int c00 = pix[y0 * stride + x0];
        int c10 = pix[y0 * stride + x1];
        int c01 = pix[y1 * stride + x0];
        int c11 = pix[y1 * stride + x1];

        float r00 = (c00 >>> 16) & 255, g00 = (c00 >>> 8) & 255, b00 = c00 & 255;
        float r10 = (c10 >>> 16) & 255, g10 = (c10 >>> 8) & 255, b10 = c10 & 255;
        float r01 = (c01 >>> 16) & 255, g01 = (c01 >>> 8) & 255, b01 = c01 & 255;
        float r11 = (c11 >>> 16) & 255, g11 = (c11 >>> 8) & 255, b11 = c11 & 255;

        float w00 = (1 - dx) * (1 - dy);
        float w10 = dx       * (1 - dy);
        float w01 = (1 - dx) * dy;
        float w11 = dx       * dy;

        int r = (int)(r00*w00 + r10*w10 + r01*w01 + r11*w11);
        int g = (int)(g00*w00 + g10*w10 + g01*w01 + g11*w11);
        int b = (int)(b00*w00 + b10*w10 + b01*w01 + b11*w11);

        if (r < 0) r = 0; else if (r > 255) r = 255;
        if (g < 0) g = 0; else if (g > 255) g = 255;
        if (b < 0) b = 0; else if (b > 255) b = 255;

        return (r << 16) | (g << 8) | b;
    }

    private static float clamp01(float a) { return a < 0 ? 0 : (a > 1 ? 1 : a); }

    // ---------- JSON emit ----------
    private static void emitJSON(File out, int[] colors, BitSet occ, int G, int ox, int oy, int oz) throws Exception {
        Map<Integer,Integer> palette = new LinkedHashMap<>();
        int nextIdx = 1;
        JSONArray xyzi = new JSONArray();
        int total = G*G*G;
        for (int i = occ.nextSetBit(0); i >= 0; i = occ.nextSetBit(i+1)) {
            int z =  i / (G*G);
            int rem = i - z*(G*G);
            int y =  rem / G;
            int x =  rem - y*G;

            int rgb = colors[i];
            Integer idx = palette.get(rgb);
            if (idx == null) { idx = nextIdx++; palette.put(rgb, idx); }
            xyzi.put(new JSONArray(new int[]{ x - ox, y - oy, z - oz, idx }));
        }

        JSONObject blocks = new JSONObject();
        for (var e : palette.entrySet()) {
            int rgb = e.getKey();
            int r = (rgb >>> 16) & 255, g = (rgb >>> 8) & 255, b = rgb & 255;
            blocks.put(Integer.toString(e.getValue()), new JSONArray(new int[] { r, g, b }));
        }
        JSONObject root = new JSONObject();
        root.put("blocks", blocks);
        root.put("xyzi",   xyzi);

        try (FileWriter fw = new FileWriter(out)) {
            fw.write(root.toString());
        }
    }

    private static void emitPosition(File out, int ox, int oy, int oz) throws Exception {
        JSONArray arr = new JSONArray();
        JSONObject pos = new JSONObject();
        pos.put("translation", new JSONArray(new int[]{ox, oy, oz}));
        pos.put("origin", new JSONArray(new int[]{0, 0, 0}));
        arr.put(pos);
        try (FileWriter fw = new FileWriter(out)) {
            fw.write(arr.toString());
        }
    }

    // ---------- utils / data holders ----------
    private static String baseName(File f) {
        String s = f.getName();
        int dot = s.lastIndexOf('.');
        return (dot >= 0) ? s.substring(0, dot) : s;
    }

    private static int clamp(int v, int lo, int hi) { return (v < lo) ? lo : (v > hi ? hi : v); }

    // AABB in object space
    private static final class Aabb {
        final float minx, miny, minz, maxx, maxy, maxz;
        Aabb(float minx, float miny, float minz, float maxx, float maxy, float maxz) {
            this.minx = minx; this.miny = miny; this.minz = minz; this.maxx = maxx; this.maxy = maxy; this.maxz = maxz;
        }
        static Aabb fromTrisObj(float[] x0,float[] y0,float[] z0,
                                float[] x1,float[] y1,float[] z1,
                                float[] x2,float[] y2,float[] z2,
                                int n){
            float mnx=Float.POSITIVE_INFINITY,mny=Float.POSITIVE_INFINITY,mnz=Float.POSITIVE_INFINITY;
            float mxx=Float.NEGATIVE_INFINITY,mxy=Float.NEGATIVE_INFINITY,mxz=Float.NEGATIVE_INFINITY;
            for(int i=0;i<n;i++){
                float[] xs={x0[i],x1[i],x2[i]};
                float[] ys={y0[i],y1[i],y2[i]};
                float[] zs={z0[i],z1[i],z2[i]};
                for(int k=0;k<3;k++){
                    float X=xs[k],Y=ys[k],Z=zs[k];
                    if(X<mnx) mnx=X; if(Y<mny) mny=Y; if(Z<mnz) mnz=Z;
                    if(X>mxx) mxx=X; if(Y>mxy) mxy=Y; if(Z>mxz) mxz=Z;
                }
            }
            return new Aabb(mnx,mny,mnz,mxx,mxy,mxz);
        }
        static Aabb tileAroundCenter(Aabb b, float tx,float ty,float tz){
            float cx = 0.5f*(b.minx+b.maxx), cy=0.5f*(b.miny+b.maxy), cz=0.5f*(b.minz+b.maxz);
            return new Aabb(cx - tx*0.5f, cy - ty*0.5f, cz - tz*0.5f,
                            cx + tx*0.5f, cy + ty*0.5f, cz + tz*0.5f);
        }
        Aabb toCube(){
            float sx = maxx-minx, sy = maxy-miny, sz = maxz-minz;
            float side = Math.max(Math.max(sx, sy), sz);
            float cx = 0.5f*(minx+maxx), cy=0.5f*(miny+maxy), cz=0.5f*(minz+maxz);
            float hx = side*0.5f;
            return new Aabb(cx-hx, cy-hx, cz-hx, cx+hx, cy+hx, cz+hx);
        }
    }

    // Object-space triangle loader + first image decode
    private static final class LoaderResult {
        final int triCount;
        final float[] vx0,vy0,vz0, vx1,vy1,vz1, vx2,vy2,vz2;
        final float[] tu0,tv0, tu1,tv1, tu2,tv2;
        final boolean[] hasUV;
        final int texW, texH, texStride;
        final int[] texPixels;

        LoaderResult(int n,
                     float[] vx0,float[] vy0,float[] vz0,
                     float[] vx1,float[] vy1,float[] vz1,
                     float[] vx2,float[] vy2,float[] vz2,
                     float[] tu0,float[] tv0,float[] tu1,float[] tv1,float[] tu2,float[] tv2,
                     boolean[] hasUV,
                     int texW,int texH,int texStride,int[] texPixels) {
            this.triCount = n;
            this.vx0=vx0; this.vy0=vy0; this.vz0=vz0;
            this.vx1=vx1; this.vy1=vy1; this.vz1=vz1;
            this.vx2=vx2; this.vy2=vy2; this.vz2=vz2;
            this.tu0=tu0; this.tv0=tv0; this.tu1=tu1; this.tv1=tv1; this.tu2=tu2; this.tv2=tv2;
            this.hasUV=hasUV;
            this.texW=texW; this.texH=texH; this.texStride=texStride; this.texPixels=texPixels;
        }
    }

    private static final class GltfReader {
        static LoaderResult loadTrianglesAndGlobalTexture(File glb) throws Exception {
            byte[] bytes = Files.readAllBytes(glb.toPath());
            return loadTrianglesAndGlobalTexture(bytes);
        }

        static LoaderResult loadTrianglesAndGlobalTexture(byte[] glbBytes) throws Exception {
            GltfModel model = new GltfModelReader().readWithoutReferences(new ByteArrayInputStream(glbBytes));

            IntArray triIdx = new IntArray(1<<20);
            FloatArray vx = new FloatArray(1<<20), vy=new FloatArray(1<<20), vz=new FloatArray(1<<20);
            FloatArray tu = new FloatArray(1<<20), tv=new FloatArray(1<<20);
            BoolArray  hv = new BoolArray(1<<19);

            List<SceneModel> scenes = model.getSceneModels();
            if (scenes == null || scenes.isEmpty()) {
                for (NodeModel n : model.getNodeModels()) {
                    gatherNode(model, n, triIdx, vx,vy,vz, tu,tv, hv);
                }
            } else {
                for (SceneModel s : scenes) {
                    for (NodeModel n : s.getNodeModels()) {
                        gatherNode(model, n, triIdx, vx,vy,vz, tu,tv, hv);
                    }
                }
            }

            int nTri = triIdx.size/3;
            float[] vx0=new float[nTri], vy0=new float[nTri], vz0=new float[nTri];
            float[] vx1=new float[nTri], vy1=new float[nTri], vz1=new float[nTri];
            float[] vx2=new float[nTri], vy2=new float[nTri], vz2=new float[nTri];
            float[] tu0=new float[nTri], tv0=new float[nTri];
            float[] tu1=new float[nTri], tv1=new float[nTri];
            float[] tu2=new float[nTri], tv2=new float[nTri];
            boolean[] hasUV = new boolean[nTri];

            // triIdx indexes into vx/vy/vz arrays of unique vertices (but we stored triangles expanded already)
            for (int i=0;i<nTri;i++){
                int b = i*3;
                int i0 = triIdx.data[b], i1=triIdx.data[b+1], i2=triIdx.data[b+2];
                vx0[i]=vx.data[i0]; vy0[i]=vy.data[i0]; vz0[i]=vz.data[i0];
                vx1[i]=vx.data[i1]; vy1[i]=vy.data[i1]; vz1[i]=vz.data[i1];
                vx2[i]=vx.data[i2]; vy2[i]=vy.data[i2]; vz2[i]=vz.data[i2];

                tu0[i]=tu.data[i0]; tv0[i]=tv.data[i0];
                tu1[i]=tu.data[i1]; tv1[i]=tv.data[i1];
                tu2[i]=tu.data[i2]; tv2[i]=tv.data[i2];
                hasUV[i] = (tu0[i] == tu0[i] || tu1[i] == tu1[i] || tu2[i] == tu2[i]); // any not NaN → had uv
            }

// --- decode first image as TYPE_INT_ARGB and extract raw int[] + scanline stride ---
java.util.List<ImageModel> ims = model.getImageModels();
int texW = 0, texH = 0, stride = 0;
int[] texPixels = null;

if (ims != null && !ims.isEmpty()) {
    for (ImageModel im : ims) {
        java.nio.ByteBuffer bb = im.getImageData();
        if (bb == null) continue;

        byte[] arr = new byte[bb.remaining()];
        bb.get(arr);

        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(arr)) {
            java.awt.image.BufferedImage img = javax.imageio.ImageIO.read(bais);
            if (img == null) continue;

            // ensure TYPE_INT_ARGB so the raster has a single int-packed sample model
            java.awt.image.BufferedImage argb =
                    (img.getType() == java.awt.image.BufferedImage.TYPE_INT_ARGB)
                            ? img
                            : convertToARGB(img); // keep your existing helper

            texW = argb.getWidth();
            texH = argb.getHeight();

            // grab backing int[] and scanline stride in a portable way
            java.awt.image.WritableRaster raster = argb.getRaster();
            java.awt.image.DataBuffer db = raster.getDataBuffer();
            if (!(db instanceof java.awt.image.DataBufferInt)) {
                // very unlikely for TYPE_INT_ARGB, but just in case: force-convert
                argb = new java.awt.image.BufferedImage(texW, texH, java.awt.image.BufferedImage.TYPE_INT_ARGB);
                argb.getGraphics().drawImage(img, 0, 0, null);
                raster = argb.getRaster();
                db = raster.getDataBuffer();
            }
            texPixels = ((java.awt.image.DataBufferInt) db).getData();

            java.awt.image.SampleModel sm = raster.getSampleModel();
            if (sm instanceof java.awt.image.SinglePixelPackedSampleModel) {
                stride = ((java.awt.image.SinglePixelPackedSampleModel) sm).getScanlineStride();
            } else {
                // Fallback: treat stride as image width if not SPPM (should not happen for TYPE_INT_ARGB)
                stride = texW;
            }
            break; // we only use the first decodable image, like the CUDA path
        }
    }
}
// ... keep returning/assigning texW/texH/stride/texPixels into your LoaderResult …


            return new LoaderResult(nTri, vx0,vy0,vz0, vx1,vy1,vz1, vx2,vy2,vz2, tu0,tv0, tu1,tv1, tu2,tv2,
                    hasUV, texW,texH,stride, texPixels);
        }

        private static void gatherNode(GltfModel model, NodeModel node,
                                       IntArray triIdx,
                                       FloatArray vx, FloatArray vy, FloatArray vz,
                                       FloatArray tu, FloatArray tv, BoolArray hv) {
            List<MeshModel> meshes = node.getMeshModels();
            if (meshes != null) {
                for (MeshModel mm : meshes) {
                    for (MeshPrimitiveModel pm : mm.getMeshPrimitiveModels()) {
                        AccessorModel posAcc = pm.getAttributes().get("POSITION");
                        if (posAcc == null) continue;
                        AccessorFloatData p = AccessorDatas.createFloat(posAcc);
                        AccessorModel uvAcc = pm.getAttributes().get("TEXCOORD_0");
                        AccessorFloatData uv = (uvAcc != null) ? AccessorDatas.createFloat(uvAcc) : null;

                        IntBuffer ib = toIndexBuffer(pm);
                        if (ib != null) {
                            while (ib.hasRemaining()) {
                                int i0=ib.get(), i1=ib.get(), i2=ib.get();
                                int base = vx.size;
                                vx.add(p.get(i0,0)); vy.add(p.get(i0,1)); vz.add(p.get(i0,2));
                                vx.add(p.get(i1,0)); vy.add(p.get(i1,1)); vz.add(p.get(i1,2));
                                vx.add(p.get(i2,0)); vy.add(p.get(i2,1)); vz.add(p.get(i2,2));
                                if (uv!=null){
                                    tu.add(uv.get(i0,0)); tv.add(uv.get(i0,1));
                                    tu.add(uv.get(i1,0)); tv.add(uv.get(i1,1));
                                    tu.add(uv.get(i2,0)); tv.add(uv.get(i2,1));
                                    hv.add(true); hv.add(true); hv.add(true);
                                } else {
                                    tu.add(Float.NaN); tv.add(Float.NaN);
                                    tu.add(Float.NaN); tv.add(Float.NaN);
                                    tu.add(Float.NaN); tv.add(Float.NaN);
                                    hv.add(false); hv.add(false); hv.add(false);
                                }
                                triIdx.add(base); triIdx.add(base+1); triIdx.add(base+2);
                            }
                        } else {
                            int n = p.getNumElements();
                            for (int i=0;i+2<n;i+=3){
                                int base = vx.size;
                                vx.add(p.get(i,0));   vy.add(p.get(i,1));   vz.add(p.get(i,2));
                                vx.add(p.get(i+1,0)); vy.add(p.get(i+1,1)); vz.add(p.get(i+1,2));
                                vx.add(p.get(i+2,0)); vy.add(p.get(i+2,1)); vz.add(p.get(i+2,2));
                                if (uv!=null){
                                    tu.add(uv.get(i,0));   tv.add(uv.get(i,1));
                                    tu.add(uv.get(i+1,0)); tv.add(uv.get(i+1,1));
                                    tu.add(uv.get(i+2,0)); tv.add(uv.get(i+2,1));
                                    hv.add(true); hv.add(true); hv.add(true);
                                } else {
                                    tu.add(Float.NaN); tv.add(Float.NaN);
                                    tu.add(Float.NaN); tv.add(Float.NaN);
                                    tu.add(Float.NaN); tv.add(Float.NaN);
                                    hv.add(false); hv.add(false); hv.add(false);
                                }
                                triIdx.add(base); triIdx.add(base+1); triIdx.add(base+2);
                            }
                        }
                    }
                }
            }
            for (NodeModel child : node.getChildren()) {
                gatherNode(model, child, triIdx, vx,vy,vz, tu,tv, hv);
            }
        }

private static IntBuffer toIndexBuffer(MeshPrimitiveModel pm) {
    AccessorModel idxAcc = pm.getIndices();
    if (idxAcc == null) return null;

    AccessorData ad = AccessorDatas.create(idxAcc);
    int n = ad.getNumElements();
    IntBuffer ib = IntBuffer.allocate(n);

    if (ad instanceof AccessorByteData bd) {           // GL_UNSIGNED_BYTE
        for (int i = 0; i < n; i++) ib.put(bd.get(i, 0) & 0xFF);
    } else if (ad instanceof AccessorShortData sd) {   // GL_UNSIGNED_SHORT
        for (int i = 0; i < n; i++) ib.put(sd.get(i, 0) & 0xFFFF);
    } else if (ad instanceof AccessorIntData id) {     // GL_UNSIGNED_INT / INT
        for (int i = 0; i < n; i++) ib.put(id.get(i, 0));
    } else {
        // glTF index component type must be UBYTE/USHORT/UINT — anything else is invalid here
        throw new IllegalStateException(
            "Unsupported index accessor type: " + ad.getClass().getName() +
            " (componentType=" + idxAcc.getComponentType() + ")"
        );
    }

    ib.rewind();
    return ib;
}


        private static BufferedImage convertToARGB(BufferedImage src) {
            BufferedImage out = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_ARGB);
            out.getGraphics().drawImage(src, 0, 0, null);
            return out;
        }
    }

    // Triangles in voxel space (unit=1), structure-of-arrays for speed
    private static final class VoxelTriSOA {
        final int n;
        final float[] x0,y0,z0, x1,y1,z1, x2,y2,z2;
        final float[] e10x,e10y,e10z, e20x,e20y,e20z, nx,ny,nz;
        final float[] tu0,tv0, tu1,tv1, tu2,tv2;
        final boolean[] hasUV;
        final int texW, texH, texStride; final int[] texPixels;

        private VoxelTriSOA(int n,
                            float[] x0,float[] y0,float[] z0,
                            float[] x1,float[] y1,float[] z1,
                            float[] x2,float[] y2,float[] z2,
                            float[] e10x,float[] e10y,float[] e10z,
                            float[] e20x,float[] e20y,float[] e20z,
                            float[] nx,float[] ny,float[] nz,
                            float[] tu0,float[] tv0,float[] tu1,float[] tv1,float[] tu2,float[] tv2,
                            boolean[] hasUV,
                            int texW,int texH,int texStride,int[] texPixels) {
            this.n = n;
            this.x0=x0; this.y0=y0; this.z0=z0; this.x1=x1; this.y1=y1; this.z1=z1; this.x2=x2; this.y2=y2; this.z2=z2;
            this.e10x=e10x; this.e10y=e10y; this.e10z=e10z; this.e20x=e20x; this.e20y=e20y; this.e20z=e20z;
            this.nx=nx; this.ny=ny; this.nz=nz;
            this.tu0=tu0; this.tv0=tv0; this.tu1=tu1; this.tv1=tv1; this.tu2=tu2; this.tv2=tv2;
            this.hasUV=hasUV;
            this.texW=texW; this.texH=texH; this.texStride=texStride; this.texPixels=texPixels;
        }

        static VoxelTriSOA fromObjectSpace(LoaderResult L, Aabb cube, float unit) {
            int n = L.triCount;
            float[] x0=new float[n], y0=new float[n], z0=new float[n];
            float[] x1=new float[n], y1=new float[n], z1=new float[n];
            float[] x2=new float[n], y2=new float[n], z2=new float[n];
            float[] e10x=new float[n], e10y=new float[n], e10z=new float[n];
            float[] e20x=new float[n], e20y=new float[n], e20z=new float[n];
            float[] nx=new float[n], ny=new float[n], nz=new float[n];
            for (int i=0;i<n;i++){
                x0[i]=(L.vx0[i]-cube.minx)/unit; y0[i]=(L.vy0[i]-cube.miny)/unit; z0[i]=(L.vz0[i]-cube.minz)/unit;
                x1[i]=(L.vx1[i]-cube.minx)/unit; y1[i]=(L.vy1[i]-cube.miny)/unit; z1[i]=(L.vz1[i]-cube.minz)/unit;
                x2[i]=(L.vx2[i]-cube.minx)/unit; y2[i]=(L.vy2[i]-cube.miny)/unit; z2[i]=(L.vz2[i]-cube.minz)/unit;
                e10x[i]=x1[i]-x0[i]; e10y[i]=y1[i]-y0[i]; e10z[i]=z1[i]-z0[i];
                e20x[i]=x2[i]-x0[i]; e20y[i]=y2[i]-y0[i]; e20z[i]=z2[i]-z0[i];
                float cx = e10y[i]*e20z[i] - e10z[i]*e20y[i];
                float cy = e10z[i]*e20x[i] - e10x[i]*e20z[i];
                float cz = e10x[i]*e20y[i] - e10y[i]*e20x[i];
                float len = (float)Math.hypot(Math.hypot(cx,cy), cz);
                if (len > 1e-20f) { nx[i]=cx/len; ny[i]=cy/len; nz[i]=cz/len; } else { nx[i]=ny[i]=nz[i]=0; }
            }
            return new VoxelTriSOA(
                n, x0,y0,z0, x1,y1,z1, x2,y2,z2,
                e10x,e10y,e10z, e20x,e20y,e20z, nx,ny,nz,
                L.tu0,L.tv0, L.tu1,L.tv1, L.tu2,L.tv2, L.hasUV,
                L.texW,L.texH,L.texStride,L.texPixels
            );
        }
    }

    // ---------- small dynamic arrays ----------
    private static final class IntArray {
        int[] data; int size=0;
        IntArray(int cap){ data=new int[cap]; }
        void add(int v){ if(size==data.length) data=Arrays.copyOf(data, data.length*2); data[size++]=v; }
    }
    private static final class FloatArray {
        float[] data; int size=0;
        FloatArray(int cap){ data=new float[cap]; }
        void add(float v){ if(size==data.length) data=Arrays.copyOf(data, data.length*2); data[size++]=v; }
    }
    private static final class BoolArray {
        boolean[] data; int size=0;
        BoolArray(int cap){ data=new boolean[cap]; }
        void add(boolean v){ if(size==data.length) data=Arrays.copyOf(data, data.length*2); data[size++]=v; }
    }
}
