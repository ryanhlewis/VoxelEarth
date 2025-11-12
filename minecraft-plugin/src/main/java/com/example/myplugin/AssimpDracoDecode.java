// AssimpDracoDecode.java (origin support + Node-parity per-root bake)

package com.example.voxelearth;

import org.lwjgl.PointerBuffer;
import org.lwjgl.assimp.*;
import org.lwjgl.system.Configuration;
import org.lwjgl.system.MemoryUtil;
import org.lwjgl.system.SharedLibrary;

import java.io.File;
import java.nio.IntBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

/**
 * GLB rotate-flat with Draco decode via LWJGL Assimp.
 * Node-parity behavior:
 *   - Optional shared origin (ECEF) provided by caller; if null, use world bbox center.
 *   - Geodetic up = normalize(origin or center) rotated to +Y.
 *   - Strict step: for each "root" (children of Assimp root, or root itself if no children),
 *       M' = RS_row * ( T(-C) * M )
 *   - Bake ONLY the ROOTS' current R*S into their meshes.
 *   - Flatten ROOTS to translation-only; pre-multiply DIRECT children by ROOTS' RS (no recursion).
 *   - Disallow baking roots whose mesh is shared by multiple nodes. Disallow skins under roots.
 */
public final class AssimpDracoDecode {

    private AssimpDracoDecode() {}

    // VoxelEarth-specific utility: measure origin center from GLB bytes
    public static double[] measureOriginCenterFromGlbBytes(byte[] inputBytes) throws Exception {
        if (inputBytes == null || inputBytes.length == 0) {
            throw new IllegalArgumentException("Empty GLB input");
        }

        int ppFlags =
                Assimp.aiProcess_Triangulate |
                Assimp.aiProcess_JoinIdenticalVertices |
                Assimp.aiProcess_ImproveCacheLocality |
                Assimp.aiProcess_SortByPType;

        java.nio.ByteBuffer bb = org.lwjgl.system.MemoryUtil.memAlloc(inputBytes.length);
        bb.put(inputBytes).flip();

        AIScene scene = Assimp.aiImportFileFromMemory(bb, ppFlags, "glb");
        if (scene == null) {
            org.lwjgl.system.MemoryUtil.memFree(bb);
            throw new IllegalStateException("Assimp import (measure) failed: " + Assimp.aiGetErrorString());
        }

        try {
            // Same “center” Node uses (world bbox center before any rotate/bake)
            WorldStats stats = worldStatsFromOriginal(scene);
            float[] c = stats.center();
            return new double[]{ c[0], c[1], c[2] };
        } finally {
            Assimp.aiReleaseImport(scene);
            org.lwjgl.system.MemoryUtil.memFree(bb);
        }
    }


    // ---------- tiny dbg helpers ----------
    private static void dbg(boolean verbose, String fmt, Object... args){
        if (verbose) Log.info(String.format(fmt, args));
    }
    private static void dbgVec(boolean verbose, String label, float[] a){
        if (verbose) Log.info(String.format("%s = (%.6f, %.6f, %.6f)", label, a[0], a[1], a[2]));
    }
    private static String nm(AINode n){ return n!=null && n.mName()!=null ? n.mName().dataString() : "<unnamed>"; }

