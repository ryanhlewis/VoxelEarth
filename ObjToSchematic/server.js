global.ReadableStream = require('readable-stream').Readable;
// const draco = require('draco')


const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { processGlb, processGltf, glbToGltf, gltfToGlb } = require('gltf-pipeline');
const { headlessConfig } = require('./tools/headless-config');
const { runHeadless } = require('./tools/run-headless');
const { Vector3 } = require('./src/vector');
const fs1 = require('fs').promises;
const { NodeIO, BufferUtils, Accessor, Material } = require('@gltf-transform/core');
const { KHRDracoMeshCompression, KHRMaterialsUnlit } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');
const {setLoaderOptions} = require('@loaders.gl/core');
setLoaderOptions({
  modules: {
    draco3d
  }
});
const { resample, prune, dedup, draco, textureCompress } = require('@gltf-transform/functions');
const sharp = require('sharp');
const magicConvert = require('./magic');
const { rotateAndSaveGlb, reverseRotation } = require('./rotateUtils');
const redis = require('redis');
const { promisify } = require('util');
const { Document } = require('@gltf-transform/core');
const { quat, vec3, mat4 } = require('gl-matrix');
const crypto = require('crypto');

const cacheDir = path.join(__dirname, 'cache');
const googleCacheDir = path.join(__dirname, 'googleCache');
const completedCacheDir = path.join(__dirname, 'completedCache');
const rotatedCacheDir = path.join(__dirname, 'rotatedCache');
const gpuCacheDir = path.join(__dirname, 'gpuCache');


if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

if (!fs.existsSync(googleCacheDir)) {
    fs.mkdirSync(googleCacheDir);
}

if (!fs.existsSync(completedCacheDir)) {
    fs.mkdirSync(completedCacheDir);
}

if (!fs.existsSync(rotatedCacheDir)) {
    fs.mkdirSync(rotatedCacheDir);
}

if (!fs.existsSync(gpuCacheDir)) {
    fs.mkdirSync(gpuCacheDir);
}


