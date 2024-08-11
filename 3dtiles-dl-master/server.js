const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression, KHRMaterialsUnlit } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');
const magicConvert = require('./magic');
const { rotateAndSaveGlb, reverseRotation } = require('./rotateUtils');

const app = express();
const PORT = 3000;

// add cors
const cors = require('cors');
app.use(cors());

app.use(bodyParser.json());
app.use(express.static('public'));

// Function to run GPU voxelizer
async function runGpuVoxelizer(inputFile, outputFile, gridSize) {
    return new Promise((resolve, reject) => {
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

const fsExtra = require("fs-extra");
const gltfPipeline = require("gltf-pipeline");
const glbToGltf = gltfPipeline.glbToGltf;
const gltfToGlb = gltfPipeline.gltfToGlb;

// Function to apply original transformations from source GLB file to voxelized GLB file
async function applyTransformations(originalFile, voxelizedFile) {
    const io = new NodeIO()
        .registerExtensions([KHRDracoMeshCompression, KHRMaterialsUnlit])
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule(),
        });

    const originalDoc = await io.read(originalFile);
    const voxelizedDoc = await io.read(voxelizedFile);

    const originalNode = originalDoc.getRoot().listNodes()[0];
    const voxelizedNode = voxelizedDoc.getRoot().listNodes()[0];

    voxelizedNode.setTranslation(originalNode.getTranslation());
    voxelizedNode.setRotation(originalNode.getRotation());
    voxelizedNode.setScale(originalNode.getScale());

    await io.write(voxelizedFile, voxelizedDoc);

    const finalGlb = await magicConvert(originalDoc, voxelizedDoc, io);
    await fsExtra.writeFile(voxelizedFile, Buffer.from(finalGlb));

    // Convert voxelized file to glTF and add unlit extension
    const glbBuffer = await fsExtra.readFile(voxelizedFile);
    const gltfResult = await glbToGltf(glbBuffer);
    const gltfWithUnlit = await addUnlitExtension(gltfResult.gltf);

    // Convert back to GLB
    const glbResult = await gltfToGlb(gltfWithUnlit);
    await fsExtra.writeFile(voxelizedFile, Buffer.from(glbResult.glb));
}

// Function to add KHR_materials_unlit extension
async function addUnlitExtension(gltf) {
    // Ensure extensionsUsed array exists and add 'KHR_materials_unlit' if needed
    if (!gltf.extensionsUsed) {
        gltf.extensionsUsed = [];
    }
    if (!gltf.extensionsUsed.includes('KHR_materials_unlit')) {
        gltf.extensionsUsed.push('KHR_materials_unlit');
    }
    
    // Loop through all materials and add the unlit extension to each
    if (gltf.materials) {
        gltf.materials.forEach(material => {
            if (!material.extensions) {
                material.extensions = {};
            }
            // Add or ensure the unlit extension is present
            material.extensions.KHR_materials_unlit = {};
        });
    }
    
    return gltf;
}

function combineGLBFiles(glbFiles, outputFile) {
    return new Promise((resolve, reject) => {
        const pythonCommand = `python.exe combine_glb.py -- ${glbFiles.join(' ')} ${outputFile}`;
        exec(pythonCommand, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
            } else {
                resolve(outputFile);
            }
        });
    }).catch(error => {
        console.error(error);
    });
}