    // ---------- public API (overloads keep BC; new overload adds origin) ----------
    public static void decodeToUncompressedGlb(File input, File output, boolean verbose) throws Exception {
        decodeToUncompressedGlb(input, output, verbose, false, false, (float[])null);
    }
    public static void decodeToUncompressedGlb(File input, File output, boolean verbose,
                                               boolean rotateFlat, boolean scaleOn) throws Exception {
        decodeToUncompressedGlb(input, output, verbose, rotateFlat, scaleOn, (float[])null);
    }
    /** New API: provide optional shared origin (ECEF X,Y,Z). If null, center is from world bbox. */
    public static void decodeToUncompressedGlb(File input, File output, boolean verbose,
                                               boolean rotateFlat, boolean scaleOn, double[] origin) throws Exception {
        float[] o = null;
        if (origin != null && origin.length == 3) {
            o = new float[]{ (float)origin[0], (float)origin[1], (float)origin[2] };
        }
        decodeToUncompressedGlb(input, output, verbose, rotateFlat, scaleOn, o);
    }
    /** New API: provide optional shared origin (ECEF X,Y,Z) as float[]. */
    public static void decodeToUncompressedGlb(File input, File output, boolean verbose,
                                               boolean rotateFlat, boolean scaleOn, float[] origin) throws Exception {
        if (!input.isFile()) throw new IllegalArgumentException("Input does not exist: " + input);

        if (verbose) { Configuration.DISABLE_FUNCTION_CHECKS.set(false); Configuration.DEBUG.set(true); }

        Assimp.getLibrary();
        try {
            SharedLibrary draco = Assimp.getDraco();
            dbg(verbose, "[Native] Draco: %s  path=%s", draco.getName(), draco.getPath());
        } catch (Throwable t) { dbg(verbose, "[Native] Draco not present (continuing): %s", t); }

        int ppFlags =
                Assimp.aiProcess_ValidateDataStructure |
                Assimp.aiProcess_Triangulate |
                Assimp.aiProcess_JoinIdenticalVertices |
                Assimp.aiProcess_ImproveCacheLocality |
                Assimp.aiProcess_SortByPType;

        dbg(verbose, "[Import] %s", input.getAbsolutePath());
        AIScene scene = Assimp.aiImportFile(input.getAbsolutePath(), ppFlags);
        if (scene == null) throw new IllegalStateException("Assimp import failed: " + Assimp.aiGetErrorString());

        try {
            if (rotateFlat) rotateStrictThenBake_NodeExact_WithOrigin(scene, verbose, scaleOn, origin);

            Path outPath = output.toPath();
            Files.createDirectories(outPath.getParent());
            int rc = Assimp.aiExportScene(scene, "glb2", outPath.toString(), 0);
            if (rc != Assimp.aiReturn_SUCCESS) throw new IllegalStateException("Assimp export failed (rc=" + rc + ")");
            dbg(verbose, "[Export] Wrote %s", outPath.toAbsolutePath());
        } finally {
            Assimp.aiReleaseImport(scene);
        }
    }

    public static byte[] decodeToUncompressedGlbBytes(byte[] inputBytes,
                                                      boolean verbose,
                                                      boolean rotateFlat,
                                                      boolean scaleOn,
                                                      double[] origin) throws Exception {
        if (inputBytes == null || inputBytes.length == 0) {
            throw new IllegalArgumentException("Empty GLB input");
        }

        if (verbose) { Configuration.DISABLE_FUNCTION_CHECKS.set(false); Configuration.DEBUG.set(true); }

        Assimp.getLibrary();
        try {
            SharedLibrary draco = Assimp.getDraco();
            dbg(verbose, "[Native] Draco: %s  path=%s", draco.getName(), draco.getPath());
        } catch (Throwable t) { dbg(verbose, "[Native] Draco not present (continuing): %s", t); }

        int ppFlags =
                Assimp.aiProcess_ValidateDataStructure |
                Assimp.aiProcess_Triangulate |
                Assimp.aiProcess_JoinIdenticalVertices |
                Assimp.aiProcess_ImproveCacheLocality |
                Assimp.aiProcess_SortByPType;

        java.nio.ByteBuffer bb = MemoryUtil.memAlloc(inputBytes.length);
        bb.put(inputBytes).flip();

        AIScene scene = Assimp.aiImportFileFromMemory(bb, ppFlags, "glb");
        if (scene == null) {
            MemoryUtil.memFree(bb);
            throw new IllegalStateException("Assimp import (memory) failed: " + Assimp.aiGetErrorString());
        }

        try {
            if (rotateFlat) {
                float[] o = null;
                if (origin != null && origin.length == 3) {
                    o = new float[]{ (float)origin[0], (float)origin[1], (float)origin[2] };
                }
                rotateStrictThenBake_NodeExact_WithOrigin(scene, verbose, scaleOn, o);
            }

            AIExportDataBlob blob = Assimp.aiExportSceneToBlob(scene, "glb2", 0);
            if (blob == null) throw new IllegalStateException("Assimp exportToBlob failed");
            try {
                java.nio.ByteBuffer out = blob.data();
                byte[] outBytes = new byte[out.remaining()];
                out.get(outBytes);
                return outBytes;
            } finally {
                Assimp.aiReleaseExportBlob(blob);
            }
        } finally {
            Assimp.aiReleaseImport(scene);
            MemoryUtil.memFree(bb);
        }
    }

    private static float[] quatFromUnitVectors(float[] from,float[] to){
        float d = clamp(dot(from,to), -1f, 1f);
        if (d > 0.999999f) return new float[]{0,0,0,1};
        if (d < -0.999999f){
            float[] axis = cross(new float[]{1,0,0}, from);
            float L=(float)Math.sqrt(axis[0]*axis[0]+axis[1]*axis[1]+axis[2]*axis[2]);
            if (L<1e-5f) axis = cross(new float[]{0,1,0}, from);
            axis = normalize3(axis);
            float s=(float)Math.sin(Math.PI/2.0), c=(float)Math.cos(Math.PI/2.0);
            return new float[]{axis[0]*s,axis[1]*s,axis[2]*s,c};
        }
        float[] axis = cross(from,to);
        float s=(float)Math.sqrt((1+d)*2), inv=1f/s;
        return new float[]{axis[0]*inv,axis[1]*inv,axis[2]*inv,s*0.5f};
    }

