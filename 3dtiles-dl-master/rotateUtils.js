const { quat, mat4, vec3 } = require('gl-matrix');
const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression, KHRMaterialsUnlit } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');

// Function to normalize a vector
function normalize(vec) {
    const length = Math.hypot(vec[0], vec[1], vec[2]);
    return length > 0 ? vec.map(v => v / length) : vec;
}

// Function to calculate the rotation quaternion to align ECEF up to global ENU up
function calculateRotation(ecef) {
    const upVec = normalize(ecef);
    const desiredUp = [0, 0, 1];

    const cross = [
        upVec[1] * desiredUp[2] - upVec[2] * desiredUp[1],
        upVec[2] * desiredUp[0] - upVec[0] * desiredUp[2],
        upVec[0] * desiredUp[1] - upVec[1] * desiredUp[0]
    ];

    const dot = upVec[0] * desiredUp[0] + upVec[1] * desiredUp[1] + upVec[2] * desiredUp[2];
    const s = Math.sqrt((1 + dot) * 2);
    const invs = 1 / s;

    return quat.normalize(quat.create(), [
        cross[0] * invs,  // X
        cross[2] * invs,  // Z
        -cross[1] * invs, // Y (negated)
        s * 0.5           // W
    ]);
}

// Function to apply a rotation to a vertex using a matrix
function applyRotationToVertex(vertex, rotationMatrix) {
    const rotatedVertex = vec3.transformMat4([], vertex, rotationMatrix);
    return rotatedVertex;
}

// Function to reverse the rotation of vertices using an inverse matrix
async function reverseRotation(translation, inputFilePath, outputFilePath) {
    const io = new NodeIO()
        .registerExtensions([KHRDracoMeshCompression, KHRMaterialsUnlit])
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule(),
        });

    const doc = await io.read(inputFilePath);
    const nodes = doc.getRoot().listNodes();

    nodes.forEach((node) => {
        // const translation = node.getTranslation();

        if (translation) {
            const correctedECEF = [translation[0], -translation[2], translation[1]];
            const rotationQuaternion = calculateRotation(correctedECEF);
            const inverseRotationMatrix = mat4.invert([], mat4.fromQuat([], rotationQuaternion));

            const mesh = node.getMesh();
            if (mesh) {
                mesh.listPrimitives().forEach(primitive => {
                    const positionAccessor = primitive.getAttribute('POSITION');
                    const vertexCount = positionAccessor.getCount();
                    const positionArray = positionAccessor.getArray();

                    for (let i = 0; i < vertexCount; i++) {
                        const vertex = [positionArray[i * 3], positionArray[i * 3 + 1], positionArray[i * 3 + 2]];
                        const reversedVertex = applyRotationToVertex(vertex, inverseRotationMatrix);

                        positionArray[i * 3] = reversedVertex[0];
                        positionArray[i * 3 + 1] = reversedVertex[1];
                        positionArray[i * 3 + 2] = reversedVertex[2];
                    }

                    // Update the positions in the accessor
                    positionAccessor.setArray(positionArray);
                });
            }

            // Clear the node's rotation since it's now baked in the vertices
            node.setRotation([0, 0, 0, 1]);
        }
    });

    await io.write(outputFilePath, doc);
    return outputFilePath;
}

// Function to bake rotations into vertices
async function rotateAndSaveGlb(inputFilePath, outputFilePath) {
    const io = new NodeIO()
        .registerExtensions([KHRDracoMeshCompression, KHRMaterialsUnlit])
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule(),
        });

    const doc = await io.read(inputFilePath);
    const nodes = doc.getRoot().listNodes();

    nodes.forEach((node) => {
        const translation = node.getTranslation();

        if (translation) {
            const correctedECEF = [translation[0], -translation[2], translation[1]];
            const rotationQuaternion = calculateRotation(correctedECEF);
            const rotationMatrix = mat4.fromQuat([], rotationQuaternion);

            const mesh = node.getMesh();
            if (mesh) {
                mesh.listPrimitives().forEach(primitive => {
                    const positionAccessor = primitive.getAttribute('POSITION');
                    const vertexCount = positionAccessor.getCount();
                    const positionArray = positionAccessor.getArray();

                    for (let i = 0; i < vertexCount; i++) {
                        const vertex = [positionArray[i * 3], positionArray[i * 3 + 1], positionArray[i * 3 + 2]];
                        const rotatedVertex = applyRotationToVertex(vertex, rotationMatrix);

                        positionArray[i * 3] = rotatedVertex[0];
                        positionArray[i * 3 + 1] = rotatedVertex[1];
                        positionArray[i * 3 + 2] = rotatedVertex[2];
                    }

                    // Update the positions in the accessor
                    positionAccessor.setArray(positionArray);
                });
            }

            // Clear the node's rotation now that it has been baked into the vertices
            node.setRotation([0, 0, 0, 1]);
        }
    });

    await io.write(outputFilePath, doc);
}

module.exports = { rotateAndSaveGlb, reverseRotation };
