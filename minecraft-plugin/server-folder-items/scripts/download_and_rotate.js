#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import PQueue from 'p-queue';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import axios from 'axios';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { rotateGlbBuffer } = require('./rotateUtils.cjs'); // ← import the working rotate

// ──────────────────────────────────────────────────────────────────────────────
// Keep-alive agents & Axios instance
// ──────────────────────────────────────────────────────────────────────────────
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const axiosInstance = axios.create({ httpAgent, httpsAgent, timeout: 30000 });

// ──────────────────────────────────────────────────────────────────────────────
// Utils
// ──────────────────────────────────────────────────────────────────────────────
function cartesianFromDegrees(lonDeg, latDeg, h = 0) {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const e2 = f * (2 - f);
  const radLat = (latDeg * Math.PI) / 180;
  const radLon = (lonDeg * Math.PI) / 180;
  const sinLat = Math.sin(radLat);
  const cosLat = Math.cos(radLat);
  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const x = (N + h) * cosLat * Math.cos(radLon);
  const y = (N + h) * cosLat * Math.sin(radLon);
  const z = (N * (1 - e2) + h) * sinLat;
  return [x, y, z];
}

class Sphere {
  constructor(center, radius) { this.center = center; this.radius = radius; }
  intersects(other) {
    const dx = other.center[0] - this.center[0];
    const dy = other.center[1] - this.center[1];
    const dz = other.center[2] - this.center[2];
    const dist = Math.hypot(dx, dy, dz);
    return dist < this.radius + other.radius;
  }
}

// Convert boundingVolume.box => approximate sphere (no transform; coarse culling)
function obbToSphere(boxSpec) {
  const cx = boxSpec[0], cy = boxSpec[1], cz = boxSpec[2];
  const h1 = [boxSpec[3], boxSpec[4], boxSpec[5]];
  const h2 = [boxSpec[6], boxSpec[7], boxSpec[8]];
  const h3 = [boxSpec[9], boxSpec[10], boxSpec[11]];
  const corners = [];
  for (let i = 0; i < 8; i++) {
    const s1 = (i & 1) ? 1 : -1;
    const s2 = (i & 2) ? 1 : -1;
    const s3 = (i & 4) ? 1 : -1;
    corners.push([
      cx + s1 * h1[0] + s2 * h2[0] + s3 * h3[0],
      cy + s1 * h1[1] + s2 * h2[1] + s3 * h3[1],
      cz + s1 * h1[2] + s2 * h2[2] + s3 * h3[2],
    ]);
  }
  let minX = corners[0][0], maxX = corners[0][0];
  let minY = corners[0][1], maxY = corners[0][1];
  let minZ = corners[0][2], maxZ = corners[0][2];
  for (const [x, y, z] of corners) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const midX = 0.5 * (minX + maxX);
  const midY = 0.5 * (minY + maxY);
  const midZ = 0.5 * (minZ + maxZ);
  const dx = maxX - minX;
  const dy = maxY - minY;
  const dz = maxZ - minZ;
  const radius = 0.5 * Math.sqrt(dx * dx + dy * dy + dz * dz);
  return new Sphere([midX, midY, midZ], radius);
}

async function getElevation(apiKey, lat, lng) {
  const url = 'https://maps.googleapis.com/maps/api/elevation/json';
  const resp = await axiosInstance.get(url, {
    params: { locations: `${lat},${lng}`, key: apiKey },
  });
  if (resp.status !== 200 || !resp.data || resp.data.status !== 'OK') {
    throw new Error(`Elevation API error: ${JSON.stringify(resp.data)}`);
  }
  return resp.data.results[0].elevation;
}

// Minimal GLB JSON extractor (for logging copyright & translation)
function parseGlbJsonFromBuffer(buf) {
  if (buf.readUInt32LE(0)!==0x46546c67) return null; // 'glTF'
  if (buf.readUInt32LE(4)!==2) return null;
  let off = 12;
  while (off + 8 <= buf.length) {
    const chunkLen = buf.readUInt32LE(off); off += 4;
    const chunkType = buf.readUInt32LE(off); off += 4;
    const chunk = buf.slice(off, off + chunkLen); off += chunkLen;
    if (chunkType === 0x4e4f534a) { // JSON
      try { return JSON.parse(chunk.toString('utf8')); } catch { return null; }
    }
  }
  return null;
}

function tileIdentifierFromUrl(fullUrl) {
  const urlObj = new URL(fullUrl);
  urlObj.searchParams.delete('session');
  urlObj.searchParams.delete('key');
  return urlObj.pathname + urlObj.search;
}

