const { NodeIO } = require("@gltf-transform/core");
const { KHRDracoMeshCompression, KHRMaterialsUnlit } = require("@gltf-transform/extensions");
const draco3d = require("draco3dgltf");
const glMatrix = require("gl-matrix");

function computeRotationQuaternion(boundingBox) {
    const dimensions = [
        boundingBox.max[0] - boundingBox.min[0],
        boundingBox.max[1] - boundingBox.min[1],
        boundingBox.max[2] - boundingBox.min[2]
    ];
    
    const largestDimensionIndex = dimensions.indexOf(Math.max(...dimensions));
    const groundAxisIndex = 1;  // Assuming Y is the up-axis

    let rotationAxis = [0, 0, 0];
    rotationAxis[largestDimensionIndex] = 1;
    rotationAxis[groundAxisIndex] = -1;

    const angle = Math.PI / 4;  // 45-degree rotation

    return glMatrix.quat.normalize(glMatrix.quat.create(), glMatrix.quat.setAxisAngle(glMatrix.quat.create(), rotationAxis, angle));
}

function rotatePointWithQuaternion(point, quaternion) {
    const vec = glMatrix.vec3.fromValues(point[0], point[1], point[2]);
    glMatrix.vec3.transformQuat(vec, vec, quaternion);
    return [vec[0], vec[1], vec[2]];
}


function computeRotationsForGLB(doc) {
    const meshes = doc.getRoot().listMeshes();

    let originalRotation = [];
    let rotationQuaternions = [];

    for (const mesh of meshes) {
        const primitives = mesh.listPrimitives();
        for (const primitive of primitives) {
            const positionAccessor = primitive.getAttribute("POSITION");
            const vertexCount = positionAccessor.getCount();
            const buffer = positionAccessor.getArray();

            let boundingBox = {
                min: [Infinity, Infinity, Infinity],
                max: [-Infinity, -Infinity, -Infinity],
            };

            for (let i = 0; i < vertexCount; i++) {
                const vertex = [buffer[i * 3], buffer[i * 3 + 1], buffer[i * 3 + 2]];
                for (let j = 0; j < 3; j++) {
                    boundingBox.min[j] = Math.min(boundingBox.min[j], vertex[j]);
                    boundingBox.max[j] = Math.max(boundingBox.max[j], vertex[j]);
                }
            }

            const rotationQuaternion = computeRotationQuaternion(boundingBox);
            rotationQuaternions.push(rotationQuaternion);
            originalRotation.push(rotationQuaternion);
        }
    }

    return { originalRotation, rotationQuaternions };
}

async function rotateGLB(inputFilePath) {
    const io = new NodeIO()
        .registerExtensions([KHRDracoMeshCompression, KHRMaterialsUnlit])
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule(),
        });

    const doc = await io.read(inputFilePath);
    const meshes = doc.getRoot().listMeshes();

    let originalRotation = [];
    let rotationQuaternions = [];

    for (const mesh of meshes) {
        const primitives = mesh.listPrimitives();
        for (const primitive of primitives) {
            const positionAccessor = primitive.getAttribute("POSITION");
            const vertexCount = positionAccessor.getCount();
            const buffer = positionAccessor.getArray();

            let boundingBox = {
                min: [Infinity, Infinity, Infinity],
                max: [-Infinity, -Infinity, -Infinity],
            };

            for (let i = 0; i < vertexCount; i++) {
                const vertex = [buffer[i * 3], buffer[i * 3 + 1], buffer[i * 3 + 2]];
                for (let j = 0; j < 3; j++) {
                    boundingBox.min[j] = Math.min(boundingBox.min[j], vertex[j]);
                    boundingBox.max[j] = Math.max(boundingBox.max[j], vertex[j]);
                }
            }

            const rotationQuaternion = computeRotationQuaternion(boundingBox);
            rotationQuaternions.push(rotationQuaternion);
            originalRotation.push(rotationQuaternion);

            for (let i = 0; i < vertexCount; i++) {
                const vertex = [buffer[i * 3], buffer[i * 3 + 1], buffer[i * 3 + 2]];
                const rotatedVertex = rotatePointWithQuaternion(vertex, rotationQuaternion);
                buffer[i * 3] = rotatedVertex[0];
                buffer[i * 3 + 1] = rotatedVertex[1];
                buffer[i * 3 + 2] = rotatedVertex[2];
            }

            positionAccessor.setArray(buffer);
        }
    }

    const rotatedGlb = await io.writeBinary(doc);
    return { rotatedGlb, originalRotation, rotationQuaternions };
}

async function unrotateGLB(doc, originalRotation) {
    const io = new NodeIO()
        .registerExtensions([KHRDracoMeshCompression, KHRMaterialsUnlit])
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule(),
        });

    const meshes = doc.getRoot().listMeshes();
    let index = 0;

    for (const mesh of meshes) {
        const primitives = mesh.listPrimitives();
        for (const primitive of primitives) {
            const rotationQuaternion = originalRotation[index];
            index++;
            if (!rotationQuaternion) continue;

            const inverseRotationQuaternion = glMatrix.quat.normalize(glMatrix.quat.create(), glMatrix.quat.conjugate(glMatrix.quat.create(), rotationQuaternion));

            const positionAccessor = primitive.getAttribute('POSITION');
            const vertexCount = positionAccessor.getCount();
            const buffer = positionAccessor.getArray();

            for (let i = 0; i < vertexCount; i++) {
                const vertex = [buffer[i * 3], buffer[i * 3 + 1], buffer[i * 3 + 2]];
                const unrotatedVertex = rotatePointWithQuaternion(vertex, inverseRotationQuaternion);
                buffer[i * 3] = unrotatedVertex[0];
                buffer[i * 3 + 1] = unrotatedVertex[1];
                buffer[i * 3 + 2] = unrotatedVertex[2];
            }

            positionAccessor.setArray(buffer);
        }
    }

    const unrotatedGlb = await io.writeBinary(doc);
    return unrotatedGlb;
}

module.exports = {
    rotateGLB,
    unrotateGLB,
    computeRotationsForGLB
};