    // ---------- main flow (Node-parity with ORIGIN support; per-root bake, no recursion) ----------
    private static void rotateStrictThenBake_NodeExact_WithOrigin(AIScene scene, boolean verbose, boolean scaleOn, float[] originOpt) {
        if (scene.mRootNode() == null) return;

        // Measure from original scene
        WorldStats stats0 = worldStatsFromOriginal(scene);
        float[] statsCenter = stats0.center;
        double diagMeasured = stats0.diag;

        // CENTER/ORIGIN: if origin provided, use it as the world "center"; else use measured center
        float[] C = (originOpt != null && originOpt.length == 3) ? new float[]{originOpt[0], originOpt[1], originOpt[2]} : statsCenter;
        double diag = diagMeasured; // used only if scaleOn
        dbg(verbose, "[BBox] center=(%.6f,%.6f,%.6f) diag=%.6f  (note: center overridden by origin=%s)",
                statsCenter[0], statsCenter[1], statsCenter[2], diagMeasured,
                (originOpt!=null?"true":"false"));

        // geodetic up from center/origin -> +Y
        float[] up = normalize3(C);
        if (!isFinite3(up) || (Math.abs(up[0])+Math.abs(up[1])+Math.abs(up[2])<1e-8f)) up = new float[]{0,1,0};
        float[] q = quatFromUnitVectors(up, new float[]{0,1,0});
        float s  = scaleOn ? (diag>0 ? (float)(1.0/diag) : 1f) : 1f;

        // logs
        double ang = Math.toDegrees(2.0 * Math.acos(clamp(q[3], -1f, 1f)));
        double sinHalf = Math.sqrt(Math.max(0.0, 1.0 - q[3]*q[3]));
        float ax=0,ay=1,az=0; if (sinHalf>1e-8){ ax=(float)(q[0]/sinHalf); ay=(float)(q[1]/sinHalf); az=(float)(q[2]/sinHalf); }
        dbgVec(verbose, "[RotateFlat] geodeticUp", up);
        dbg(verbose, "[RotateFlat] quaternion q = (x=%.6f, y=%.6f, z=%.6f, w=%.6f)  angle=%.3f°  axis=(%.4f,%.4f,%.4f)",
                q[0],q[1],q[2],q[3],ang,ax,ay,az);
        dbg(verbose, "[RotateFlat] scale s = %.9f (uniform)", s);

        // Node mapping: ROW-scaled compose only
        float[] RS4 = composeTRS_row(new float[]{0,0,0}, q, new float[]{s,s,s});
        float[] Tpre = composeTRS_Tpre(C);

        // Abort on mesh sharing: we'll only bake ROOT meshes, so check only for those later.
        Map<Integer,Integer> uses = countMeshUses(scene.mRootNode());

        // Pick roots = children of Assimp root; fallback to root itself
        AINode aiRoot = scene.mRootNode();
        List<AINode> roots = new ArrayList<>();
        if (aiRoot.mNumChildren() > 0){
            PointerBuffer pb = aiRoot.mChildren();
            for (int i=0;i<aiRoot.mNumChildren();i++) roots.add(AINode.create(pb.get(i)));
            dbg(verbose, "[Roots] Using %d children of Assimp root as roots.", roots.size());
        } else {
            roots.add(aiRoot);
            dbg(verbose, "[Roots] Assimp root has no children → treating ROOT itself \"%s\" as the sole root.", nm(aiRoot));
        }

        for (AINode r : roots){
            int subMeshes = countMeshesUnder(r);
            dbg(verbose, "[Roots] root \"%s\" subtree meshes=%d", nm(r), subMeshes);
        }

        // Strict step: M' = RS * (T(-C) * M)  (applied to roots)
        for (AINode r : roots){
            float[] M0 = toCM(r.mTransformation());
            float[] M1 = mat4Mul(Tpre, M0);
            float[] M2 = mat4Mul(RS4, M1);
            dbg(verbose, "[Strict] root \"%s\": M' = RS * (T(-C) * M)", nm(r));
            fromCM(M2, r.mTransformation());
        }

        // Per-root bake (Node exact): only meshes owned by the root; flatten root to T-only; pre-multiply direct children by current RS
        PointerBuffer sceneMeshes = scene.mMeshes();
        long changedTotal = 0;

        for (AINode r : roots){
            // Decompose ROOT's current transform to get R,S to bake
            float[] Mr  = toCM(r.mTransformation());
            TRS prs     = decomposeTRS(Mr);
            float[] RS4_current = composeTRS_row(new float[]{0,0,0}, prs.r, prs.s);
            float[] RS3_current = mat3FromMat4(RS4_current);
            float[] inv3 = mat3Inverse(RS3_current);
            if (inv3 == null) throw new IllegalStateException("Non-invertible RS at root \""+nm(r)+"\"");
            float[] normalM = mat3Transpose(inv3);

            // Node limitations: mesh reuse & skins, but only for ROOT's own meshes
            IntBuffer meshIdx = r.mMeshes();
            if (meshIdx != null) {
                for (int k=0;k<r.mNumMeshes();k++){
                    int mi = meshIdx.get(k);
                    if (uses.getOrDefault(mi,0) > 1)
                        throw new IllegalStateException("Mesh "+mi+" is used by multiple nodes; duplicate per-node before baking (Node limitation).");
                    AIMesh mx = AIMesh.create(sceneMeshes.get(mi));
                    if (mx!=null && mx.mNumBones()>0)
                        throw new IllegalStateException("Skinned mesh under root \""+nm(r)+"\" unsupported (Node limitation).");
                }
            }

            int changedHere = 0; float maxDelta = 0f;

            // Bake ROOT meshes only
            if (meshIdx != null) {
                for (int k=0;k<r.mNumMeshes();k++){
                    int mi = meshIdx.get(k);
                    AIMesh m = AIMesh.create(sceneMeshes.get(mi));
                    if (m==null) continue;

                    // Positions
                    AIVector3D.Buffer vtx = m.mVertices();
                    if (vtx!=null){
                        for (int vi=0;vi<m.mNumVertices();vi++){
                            AIVector3D p = vtx.get(vi);
                            float x=p.x(),y=p.y(),z=p.z();
                            float nx = RS3_current[0]*x + RS3_current[3]*y + RS3_current[6]*z;
                            float ny = RS3_current[1]*x + RS3_current[4]*y + RS3_current[7]*z;
                            float nz = RS3_current[2]*x + RS3_current[5]*y + RS3_current[8]*z;
                            float dx=nx-x, dy=ny-y, dz=nz-z;
                            float dL=(float)Math.sqrt(dx*dx+dy*dy+dz*dz);
                            if (dL>1e-9){ changedHere++; if (dL>maxDelta) maxDelta=dL; }
                            p.set(nx,ny,nz);
                        }
                    }

                    // Normals/tangents/bitangents (base: renorm; morph: NO renorm)
                    AIVector3D.Buffer nrm = m.mNormals();
                    if (nrm!=null){
                        for (int vi=0;vi<m.mNumVertices();vi++){
                            AIVector3D n = nrm.get(vi);
                            float x=n.x(),y=n.y(),z=n.z();
                            float nx = normalM[0]*x + normalM[3]*y + normalM[6]*z;
                            float ny = normalM[1]*x + normalM[4]*y + normalM[7]*z;
                            float nz = normalM[2]*x + normalM[5]*y + normalM[8]*z;
                            float L=(float)Math.sqrt(nx*nx+ny*ny+nz*nz);
                            if (L>0){ nx/=L; ny/=L; nz/=L; }
                            n.set(nx,ny,nz);
                        }
                    }
                    AIVector3D.Buffer tan = m.mTangents();
                    if (tan!=null){
                        for (int vi=0;vi<m.mNumVertices();vi++){
                            AIVector3D t = tan.get(vi);
                            float x=t.x(),y=t.y(),z=t.z();
                            float nx = normalM[0]*x + normalM[3]*y + normalM[6]*z;
                            float ny = normalM[1]*x + normalM[4]*y + normalM[7]*z;
                            float nz = normalM[2]*x + normalM[5]*y + normalM[8]*z;
                            float L=(float)Math.sqrt(nx*nx+ny*ny+nz*nz);
                            if (L>0){ nx/=L; ny/=L; nz/=L; }
                            t.set(nx,ny,nz);
                        }
                    }
                    AIVector3D.Buffer bit = m.mBitangents();
                    if (bit!=null){
                        for (int vi=0;vi<m.mNumVertices();vi++){
                            AIVector3D b = bit.get(vi);
                            float x=b.x(),y=b.y(),z=b.z();
                            float nx = normalM[0]*x + normalM[3]*y + normalM[6]*z;
                            float ny = normalM[1]*x + normalM[4]*y + normalM[7]*z;
                            float nz = normalM[2]*x + normalM[5]*y + normalM[8]*z;
                            float L=(float)Math.sqrt(nx*nx+ny*ny+nz*nz);
                            if (L>0){ nx/=L; ny/=L; nz/=L; }
                            b.set(nx,ny,nz);
                        }
                    }

                    // Morph targets (deltas)
                    PointerBuffer anims = m.mAnimMeshes();
                    if (anims!=null){
                        for (int j=0;j<m.mNumAnimMeshes();j++){
                            AIAnimMesh am = AIAnimMesh.create(anims.get(j));
                            AIVector3D.Buffer mv = am.mVertices();    // deltas
                            if (mv!=null){
                                for (int vi=0;vi<am.mNumVertices();vi++){
                                    AIVector3D p = mv.get(vi);
                                    float x=p.x(),y=p.y(),z=p.z();
                                    float nx = RS3_current[0]*x + RS3_current[3]*y + RS3_current[6]*z;
                                    float ny = RS3_current[1]*x + RS3_current[4]*y + RS3_current[7]*z;
                                    float nz = RS3_current[2]*x + RS3_current[5]*y + RS3_current[8]*z;
                                    p.set(nx,ny,nz);
                                }
                            }
                            AIVector3D.Buffer mn = am.mNormals();     // deltas
                            if (mn!=null){
                                for (int vi=0;vi<am.mNumVertices();vi++){
                                    AIVector3D n = mn.get(vi);
                                    float x=n.x(),y=n.y(),z=n.z();
                                    float nx = normalM[0]*x + normalM[3]*y + normalM[6]*z;
                                    float ny = normalM[1]*x + normalM[4]*y + normalM[7]*z;
                                    float nz = normalM[2]*x + normalM[5]*y + normalM[8]*z;
                                    n.set(nx,ny,nz);
                                }
                            }
                            AIVector3D.Buffer mt = am.mTangents();    // deltas
                            if (mt!=null){
                                for (int vi=0;vi<am.mNumVertices();vi++){
                                    AIVector3D t = mt.get(vi);
                                    float x=t.x(),y=t.y(),z=t.z();
                                    float nx = normalM[0]*x + normalM[3]*y + normalM[6]*z;
                                    float ny = normalM[1]*x + normalM[4]*y + normalM[7]*z;
                                    float nz = normalM[2]*x + normalM[5]*y + normalM[8]*z;
                                    t.set(nx,ny,nz);
                                }
                            }
                            AIVector3D.Buffer mb = am.mBitangents();  // deltas
                            if (mb!=null){
                                for (int vi=0;vi<am.mNumVertices();vi++){
                                    AIVector3D b = mb.get(vi);
                                    float x=b.x(),y=b.y(),z=b.z();
                                    float nx = normalM[0]*x + normalM[3]*y + normalM[6]*z;
                                    float ny = normalM[1]*x + normalM[4]*y + normalM[7]*z;
                                    float nz = normalM[2]*x + normalM[5]*y + normalM[8]*z;
                                    b.set(nx,ny,nz);
                                }
                            }
                        }
                    }
                }
            }

            changedTotal += changedHere;

            // Flatten ROOT to translation-only (Node): keep prs.t
            setTranslationOnly(r.mTransformation(), prs.t);
            dbg(verbose, "[RootsFinal] \"%s\" translation=(%.6f, %.6f, %.6f)", nm(r), prs.t[0], prs.t[1], prs.t[2]);

            // Pre-multiply DIRECT children by ROOT's current RS (no recursion)
            PointerBuffer kids = r.mChildren();
            for (int c=0;c<r.mNumChildren();c++){
                AINode child = AINode.create(kids.get(c));
                float[] C0 = toCM(child.mTransformation());
                float[] C1 = mat4Mul(RS4_current, C0);
                fromCM(C1, child.mTransformation());
                dbg(verbose, "[PushRS] \"%s\" → child \"%s\"", nm(r), nm(child));
            }

            dbg(verbose, "[BakeRoot] \"%s\"  Δpos count=%d  maxΔ=%.9g", nm(r), changedHere, maxDelta);
        }

        // Post check bbox (visual confidence only)
        WorldStats stats1 = worldStatsFromOriginal(scene);
        dbg(verbose, "[PostBBox] center=(%.6f,%.6f,%.6f) diag=%.6f  changedVertices=%d",
                stats1.center[0], stats1.center[1], stats1.center[2], stats1.diag, changedTotal);

        dbg(verbose, "[RotateFlat] DONE: origin=%s; strict applied; ROOT RS baked; roots flattened; children premultiplied.",
                (originOpt!=null?"provided":"auto-center"));
    }

