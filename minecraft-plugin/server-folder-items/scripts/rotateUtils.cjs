#!/usr/bin/env node
/* rotateUtils.js — mirror tiles-fast.mjs recenter + rotate flow,
 * then BAKE the final per-root rotation+scale into vertices so nodes end up
 * with identity rotation/scale (translation only).
 *
 * Programmatic API:
 *   const { rotateGlbBuffer } = require('./rotateUtils.js');
 *   const { buffer, positions, originUsed, scale } =
 *     await rotateGlbBuffer(inBuf, { origin: [x,y,z] | null, scaleOn: false });
 *
 * CLI (unchanged behavior):
 *   node rotateUtils.js <input.glb> <output.glb> <positions.json> [originJsonArray] [--scale] [--origin '[x,y,z]']
 *
 * Limitations:
 * - FLOAT attributes only (no sparse). Draco is auto-decoded; EXT_meshopt is not handled here.
 * - Skinned meshes (nodes with "skin") are not supported.
 * - If a mesh is referenced by multiple nodes, we abort (duplicate meshes per node before baking).
 */

const fs = require('fs');

// ---------------- math helpers ----------------
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function len(a){return Math.hypot(a[0],a[1],a[2]);}
function norm(a){const L=len(a)||1; return [a[0]/L,a[1]/L,a[2]/L];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];}
function clamp(x,lo,hi){return Math.max(lo,Math.min(hi,x));}

function quatFromUnitVectors(from,to){
  const d = clamp(dot(from,to), -1, 1);
  if (d > 0.999999) return [0,0,0,1];
  if (d < -0.999999){
    let axis = cross([1,0,0], from);
    if (len(axis) < 1e-5) axis = cross([0,1,0], from);
    axis = norm(axis);
    const s = Math.sin(Math.PI/2), c = Math.cos(Math.PI/2);
    return [axis[0]*s, axis[1]*s, axis[2]*s, c];
  }
  const axis = cross(from,to);
  const s = Math.sqrt((1+d)*2);
  const invs = 1/s;
  return [axis[0]*invs, axis[1]*invs, axis[2]*invs, s*0.5];
}

function rotateVecByQuat(v,q){
  const [vx,vy,vz]=v, [qx,qy,qz,qw]=q;
  const ix =  qw*vx + qy*vz - qz*vy;
  const iy =  qw*vy + qz*vx - qx*vz;
  const iz =  qw*vz + qx*vy - qy*vx;
  const iw = -qx*vx - qy*vy - qz*vz;
  return [
    ix*qw + iw*-qx + iy*-qz - iz*-qy,
    iy*qw + iw*-qy + iz*-qx - ix*-qz,
    iz*qw + iw*-qz + ix*-qy - iy*-qx
  ];
}

function quatToMat3(q){
  const [x,y,z,w]=q;
  const x2=x+x,y2=y+y,z2=z+z;
  const xx=x*x2, yy=y*y2, zz=z*z2;
  const xy=x*y2, xz=x*z2, yz=y*z2;
  const wx=w*x2, wy=w*y2, wz=w*z2;
  return [
    1-(yy+zz), xy-wz,     xz+wy,
    xy+wz,     1-(xx+zz), yz-wx,
    xz-wy,     yz+wx,     1-(xx+yy),
  ];
}
function composeTRS(t=[0,0,0], q=[0,0,0,1], s=[1,1,1]){
  const R = quatToMat3(q);
  const m00=R[0]*s[0], m01=R[1]*s[0], m02=R[2]*s[0];
  const m10=R[3]*s[1], m11=R[4]*s[1], m12=R[5]*s[1];
  const m20=R[6]*s[2], m21=R[7]*s[2], m22=R[8]*s[2];
  return [
    m00, m10, m20, 0,
    m01, m11, m21, 0,
    m02, m12, m22, 0,
    t[0], t[1], t[2], 1
  ];
}
function mat4Mul(a,b){
  const out=new Array(16).fill(0);
  for (let r=0;r<4;r++){
    for (let c=0;c<4;c++){
      out[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];
    }
  }
  return out;
}
function decomposeTRS(M){
  const t=[M[12],M[13],M[14]];
  const sx = Math.hypot(M[0],M[1],M[2]) || 1;
  const sy = Math.hypot(M[4],M[5],M[6]) || 1;
  const sz = Math.hypot(M[8],M[9],M[10])|| 1;
  const r00=M[0]/sx, r01=M[4]/sy, r02=M[8]/sz;
  const r10=M[1]/sx, r11=M[5]/sy, r12=M[9]/sz;
  const r20=M[2]/sx, r21=M[6]/sy, r22=M[10]/sz;
  const trace = r00+r11+r22;
  let q=[0,0,0,1];
  if (trace>0){
    const s=Math.sqrt(trace+1)*2;
    q=[(r21-r12)/s,(r02-r20)/s,(r10-r01)/s,0.25*s];
  } else if (r00>r11 && r00>r22){
    const s=Math.sqrt(1+r00-r11-r22)*2;
    q=[0.25*s,(r01+r10)/s,(r02+r20)/s,(r21-r12)/s];
  } else if (r11>r22){
    const s=Math.sqrt(1+r11-r00-r22)*2;
    q=[(r01+r10)/s,0.25*s,(r12+r21)/s,(r02-r20)/s];
  } else {
    const s=Math.sqrt(1+r22-r00-r11)*2;
    q=[(r02+r20)/s,(r12+r21)/s,0.25*s,(r10-r01)/s];
  }
  return { t, r:q, s:[sx,sy,sz] };
}

