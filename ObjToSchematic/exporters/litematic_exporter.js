"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Litematic = void 0;
const prismarine_nbt_1 = require("prismarine-nbt");
const constants_1 = require("../constants");
const math_1 = require("../math");
const error_util_1 = require("../util/error_util");
const nbt_util_1 = require("../util/nbt_util");
const vector_1 = require("../vector");
const base_exporter_1 = require("./base_exporter");
class Litematic extends base_exporter_1.IExporter {
    getFormatFilter() {
        return {
            name: 'Litematic',
            extension: 'litematic',
        };
    }
    export(blockMesh) {
        const nbt = this._convertToNBT(blockMesh);
        return { type: 'single', extension: '.litematic', content: (0, nbt_util_1.saveNBT)(nbt) };
    }
    /**
     * Create a mapping from block names to their respecitve index in the block state palette.
     */
    _createBlockMapping(blockMesh) {
        const blockMapping = new Map();
        blockMapping.set('minecraft:air', 0);
        blockMesh.getBlockPalette().forEach((blockName, index) => {
            blockMapping.set(blockName, index + 1);
        });
        return blockMapping;
    }
    /**
     * Pack the blocks into a buffer that's the dimensions of the block mesh.
     */
    _createBlockBuffer(blockMesh, blockMapping) {
        var _a;
        const bounds = (_a = blockMesh.getVoxelMesh()) === null || _a === void 0 ? void 0 : _a.getBounds();
        const sizeVector = vector_1.Vector3.sub(bounds.max, bounds.min).add(1);
        const buffer = new Uint32Array(sizeVector.x * sizeVector.y * sizeVector.z);
        blockMesh.getBlocks().forEach((block) => {
            const indexVector = vector_1.Vector3.sub(block.voxel.position, bounds.min);
            const bufferIndex = (sizeVector.z * sizeVector.x * indexVector.y) + (sizeVector.x * indexVector.z) + indexVector.x; // XZY ordering
            const mappingIndex = blockMapping.get(block.blockInfo.name);
            (0, error_util_1.ASSERT)(mappingIndex !== undefined, 'Invalid mapping index');
            buffer[bufferIndex] = mappingIndex;
        });
        return buffer;
    }
    _createBlockStates(blockMesh, blockMapping) {
        const buffer = this._encodeBlockBuffer(blockMesh, blockMapping);
        const numBytes = buffer.length;
        const numBits = numBytes * 8;
        const blockStates = new Array(Math.ceil(numBits / 64));
        let index = 0;
        for (let i = numBits; i > 0; i -= 64) {
            const rightBaseIndexBit = i - 32;
            const rightBaseIndexByte = rightBaseIndexBit / 8;
            let right = 0;
            right = (right << 8) + buffer[rightBaseIndexByte + 0];
            right = (right << 8) + buffer[rightBaseIndexByte + 1];
            right = (right << 8) + buffer[rightBaseIndexByte + 2];
            right = (right << 8) + buffer[rightBaseIndexByte + 3];
            const leftBaseIndexBit = i - 64;
            const leftBaseIndexByte = leftBaseIndexBit / 8;
            let left = 0;
            left = (left << 8) + buffer[leftBaseIndexByte + 0];
            left = (left << 8) + buffer[leftBaseIndexByte + 1];
            left = (left << 8) + buffer[leftBaseIndexByte + 2];
            left = (left << 8) + buffer[leftBaseIndexByte + 3];
            blockStates[index++] = [left, right];
        }
        return blockStates;
    }
    _encodeBlockBuffer(blockMesh, blockMapping) {
        const blockBuffer = this._createBlockBuffer(blockMesh, blockMapping);
        const paletteSize = blockMapping.size;
        const stride = Math.ceil(Math.log2(paletteSize - 1));
        (0, error_util_1.ASSERT)(stride >= 1, `Stride too small: ${stride}`);
        const expectedLengthBits = blockBuffer.length * stride;
        const requiredLengthBits = (0, math_1.ceilToNearest)(expectedLengthBits, 64);
        const startOffsetBits = requiredLengthBits - expectedLengthBits;
        const requiredLengthBytes = requiredLengthBits / 8;
        const buffer = Buffer.alloc(requiredLengthBytes);
        // Write first few offset bits
        const fullBytesToWrite = Math.floor(startOffsetBits / 8);
        for (let i = 0; i < fullBytesToWrite; ++i) {
            buffer[i] = 0;
        }
        const remainingBitsToWrite = startOffsetBits - (fullBytesToWrite * 8);
        let currentByte = 0;
        let bitsWrittenToByte = remainingBitsToWrite;
        let nextBufferWriteIndex = fullBytesToWrite;
        for (let i = blockBuffer.length - 1; i >= 0; --i) {
            for (let j = 0; j < stride; ++j) {
                if (bitsWrittenToByte === 8) {
                    buffer[nextBufferWriteIndex] = currentByte;
                    ++nextBufferWriteIndex;
                    currentByte = 0; // Shouldn't be actually necessary to reset
                    bitsWrittenToByte = 0;
                }
                const bitToAddToByte = (blockBuffer[i] >> (stride - j - 1)) & 1;
                currentByte = (currentByte << 1) + bitToAddToByte;
                ++bitsWrittenToByte;
            }
        }
        // Write remaining partially filled byte
        buffer[nextBufferWriteIndex] = currentByte;
        ++nextBufferWriteIndex;
        currentByte = 0; // Shouldn't be actually necessary to reset
        bitsWrittenToByte = 0;
        return buffer;
    }
    _createBlockStatePalette(blockMapping) {
        const blockStatePalette = Array(Object.keys(blockMapping).length);
        blockMapping.forEach((index, blockName) => {
            blockStatePalette[index] = { Name: { type: prismarine_nbt_1.TagType.String, value: blockName } };
        });
        blockStatePalette[0] = { Name: { type: prismarine_nbt_1.TagType.String, value: 'minecraft:air' } };
        return blockStatePalette;
    }
    _convertToNBT(blockMesh) {
        var _a;
        const bounds = (_a = blockMesh.getVoxelMesh()) === null || _a === void 0 ? void 0 : _a.getBounds();
        const sizeVector = vector_1.Vector3.sub(bounds.max, bounds.min).add(1);
        const bufferSize = sizeVector.x * sizeVector.y * sizeVector.z;
        const blockMapping = this._createBlockMapping(blockMesh);
        const blockStates = this._createBlockStates(blockMesh, blockMapping);
        const blockStatePalette = this._createBlockStatePalette(blockMapping);
        const numBlocks = blockMesh.getBlocks().length;
        const nbt = {
            type: prismarine_nbt_1.TagType.Compound,
            name: 'Litematic',
            value: {
                Metadata: {
                    type: prismarine_nbt_1.TagType.Compound, value: {
                        Author: { type: prismarine_nbt_1.TagType.String, value: '' },
                        Description: { type: prismarine_nbt_1.TagType.String, value: '' },
                        Size: {
                            type: prismarine_nbt_1.TagType.Compound, value: {
                                x: { type: prismarine_nbt_1.TagType.Int, value: sizeVector.x },
                                y: { type: prismarine_nbt_1.TagType.Int, value: sizeVector.y },
                                z: { type: prismarine_nbt_1.TagType.Int, value: sizeVector.z },
                            },
                        },
                        Name: { type: prismarine_nbt_1.TagType.String, value: '' },
                        RegionCount: { type: prismarine_nbt_1.TagType.Int, value: 1 },
                        TimeCreated: { type: prismarine_nbt_1.TagType.Long, value: [0, 0] },
                        TimeModified: { type: prismarine_nbt_1.TagType.Long, value: [0, 0] },
                        TotalBlocks: { type: prismarine_nbt_1.TagType.Int, value: numBlocks },
                        TotalVolume: { type: prismarine_nbt_1.TagType.Int, value: bufferSize },
                    },
                },
                Regions: {
                    type: prismarine_nbt_1.TagType.Compound, value: {
                        Unnamed: {
                            type: prismarine_nbt_1.TagType.Compound, value: {
                                BlockStates: { type: prismarine_nbt_1.TagType.LongArray, value: blockStates },
                                PendingBlockTicks: { type: prismarine_nbt_1.TagType.List, value: { type: prismarine_nbt_1.TagType.Int, value: [] } },
                                Position: {
                                    type: prismarine_nbt_1.TagType.Compound, value: {
                                        x: { type: prismarine_nbt_1.TagType.Int, value: 0 },
                                        y: { type: prismarine_nbt_1.TagType.Int, value: 0 },
                                        z: { type: prismarine_nbt_1.TagType.Int, value: 0 },
                                    },
                                },
                                BlockStatePalette: { type: prismarine_nbt_1.TagType.List, value: { type: prismarine_nbt_1.TagType.Compound, value: blockStatePalette } },
                                Size: {
                                    type: prismarine_nbt_1.TagType.Compound, value: {
                                        x: { type: prismarine_nbt_1.TagType.Int, value: sizeVector.x },
                                        y: { type: prismarine_nbt_1.TagType.Int, value: sizeVector.y },
                                        z: { type: prismarine_nbt_1.TagType.Int, value: sizeVector.z },
                                    },
                                },
                                PendingFluidTicks: { type: prismarine_nbt_1.TagType.List, value: { type: prismarine_nbt_1.TagType.Int, value: [] } },
                                TileEntities: { type: prismarine_nbt_1.TagType.List, value: { type: prismarine_nbt_1.TagType.Int, value: [] } },
                                Entities: { type: prismarine_nbt_1.TagType.List, value: { type: prismarine_nbt_1.TagType.Int, value: [] } },
                            },
                        },
                    },
                },
                MinecraftDataVersion: { type: prismarine_nbt_1.TagType.Int, value: constants_1.AppConstants.DATA_VERSION },
                Version: { type: prismarine_nbt_1.TagType.Int, value: 5 },
            },
        };
        return nbt;
    }
}
exports.Litematic = Litematic;
