"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfLoader = void 0;
require("@loaders.gl/polyfills");
var core_1 = require("@loaders.gl/core");
var gltf_1 = require("@loaders.gl/gltf");
var colour_1 = require("../colour");
// var localiser_1 = require("../localiser");
var mesh_1 = require("../mesh");
var status_1 = require("../status");
var util_1 = require("../util");
var vector_1 = require("../vector");
var base_importer_1 = require("./base_importer");
var GltfLoader = /** @class */ (function (_super) {
    __extends(GltfLoader, _super);
    function GltfLoader() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GltfLoader.prototype.import = function (file) {
        var _this = this;
        // status_1.StatusHandler.warning((0, localiser_1.LOC)('import.gltf_experimental'));
        return new Promise(function (resolve, reject) {
            (0, core_1.parse)(file, gltf_1.GLTFLoader, { loadImages: true })
                .then(function (gltf) {
                resolve(_this._handleGLTF(gltf));
            })
                .catch(function (err) {
                reject(err);
            });
        });
    };
    GltfLoader.prototype._handleGLTF = function (gltf) {
        var meshVertices = [];
        var meshNormals = [];
        var meshTexcoords = [];
        var meshTriangles = [];
        var meshMaterials = new Map();
        meshMaterials.set('NONE', {
            type: mesh_1.MaterialType.solid,
            colour: colour_1.RGBAUtil.copy(colour_1.RGBAColours.WHITE),
            needsAttention: false,
            canBeTextured: false,
        });
        var maxIndex = 0;
        var materialIndex = 0; // New variable to create unique material identifiers
        Object.values(gltf.meshes).forEach(function (mesh) {
            Object.values(mesh.primitives).forEach(function (primitive) {
                var attributes = primitive.attributes;
                // Handling vertices
                if (attributes.POSITION !== undefined) {
                    var positions = attributes.POSITION.value;
                    for (var i = 0; i < positions.length; i += 3) {
                        meshVertices.push(new vector_1.Vector3(positions[i + 0], positions[i + 1], positions[i + 2]));
                    }
                }
                // Handling normals
                if (attributes.NORMAL !== undefined) {
                    var normals = attributes.NORMAL.value;
                    for (var i = 0; i < normals.length; i += 3) {
                        meshNormals.push(new vector_1.Vector3(normals[i + 0], normals[i + 1], normals[i + 2]));
                    }
                }
                // Handling texture coordinates
                if (attributes.TEXCOORD_0 !== undefined) {
                    var texcoords = attributes.TEXCOORD_0.value;
                    for (var i = 0; i < texcoords.length; i += 2) {
                        meshTexcoords.push(new util_1.UV(texcoords[i + 0], 1.0 - texcoords[i + 1]));
                    }
                }
                // Material
                var materialBaseName = 'NONE';
                if (primitive.material) {
                    materialBaseName = primitive.material.name || 'Material';
                }
                var materialNameToUse = materialBaseName + '_' + materialIndex; // Unique material identifier
                materialIndex++; // Increment material index
                // Handling materials
                if (primitive.material) {
                    var pbr = primitive.material.pbrMetallicRoughness;
                    if (pbr !== undefined) {
                        var diffuseTexture = pbr.baseColorTexture;
                        if (diffuseTexture !== undefined) {
                            var imageData = diffuseTexture.texture.source.bufferView.data;
                            var mimeType = diffuseTexture.texture.source.mimeType;
                            try {
                                console.log('mimeType', mimeType);
                                console.log('imageData', imageData);
                                if (mimeType !== 'image/png' && mimeType !== 'image/jpeg') {
                                    status_1.StatusHandler.warning((0, localiser_1.LOC)('import.unsupported_image_type', { file_name: diffuseTexture.texture.source.id, file_type: mimeType }));
                                    throw new Error('Unsupported image type');
                                }
                                var base64 = btoa(imageData.reduce(function (data, byte) { return data + String.fromCharCode(byte); }, ''));
                                meshMaterials.set(materialNameToUse, {
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
                                meshMaterials.set(materialNameToUse, {
                                    type: mesh_1.MaterialType.solid,
                                    colour: colour_1.RGBAUtil.copy(colour_1.RGBAColours.WHITE),
                                    needsAttention: false,
                                    canBeTextured: true,
                                });
                            }
                        }
                    }
                }
                // Indices
                var indices = primitive.indices.value;
                for (var i = 0; i < indices.length / 3; ++i) {
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
                var localMax = 0;
                for (var i = 0; i < indices.length; ++i) {
                    localMax = Math.max(localMax, indices[i]);
                }
                maxIndex += localMax + 1;
            });
        });
        return new mesh_1.Mesh(meshVertices, meshNormals, meshTexcoords, meshTriangles, meshMaterials);
    };
    return GltfLoader;
}(base_importer_1.IImporter));
exports.GltfLoader = GltfLoader;
