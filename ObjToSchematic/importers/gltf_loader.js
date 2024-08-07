"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfLoader = void 0;
const core_1 = require("@loaders.gl/core");
const gltf_1 = require("@loaders.gl/gltf");
const colour_1 = require("../colour");
const localiser_1 = require("../localiser");
const mesh_1 = require("../mesh");
const status_1 = require("../status");
const util_1 = require("../util");
const vector_1 = require("../vector");
const base_importer_1 = require("./base_importer");
class GltfLoader extends base_importer_1.IImporter {
    import(file) {
        status_1.StatusHandler.warning((0, localiser_1.LOC)('import.gltf_experimental'));
        return new Promise((resolve, reject) => {
            (0, core_1.parse)(file, gltf_1.GLTFLoader, { loadImages: true })
                .then((gltf) => {
                resolve(this._handleGLTF(gltf));
            })
                .catch((err) => {
                reject(err);
            });
        });
    }
    _handleGLTF(gltf) {
        const meshVertices = [];
        const meshNormals = [];
        const meshTexcoords = [];
        const meshTriangles = [];
        const meshMaterials = new Map();
        meshMaterials.set('NONE', {
            type: mesh_1.MaterialType.solid,
            colour: colour_1.RGBAUtil.copy(colour_1.RGBAColours.WHITE),
            needsAttention: false,
            canBeTextured: false,
        });
        let maxIndex = 0;
        Object.values(gltf.meshes).forEach((mesh) => {
            Object.values(mesh.primitives).forEach((primitive) => {
                const attributes = primitive.attributes;
                if (attributes.POSITION !== undefined) {
                    const positions = attributes.POSITION.value;
                    for (let i = 0; i < positions.length; i += 3) {
                        meshVertices.push(new vector_1.Vector3(positions[i + 0], positions[i + 1], positions[i + 2]));
                    }
                }
                if (attributes.NORMAL !== undefined) {
                    const normals = attributes.NORMAL.value;
                    for (let i = 0; i < normals.length; i += 3) {
                        meshNormals.push(new vector_1.Vector3(normals[i + 0], normals[i + 1], normals[i + 2]));
                    }
                }
                if (attributes.TEXCOORD_0 !== undefined) {
                    const texcoords = attributes.TEXCOORD_0.value;
                    for (let i = 0; i < texcoords.length; i += 2) {
                        meshTexcoords.push(new util_1.UV(texcoords[i + 0], 1.0 - texcoords[i + 1]));
                    }
                }
                // Material
                let materialNameToUse = 'NONE';
                {
                    if (primitive.material) {
                        const materialName = primitive.material.name;
                        let materialMade = false;
                        const pbr = primitive.material.pbrMetallicRoughness;
                        if (pbr !== undefined) {
                            const diffuseTexture = pbr.baseColorTexture;
                            if (diffuseTexture !== undefined) {
                                const imageData = diffuseTexture.texture.source.bufferView.data;
                                const mimeType = diffuseTexture.texture.source.mimeType;
                                try {
                                    if (mimeType !== 'image/png' && mimeType !== 'image/jpeg') {
                                        status_1.StatusHandler.warning((0, localiser_1.LOC)('import.unsupported_image_type', { file_name: diffuseTexture.texture.source.id, file_type: mimeType }));
                                        throw new Error('Unsupported image type');
                                    }
                                    const base64 = btoa(imageData.reduce((data, byte) => data + String.fromCharCode(byte), ''));
                                    meshMaterials.set(materialName, {
                                        type: mesh_1.MaterialType.textured,
                                        diffuse: {
                                            filetype: mimeType === 'image/jpeg' ? 'jpg' : 'png',
                                            raw: (mimeType === 'image/jpeg' ? 'data:image/jpeg;base64,' : 'data:image/png;base64,') + base64,
                                        },
                                        extension: 'clamp',
                                        interpolation: 'linear',
                                        needsAttention: false,
                                        transparency: { type: 'None' },
                                    });
                                }
                                catch (_a) {
                                    meshMaterials.set(materialName, {
                                        type: mesh_1.MaterialType.solid,
                                        colour: colour_1.RGBAUtil.copy(colour_1.RGBAColours.WHITE),
                                        needsAttention: false,
                                        canBeTextured: true,
                                    });
                                }
                                /*

                                */
                                materialNameToUse = materialName;
                                materialMade = true;
                            }
                            else {
                                const diffuseColour = pbr.baseColorFactor;
                                if (diffuseColour !== undefined) {
                                    meshMaterials.set(materialName, {
                                        type: mesh_1.MaterialType.solid,
                                        colour: {
                                            r: diffuseColour[0],
                                            g: diffuseColour[1],
                                            b: diffuseColour[2],
                                            a: diffuseColour[3],
                                        },
                                        needsAttention: false,
                                        canBeTextured: false,
                                    });
                                }
                                materialNameToUse = materialName;
                                materialMade = true;
                            }
                        }
                        const emissiveColour = primitive.material.pbr;
                        if (!materialMade && emissiveColour !== undefined) {
                            meshMaterials.set(materialName, {
                                type: mesh_1.MaterialType.solid,
                                colour: {
                                    r: emissiveColour[0],
                                    g: emissiveColour[1],
                                    b: emissiveColour[2],
                                    a: 1.0,
                                },
                                needsAttention: false,
                                canBeTextured: false,
                            });
                            materialNameToUse = materialName;
                            materialMade = true;
                        }
                    }
                }
                // Indices
                {
                    const indices = primitive.indices.value;
                    for (let i = 0; i < indices.length / 3; ++i) {
                        meshTriangles.push({
                            material: materialNameToUse,
                            positionIndices: {
                                x: maxIndex + indices[i * 3 + 0],
                                y: maxIndex + indices[i * 3 + 1],
                                z: maxIndex + indices[i * 3 + 2],
                            },
                            texcoordIndices: {
                                x: maxIndex + indices[i * 3 + 0],
                                y: maxIndex + indices[i * 3 + 1],
                                z: maxIndex + indices[i * 3 + 2],
                            },
                        });
                    }
                    let localMax = 0;
                    for (let i = 0; i < indices.length; ++i) {
                        localMax = Math.max(localMax, indices[i]);
                    }
                    maxIndex += localMax + 1;
                }
            });
        });
        return new mesh_1.Mesh(meshVertices, meshNormals, meshTexcoords, meshTriangles, meshMaterials);
    }
}
exports.GltfLoader = GltfLoader;
