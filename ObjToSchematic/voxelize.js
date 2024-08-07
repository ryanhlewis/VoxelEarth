const axios = require('axios'); // axios gives a readable stream
const fs = require('fs');
const path = require('path');
const { processGlb, processGltf, glbToGltf, gltfToGlb } = require('gltf-pipeline');
const { Vector3 } = require('./src/vector');
const fs1 = require('fs').promises;
const { NodeIO, BufferUtils, Accessor, Material } = require('@gltf-transform/core');
const { KHRDracoMeshCompression, KHRMaterialsUnlit } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');
const { setLoaderOptions } = require('@loaders.gl/core');
const { exec } = require('child_process');
const crypto = require('crypto');
const { headlessConfig } = require('./tools/headless-config');
const { runHeadless } = require('./tools/run-headless');

setLoaderOptions({
  modules: {
    draco3d
  }
});

const gridsize = 16;  // Define your grid size here

// Function to run GPU voxelizer
async function runGpuVoxelizer(inputFile, outputFile, gridSize) {
    return new Promise((resolve, reject) => {
        const command = `./cuda_voxelizer -f ${inputFile} -s ${gridSize} -output ${path.dirname(outputFile)}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
            } else {
                resolve(outputFile);
            }
        });
    });
}

// Function to create a hash of the filename for uniqueness without length issues
const hashFileName = (filename) => {
    return crypto.createHash('sha256').update(filename).digest('hex');
};

async function compressAndCopyAttributes(buffer, originalBuffer) {
    const options = {
        dracoOptions: {
            compressionLevel: 10
        },
    };

    console.log('Compressing and copying attributes');

    const targetGltfResult = await glbToGltf(buffer);
    const originalGltfResult = await glbToGltf(originalBuffer);

    const originalNode = originalGltfResult.gltf.nodes[0];
    const targetNode = targetGltfResult.gltf.nodes[0];

    // print out the node lengths for debugging
    console.log('Original node length: ' + originalGltfResult.gltf.nodes.length);
    console.log('Target node length: ' + targetGltfResult.gltf.nodes.length);

    if (originalNode && targetNode) {
        targetNode.translation = originalNode.translation;
        targetNode.rotation = originalNode.rotation;
        targetNode.scale = originalNode.scale;
    } else {
        throw new Error('One of the GLTFs does not contain the required nodes.');
    }

    // targetGltfResult.gltf.nodes = [targetNode];
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

(async () => {
    const inputFilePath = process.argv[2];
    const useCPU = process.argv[3] === 'cpu';

    if (!inputFilePath) {
        console.error('Please provide the input file path as the first argument.');
        process.exit(1);
    }

    const outputFileName = path.basename(inputFilePath, path.extname(inputFilePath)) + '_voxel.glb';
    const outputFilePath = path.join(path.dirname(inputFilePath), outputFileName);

    try {
        const io = new NodeIO()
            .registerExtensions([KHRDracoMeshCompression, KHRMaterialsUnlit])
            .registerDependencies({
                'draco3d.decoder': await draco3d.createDecoderModule(),
                'draco3d.encoder': await draco3d.createEncoderModule(),
            });

        console.log(`Running voxelizer for ${inputFilePath}`);

        let voxelizedGlbFile;

        if (useCPU) {
            console.log('Using CPU for voxelization');
            const headlessConfig1 = { ...headlessConfig, import: { file: inputFilePath, rotation: new Vector3(0, 0, 0) } };
            const customGlbFile = await runHeadless(headlessConfig1);
            voxelizedGlbFile = await compressAndCopyAttributes(new Uint8Array(customGlbFile), fs.readFileSync(inputFilePath));
        } else {
            console.log('Using GPU for voxelization');
            voxelizedGlbFile = await runGpuVoxelizer(inputFilePath, outputFilePath, gridsize);
            voxelizedGlbFile = await compressAndCopyAttributes(new Uint8Array(fs.readFileSync(voxelizedGlbFile)), fs.readFileSync(inputFilePath));
        }

        fs.writeFileSync(outputFilePath, Buffer.from(voxelizedGlbFile));

        console.log(`Voxelized GLB saved to ${outputFilePath}`);
    } catch (error) {
        console.error('An error occurred while processing the file:', error);
    }
})();
