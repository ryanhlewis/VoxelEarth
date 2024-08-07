"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferGenerator = exports.ChunkedBufferGenerator = void 0;
var config_1 = require("./config");
var constants_1 = require("./constants");
var geometry_1 = require("./geometry");
var occlusion_1 = require("./occlusion");
// var progress_1 = require("./progress");
var util_1 = require("./util");
var error_util_1 = require("./util/error_util");
var vector_1 = require("./vector");
var ChunkedBufferGenerator = /** @class */ (function () {
    function ChunkedBufferGenerator() {
    }
    ChunkedBufferGenerator.fromVoxelMesh = function (voxelMesh, params, chunkIndex) {
        var numTotalVoxels = voxelMesh.getVoxelCount();
        var voxelsStartIndex = chunkIndex * config_1.AppConfig.Get.VOXEL_BUFFER_CHUNK_SIZE;
        var voxelsEndIndex = Math.min((chunkIndex + 1) * config_1.AppConfig.Get.VOXEL_BUFFER_CHUNK_SIZE, numTotalVoxels);
        (0, error_util_1.ASSERT)(voxelsStartIndex < numTotalVoxels, 'Invalid voxel start index');
        var numBufferVoxels = voxelsEndIndex - voxelsStartIndex;
        var newBuffer = BufferGenerator.createVoxelMeshBuffer(numBufferVoxels);
        var cube = geometry_1.GeometryTemplates.getBoxBufferData(new vector_1.Vector3(0, 0, 0));
        var voxels = voxelMesh.getVoxels();
        // Build position buffer
        for (var i = 0; i < numBufferVoxels; ++i) {
            var voxel = voxels[i + voxelsStartIndex];
            var voxelPositionArray = voxel.position.toArray();
            for (var j = 0; j < constants_1.AppConstants.VoxelMeshBufferComponentOffsets.POSITION; ++j) {
                newBuffer.position.data[i * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.POSITION + j] = cube.custom.position[j] + voxelPositionArray[j % 3];
            }
        }
        // Build colour buffer
        for (var i = 0; i < numBufferVoxels; ++i) {
            var voxel = voxels[i + voxelsStartIndex];
            newBuffer.colour.data[i * 96 + 0] = voxel.colour.r;
            newBuffer.colour.data[i * 96 + 1] = voxel.colour.g;
            newBuffer.colour.data[i * 96 + 2] = voxel.colour.b;
            newBuffer.colour.data[i * 96 + 3] = voxel.colour.a;
            util_1.AppUtil.Array.repeatedFill(newBuffer.colour.data, i * 96, 4, 24);
        }
        // Build normal buffer
        {
            newBuffer.normal.data.set(cube.custom.normal, 0);
            util_1.AppUtil.Array.repeatedFill(newBuffer.normal.data, 0, 72, numBufferVoxels);
        }
        // Build texcoord buffer
        {
            newBuffer.texcoord.data.set(cube.custom.texcoord, 0);
            util_1.AppUtil.Array.repeatedFill(newBuffer.texcoord.data, 0, 48, numBufferVoxels);
        }
        // Build indices buffer
        for (var i = 0; i < numBufferVoxels; ++i) {
            for (var j = 0; j < constants_1.AppConstants.VoxelMeshBufferComponentOffsets.INDICES; ++j) {
                newBuffer.indices.data[i * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.INDICES + j] = cube.indices[j] + (i * constants_1.AppConstants.INDICES_PER_VOXEL);
            }
        }
        // Build occlusion buffer
        if (params.enableAmbientOcclusion) {
            var voxelOcclusionArray = new Float32Array(96);
            for (var i = 0; i < numBufferVoxels; ++i) {
                var voxel = voxels[i + voxelsStartIndex];
                occlusion_1.OcclusionManager.Get.getOcclusions(voxelOcclusionArray, voxel.position, voxelMesh);
                newBuffer.occlusion.data.set(voxelOcclusionArray, i * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.OCCLUSION);
            }
        }
        return {
            buffer: newBuffer,
            numElements: newBuffer.indices.data.length,
            moreVoxelsToBuffer: voxelsEndIndex !== numTotalVoxels,
            progress: voxelsStartIndex / numTotalVoxels,
        };
    };
    ChunkedBufferGenerator.fromBlockMesh = function (blockMesh, chunkIndex) {
        var _a, _b;
        var blocks = blockMesh.getBlocks();
        var lightingRamp = new Map();
        lightingRamp.set(15, 40 / 40);
        lightingRamp.set(14, 40 / 40);
        lightingRamp.set(13, 39 / 40);
        lightingRamp.set(12, 37 / 40);
        lightingRamp.set(11, 35 / 40);
        lightingRamp.set(10, 32 / 40);
        lightingRamp.set(9, 29 / 40);
        lightingRamp.set(8, 26 / 40);
        lightingRamp.set(7, 23 / 40);
        lightingRamp.set(6, 20 / 40);
        lightingRamp.set(5, 17 / 40);
        lightingRamp.set(4, 14 / 40);
        lightingRamp.set(3, 12 / 40);
        lightingRamp.set(2, 9 / 40);
        lightingRamp.set(1, 7 / 40);
        lightingRamp.set(0, 5 / 40);
        var numTotalBlocks = blocks.length;
        var blocksStartIndex = chunkIndex * config_1.AppConfig.Get.VOXEL_BUFFER_CHUNK_SIZE;
        var blocksEndIndex = Math.min((chunkIndex + 1) * config_1.AppConfig.Get.VOXEL_BUFFER_CHUNK_SIZE, numTotalBlocks);
        (0, error_util_1.ASSERT)(blocksStartIndex < numTotalBlocks, 'Invalid block start index');
        var numBufferBlocks = blocksEndIndex - blocksStartIndex;
        var voxelChunkBuffer = blockMesh.getVoxelMesh().getChunkedBuffer(chunkIndex);
        var newBuffer = BufferGenerator.createBlockMeshBuffer(numBufferBlocks, voxelChunkBuffer.buffer);
        var faceOrder = ['north', 'south', 'up', 'down', 'east', 'west'];
        var insertIndex = 0;
        var lightingInsertIndex = 0;
        //const blockPositionArray = new Float32Array(3);
        for (var i = 0; i < numBufferBlocks; ++i) {
            var blockIndex = i + blocksStartIndex;
            var blockLighting = blockMesh.getBlockLighting(blocks[blockIndex].voxel.position);
            for (var f = 0; f < constants_1.AppConstants.FACES_PER_VOXEL; ++f) {
                var faceName = faceOrder[f];
                var faceLighting = (_b = lightingRamp.get((_a = blockLighting[f]) !== null && _a !== void 0 ? _a : 15)) !== null && _b !== void 0 ? _b : 1.0;
                var texcoord = blocks[blockIndex].blockInfo.faces[faceName].texcoord;
                for (var v = 0; v < constants_1.AppConstants.VERTICES_PER_FACE; ++v) {
                    newBuffer.blockTexcoord.data[insertIndex++] = texcoord.u;
                    newBuffer.blockTexcoord.data[insertIndex++] = texcoord.v;
                    newBuffer.lighting.data[lightingInsertIndex++] = faceLighting;
                }
            }
            //const blockPosition = blocks[blockIndex].voxel.position.toArray();
            //blocks[blockIndex].voxel.position.intoArray(blockPositionArray, 0);
            newBuffer.blockPosition.data[i * 72 + 0] = blocks[blockIndex].voxel.position.x;
            newBuffer.blockPosition.data[i * 72 + 1] = blocks[blockIndex].voxel.position.y;
            newBuffer.blockPosition.data[i * 72 + 2] = blocks[blockIndex].voxel.position.z;
            util_1.AppUtil.Array.repeatedFill(newBuffer.blockPosition.data, i * 72, 3, 24);
        }
        return {
            buffer: newBuffer,
            numElements: newBuffer.indices.data.length,
            moreBlocksToBuffer: voxelChunkBuffer.moreVoxelsToBuffer,
            progress: voxelChunkBuffer.progress,
        };
    };
    return ChunkedBufferGenerator;
}());
exports.ChunkedBufferGenerator = ChunkedBufferGenerator;
var BufferGenerator = /** @class */ (function () {
    function BufferGenerator() {
    }
    BufferGenerator.fromMesh = function (mesh) {
        var _a;
        var numTris = mesh.getTriangleCount();
        // Count the number of triangles that use each material
        var materialTriangleCount = new Map();
        {
            for (var triIndex = 0; triIndex < numTris; ++triIndex) {
                var materialName = mesh.getMaterialByTriangle(triIndex);
                var triangleCount = (_a = materialTriangleCount.get(materialName)) !== null && _a !== void 0 ? _a : 0;
                materialTriangleCount.set(materialName, triangleCount + 1);
            }
        }
        var materialBuffers = [];
        var trianglesHandled = 0;
        // var taskHandle = progress_1.ProgressManager.Get.start('MeshBuffer');
        // Create the buffers for each material and fill with data from the triangles
        materialTriangleCount.forEach(function (triangleCount, materialName) {
            var materialBuffer = BufferGenerator.createMaterialBuffer(triangleCount);
            var insertIndex = 0;
            for (var triIndex = 0; triIndex < numTris; ++triIndex) {
                // progress_1.ProgressManager.Get.progress(taskHandle, trianglesHandled / numTris);
                var material_1 = mesh.getMaterialByTriangle(triIndex);
                if (material_1 === materialName) {
                    ++trianglesHandled;
                    var uiTriangle = mesh.getUVTriangle(triIndex);
                    // Position
                    {
                        materialBuffer.position.data.set(uiTriangle.v0.toArray(), insertIndex * 9 + 0);
                        materialBuffer.position.data.set(uiTriangle.v1.toArray(), insertIndex * 9 + 3);
                        materialBuffer.position.data.set(uiTriangle.v2.toArray(), insertIndex * 9 + 6);
                    }
                    // Texcoord
                    {
                        materialBuffer.texcoord.data.set([uiTriangle.uv0.u, uiTriangle.uv0.v], insertIndex * 6 + 0);
                        materialBuffer.texcoord.data.set([uiTriangle.uv1.u, uiTriangle.uv1.v], insertIndex * 6 + 2);
                        materialBuffer.texcoord.data.set([uiTriangle.uv2.u, uiTriangle.uv2.v], insertIndex * 6 + 4);
                    }
                    // Normal
                    {
                        materialBuffer.normal.data.set(uiTriangle.n0.toArray(), insertIndex * 9 + 0);
                        materialBuffer.normal.data.set(uiTriangle.n1.toArray(), insertIndex * 9 + 3);
                        materialBuffer.normal.data.set(uiTriangle.n2.toArray(), insertIndex * 9 + 6);
                    }
                    // Indices
                    {
                        materialBuffer.indices.data.set([
                            insertIndex * 3 + 0,
                            insertIndex * 3 + 1,
                            insertIndex * 3 + 2,
                        ], insertIndex * 3);
                    }
                    ++insertIndex;
                }
            }
            var material = mesh.getMaterialByName(materialName);
            (0, error_util_1.ASSERT)(material !== undefined);
            materialBuffers.push({
                buffer: materialBuffer,
                material: material,
                numElements: materialBuffer.indices.data.length,
                materialName: materialName,
            });
        });
        // progress_1.ProgressManager.Get.end(taskHandle);
        return materialBuffers;
    };
    /*
    public static fromVoxelMesh(voxelMesh: VoxelMesh, params: RenderVoxelMeshParams.Input): TVoxelMeshBufferDescription {
        const numVoxels = voxelMesh.getVoxelCount();
        const newBuffer: TVoxelMeshBuffer = this.createVoxelMeshBuffer(numVoxels);

        const cube: AttributeData = GeometryTemplates.getBoxBufferData(new Vector3(0, 0, 0));
        const voxels = voxelMesh.getVoxels();

        const taskHandle = ProgressManager.Get.start('VoxelMeshBuffer');
        for (let i = 0; i < numVoxels; ++i) {
            ProgressManager.Get.progress(taskHandle, i / numVoxels);

            const voxel = voxels[i];
            const voxelColourArray = [voxel.colour.r, voxel.colour.g, voxel.colour.b, voxel.colour.a];
            const voxelPositionArray = voxel.position.toArray();

            for (let j = 0; j < AppConstants.VoxelMeshBufferComponentOffsets.POSITION; ++j) {
                newBuffer.position.data[i * AppConstants.VoxelMeshBufferComponentOffsets.POSITION + j] = cube.custom.position[j] + voxelPositionArray[j % 3];
            }

            for (let j = 0; j < AppConstants.VoxelMeshBufferComponentOffsets.COLOUR; ++j) {
                newBuffer.colour.data[i * AppConstants.VoxelMeshBufferComponentOffsets.COLOUR + j] = voxelColourArray[j % 4];
            }

            for (let j = 0; j < AppConstants.VoxelMeshBufferComponentOffsets.NORMAL; ++j) {
                newBuffer.normal.data[i * AppConstants.VoxelMeshBufferComponentOffsets.NORMAL + j] = cube.custom.normal[j];
            }

            for (let j = 0; j < AppConstants.VoxelMeshBufferComponentOffsets.TEXCOORD; ++j) {
                newBuffer.texcoord.data[i * AppConstants.VoxelMeshBufferComponentOffsets.TEXCOORD + j] = cube.custom.texcoord[j];
            }

            for (let j = 0; j < AppConstants.VoxelMeshBufferComponentOffsets.INDICES; ++j) {
                newBuffer.indices.data[i * AppConstants.VoxelMeshBufferComponentOffsets.INDICES + j] = cube.indices[j] + (i * AppConstants.INDICES_PER_VOXEL);
            }

            if (params.enableAmbientOcclusion) {
                const voxelOcclusionArray = OcclusionManager.Get.getOcclusions(voxel.position, voxelMesh);
                for (let j = 0; j < AppConstants.VoxelMeshBufferComponentOffsets.OCCLUSION; ++j) {
                    newBuffer.occlusion.data[i * AppConstants.VoxelMeshBufferComponentOffsets.OCCLUSION + j] = voxelOcclusionArray[j];
                }
            }
        }
        ProgressManager.Get.end(taskHandle);

        return {
            buffer: newBuffer,
            numElements: newBuffer.indices.data.length,
        };
    }
    */
    /*
    public static fromBlockMesh(blockMesh: BlockMesh): TBlockMeshBufferDescription {
        const blocks = blockMesh.getBlocks();
        const numBlocks = blocks.length;

        const newBuffer = this.createBlockMeshBuffer(numBlocks, blockMesh.getVoxelMesh().getBuffer().buffer);

        const faceOrder = ['north', 'south', 'up', 'down', 'east', 'west'];
        let insertIndex = 0;

        const taskHandle = ProgressManager.Get.start('BlockMeshBuffer');
        for (let i = 0; i < numBlocks; ++i) {
            ProgressManager.Get.progress(taskHandle, i / numBlocks);

            for (let f = 0; f < AppConstants.FACES_PER_VOXEL; ++f) {
                const faceName = faceOrder[f];
                const texcoord = blocks[i].blockInfo.faces[faceName].texcoord;
                for (let v = 0; v < AppConstants.VERTICES_PER_FACE; ++v) {
                    newBuffer.blockTexcoord.data[insertIndex++] = texcoord.u;
                    newBuffer.blockTexcoord.data[insertIndex++] = texcoord.v;
                }
            }
        }
        ProgressManager.Get.end(taskHandle);

        return {
            buffer: newBuffer,
            numElements: newBuffer.indices.data.length,
        };
    }
    */
    BufferGenerator.createMaterialBuffer = function (triangleCount) {
        return {
            position: {
                numComponents: 3,
                data: new Float32Array(triangleCount * 3 * 3),
            },
            texcoord: {
                numComponents: 2,
                data: new Float32Array(triangleCount * 3 * 2),
            },
            normal: {
                numComponents: 3,
                data: new Float32Array(triangleCount * 3 * 3),
            },
            indices: {
                numComponents: 3,
                data: new Uint32Array(triangleCount * 3),
            },
        };
    };
    BufferGenerator.createVoxelMeshBuffer = function (numVoxels) {
        return {
            position: {
                numComponents: 3,
                data: new Float32Array(numVoxels * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.POSITION),
            },
            colour: {
                numComponents: 4,
                data: new Float32Array(numVoxels * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.COLOUR),
            },
            occlusion: {
                numComponents: 4,
                data: new Float32Array(numVoxels * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.OCCLUSION).fill(1.0),
            },
            texcoord: {
                numComponents: 2,
                data: new Float32Array(numVoxels * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.TEXCOORD),
            },
            normal: {
                numComponents: 3,
                data: new Float32Array(numVoxels * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.NORMAL),
            },
            indices: {
                numComponents: 3,
                data: new Uint32Array(numVoxels * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.INDICES),
            },
        };
    };
    BufferGenerator.createBlockMeshBuffer = function (numBlocks, voxelMeshBuffer) {
        return {
            position: {
                numComponents: constants_1.AppConstants.ComponentSize.POSITION,
                data: voxelMeshBuffer.position.data,
            },
            colour: {
                numComponents: constants_1.AppConstants.ComponentSize.COLOUR,
                data: voxelMeshBuffer.colour.data,
            },
            occlusion: {
                numComponents: constants_1.AppConstants.ComponentSize.OCCLUSION,
                data: voxelMeshBuffer.occlusion.data,
            },
            texcoord: {
                numComponents: constants_1.AppConstants.ComponentSize.TEXCOORD,
                data: voxelMeshBuffer.texcoord.data,
            },
            normal: {
                numComponents: constants_1.AppConstants.ComponentSize.NORMAL,
                data: voxelMeshBuffer.normal.data,
            },
            indices: {
                numComponents: constants_1.AppConstants.ComponentSize.INDICES,
                data: voxelMeshBuffer.indices.data,
            },
            blockTexcoord: {
                numComponents: constants_1.AppConstants.ComponentSize.TEXCOORD,
                data: new Float32Array(numBlocks * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.TEXCOORD),
            },
            blockPosition: {
                numComponents: constants_1.AppConstants.ComponentSize.POSITION,
                data: new Float32Array(numBlocks * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.POSITION),
            },
            lighting: {
                numComponents: constants_1.AppConstants.ComponentSize.LIGHTING,
                data: new Float32Array(numBlocks * constants_1.AppConstants.VoxelMeshBufferComponentOffsets.LIGHTING),
            },
        };
    };
    return BufferGenerator;
}());
exports.BufferGenerator = BufferGenerator;