function transformAabb(center, half, M){
  const m00=M[0], m01=M[4], m02=M[8];
  const m10=M[1], m11=M[5], m12=M[9];
  const m20=M[2], m21=M[6], m22=M[10];
  const tx = M[12], ty = M[13], tz = M[14];

  const cx = m00*center[0] + m01*center[1] + m02*center[2] + tx;
  const cy = m10*center[0] + m11*center[1] + m12*center[2] + ty;
  const cz = m20*center[0] + m21*center[1] + m22*center[2] + tz;

  const ax00=Math.abs(m00), ax01=Math.abs(m01), ax02=Math.abs(m02);
  const ax10=Math.abs(m10), ax11=Math.abs(m11), ax12=Math.abs(m12);
  const ax20=Math.abs(m20), ax21=Math.abs(m21), ax22=Math.abs(m22);

  const hx = ax00*half[0] + ax01*half[1] + ax02*half[2];
  const hy = ax10*half[0] + ax11*half[1] + ax12*half[2];
  const hz = ax20*half[0] + ax21*half[1] + ax22*half[2];

  return { center:[cx,cy,cz], half:[hx,hy,hz] };
}

function align4(x){return (x+3)&~3;}

// --- geocentric Up ---
function geodeticUpFromECEF(p){ return norm(p); }

// -------------- small mat3 helpers for baking --------------
function mat3FromMat4(M){ return [M[0],M[1],M[2],  M[4],M[5],M[6],  M[8],M[9],M[10]]; }
function mat3MulVec3(m,v){
  const x=v[0],y=v[1],z=v[2];
  return [
    m[0]*x + m[3]*y + m[6]*z,
    m[1]*x + m[4]*y + m[7]*z,
    m[2]*x + m[5]*y + m[8]*z,
  ];
}
function mat3Inverse(m){
  const a00=m[0], a01=m[3], a02=m[6];
  const a10=m[1], a11=m[4], a12=m[7];
  const a20=m[2], a21=m[5], a22=m[8];
  const b01 =  a22*a11 - a12*a21;
  const b11 = -a22*a10 + a12*a20;
  const b21 =  a21*a10 - a11*a20;
  let det = a00*b01 + a01*b11 + a02*b21;
  if (!isFinite(det) || Math.abs(det) < 1e-20) return null;
  det = 1/det;
  return [
    b01*det,
    (-a22*a01 + a02*a21)*det,
    ( a12*a01 - a02*a11)*det,
    b11*det,
    ( a22*a00 - a02*a20)*det,
    (-a12*a00 + a02*a10)*det,
    b21*det,
    (-a21*a00 + a01*a20)*det,
    ( a11*a00 - a01*a10)*det,
  ];
}
function mat3Transpose(m){ return [m[0],m[3],m[6], m[1],m[4],m[7], m[2],m[5],m[8]]; }

// ---------------- GLB read/write ----------------
function parseGlb(buf){
  if (buf.readUInt32LE(0)!==0x46546c67) throw new Error('Invalid GLB magic');
  if (buf.readUInt32LE(4)!==2) throw new Error('Unsupported GLB version');
  let off=12, json=null, bin=null;
  while (off+8<=buf.length){
    const l=buf.readUInt32LE(off); off+=4;
    const t=buf.readUInt32LE(off); off+=4;
    const data = buf.slice(off, off+l); off+=l;
    if (t===0x4e4f534a) json = JSON.parse(data.toString('utf8'));
    else if (t===0x004e4942) bin = data;
  }
  if (!json||!bin) throw new Error('Missing JSON or BIN');
  return { json, bin };
}

