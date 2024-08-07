const fsExtra = require("fs-extra");
const path = require("path");
const gltfPipeline = require("gltf-pipeline");
const glbToGltf = gltfPipeline.glbToGltf;
const gltfToGlb = gltfPipeline.gltfToGlb;

const folderPath = './completedCache'; // Update this path

async function processGlbs(folderPath) {
    const files = await fsExtra.readdir(folderPath);
    for (let file of files) {
        if (path.extname(file).toLowerCase() === '.glb') {
            const filePath = path.join(folderPath, file);
            console.log(`Processing: ${filePath}`);

            // Load GLB
            const glbBuffer = await fsExtra.readFile(filePath);
            const gltfResult = await glbToGltf(glbBuffer);
            const gltfWithUnlit = await addUnlitExtension(gltfResult.gltf);

            // Convert back to GLB
            const glbResult = await gltfToGlb(gltfWithUnlit);
            const outputFilePath = filePath;

            // Save the modified GLB
            await fsExtra.writeFile(outputFilePath, Buffer.from(glbResult.glb));
            console.log(`Saved: ${outputFilePath}`);
        }
    }
}

// Implement addUnlitExtension as previously described


// Assuming processGltf has been called and compressedResult is the result
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


// Start processing
processGlbs(folderPath).then(() => console.log('All GLB files processed.'));
