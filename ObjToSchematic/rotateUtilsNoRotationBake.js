const { quat, mat4 } = require('gl-matrix');
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

// Function to convert quaternion to Euler angles
function quaternionToEuler(q) {
    const mat = mat4.create();
    mat4.fromQuat(mat, q);
    
    const sy = Math.sqrt(mat[0] * mat[1] + mat[1] * mat[1]);
    const singular = sy < 1e-6;

    let x, y, z;
    if (!singular) {
        x = Math.atan2(mat[6], mat[10]);
        y = Math.atan2(-mat[2], sy);
        z = Math.atan2(mat[1], mat[0]);
    } else {
        x = Math.atan2(-mat[9], mat[5]);
        y = Math.atan2(-mat[2], sy);
        z = 0;
    }

    return [x * 180 / Math.PI, y * 180 / Math.PI, z * 180 / Math.PI]; // Convert radians to degrees
}

// Function to rotate and save the GLB file
async function rotateAndSaveGlb(inputFilePath, outputFilePath) {
    const io = new NodeIO()
        .registerExtensions([KHRDracoMeshCompression, KHRMaterialsUnlit])
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule(),
        });

    const doc = await io.read(inputFilePath);
    const nodes = doc.getRoot().listNodes();

    nodes.forEach((node, index) => {
        const translation = node.getTranslation();
        
        if (translation) {
            const correctedECEF = [translation[0], -translation[2], translation[1]];
            const rotationQuaternion = calculateRotation(correctedECEF);
            const originalRotation = node.getRotation();
            const finalRotation = quat.multiply(quat.create(), rotationQuaternion, originalRotation);
            quat.normalize(finalRotation, finalRotation);
            node.setRotation(Array.from(finalRotation));
        }
    });

    await io.write(outputFilePath, doc);
}

module.exports = { rotateAndSaveGlb };