// ──────────────────────────────────────────────────────────────────────────────
// BFS of 3D Tiles to gather .glb URLs
// ──────────────────────────────────────────────────────────────────────────────
const parseQueue = new PQueue({ concurrency: 10 });

async function parseNode(node, regionSphere, baseURL, sessionRef, apiKey, results) {
  let intersects = false;
  if (node.boundingVolume?.box) {
    const sphere = obbToSphere(node.boundingVolume.box);
    if (regionSphere.intersects(sphere)) intersects = true;
  } else {
    intersects = true;
  }
  if (!intersects) return;

  if (Array.isArray(node.children) && node.children.length > 0) {
    for (const child of node.children) {
      await parseNode(child, regionSphere, baseURL, sessionRef, apiKey, results);
    }
    return;
  }

  const contents = [];
  if (node.content?.uri) contents.push(node.content);
  if (Array.isArray(node.contents)) contents.push(...node.contents);

  for (const content of contents) {
    if (!content?.uri) continue;
    const contentURL = new URL(content.uri, baseURL);

    const childSession = contentURL.searchParams.get('session');
    if (childSession) sessionRef.value = childSession;

    if (!contentURL.searchParams.has('key')) contentURL.searchParams.set('key', apiKey);
    if (sessionRef.value && !contentURL.searchParams.has('session')) {
      contentURL.searchParams.set('session', sessionRef.value);
    }

    const fullUrl = contentURL.toString();
    if (fullUrl.endsWith('.glb')) {
      results.push(fullUrl);
    } else {
      parseQueue.add(() => fetchTileSet(fullUrl, regionSphere, sessionRef, apiKey, results));
    }
  }
}

async function fetchTileSet(tilesetUrl, regionSphere, sessionRef, apiKey, results) {
  const urlObj = new URL(tilesetUrl);
  if (!urlObj.searchParams.has('key')) urlObj.searchParams.set('key', apiKey);
  if (sessionRef.value && !urlObj.searchParams.has('session')) urlObj.searchParams.set('session', sessionRef.value);

  let resp;
  try {
    resp = await axiosInstance.get(urlObj.toString(), { responseType: 'json' });
  } catch (err) {
    console.warn(`[WARN] fetchTileSet: Could not fetch ${tilesetUrl}`, err);
    return;
  }
  if (resp.status !== 200) {
    console.warn(`[WARN] fetchTileSet: HTTP ${resp.status} => ${tilesetUrl}`);
    return;
  }
  const ctype = resp.headers['content-type'] || '';
  if (!ctype.includes('application/json')) {
    results.push(urlObj.toString()); // some leaves are binary GLBs
    return;
  }
  const data = resp.data;
  if (!data.root) {
    console.warn(`[WARN] No root in sub-tileset: ${tilesetUrl}`);
    return;
  }
  await parseNode(data.root, regionSphere, urlObj, sessionRef, apiKey, results);
}