    // ---------- math & utils ----------
    private static boolean isFinite3(float[] v){ return Float.isFinite(v[0])&&Float.isFinite(v[1])&&Float.isFinite(v[2]); }
    private static float clamp(float x, float lo, float hi){ return Math.max(lo, Math.min(hi,x)); }
    private static float dot(float[] a, float[] b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
    private static float[] normalize3(float[] v){ double L=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]); if(!(L>0)) return new float[]{0,0,0}; return new float[]{(float)(v[0]/L),(float)(v[1]/L),(float)(v[2]/L)}; }
    private static float[] cross(float[] a,float[] b){ return new float[]{a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]}; }
    private static float[] rotateVecByQuat(float[] v,float[] q){
        float vx=v[0],vy=v[1],vz=v[2], qx=q[0],qy=q[1],qz=q[2],qw=q[3];
        float ix=qw*vx+qy*vz-qz*vy, iy=qw*vy+qz*vx-qx*vz, iz=qw*vz+qx*vy-qy*vx, iw=-qx*vx-qy*vy-qz*vz;
        return new float[]{ ix*qw + iw*-qx + iy*-qz - iz*-qy,  iy*qw + iw*-qy + iz*-qx - ix*-qz,  iz*qw + iw*-qz + ix*-qy - iy*-qx };
    }

    // Node-like compose (row-scaled 3×3; column-major 4×4)
    private static float[] quatToMat3(float[] q){
        float x=q[0],y=q[1],z=q[2],w=q[3],x2=x+x,y2=y+y,z2=z+z,xx=x*x2,yy=y*y2,zz=z*z2,xy=x*y2,xz=x*z2,yz=y*z2,wx=w*x2,wy=w*y2,wz=w*z2;
        return new float[]{ 1-(yy+zz), xy-wz, xz+wy,  xy+wz, 1-(xx+zz), yz-wx,  xz-wy, yz+wx, 1-(xx+yy) };
    }
    private static float[] composeTRS_row(float[] t,float[] q,float[] s){
        float[] R = quatToMat3(q);
        float m00=R[0]*s[0], m01=R[1]*s[0], m02=R[2]*s[0];
        float m10=R[3]*s[1], m11=R[4]*s[1], m12=R[5]*s[1];
        float m20=R[6]*s[2], m21=R[7]*s[2], m22=R[8]*s[2];
        return new float[]{ m00,m10,m20,0,  m01,m11,m21,0,  m02,m12,m22,0,  t[0],t[1],t[2],1 };
    }
    private static float[] composeTRS_Tpre(float[] C){
        return new float[]{ 1,0,0,0, 0,1,0,0, 0,0,1,0,  -C[0],-C[1],-C[2],1 };
    }
    private static float[] mat3FromMat4(float[] M){ return new float[]{ M[0],M[1],M[2],  M[4],M[5],M[6],  M[8],M[9],M[10] }; }
    private static float[] mat3Inverse(float[] m){
        float a00=m[0], a01=m[3], a02=m[6], a10=m[1], a11=m[4], a12=m[7], a20=m[2], a21=m[5], a22=m[8];
        float b01=a22*a11-a12*a21, b11=-a22*a10+a12*a20, b21=a21*a10-a11*a20;
        float det=a00*b01+a01*b11+a02*b21; if (!Float.isFinite(det)||Math.abs(det)<1e-20f) return null; float inv=1f/det;
        return new float[]{ b01*inv, (-a22*a01+a02*a21)*inv, (a12*a01-a02*a11)*inv, b11*inv, (a22*a00-a02*a20)*inv, (-a12*a00+a02*a10)*inv, b21*inv, (-a21*a00+a01*a20)*inv, (a11*a00-a01*a10)*inv };
    }
    private static float[] mat3Transpose(float[] m){ return new float[]{ m[0],m[3],m[6], m[1],m[4],m[7], m[2],m[5],m[8] }; }
    private static float[] applyMat3(float[] m,float[] v){
        float x=v[0],y=v[1],z=v[2]; return new float[]{ m[0]*x+m[3]*y+m[6]*z,  m[1]*x+m[4]*y+m[7]*z,  m[2]*x+m[5]*y+m[8]*z };
    }
    private static float[] mat4Mul(float[] a,float[] b){
        float[] o=new float[16];
        for(int r=0;r<4;r++) for(int c=0;c<4;c++) o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];
        return o;
    }
    private static float[] toCM(AIMatrix4x4 src){
        return new float[]{ src.a1(),src.b1(),src.c1(),src.d1(),  src.a2(),src.b2(),src.c2(),src.d2(),  src.a3(),src.b3(),src.c3(),src.d3(),  src.a4(),src.b4(),src.c4(),src.d4() };
    }
    private static void fromCM(float[] m,AIMatrix4x4 dst){
        dst.a1(m[0]); dst.b1(m[1]); dst.c1(m[2]); dst.d1(m[3]);
        dst.a2(m[4]); dst.b2(m[5]); dst.c2(m[6]); dst.d2(m[7]);
        dst.a3(m[8]); dst.b3(m[9]); dst.c3(m[10]); dst.d3(m[11]);
        dst.a4(m[12]); dst.b4(m[13]); dst.c4(m[14]); dst.d4(m[15]);
    }
    private static void setTranslationOnly(AIMatrix4x4 dst,float[] t){
        dst.a1(1); dst.b1(0); dst.c1(0); dst.d1(0);
        dst.a2(0); dst.b2(1); dst.c2(0); dst.d2(0);
        dst.a3(0); dst.b3(0); dst.c3(1); dst.d3(0);
        dst.a4(t[0]); dst.b4(t[1]); dst.c4(t[2]); dst.d4(1);
    }
    private static final class TRS { final float[] t,r,s; TRS(float[] t,float[] r,float[] s){this.t=t;this.r=r;this.s=s;} }
    private static TRS decomposeTRS(float[] M){
        float[] t=new float[]{M[12],M[13],M[14]};
        float sx=(float)Math.hypot(M[0],Math.hypot(M[1],M[2])); if (sx==0) sx=1;
        float sy=(float)Math.hypot(M[4],Math.hypot(M[5],M[6])); if (sy==0) sy=1;
        float sz=(float)Math.hypot(M[8],Math.hypot(M[9],M[10])); if (sz==0) sz=1;
        float r00=M[0]/sx, r01=M[4]/sy, r02=M[8]/sz, r10=M[1]/sx, r11=M[5]/sy, r12=M[9]/sz, r20=M[2]/sx, r21=M[6]/sy, r22=M[10]/sz;
        float trace=r00+r11+r22; float[] q;
        if (trace>0f){ float s=(float)Math.sqrt(trace+1f)*2f; q=new float[]{ (r21-r12)/s,(r02-r20)/s,(r10-r01)/s,0.25f*s }; }
        else if (r00>r11 && r00>r22){ float s=(float)Math.sqrt(1f+r00-r11-r22)*2f; q=new float[]{ 0.25f*s,(r01+r10)/s,(r02+r20)/s,(r21-r12)/s }; }
        else if (r11>r22){ float s=(float)Math.sqrt(1f+r11-r00-r22)*2f; q=new float[]{ (r01+r10)/s,0.25f*s,(r12+r21)/s,(r02-r20)/s }; }
        else { float s=(float)Math.sqrt(1f+r22-r00-r11)*2f; q=new float[]{ (r02+r20)/s,(r12+r21)/s,0.25f*s,(r10-r01)/s }; }
        return new TRS(t,q,new float[]{sx,sy,sz});
    }

    // ---------- world stats / mesh counting ----------
    private record WorldStats(float[] center,double diag,float[] half){}
    private static WorldStats worldStatsFromOriginal(AIScene scene){
        MinMax mm = new MinMax();
        buildAndAccumulate(scene.mRootNode(), new float[]{1,0,0,0, 0,1,0,0, 0,0,1,0,  0,0,0,1}, scene.mMeshes(), mm);
        if (!mm.valid){ mm.minX=mm.minY=mm.minZ=-0.5; mm.maxX=mm.maxY=mm.maxZ=0.5; }
        float cx=(float)((mm.minX+mm.maxX)/2.0), cy=(float)((mm.minY+mm.maxY)/2.0), cz=(float)((mm.minZ+mm.maxZ)/2.0);
        double dx=mm.maxX-mm.minX, dy=mm.maxY-mm.minY, dz=mm.maxZ-mm.minZ, diag=Math.sqrt(dx*dx+dy*dy+dz*dz);
        float hx=(float)(dx*0.5), hy=(float)(dy*0.5), hz=(float)(dz*0.5);
        return new WorldStats(new float[]{cx,cy,cz}, diag, new float[]{hx,hy,hz});
    }
    private static final class MinMax{
        boolean valid=false;
        double minX=Double.POSITIVE_INFINITY,minY=Double.POSITIVE_INFINITY,minZ=Double.POSITIVE_INFINITY,
               maxX=Double.NEGATIVE_INFINITY,maxY=Double.NEGATIVE_INFINITY,maxZ=Double.NEGATIVE_INFINITY;
        void grow(double mnx,double mny,double mnz,double mxx,double mxy,double mxz){
            if (mnx<minX)minX=mnx; if (mny<minY)minY=mny; if (mnz<minZ)minZ=mnz;
            if (mxx>maxX)maxX=mxx; if (mxy>maxY)maxY=mxy; if (mxz>maxZ)maxZ=mxz;
            valid=true;
        }
    }
    private static void buildAndAccumulate(AINode node,float[] parentCM,PointerBuffer meshesBuf,MinMax mm){
        float[] local = toCM(node.mTransformation());
        float[] world = mat4Mul(parentCM, local);
        IntBuffer idx = node.mMeshes();
        if (idx!=null){
            for (int k=0;k<node.mNumMeshes();k++){
                int mi=idx.get(k); AIMesh mesh=AIMesh.create(meshesBuf.get(mi)); if (mesh==null) continue;
                AIVector3D.Buffer v = mesh.mVertices(); if (v==null||mesh.mNumVertices()==0) continue;
                float lminX=Float.POSITIVE_INFINITY,lminY=Float.POSITIVE_INFINITY,lminZ=Float.POSITIVE_INFINITY;
                float lmaxX=Float.NEGATIVE_INFINITY,lmaxY=Float.NEGATIVE_INFINITY,lmaxZ=Float.NEGATIVE_INFINITY;
                for (int i=0;i<mesh.mNumVertices();i++){
                    AIVector3D p=v.get(i); float x=p.x(),y=p.y(),z=p.z();
                    if (x<lminX)lminX=x; if (y<lminY)lminY=y; if (z<lminZ)lminZ=z;
                    if (x>lmaxX)lmaxX=x; if (y>lmaxY)lmaxY=y; if (z>lmaxZ)lmaxZ=z;
                }
                float[] cLocal=new float[]{(lminX+lmaxX)/2f,(lminY+lmaxY)/2f,(lminZ+lmaxZ)/2f};
                float[] hLocal=new float[]{(lmaxX-lminX)/2f,(lmaxY-lminY)/2f,(lmaxZ-lminZ)/2f};
                AABB tr = transformAabb(cLocal, hLocal, world);
                double mnx=tr.center[0]-tr.half[0], mny=tr.center[1]-tr.half[1], mnz=tr.center[2]-tr.half[2];
                double mxx=tr.center[0]+tr.half[0], mxy=tr.center[1]+tr.half[1], mxz=tr.center[2]+tr.half[2];
                mm.grow(mnx,mny,mnz,mxx,mxy,mxz);
            }
        }
        PointerBuffer kids = node.mChildren();
        for (int i=0;i<node.mNumChildren();i++) buildAndAccumulate(AINode.create(kids.get(i)), world, meshesBuf, mm);
    }
    private record AABB(float[] center,float[] half){}
    private static AABB transformAabb(float[] center,float[] half,float[] M){
        float m00=M[0], m01=M[4], m02=M[8],  m10=M[1], m11=M[5], m12=M[9],  m20=M[2], m21=M[6], m22=M[10],  tx=M[12],ty=M[13],tz=M[14];
        float cx=m00*center[0]+m01*center[1]+m02*center[2]+tx, cy=m10*center[0]+m11*center[1]+m12*center[2]+ty, cz=m20*center[0]+m21*center[1]+m22*center[2]+tz;
        float ax00=Math.abs(m00), ax01=Math.abs(m01), ax02=Math.abs(m02), ax10=Math.abs(m10), ax11=Math.abs(m11), ax12=Math.abs(m12), ax20=Math.abs(m20), ax21=Math.abs(m21), ax22=Math.abs(m22);
        float hx=ax00*half[0]+ax01*half[1]+ax02*half[2], hy=ax10*half[0]+ax11*half[1]+ax12*half[2], hz=ax20*half[0]+ax21*half[1]+ax22*half[2];
        return new AABB(new float[]{cx,cy,cz}, new float[]{hx,hy,hz});
    }
    private static Map<Integer,Integer> countMeshUses(AINode root){
        Map<Integer,Integer> uses = new HashMap<>();
        Deque<AINode> dq = new ArrayDeque<>(); dq.add(root);
        while(!dq.isEmpty()){
            AINode n = dq.removeFirst();
            IntBuffer idx = n.mMeshes();
            if (idx!=null) for (int k=0;k<n.mNumMeshes();k++){ int mi=idx.get(k); uses.put(mi, uses.getOrDefault(mi,0)+1); }
            PointerBuffer kids = n.mChildren(); for (int i=0;i<n.mNumChildren();i++) dq.add(AINode.create(kids.get(i)));
        }
        return uses;
    }
    private static int countMeshesUnder(AINode root){
        int cnt=0; Deque<AINode> dq=new ArrayDeque<>(); dq.add(root);
        while(!dq.isEmpty()){
            AINode n=dq.removeFirst();
            if (n.mMeshes()!=null) cnt += n.mNumMeshes();
            PointerBuffer kids=n.mChildren(); for (int i=0;i<n.mNumChildren();i++) dq.add(AINode.create(kids.get(i)));
        }
        return cnt;
    }
}