function buildGlb(json, bin){
  if (!Array.isArray(json.buffers)) json.buffers = [];
  if (json.buffers.length === 0) json.buffers.push({byteLength: bin.length});
  json.buffers[0].byteLength = bin.length;

  const jb = Buffer.from(JSON.stringify(json), 'utf8');
  const jp = align4(jb.length);
  const bp = align4(bin.length);
  const total = 12 + (8+jp) + (8+bp);
  const out = Buffer.alloc(total);
  let o=0;
  out.writeUInt32LE(0x46546c67,o); o+=4;
  out.writeUInt32LE(2,o); o+=4;
  out.writeUInt32LE(total,o); o+=4;

  out.writeUInt32LE(jp,o); o+=4; out.writeUInt32LE(0x4e4f534a,o); o+=4;
  jb.copy(out,o); o+=jb.length; out.fill(0x20,o,o+(jp-jb.length)); o+=(jp-jb.length);

  out.writeUInt32LE(bp,o); o+=4; out.writeUInt32LE(0x004e4942,o); o+=4;
  bin.copy(out,o); o+=bin.length; out.fill(0,o,o+(bp-bin.length));
  return out;
}

// ---------------- accessor helpers ----------------
const T_FLOAT = 5126;
const T_UINT16 = 5123;
const T_UINT32 = 5125;

function numComponents(type){
  switch(type){
    case 'SCALAR': return 1;
    case 'VEC2': return 2;
    case 'VEC3': return 3;
    case 'VEC4': return 4;
    case 'MAT3': return 9;
    case 'MAT4': return 16;
  }
  return 0;
}
function typeFromComps(n){ return n===1?'SCALAR': n===2?'VEC2': n===3?'VEC3': 'VEC4'; }

function readAccessorMinMax(json, bin, accIndex){
  const acc = json.accessors[accIndex];
  if (!acc) return null;
  if (Array.isArray(acc.min) && Array.isArray(acc.max)) {
    return { min: acc.min.slice(0,3), max: acc.max.slice(0,3) };
  }
  if (acc.componentType !== T_FLOAT) return null;
  const bvIndex = acc.bufferView;
  if (typeof bvIndex !== 'number') return null;
  const bv = json.bufferViews[bvIndex];
  if (!bv) return null;
  const comps = numComponents(acc.type);
  if (comps < 3) return null;

  const base = (bv.byteOffset||0) + (acc.byteOffset||0) + (bin.byteOffset||0);
  const stride = bv.byteStride || comps*4;
  const dv = new DataView(bin.buffer, base, acc.count*stride);

  let minx= Infinity, miny= Infinity, minz= Infinity;
  let maxx=-Infinity, maxy=-Infinity, maxz=-Infinity;
  for (let i=0;i<acc.count;i++){
    const off = i*stride;
    const x = dv.getFloat32(off+0, true);
    const y = dv.getFloat32(off+4, true);
    const z = dv.getFloat32(off+8, true);
    if (x<minx)minx=x; if (y<miny)miny=y; if (z<minz)minz=z;
    if (x>maxx)maxx=x; if (y>maxy)maxy=y; if (z>maxz)maxz=z;
  }
  return { min:[minx,miny,minz], max:[maxx,maxy,maxz] };
}

function assertFloatVecAccessor(json, accIndex, wantComps){
  const acc = json.accessors[accIndex];
  if (!acc) throw new Error(`Bad accessor ${accIndex}`);
  if (acc.componentType !== T_FLOAT) throw new Error(`Accessor ${accIndex}: only FLOAT supported (no quantization/compression)`);
  const comps = numComponents(acc.type);
  if (comps < wantComps) throw new Error(`Accessor ${accIndex}: expected at least ${wantComps} components, got ${acc.type}`);
  if (acc.sparse) throw new Error(`Accessor ${accIndex}: sparse accessors not supported for baking`);
  if (typeof acc.bufferView !== 'number') throw new Error(`Accessor ${accIndex}: missing bufferView (likely compressed). Install draco3d and let this script decode, or re-export uncompressed.`);
  const bv = json.bufferViews[acc.bufferView];
  if (!bv) throw new Error(`Accessor ${accIndex}: bufferView ${acc.bufferView} not found.`);
  return { acc, bv };
}