// ──────────────────────────────────────────────────────────────────────────────
// Download → rotate via rotateUtils → write
// ──────────────────────────────────────────────────────────────────────────────
async function downloadRotateWrite(glbUrl, outDir, originRef) {
  const tileId = tileIdentifierFromUrl(glbUrl);
  const hash = crypto.createHash('sha1').update(tileId).digest('hex');
  const outGlbPath = path.join(outDir, `${hash}.glb`);

  // Skip if already exists, but still try to log translation
  if (fs.existsSync(outGlbPath)) {
    console.warn(`[SKIP] ${outGlbPath} already exists.`);
    try {
      const buf = fs.readFileSync(outGlbPath);
      const json = parseGlbJsonFromBuffer(buf);
      const sceneIdx = json?.scene ?? 0;
      const rootNodeIdx = json?.scenes?.[sceneIdx]?.nodes?.[0];
      const t = (json?.nodes?.[rootNodeIdx]?.translation) || [0,0,0];
      const copyright = json?.asset?.copyright || '';
      console.log(`ASSET_COPYRIGHT ${path.basename(outGlbPath)} ${copyright}`);
      console.log(`TILE_TRANSLATION ${path.basename(outGlbPath)} ${JSON.stringify(t)}`);
    } catch {}
    return { fileName: path.basename(outGlbPath), updatedOrigin: originRef.value };
  }

  // Download GLB
  let inBuf;
  try {
    const resp = await axiosInstance.get(glbUrl, { responseType: 'arraybuffer' });
    inBuf = Buffer.from(resp.data);
  } catch (err) {
    console.error(`[ERROR] Could not fetch GLB from ${glbUrl}`, err?.response?.status || err?.message || err);
    return { fileName: null, updatedOrigin: originRef.value };
  }

  // Rotate/bake with shared origin (adopt from first tile if null)
  const { buffer: outBuf, positions, originUsed } = await rotateGlbBuffer(inBuf, {
    origin: originRef.value ?? null,
    scaleOn: false,
  });

  if (!originRef.value) {
    originRef.value = originUsed.slice();
    console.log(`ORIGIN_TRANSLATION ${JSON.stringify(originRef.value)}`);
  }

  // Write
  fs.writeFileSync(outGlbPath, outBuf);

  // Log some metadata (from rotated GLB)
  const json = parseGlbJsonFromBuffer(outBuf);
  const sceneIdx = json?.scene ?? 0;
  const rootNodeIdx = json?.scenes?.[sceneIdx]?.nodes?.[0];
  const t = (json?.nodes?.[rootNodeIdx]?.translation) || positions?.[0]?.translation || [0,0,0];
  const copyright = json?.asset?.copyright || '';

  console.log(`[INFO] Wrote new tile => ${path.basename(outGlbPath)}`);
  console.log(`ASSET_COPYRIGHT ${path.basename(outGlbPath)} ${copyright}`);
  console.log(`TILE_TRANSLATION ${path.basename(outGlbPath)} ${JSON.stringify(t)}`);

  return { fileName: path.basename(outGlbPath), updatedOrigin: originRef.value };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
(async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('key', { type: 'string', demandOption: true })
    .option('lat', { type: 'number', demandOption: true })
    .option('lng', { type: 'number', demandOption: true })
    .option('radius', { type: 'number', demandOption: true })
    .option('out', { type: 'string', demandOption: true })
    .option('parallel', { type: 'number', default: 10 })
    .option('origin', {
      type: 'array',
      description: 'Optional origin as three numbers: x y z. E.g. --origin 3383551.7246 2624125.9925 -4722209.0962',
    })
    .help()
    .argv;

  const { key, lat, lng, radius, out: outDir, parallel, origin } = argv;

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Optional user-provided origin
  const originRef = { value: null };
  if (origin) {
    if (!Array.isArray(origin) || origin.length !== 3) {
      console.error(`[ERROR] --origin requires exactly three numeric values: x y z`);
      process.exit(1);
    }
    originRef.value = origin.map(Number);
    if (originRef.value.some(isNaN)) {
      console.error(`[ERROR] --origin values must be valid numbers.`);
      process.exit(1);
    }
    console.log(`[INFO] Using user-provided origin: ${JSON.stringify(originRef.value)}`);
  }

  // Elevation (optional; just used to pick a reasonable culling center)
  let elevation = 0;
  try {
    elevation = await getElevation(key, lat, lng);
    console.log(`[INFO] Found ground elevation ~${elevation.toFixed(2)} m`);
  } catch (err) {
    console.warn(`[WARN] Elevation fetch failed => using 0. Error: ${err}`);
  }

  // Region sphere for coarse culling
  const centerECEF = cartesianFromDegrees(lng, lat, elevation);
  const regionSphere = new Sphere(centerECEF, radius);

  // Gather GLB URLs (BFS)
  console.log('[INFO] Gathering sub-tiles in bounding volume...');
  const rootUrl = new URL('https://tile.googleapis.com/v1/3dtiles/root.json');
  rootUrl.searchParams.set('key', key);

  const glbResults = [];
  const sessionRef = { value: null };

  try {
    const resp = await axiosInstance.get(rootUrl.toString(), { responseType: 'json' });
    if (resp.status !== 200 || !resp.data?.root) {
      throw new Error(`root.json fetch error or missing root. code=${resp.status}`);
    }
    await parseNode(resp.data.root, regionSphere, rootUrl, sessionRef, key, glbResults);
    await parseQueue.onIdle();
  } catch (err) {
    console.error(`[ERROR] Could not gather 3D tiles: ${err}`);
    process.exit(1);
  }

  console.log(`[INFO] Found ${glbResults.length} .glb tile(s).`);
  if (glbResults.length === 0) {
    console.log('DOWNLOADED_TILES: []');
    process.exit(0);
  }

  const downloadedTiles = [];

  // If origin not provided, adopt from the first processed tile
  const first = glbResults.shift();
  if (first) {
    const r = await downloadRotateWrite(first, outDir, originRef);
    if (r.fileName) downloadedTiles.push(r.fileName);
  }

  // Process the rest in parallel (originRef.value now fixed)
  const downloadQueue = new PQueue({ concurrency: parallel });
  for (const url of glbResults) {
    downloadQueue.add(async () => {
      const r = await downloadRotateWrite(url, outDir, originRef);
      if (r.fileName) downloadedTiles.push(r.fileName);
    });
  }
  await downloadQueue.onIdle();

  console.log('DOWNLOADED_TILES:', JSON.stringify(downloadedTiles));
  process.exit(0);
})();