const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) { // numCPUs
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {

const app = express();
const port = 3005;

app.use(cors());

const { exec } = require('child_process');

// Function to run GPU voxelizer
async function runGpuVoxelizer(inputFile, outputFile, gridSize) {
    return new Promise((resolve, reject) => {
        // ./cuda_voxelizer -f /path/to/input.glb -s 32 -output /path/to/output
        const command = `./cuda_voxelizer -f ${inputFile} -s ${gridSize} -o glb -output ${path.dirname(outputFile)}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
            } else {
                resolve(outputFile);
            }
        });
    });
}

var toggleMCG = true;
var forceCPU = false;
var gridsize = 64;


// Function to create a hash of the filename for uniqueness without length issues
const hashFileName = (filename) => {
    return crypto.createHash('sha256').update(filename).digest('hex');
};

app.get('/v1/3dtiles/:path*', async (req, res) => {
    // log the url from req
    console.log('req.url: ' + req.url);
    const originalUrl = `http://127.0.0.1:8080/v1/3dtiles/${req.params.path}${req.params[0]}${req.originalUrl.split('?')[1] ? '?' + req.originalUrl.split('?')[1] : ''}`;
    let sanitizedFileName = path.basename(originalUrl).replace(/[\\/:*?"<>|]/g, "_");
    sanitizedFileName = hashFileName(sanitizedFileName);

    if(originalUrl.includes('.json'))
    {
        sanitizedFileName = sanitizedFileName + '.json';
    }
    else
    {
        sanitizedFileName = sanitizedFileName + '.glb';
    }

    const redisKey = `completedCache:${sanitizedFileName}`;
    if(sanitizedFileName.includes('.glb')) {
        sanitizedFileName = sanitizedFileName.split('.glb')[0] + '.glb';
    }
    console.log('Sanitized file name: ' + sanitizedFileName);

    const cacheFilePath = path.join(cacheDir, sanitizedFileName);
    const googleCacheFilePath = path.join(googleCacheDir, sanitizedFileName);
    const completedCacheFilePath = path.join(completedCacheDir, sanitizedFileName);
    const rotatedCacheFilePath = path.join(rotatedCacheDir, sanitizedFileName);
    const gpuCacheFilePath = path.join(gpuCacheDir, sanitizedFileName.split('.glb')[0] + '_' + gridsize + '.glb');

    console.log('Entering endpoint');

    // var cacheData = await client.get(redisKey);
    var cacheData = null;
    console.log('Checking Redis cache');

    if (cacheData) {
      console.log(`Using Redis Cache for ${originalUrl}`);
      return res.end(Buffer.from(cacheData, 'base64'));
    }

    // Check disk cache second
    if (fs.existsSync(googleCacheFilePath) && !toggleMCG) {
      console.log(`Using Google Cache for ${originalUrl}`);
      return res.download(googleCacheFilePath);
    }

    if (fs.existsSync(completedCacheFilePath) && toggleMCG) {
      console.log(`Using Disk Cache for ${originalUrl}`);
      const buffer = await fs.promises.readFile(completedCacheFilePath);

      // Save to Redis cache for future use
    //   client.set(redisKey, buffer.toString('base64'), 'EX', 60 * 60 * 24); // Expire after 24 hours

      return res.download(completedCacheFilePath);
    }

    try {
        const io = new NodeIO()
        .registerExtensions([KHRDracoMeshCompression, KHRMaterialsUnlit])
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule(),
        });

        let doc;
        let resp;

        if (!fs.existsSync(googleCacheFilePath)) {
            console.log('Fetching new Google for ' + originalUrl);

            // Google purposely obfuscates to force you to request new tiles
            // as to deter you from caching their tiles (as you would only be
            // able to cache sections before the obfuscation changes)
            
            // This is as caching or downloading is against TOS- so to deter bad actors,
            // previously fetched JSON files cannot be used to reconstruct further parts of the dataset.
            // So, only cache for development and educational purposes. Do NOT use in production- it is against TOS, and it will break.
            // Note that we are not the first to cache for development purposes- this is a common practice in the industry (CartoDB).

            // If you notice in development that you get errors after a while, delete your Google cache folder.
            // It means that your session is outdated and you must fetch a new session.

            // Development mode caching should be used to evaluate how tiles are processed on-demand,
            // whether nodes are correctly placed (per 3D Tiles), rotations, scales are followed correctly,
            // textures are correct, etc.  -  We've fixed most of this already in creating a pipeline for 3D Tiles,
            // but in case future development is needed, caching and debugging is useful, especially paired with GLTF Validator.

            const apiKey = 'AIzaSy...'; // Replace with your actual API key
            const baseUrl = 'https://tile.googleapis.com/v1/3dtiles/';
            const url = `${baseUrl}${req.params.path}${req.params[0]}${req.originalUrl.split('?')[1] ? '?' + req.originalUrl.split('?')[1] : ''}`;
            const headers = {
                'X-Goog-Api-Key': apiKey
            };

            response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: headers
            });

            console.log('Fetched ' + response.data.byteLength + ' bytes');

            fs.writeFileSync(googleCacheFilePath, response.data);

            console.log('Wrote to ' + googleCacheFilePath);

            if (originalUrl.includes('glb')) {
                doc = await io.readBinary(new Uint8Array(response.data));
                resp = response.data;
            } else {
                return res.send(response.data);
            }

            if (!toggleMCG) {
                res.send(response.data);
            }

        } else {
            console.log('Using Google Cache for ' + originalUrl);
            const buffer = await fs1.readFile(googleCacheFilePath);
            if (originalUrl.includes('glb')) {
                doc = await io.readBinary(new Uint8Array(buffer));
            }
            resp = buffer;

            if (!toggleMCG) {
                res.send(buffer);
            }
        }

        // Apply rotation to the GLB file before voxelization
        if (originalUrl.includes('glb')) {
            console.log('Processing ' + originalUrl);

            if (!fs.existsSync(rotatedCacheFilePath)) {
                await rotateAndSaveGlb(googleCacheFilePath, rotatedCacheFilePath);
                console.log(`Rotated GLB saved to ${rotatedCacheFilePath}`);
            }

            let mineDoc;

            if (!fs.existsSync(cacheFilePath)) {
                console.log('Running headless for ' + originalUrl);
                const headlessConfig1 = { ...headlessConfig, 
                    import: { file: rotatedCacheFilePath, rotation: new Vector3(0, 0, 0) },
                    voxelise: { 
                        constraintAxis: 'y',
                        voxeliser: 'bvh-ray',
                        size: gridsize,
                        useMultisampleColouring: false,
                        voxelOverlapRule: 'average',
                        enableAmbientOcclusion: false,
                    }
                };

                let compressedAndModifiedBuffer;
                if (forceCPU) {
                    const customGlbFile = await runHeadless(headlessConfig1);
                    compressedAndModifiedBuffer = await compressAndCopyAttributes(new Uint8Array(customGlbFile), resp);
                    // Save to gpuCacheDir
                    fs.writeFileSync(gpuCacheFilePath, Buffer.from(compressedAndModifiedBuffer));

                    // Get translation and rotation from the original file
                    const originalBuffer = await fs1.readFile(googleCacheFilePath);
                    const originalDoc = await io.readBinary(new Uint8Array(originalBuffer));
                    const originalNode = originalDoc.getRoot().listNodes()[0];
                    const originalTranslation = originalNode.getTranslation();

                    // Reverse the rotation after voxelization
                    await reverseRotation(originalTranslation, gpuCacheFilePath, gpuCacheFilePath); // Use the correct file path here
                    compressedAndModifiedBuffer = await fs1.readFile(gpuCacheFilePath);
                } else {
                    const voxelizedGlbFile = await runGpuVoxelizer(rotatedCacheFilePath, gpuCacheFilePath, gridsize);
                    compressedAndModifiedBuffer = await compressAndCopyAttributes(new Uint8Array(fs.readFileSync(voxelizedGlbFile)), resp);
                
                    // Get translation and rotation from the original file
                    const originalBuffer = await fs1.readFile(googleCacheFilePath);
                    const originalDoc = await io.readBinary(new Uint8Array(originalBuffer));
                    const originalNode = originalDoc.getRoot().listNodes()[0];
                    const originalTranslation = originalNode.getTranslation();

                    // Reverse the rotation after voxelization
                    await reverseRotation(originalTranslation, gpuCacheFilePath, gpuCacheFilePath); // Use the correct file path here
                    compressedAndModifiedBuffer = await fs1.readFile(gpuCacheFilePath);
                }

                fs.writeFileSync(cacheFilePath, Buffer.from(compressedAndModifiedBuffer));

                mineDoc = await io.readBinary(new Uint8Array(compressedAndModifiedBuffer));
            } else {
                console.log('Using fixed cache for ' + originalUrl);
                const buffer = await fs1.readFile(cacheFilePath);
                mineDoc = await io.readBinary(new Uint8Array(buffer));
            }

            const finalGlb = await magicConvert(doc, mineDoc, io);
            fs.writeFileSync(completedCacheFilePath, Buffer.from(finalGlb));

            res.setHeader('Content-Type', 'model/gltf-binary');
            return res.end(finalGlb);
        } else {
            res.send(resp);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing the request.');
    }
});


async function compressAndCopyAttributes(buffer, originalBuffer) {
    const options = {
        dracoOptions: {
            compressionLevel: 10
        },
    };

    console.log('Compressing and copying attributes');

    const targetGltfResult = await glbToGltf(buffer);
    const originalGltfResult = await glbToGltf(originalBuffer);

    let originalNode = originalGltfResult.gltf.nodes[0];
    let targetNode = targetGltfResult.gltf.nodes[0];
    if(forceCPU) {
        targetNode = targetGltfResult.gltf.nodes[1]; // use 1 for CPU
    } 

    // print out the node slength for debugging
    console.log('Original node length: ' + originalGltfResult.gltf.nodes.length);
    console.log('Target node length: ' + targetGltfResult.gltf.nodes.length);

    if (originalNode && targetNode) {
        targetNode.translation = originalNode.translation;
        targetNode.rotation = originalNode.rotation;
        targetNode.scale = originalNode.scale;
    } else {
        throw new Error('One of the GLTFs does not contain the required nodes.');
    }

    targetGltfResult.gltf.nodes = [targetNode];
    targetGltfResult.gltf.scenes[0].nodes = [0];

    let compressedResult = await processGltf(targetGltfResult.gltf, options);

    async function addUnlitExtension(gltf) {
        if (!gltf.extensionsUsed) {
            gltf.extensionsUsed = [];
        }
        if (!gltf.extensionsUsed.includes('KHR_materials_unlit')) {
            gltf.extensionsUsed.push('KHR_materials_unlit');
        }

        if (gltf.materials) {
            gltf.materials.forEach(material => {
                if (!material.extensions) {
                    material.extensions = {};
                }
                material.extensions.KHR_materials_unlit = {};
            });
        }

        return gltf;
    }

    compressedResult.gltf = await addUnlitExtension(compressedResult.gltf);

    if (compressedResult.gltf.meshes[0].primitives[0].extensions && 
        compressedResult.gltf.meshes[0].primitives[0].extensions["KHR_draco_mesh_compression"]) {
        const accessor4 = compressedResult.gltf.accessors[4];
        if (accessor4 && accessor4.max) {
            accessor4.max = accessor4.max.map(value => Math.min(255, value));
        }
    } else {
        throw new Error('Failed to apply Draco compression. Extension KHR_draco_mesh_compression is missing.');
    }

    const finalGlb = await gltfToGlb(compressedResult.gltf);

    if (!finalGlb.glb) {
        throw new Error('Failed to apply Draco compression.');
    }

    return finalGlb.glb;
}

// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });
const host = '127.0.0.1';

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});
}