function mapAccessorVec3(json, bin, accIndex, fn){
  const { acc, bv } = assertFloatVecAccessor(json, accIndex, 3);
  const base = (bv.byteOffset||0)+(acc.byteOffset||0)+(bin.byteOffset||0);
  const stride = bv.byteStride || 12;
  const dv = new DataView(bin.buffer, base, acc.count*stride);
  let minx= Infinity, miny= Infinity, minz= Infinity;
  let maxx=-Infinity, maxy=-Infinity, maxz=-Infinity;
  for (let i=0;i<acc.count;i++){
    const off = i*stride;
    const x = dv.getFloat32(off+0, true);
    const y = dv.getFloat32(off+4, true);
    const z = dv.getFloat32(off+8, true);
    const [nx,ny,nz] = fn(x,y,z);
    dv.setFloat32(off+0, nx, true);
    dv.setFloat32(off+4, ny, true);
    dv.setFloat32(off+8, nz, true);
    if (nx<minx)minx=nx; if (ny<miny)miny=ny; if (nz<minz)minz=nz;
    if (nx>maxx)maxx=nx; if (ny>maxy)maxy=ny; if (nz>maxz)maxz=nz;
  }
  acc.min = [minx,miny,minz];
  acc.max = [maxx,maxy,maxz];
}
function mapAccessorNormal(json, bin, accIndex, fn){
  const { acc, bv } = assertFloatVecAccessor(json, accIndex, 3);
  const base = (bv.byteOffset||0)+(acc.byteOffset||0)+(bin.byteOffset||0);
  const stride = bv.byteStride || 12;
  const dv = new DataView(bin.buffer, base, acc.count*stride);
  for (let i=0;i<acc.count;i++){
    const off = i*stride;
    const x = dv.getFloat32(off+0, true);
    const y = dv.getFloat32(off+4, true);
    const z = dv.getFloat32(off+8, true);
    let [nx,ny,nz] = fn(x,y,z);
    const L = Math.hypot(nx,ny,nz) || 1;
    dv.setFloat32(off+0, nx/L, true);
    dv.setFloat32(off+4, ny/L, true);
    dv.setFloat32(off+8, nz/L, true);
  }
}
function mapAccessorTangent(json, bin, accIndex, fn){
  const { acc, bv } = assertFloatVecAccessor(json, accIndex, 4);
  const base = (bv.byteOffset||0)+(acc.byteOffset||0)+(bin.byteOffset||0);
  const stride = bv.byteStride || 16;
  const dv = new DataView(bin.buffer, base, acc.count*stride);
  for (let i=0;i<acc.count;i++){
    const off = i*stride;
    const x = dv.getFloat32(off+0, true);
    const y = dv.getFloat32(off+4, true);
    const z = dv.getFloat32(off+8, true);
    const w = dv.getFloat32(off+12,true);
    let [nx,ny,nz] = fn(x,y,z);
    const L = Math.hypot(nx,ny,nz) || 1;
    dv.setFloat32(off+0, nx/L, true);
    dv.setFloat32(off+4, ny/L, true);
    dv.setFloat32(off+8, nz/L, true);
    dv.setFloat32(off+12, w, true);
  }
}

// ---------------- world matrices + geometry bbox ----------------
function _buildWorldMatrices(nodes){
  const world = new Array(nodes.length).fill(null);
  function localM(n){
    if (n.matrix && n.matrix.length===16) return n.matrix.slice();
    const t = n.translation || [0,0,0];
    const r = n.rotation || [0,0,0,1];
    const s = n.scale || [1,1,1];
    return composeTRS(t,r,s);
  }
  function worldOf(i){
    if (world[i]) return world[i];
    let parent = -1;
    for (let p=0;p<nodes.length;p++){
      if ((nodes[p].children||[]).includes(i)){ parent = p; break; }
    }
    const local = localM(nodes[i]);
    world[i] = parent < 0 ? local : mat4Mul(worldOf(parent), local);
    return world[i];
  }
  for (let i=0;i<nodes.length;i++) worldOf(i);
  return world;
}

