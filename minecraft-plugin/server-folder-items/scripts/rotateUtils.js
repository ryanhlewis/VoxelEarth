const { quat, mat4, vec3 } = require('gl-matrix');
const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression, KHRMaterialsUnlit } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');
const fs = require('fs');

function normalize(vec) {
    const length = Math.hypot(vec[0], vec[1], vec[2]);
    return length > 0 ? vec.map(v => v / length) : vec;
}

async function rotateAndSaveGlb(inputFilePath, outputFilePath, positionOutputPath, originTranslation) {
    const io = new NodeIO()
        .registerExtensions([KHRDracoMeshCompression, KHRMaterialsUnlit])
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule(),
        });

    const doc = await io.read(inputFilePath);
    const nodes = doc.getRoot().listNodes();

    const tileTranslations = [];

    nodes.forEach((node) => {
        const translation = node.getTranslation();

        if (translation) {
            if (!originTranslation) {
                // This is the first tile; set originTranslation and output it
                originTranslation = translation.slice();
                console.log(`ORIGIN_TRANSLATION ${JSON.stringify(originTranslation)}`);
            }

            // Compute relative translation
            const relativeTranslation = [
                translation[0] - originTranslation[0],
                translation[1] - originTranslation[1],
                translation[2] - originTranslation[2],
            ];

            // Compute the up vector (from the ECEF position)
            const upVec = normalize(translation);

            // Desired up direction is the global ENU up (which is [0, 0, 1] in GLTF coordinate system)
            const desiredUp = [0, 1, 0]; // Y-up in GLTF

            // Calculate rotation quaternion using gl-matrix's rotationTo function
            const rotationQuaternion = quat.create();
            quat.rotationTo(rotationQuaternion, upVec, desiredUp);

            // Create rotation matrix from the quaternion
            const rotationMatrix = mat4.fromQuat([], rotationQuaternion);

            // Rotate the relative translation
            const rotatedTranslation = vec3.transformMat4([], relativeTranslation, rotationMatrix);

            // Rotate the mesh vertices
            const mesh = node.getMesh();
            if (mesh) {
                mesh.listPrimitives().forEach(primitive => {
                    const positionAccessor = primitive.getAttribute('POSITION');
                    const positionArray = positionAccessor.getArray();
                    const vertexCount = positionAccessor.getCount();

                    for (let i = 0; i < vertexCount; i++) {
                        const vertex = [
                            positionArray[i * 3],
                            positionArray[i * 3 + 1],
                            positionArray[i * 3 + 2],
                        ];

                        // Apply rotation to the vertex
                        const rotatedVertex = vec3.transformMat4([], vertex, rotationMatrix);

                        positionArray[i * 3] = rotatedVertex[0];
                        positionArray[i * 3 + 1] = rotatedVertex[1];
                        positionArray[i * 3 + 2] = rotatedVertex[2];
                    }

                    positionAccessor.setArray(positionArray);
                });
            }

            // Set node rotation to identity (since we've already applied the rotation)
            node.setRotation([0, 0, 0, 1]);

            // Set node translation to the rotated translation
            node.setTranslation(rotatedTranslation);

            // Save the rotated translation for reference
            tileTranslations.push({
                name: node.getName() || 'Unnamed Node',
                translation: rotatedTranslation,
                origin: originTranslation
            });
        }
    });

    await io.write(outputFilePath, doc);

    // Write the position data to a JSON file
    if (positionOutputPath && tileTranslations.length > 0) {
        fs.writeFileSync(positionOutputPath, JSON.stringify(tileTranslations, null, 2));
    }
}

// Execute the function with command-line arguments
(async () => {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.error(
            "Usage: node rotateUtils.js <inputFilePath> <outputFilePath> <positionOutputPath> [originTranslation]"
        );
        process.exit(1);
    }

    const inputFilePath = args[0];
    const outputFilePath = args[1];
    const positionOutputPath = args[2];
    let originTranslation = null;

    if (args[3]) {
        // Parse originTranslation from JSON string
        originTranslation = JSON.parse(args[3]);
    }

    try {
        await rotateAndSaveGlb(inputFilePath, outputFilePath, positionOutputPath, originTranslation);
        console.log(`Rotated GLB saved to ${outputFilePath}`);
        console.log(`Position data saved to ${positionOutputPath}`);
    } catch (error) {
        console.error("Error rotating GLB:", error);
    }
})();
