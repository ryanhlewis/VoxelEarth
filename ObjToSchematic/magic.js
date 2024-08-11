const { Accessor } = require('@gltf-transform/core');
const { KHRDracoMeshCompression, KHRMaterialsUnlit, Unlit  } = require('@gltf-transform/extensions');
const { mergeDocuments } = require('@gltf-transform/functions');
const { PNG } = require('pngjs');

async function magicConvert(doc, mineDoc, io) {

    // Merge mineDoc into doc using mergeDocuments
    await mergeDocuments(doc, mineDoc);

    // Create single scene and set as default
    const mainScene = doc.createScene('MainScene');
    doc.getRoot().setDefaultScene(mainScene);

    const unlitExtension = doc.createExtension(KHRMaterialsUnlit);


    // Remove the original mesh from the scene
    const originalMesh = doc.getRoot().listMeshes()[0];
    const originalMeshClone = originalMesh.clone();
    originalMesh.dispose();

    var callOnce = false;
    // Create a single mesh collecting primitives
    const mainMesh = doc.createMesh('MainMesh');
    doc.getRoot().listMeshes().forEach((mesh) => {
        mesh.listPrimitives().forEach((primitive) => {
            if (!callOnce) {
                mainMesh.addPrimitive(primitive);
                callOnce = true;
            }
        });
    });

    // Get the original node's translation and scale
    const originalNode = doc.getRoot().listNodes()[0];
    const originalTranslation = originalNode.getTranslation();
    const originalScale = originalNode.getScale();

    // Obtain vertices using the accessor API
    function getVerticesFromMesh(mesh) {
        const vertices = [];
        const positionAccessor = mesh.listPrimitives()[0].getAttribute('POSITION');

        const vertexCount = positionAccessor.getCount();

        for (let i = 0; i < vertexCount; i++) {
            const vertexElement = [];
            positionAccessor.getElement(i, vertexElement);
            vertices.push(vertexElement);
        }

        return vertices;
    }

    // Calculate the Axis-Aligned BoundingBox (AABB) of a mesh
    function calculateAABB(vertices) {
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];

        vertices.forEach(vertex => {
            for (let i = 0; i < 3; i++) {
                if (vertex[i] < min[i]) min[i] = vertex[i];
                if (vertex[i] > max[i]) max[i] = vertex[i];
            }
        });

        return { min, max };
    }

    // Calculate the scale factors based on AABBs
    function calculateAABBScale(originalAABB, newAABB) {
        const scaleFactors = [];
        for (let i = 0; i < 3; i++) {
            const originalLength = originalAABB.max[i] - originalAABB.min[i];
            const newLength = newAABB.max[i] - newAABB.min[i];
            scaleFactors[i] = originalLength / newLength;
        }
        return scaleFactors;
    }

    // Calculate the translation factors based on AABBs
    function calculateAABBTranslation(originalAABB, newAABB, scaleFactors) {
        const translationFactors = [];
        for (let i = 0; i < 3; i++) {
            const scaledNewMin = newAABB.min[i] * scaleFactors[i];
            const scaledNewMax = newAABB.max[i] * scaleFactors[i];
            const newCenter = (scaledNewMax + scaledNewMin) / 2;
            const originalCenter = (originalAABB.max[i] + originalAABB.min[i]) / 2;
            translationFactors[i] = originalCenter - newCenter;
        }
        return translationFactors;
    }

    // Use the new AABB functions to calculate scale and translation
    const originalMeshVertices = getVerticesFromMesh(originalMeshClone);
    const newMeshVertices = getVerticesFromMesh(mainMesh);
    const originalMeshAABB = calculateAABB(originalMeshVertices);
    const newMeshAABB = calculateAABB(newMeshVertices);
    const calculatedScale = calculateAABBScale(originalMeshAABB, newMeshAABB);
    const calculatedTranslation = calculateAABBTranslation(originalMeshAABB, newMeshAABB, calculatedScale);

    // Apply the calculated scale and translation
    const newScale = originalScale.map((s, i) => s * calculatedScale[i]);
    const newTranslation = originalTranslation.map((t, i) => t + calculatedTranslation[i]);

    console.log('Calculated scale:', calculatedScale);
    console.log('Calculated translation:', newTranslation);

    // Create a node for the single mesh
    const mainNode = doc.createNode('MainNode')
        .setMesh(mainMesh)
        .setTranslation(newTranslation)  // Use new translation based on centroid
        .setScale(newScale);  // Use calculated scale

    // Add the new node to the main scene
    mainScene.addChild(mainNode);

    // Remove extra meshes and scenes
    doc.getRoot().listMeshes().forEach((mesh) => {
        if (mesh !== mainMesh) mesh.dispose();
    });
    doc.getRoot().listScenes().forEach((scene) => {
        if (scene !== mainScene) scene.dispose();
    });

    // Get unique colors from mesh
    const mesh = doc.getRoot().listMeshes()[0];
    const primitive = mesh.listPrimitives()[0];
    const colorAccessor = primitive.getAttribute('COLOR_0');
    const colors = colorAccessor.getArray();
    const colorSet = new Set();
    for (let i = 0; i < colors.length; i += 4) {
        const color = [
            Math.round(colors[i] * 255),
            Math.round(colors[i + 1] * 255),
            Math.round(colors[i + 2] * 255),
            Math.round(colors[i + 3] * 255),
        ];
        colorSet.add(color.join(','));
    }

    const uniqueColors = Array.from(colorSet).map(c => c.split(',').map(Number));
    const palette = uniqueColors;
    palette.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    console.log('Palette:', palette);

    function normalizeColor(value, maxVal = 65025) {
        return Math.round((value / maxVal) * 255);
    }

    const gridSize = Math.ceil(Math.sqrt(palette.length));
    console.log('Grid Size:', gridSize);

    const padding = 1 / (2 * gridSize);
    const colorToUV = {};
    palette.forEach((color, index) => {
        const u = (index % gridSize) / gridSize + padding;
        const v = Math.floor(index / gridSize) / gridSize + padding;
        colorToUV[color.join(',')] = [u, v];
    });

    async function createTextureFromColors(doc, uniqueColors, gridSize) {
        const width = gridSize;
        const height = gridSize;

        const png = new PNG({
            width,
            height,
            filterType: -1
        });

        for (let i = 0; i < uniqueColors.length; i++) {
            const [r, g, b, a] = uniqueColors[i].map(c => normalizeColor(c));
            const idx = (i % width + Math.floor(i / width) * width) * 4;
            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = a;
        }

        const buffer = PNG.sync.write(png);

        const texture = doc.createTexture('baseColorTexture')
            .setImage(buffer)
            .setMimeType('image/png');

        return texture;
    }

    const texture = await createTextureFromColors(doc, palette, gridSize);

    const material = doc.createMaterial('ColoredMaterial')
        .setBaseColorTexture(texture);

    const unlit = unlitExtension.createUnlit();
    material.setExtension('KHR_materials_unlit', unlit);
    
    mesh.listPrimitives().forEach((primitive) => {
        primitive.setMaterial(material);
    });

    const newUVs = [];
    for (let i = 0; i < colors.length; i += 4) {
        const color = [
            Math.round(colors[i] * 255),
            Math.round(colors[i + 1] * 255),
            Math.round(colors[i + 2] * 255),
            Math.round(colors[i + 3] * 255),
        ];
        const uv = colorToUV[color.join(',')];
        if (uv === undefined) {
            console.log("Undefined UV for color", color);
            continue;
        }
        newUVs.push(...uv);
    }

    const uvAccessor = doc.createAccessor('NewTEXCOORD_0')
        .setArray(new Float32Array(newUVs))
        .setType(Accessor.Type.VEC2);

    primitive.setAttribute('TEXCOORD_0', uvAccessor);

    mesh.listPrimitives().forEach((primitive) => {
        primitive.getAttribute('COLOR_0').dispose();
        console.log('COLOR_0 disposed');
    });

    doc.createExtension(KHRDracoMeshCompression)
        .setRequired(true)
        .setEncoderOptions({
            method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
            encodeSpeed: 5,
            decodeSpeed: 5,
        });

    const { resample, prune, dedup, draco } = require('@gltf-transform/functions');

    await doc.transform(
        resample(),
        prune(),
        dedup(),
        draco(),
        backfaceCulling({ cull: true }),
    );

    function backfaceCulling(options) {
        return (document) => {
            for (const material of document.getRoot().listMaterials()) {
                material.setDoubleSided(!options.cull);
            }
        };
    }

    const { unpartition } = require('@gltf-transform/functions');
    await doc.transform(unpartition());

    doc.getRoot().getAsset().generator = 'draco_decoder';
    doc.getRoot().getAsset().copyright = 'Google';

    const finalGlb = await io.writeBinary(doc);
    return finalGlb;
}

module.exports = magicConvert;