function worldBBoxFromGeometry(glTF, bin){
  const j = glTF;
  const nodes = j.nodes || [];
  const meshes = j.meshes || [];
  const accessors = j.accessors || [];

  const world = _buildWorldMatrices(nodes);

  let minX= Infinity, minY= Infinity, minZ= Infinity;
  let maxX=-Infinity, maxY=-Infinity, maxZ=-Infinity;

  function grow({center,half}){
    const [cx,cy,cz]=center,[hx,hy,hz]=half;
    minX=Math.min(minX,cx-hx); minY=Math.min(minY,cy-hy); minZ=Math.min(minZ,cz-hz);
    maxX=Math.max(maxX,cx+hx); maxY=Math.max(maxY,cy+hy); maxZ=Math.max(maxZ,cz+hz);
  }

  for (let ni=0; ni<nodes.length; ni++){
    const n = nodes[ni];
    if (typeof n.mesh !== 'number') continue;
    const mesh = meshes[n.mesh]; if (!mesh) continue;
    const M = world[ni];

    for (const prim of (mesh.primitives||[])){
      const posIndex = prim.attributes && prim.attributes.POSITION;
      if (typeof posIndex !== 'number') continue;
      let mm = null;
      const acc = accessors[posIndex];
      if (acc) {
        if (Array.isArray(acc.min) && Array.isArray(acc.max)) {
          mm = { min: acc.min, max: acc.max };
        } else {
          mm = readAccessorMinMax(j, bin, posIndex);
        }
      }
      if (!mm) continue;

      const min = mm.min, max = mm.max;
      const centerLocal = [(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2];
      const halfLocal   = [(max[0]-min[0])/2,(max[1]-min[1])/2,(max[2]-min[2])/2];
      grow(transformAabb(centerLocal, halfLocal, M));
    }
  }

  if (!isFinite(minX)){ minX=minY=minZ=-0.5; maxX=maxY=maxZ=0.5; }
  const center = [(minX+maxX)/2,(minY+maxY)/2,(minZ+maxZ)/2];
  const dx=maxX-minX, dy=maxY-minY, dz=maxZ-minZ;
  let diag = Math.hypot(dx,dy,dz)||1;
  return { center, diag, min:[minX,minY,minZ], max:[maxX,maxY,maxZ] };
}

// ---------------- compute global pieces (C, R, S, Tpre, RS) ----------------
function planGlobalStrict(glbJson, bin, { origin=null, scaleOn=false }={}){
  const json = JSON.parse(JSON.stringify(glbJson));
  if (!Array.isArray(json.nodes)) json.nodes = [];
  if (!Array.isArray(json.scenes) || typeof json.scene !== 'number'){
    json.scenes = json.scenes || [];
    json.scenes.push({ nodes: [] });
    json.scene = json.scenes.length - 1;
  }
  const scene = json.scenes[json.scene];
  const roots = (scene.nodes || []).slice();

  let center, diag;
  if (Array.isArray(origin) && origin.length===3){
    center = origin.slice();
    diag = scaleOn ? worldBBoxFromGeometry(json, bin).diag : 1;
  } else {
    ({ center, diag } = worldBBoxFromGeometry(json, bin));
    if (!scaleOn) diag = 1;
  }

  // geodetic Up (ellipsoid normal at center) -> +Y
  let ecefUp = geodeticUpFromECEF(center);
  if (!isFinite(ecefUp[0]) || !isFinite(ecefUp[1]) || !isFinite(ecefUp[2])) ecefUp = [0,1,0];
  const q = quatFromUnitVectors(ecefUp, [0,1,0]);

  const s = scaleOn ? (1/diag) : 1;

  const Tpre = composeTRS([-center[0], -center[1], -center[2]], [0,0,0,1], [1,1,1]);
  const RS   = composeTRS([0,0,0], q, [s,s,s]);

  return { json, roots, center, q, s, Tpre, RS };
}

// ---------------- apply original flow ----------------
function applyStrictIntoRoots(json, roots, Tpre, RS){
  for (const idx of roots){
    const n = json.nodes[idx] || {};
    const t0 = Array.isArray(n.translation) ? n.translation.slice() : [0,0,0];
    const r0 = Array.isArray(n.rotation) ? n.rotation.slice() : [0,0,0,1];
    const s0 = Array.isArray(n.scale) ? n.scale.slice() : [1,1,1];
    const M0 = (n.matrix && n.matrix.length===16) ? n.matrix.slice() : composeTRS(t0,r0,s0);
    const M1 = mat4Mul(Tpre, M0);
    const M2 = mat4Mul(RS, M1);
    const { t, r, s } = decomposeTRS(M2);
    delete n.matrix;
    n.translation = t;
    n.rotation    = r;
    n.scale       = s;
  }
}

// ---------------- positions from final result ----------------
function positionsFromFinal(glTF, roots, { origin=[0,0,0], scale=1 } = {}){
  const nodes = glTF.nodes || [];
  const out = [];
  for (const idx of roots){
    const n = nodes[idx] || {};
    const t = Array.isArray(n.translation) ? n.translation.slice() : [0,0,0];
    out.push({
      name: n.name || `Node_${idx}`,
      translation: t,
      origin: origin.slice()
    });
  }
  out._meta = { origin, scale };
  return out;
}

// ---------------- baking: push each root's CURRENT R*S into vertices ----------------
function countMeshUses(json){
  const uses = new Map();
  for (const n of (json.nodes||[])){
    if (typeof n.mesh === 'number'){
      uses.set(n.mesh, (uses.get(n.mesh)||0)+1);
    }
  }
  return uses;
}

function bakeRotScaleIntoVerticesAfterApply(json, bin, roots){
  const uses = countMeshUses(json);
  for (const idx of roots){
    const n = json.nodes[idx] || {};
    if (typeof n.mesh === 'number' && uses.get(n.mesh) > 1){
      throw new Error(`Mesh ${n.mesh} is referenced by multiple nodes; duplicate meshes per node before baking.`);
    }
    if (n.skin !== undefined){
      throw new Error(`Node ${idx} has a skin; baking into vertices would require rebinding (unsupported).`);
    }

    const r = Array.isArray(n.rotation) ? n.rotation.slice() : [0,0,0,1];
    const s = Array.isArray(n.scale) ? n.scale.slice() : [1,1,1];

    const RS4 = composeTRS([0,0,0], r, s);
    const RS3 = mat3FromMat4(RS4);

    const invT = mat3Inverse(RS3);
    if (!invT) throw new Error(`Non-invertible rotation/scale at node ${idx}.`);
    const normalM = mat3Transpose(invT);

    if (typeof n.mesh === 'number'){
      const mesh = (json.meshes||[])[n.mesh];
      if (!mesh) throw new Error(`Node ${idx} references missing mesh ${n.mesh}`);

      for (const prim of (mesh.primitives||[])){
        const attrs = prim.attributes||{};
        const pos = attrs.POSITION;
        if (typeof pos !== 'number') continue;

        mapAccessorVec3(json, bin, pos, (x,y,z) => mat3MulVec3(RS3, [x,y,z]));

        if (typeof attrs.NORMAL === 'number'){
          mapAccessorNormal(json, bin, attrs.NORMAL, (x,y,z) => mat3MulVec3(normalM, [x,y,z]));
        }
        if (typeof attrs.TANGENT === 'number'){
          mapAccessorTangent(json, bin, attrs.TANGENT, (x,y,z) => mat3MulVec3(normalM, [x,y,z]));
        }

        if (Array.isArray(prim.targets)){
          for (const tgt of prim.targets){
            if (typeof tgt.POSITION === 'number'){
              mapAccessorVec3(json, bin, tgt.POSITION, (x,y,z) => mat3MulVec3(RS3, [x,y,z]));
            }
            if (typeof tgt.NORMAL === 'number'){
              const { acc, bv } = assertFloatVecAccessor(json, tgt.NORMAL, 3);
              const base = (bv.byteOffset||0)+(acc.byteOffset||0)+(bin.byteOffset||0);
              const stride = bv.byteStride || 12;
              const dv = new DataView(bin.buffer, base, acc.count*stride);
              for (let i=0;i<acc.count;i++){
                const off = i*stride;
                const x = dv.getFloat32(off+0,true);
                const y = dv.getFloat32(off+4,true);
                const z = dv.getFloat32(off+8,true);
                const [nx,ny,nz] = mat3MulVec3(normalM, [x,y,z]);
                dv.setFloat32(off+0,nx,true);
                dv.setFloat32(off+4,ny,true);
                dv.setFloat32(off+8,nz,true);
              }
            }
            if (typeof tgt.TANGENT === 'number'){
              const { acc, bv } = assertFloatVecAccessor(json, tgt.TANGENT, 3);
              const base = (bv.byteOffset||0)+(acc.byteOffset||0)+(bin.byteOffset||0);
              const stride = bv.byteStride || 12;
              const dv = new DataView(bin.buffer, base, acc.count*stride);
              for (let i=0;i<acc.count;i++){
                const off = i*stride;
                const x = dv.getFloat32(off+0,true);
                const y = dv.getFloat32(off+4,true);
                const z = dv.getFloat32(off+8,true);
                const [nx,ny,nz] = mat3MulVec3(normalM, [x,y,z]);
                dv.setFloat32(off+0,nx,true);
                dv.setFloat32(off+4,ny,true);
                dv.setFloat32(off+8,nz,true);
              }
            }
          }
        }
      }
    }

    const t = Array.isArray(n.translation) ? n.translation.slice() : [0,0,0];
    delete n.matrix;
    n.translation = t;
    n.rotation    = [0,0,0,1];
    n.scale       = [1,1,1];

    if (Array.isArray(n.children)){
      for (const ci of n.children){
        const c = json.nodes[ci];
        if (!c) continue;
        const t0 = Array.isArray(c.translation) ? c.translation.slice() : [0,0,0];
        const r0 = Array.isArray(c.rotation) ? c.rotation.slice() : [0,0,0,1];
        const s0 = Array.isArray(c.scale) ? c.scale.slice() : [1,1,1];
        const Mchild0 = (c.matrix && c.matrix.length===16) ? c.matrix.slice() : composeTRS(t0,r0,s0);
        const Mchild1 = mat4Mul(RS4, Mchild0);
        const { t: tc, r: rc, s: sc } = decomposeTRS(Mchild1);
        delete c.matrix;
        c.translation = tc; c.rotation = rc; c.scale = sc;
      }
    }
  }
}

// ---------------- Draco decode (KHR_draco_mesh_compression) ----------------
async function maybeDecodeAllDraco(glTF, bin){
  let needs = false;
  for (const mesh of (glTF.meshes||[])){
    for (const prim of (mesh.primitives||[])){
      if (prim.extensions && prim.extensions.KHR_draco_mesh_compression){ needs = true; break; }
    }
    if (needs) break;
  }
  if (!needs) return { json: glTF, bin };

  let draco3d;
  try { draco3d = require('draco3d'); }
  catch {
    throw new Error('This GLB uses KHR_draco_mesh_compression. Install the decoder: npm i draco3d');
  }
  const decoderModuleMaybe = draco3d.createDecoderModule ? draco3d.createDecoderModule({}) : draco3d({});
  const dm = (decoderModuleMaybe && typeof decoderModuleMaybe.then === 'function')
    ? await decoderModuleMaybe
    : decoderModuleMaybe;
  const decoder = new dm.Decoder();

  function appendTypedArray(json, binIn, typed, target /* optional */){
    const pad = (4 - (binIn.length % 4)) % 4;
    const off = binIn.length + pad;
    const padBuf = pad ? Buffer.alloc(pad) : null;
    const dataBuf = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    const newBin = pad ? Buffer.concat([binIn, padBuf, dataBuf]) : Buffer.concat([binIn, dataBuf]);
    if (!Array.isArray(json.buffers)) json.buffers = [];
    if (json.buffers.length === 0) json.buffers.push({ byteLength: newBin.length });
    json.buffers[0].byteLength = newBin.length;
    json.bufferViews = json.bufferViews || [];
    const bvIndex = json.bufferViews.length;
    const bv = { buffer: 0, byteOffset: off, byteLength: typed.byteLength };
    if (target) bv.target = target;
    json.bufferViews.push(bv);
    return { newBin, bvIndex };
  }
  function addAccessor(json, bvIndex, componentType, count, type, options={}){
    json.accessors = json.accessors || [];
    const idx = json.accessors.length;
    const acc = { bufferView: bvIndex, byteOffset: 0, componentType, count, type };
    if (options.min) acc.min = options.min;
    if (options.max) acc.max = options.max;
    json.accessors.push(acc);
    return idx;
  }
  function removeTopExtIfGone(json){
    let left=false;
    for (const mesh of (json.meshes||[])){
      for (const prim of (mesh.primitives||[])){
        if (prim.extensions && prim.extensions.KHR_draco_mesh_compression){ left = true; break; }
      }
      if (left) break;
    }
    if (!left){
      if (Array.isArray(json.extensionsUsed))
        json.extensionsUsed = json.extensionsUsed.filter(x=>x!=='KHR_draco_mesh_compression');
      if (Array.isArray(json.extensionsRequired))
        json.extensionsRequired = json.extensionsRequired.filter(x=>x!=='KHR_draco_mesh_compression');
    }
  }

  for (const mesh of (glTF.meshes||[])){
    for (const prim of (mesh.primitives||[])){
      const ext = prim.extensions && prim.extensions.KHR_draco_mesh_compression;
      if (!ext) continue;

      const bv = glTF.bufferViews[ext.bufferView];
      if (!bv) throw new Error(`Draco: bufferView ${ext.bufferView} missing`);
      const byteOffset = (bv.byteOffset||0) + (bin.byteOffset||0);
      const compData = new Uint8Array(bin.buffer, byteOffset, bv.byteLength);

      const buf = new dm.DecoderBuffer();
      buf.Init(compData, compData.byteLength);

      const geomType = decoder.GetEncodedGeometryType(buf);
      let dracoGeom = null, numPoints=0, numFaces=0;
      if (geomType === dm.TRIANGULAR_MESH){
        dracoGeom = new dm.Mesh();
        const st = decoder.DecodeBufferToMesh(buf, dracoGeom);
        if (!st.ok()) throw new Error('Draco decode failed: ' + st.error_msg());
        numPoints = dracoGeom.num_points();
        numFaces  = dracoGeom.num_faces();
      } else if (geomType === dm.POINT_CLOUD){
        dracoGeom = new dm.PointCloud();
        const st = decoder.DecodeBufferToPointCloud(buf, dracoGeom);
        if (!st.ok()) throw new Error('Draco decode (point cloud) failed: ' + st.error_msg());
        numPoints = dracoGeom.num_points();
        numFaces  = 0;
      } else {
        throw new Error('Draco: Unsupported geometry type');
      }

      // indices
      if (numFaces > 0){
        const ia = new dm.DracoInt32Array();
        const indexArray = new Uint32Array(numFaces*3);
        for (let f=0; f<numFaces; f++){
          decoder.GetFaceFromMesh(dracoGeom, f, ia);
          indexArray[f*3+0] = ia.GetValue(0);
          indexArray[f*3+1] = ia.GetValue(1);
          indexArray[f*3+2] = ia.GetValue(2);
        }
        dm.destroy(ia);
        const useU16 = (numPoints <= 65535);
        const idxTyped = useU16 ? new Uint16Array(indexArray) : indexArray;
        const ap = appendTypedArray(glTF, bin, idxTyped, 34963);
        bin = ap.newBin;
        prim.indices = addAccessor(glTF, ap.bvIndex, useU16 ? T_UINT16 : T_UINT32, idxTyped.length, 'SCALAR');
      } else {
        delete prim.indices;
      }

      // attributes
      prim.attributes = prim.attributes || {};
      const attrMap = ext.attributes || {};
      for (const semantic of Object.keys(attrMap)){
        const attId = attrMap[semantic];
        const att = decoder.GetAttributeByUniqueId(dracoGeom, attId);
        if (!att) continue;
        const comps = att.num_components();
        const valCount = numPoints * comps;

        const darr = new dm.DracoFloat32Array();
        decoder.GetAttributeFloatForAllPoints(dracoGeom, att, darr);
        let out = new Float32Array(valCount);
        for (let i=0;i<valCount;i++) out[i] = darr.GetValue(i);
        dm.destroy(darr);

        // Ensure TANGENT has 4 comps
        let outTyped = out, outComps = comps;
        if (semantic === 'TANGENT' && comps === 3){
          const tmp = new Float32Array(numPoints*4);
          for (let i=0;i<numPoints;i++){
            tmp[i*4+0]=out[i*3+0];
            tmp[i*4+1]=out[i*3+1];
            tmp[i*4+2]=out[i*3+2];
            tmp[i*4+3]=1;
          }
          outTyped = tmp; outComps = 4;
        }

        const ap = appendTypedArray(glTF, bin, outTyped, 34962);
        bin = ap.newBin;

        // min/max for POSITION
        let opts = {};
        if (semantic === 'POSITION'){
          let minx= Infinity,miny= Infinity,minz= Infinity;
          let maxx=-Infinity,maxy=-Infinity,maxz=-Infinity;
          for (let i=0;i<numPoints;i++){
            const x = outTyped[i*outComps+0];
            const y = outTyped[i*outComps+1];
            const z = outTyped[i*outComps+2];
            if (x<minx)minx=x; if (y<miny)miny=y; if (z<minz)minz=z;
            if (x>maxx)maxx=x; if (y>maxy)maxy=y; if (z>maxz)maxz=z;
          }
          opts.min=[minx,miny,minz]; opts.max=[maxx,maxy,maxz];
        }

        const accIndex = addAccessor(glTF, ap.bvIndex, T_FLOAT, numPoints, typeFromComps(outComps), opts);
        prim.attributes[semantic] = accIndex;
      }

      // strip extension
      delete prim.extensions.KHR_draco_mesh_compression;
      if (Object.keys(prim.extensions||{}).length===0) delete prim.extensions;

      dm.destroy(dracoGeom);
      dm.destroy(buf);
    }
  }

  dm.destroy(decoder);
  removeTopExtIfGone(glTF);
  return { json: glTF, bin };
}

// ---------------- Programmatic API ----------------
async function rotateGlbBuffer(inBuf, { origin=null, scaleOn=false } = {}) {
  const { json: inJsonRaw, bin: inBinRaw } = parseGlb(inBuf);
  const { json: inJson, bin } = await maybeDecodeAllDraco(inJsonRaw, inBinRaw);

  const plan = planGlobalStrict(inJson, bin, { origin, scaleOn });
  const { json, roots, center, s, Tpre, RS } = plan;

  // original strict flow
  applyStrictIntoRoots(json, roots, Tpre, RS);

  // bake RS, flatten nodes
  bakeRotScaleIntoVerticesAfterApply(json, bin, roots);

  const positions = positionsFromFinal(json, roots, { origin: center, scale: s });
  const outBuf = buildGlb(json, bin);

  return { buffer: outBuf, positions, originUsed: center, scale: s };
}

module.exports = { rotateGlbBuffer };

// ---------------- CLI (still works) ----------------
if (require.main === module) {
  (async function main(){
    const args = process.argv.slice(2);
    if (args.length < 3){
      console.error('Usage: node rotateUtils.js <input.glb> <output.glb> <positions.json> [originJsonArray] [--scale] [--origin \'[x,y,z]\']');
      process.exit(1);
    }
    const [inPath, outPath, posPath, maybeOrigin, ...rest] = args;

    let origin = null, scaleOn = false;

    if (maybeOrigin && typeof maybeOrigin === 'string' && maybeOrigin.trim().startsWith('[') && maybeOrigin.trim().endsWith(']')){
      try { origin = JSON.parse(maybeOrigin); } catch {}
    } else if (maybeOrigin !== undefined) {
      rest.unshift(maybeOrigin);
    }

    for (let i=0;i<rest.length;i++){
      const a = rest[i];
      if (!a) continue;
      if (a === '--scale') scaleOn = true;
      else if (a === '--origin') origin = JSON.parse(rest[++i]);
    }

    const inBuf = fs.readFileSync(inPath);
    const { buffer, positions, originUsed } = await rotateGlbBuffer(inBuf, { origin, scaleOn });
    fs.writeFileSync(outPath, buffer);
    fs.writeFileSync(posPath, JSON.stringify(positions, null, 2));

    console.log(`ORIGIN_TRANSLATION ${JSON.stringify(origin ?? originUsed)}`);
    console.log(`Applied strict flow, then baked each root's rotation+scale into vertices; nodes set to translation-only.`);
    console.log(`Rotated+BAKED GLB saved to ${outPath}`);
    console.log(`Position data saved to ${posPath}`);
  })().catch(e=>{ console.error('Error:', e?.stack||e?.message||e); process.exit(1); });
}