app.post('/download-tiles', async (req, res) => {
    const { gridSize, lat, lng, radius } = req.body;
    console.log("User requested tiles for lat:", lat, "lng:", lng, "radius:", radius, "gridSize:", gridSize);
    let apiKey = "AIzaSy..."; // Add your Google Maps API key here
    const sessionID = `${lat}${lng}${radius}`;
    const outputDir = 'public/' + sessionID;
    const coords = `${lng} ${lat}`;

    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    } else {
        const glbFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.glb'));
        if (glbFiles.length > 0) {
            console.log('Tiles already downloaded, running voxelizer with new grid size');
            const renamedFiles = glbFiles.map((file, index) => `${index + 1}.glb`);
            const combinedFilePath = path.join(outputDir, 'combined.glb');
            try {
                await combineGLBFiles(renamedFiles.map(file => path.join(outputDir, file)), combinedFilePath);
                
                 // Add rotation check and apply rotation if necessary
                const rotatedCacheFilePath = path.join(outputDir, 'combined_rotated.glb');
                if (!fs.existsSync(rotatedCacheFilePath)) {
                    await rotateAndSaveGlb(combinedFilePath, rotatedCacheFilePath);
                    console.log(`Rotated GLB saved to ${rotatedCacheFilePath}`);
                }
                
                const voxelizedFiles = [];
                for (const file of ['combined_rotated.glb']) {
                    const inputFile = path.join(outputDir, file);
                    const outputFile = path.join(outputDir, file.replace('.glb', '_' + gridSize + '.glb'));
                    await runGpuVoxelizer(inputFile, outputFile, gridSize);
                    await applyTransformations(inputFile, outputFile);
                    voxelizedFiles.push(outputFile);
                    console.log("Voxelized file");
                }
                res.status(200).json({ voxelizedFiles });
            } catch (voxelizerError) {
                console.error('Error voxelizing files:', voxelizerError);
                res.status(500).send('Error voxelizing files');
            }
            return;
        } else {
            fs.rmdirSync(outputDir, { recursive: true });
            fs.mkdirSync(outputDir);
        }
    }

    // const command = `python3 -m scripts.download_tiles -k ${apiKey} -c ${coords} -r ${radius} -o ${outputDir}`;
    const command = `python3 -m threaded_api -k ${apiKey} -c ${coords} -r ${radius} -o ${outputDir}`;
    
    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send('Error downloading tiles');
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }
        console.log(`Stdout: ${stdout}`);
        console.log('Tiles downloaded successfully');

        const glbFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.glb'));
        let renamedFiles = [];
        glbFiles.forEach((file, index) => {
            const oldPath = path.join(outputDir, file);
            const newFileName = `${index + 1}.glb`;
            const newPath = path.join(outputDir, newFileName);
            fs.renameSync(oldPath, newPath);
            renamedFiles.push(newFileName);
        });

        const combinedFilePath = path.join(outputDir, 'combined.glb');
        try {
            await combineGLBFiles(renamedFiles.map(file => path.join(outputDir, file)), combinedFilePath);
            
            // Add rotation check and apply rotation if necessary
            const rotatedCacheFilePath = path.join(outputDir, 'combined_rotated.glb');
            if (!fs.existsSync(rotatedCacheFilePath)) {
                await rotateAndSaveGlb(combinedFilePath, rotatedCacheFilePath);
                console.log(`Rotated GLB saved to ${rotatedCacheFilePath}`);
            }
            
            const voxelizedFiles = [];
            for (const file of ['combined_rotated.glb']) {
                const inputFile = path.join(outputDir, file);
                const outputFile = path.join(outputDir, file.replace('.glb', '_' + gridSize + '.glb'));
                await runGpuVoxelizer(inputFile, outputFile, gridSize);
                await applyTransformations(inputFile, outputFile);
                voxelizedFiles.push(outputFile);
                console.log("Voxelized file");
            }
            res.status(200).json({ voxelizedFiles });
        } catch (voxelizerError) {
            console.error('Error voxelizing files:', voxelizerError);
            res.status(500).send('Error voxelizing files');
        }
    });
});

app.post('/check-cache', (req, res) => {
    const { gridSize, lat, lng, radius } = req.body;
    const sessionID = `${lat}${lng}${radius}`;
    const outputDir = path.join(__dirname, 'public', sessionID);

    if (fs.existsSync(outputDir)) {
        const voxelizedFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('_' + gridSize + '.glb'));
        res.status(200).json({ voxelizedFiles: voxelizedFiles.map(file => path.join(sessionID, file)) });
    } else {
        res.status(200).json({ voxelizedFiles: [] });
    }
});


// Serve the HTML file for Three.js visualization
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
