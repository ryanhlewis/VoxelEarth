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
exports.Litematic = void 0;
var prismarine_nbt_1 = require("prismarine-nbt");
var constants_1 = require("../constants");
var math_1 = require("../math");
var error_util_1 = require("../util/error_util");
var nbt_util_1 = require("../util/nbt_util");
var vector_1 = require("../vector");
var base_exporter_1 = require("./base_exporter");
var Litematic = /** @class */ (function (_super) {
    __extends(Litematic, _super);
    function Litematic() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Litematic.prototype.getFormatFilter = function () {
        return {
            name: 'Litematic',
            extension: 'litematic',
        };
    };
    Litematic.prototype.export = function (blockMesh) {
        var nbt = this._convertToNBT(blockMesh);
        return { type: 'single', extension: '.litematic', content: (0, nbt_util_1.saveNBT)(nbt) };
    };
    /**
     * Create a mapping from block names to their respecitve index in the block state palette.
     */
    Litematic.prototype._createBlockMapping = function (blockMesh) {
        var blockMapping = new Map();
        blockMapping.set('minecraft:air', 0);
        blockMesh.getBlockPalette().forEach(function (blockName, index) {
            blockMapping.set(blockName, index + 1);
        });
        return blockMapping;
    };
    /**
     * Pack the blocks into a buffer that's the dimensions of the block mesh.
     */
    Litematic.prototype._createBlockBuffer = function (blockMesh, blockMapping) {
        var _a;
        var bounds = (_a = blockMesh.getVoxelMesh()) === null || _a === void 0 ? void 0 : _a.getBounds();
        var sizeVector = vector_1.Vector3.sub(bounds.max, bounds.min).add(1);
        var buffer = new Uint32Array(sizeVector.x * sizeVector.y * sizeVector.z);
        blockMesh.getBlocks().forEach(function (block) {
            var indexVector = vector_1.Vector3.sub(block.voxel.position, bounds.min);
            var bufferIndex = (sizeVector.z * sizeVector.x * indexVector.y) + (sizeVector.x * indexVector.z) + indexVector.x; // XZY ordering
            var mappingIndex = blockMapping.get(block.blockInfo.name);
            (0, error_util_1.ASSERT)(mappingIndex !== undefined, 'Invalid mapping index');
            buffer[bufferIndex] = mappingIndex;
        });
        return buffer;
    };
    Litematic.prototype._createBlockStates = function (blockMesh, blockMapping) {
        var buffer = this._encodeBlockBuffer(blockMesh, blockMapping);
        var numBytes = buffer.length;
        var numBits = numBytes * 8;
        var blockStates = new Array(Math.ceil(numBits / 64));
        var index = 0;
        for (var i = numBits; i > 0; i -= 64) {
            var rightBaseIndexBit = i - 32;
            var rightBaseIndexByte = rightBaseIndexBit / 8;
            var right = 0;
            right = (right << 8) + buffer[rightBaseIndexByte + 0];
            right = (right << 8) + buffer[rightBaseIndexByte + 1];
            right = (right << 8) + buffer[rightBaseIndexByte + 2];
            right = (right << 8) + buffer[rightBaseIndexByte + 3];
            var leftBaseIndexBit = i - 64;
            var leftBaseIndexByte = leftBaseIndexBit / 8;
            var left = 0;
            left = (left << 8) + buffer[leftBaseIndexByte + 0];
            left = (left << 8) + buffer[leftBaseIndexByte + 1];
            left = (left << 8) + buffer[leftBaseIndexByte + 2];
            left = (left << 8) + buffer[leftBaseIndexByte + 3];
            blockStates[index++] = [left, right];
        }
        return blockStates;
    };
    Litematic.prototype._encodeBlockBuffer = function (blockMesh, blockMapping) {
        var blockBuffer = this._createBlockBuffer(blockMesh, blockMapping);
        var paletteSize = blockMapping.size;
        var stride = Math.ceil(Math.log2(paletteSize - 1));
        (0, error_util_1.ASSERT)(stride >= 1, "Stride too small: ".concat(stride));
        var expectedLengthBits = blockBuffer.length * stride;
        var requiredLengthBits = (0, math_1.ceilToNearest)(expectedLengthBits, 64);
        var startOffsetBits = requiredLengthBits - expectedLengthBits;
        var requiredLengthBytes = requiredLengthBits / 8;
        var buffer = Buffer.alloc(requiredLengthBytes);
        // Write first few offset bits
        var fullBytesToWrite = Math.floor(startOffsetBits / 8);
        for (var i = 0; i < fullBytesToWrite; ++i) {
            buffer[i] = 0;
        }
        var remainingBitsToWrite = startOffsetBits - (fullBytesToWrite * 8);
        var currentByte = 0;
        var bitsWrittenToByte = remainingBitsToWrite;
        var nextBufferWriteIndex = fullBytesToWrite;
        for (var i = blockBuffer.length - 1; i >= 0; --i) {
            for (var j = 0; j < stride; ++j) {
                if (bitsWrittenToByte === 8) {
                    buffer[nextBufferWriteIndex] = currentByte;
                    ++nextBufferWriteIndex;
                    currentByte = 0; // Shouldn't be actually necessary to reset
                    bitsWrittenToByte = 0;
                }
                var bitToAddToByte = (blockBuffer[i] >> (stride - j - 1)) & 1;
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
    };
    Litematic.prototype._createBlockStatePalette = function (blockMapping) {
        var blockStatePalette = Array(Object.keys(blockMapping).length);
        blockMapping.forEach(function (index, blockName) {
            blockStatePalette[index] = { Name: { type: prismarine_nbt_1.TagType.String, value: blockName } };
        });
        blockStatePalette[0] = { Name: { type: prismarine_nbt_1.TagType.String, value: 'minecraft:air' } };
        return blockStatePalette;
    };
    Litematic.prototype._convertToNBT = function (blockMesh) {
        var _a;
        var bounds = (_a = blockMesh.getVoxelMesh()) === null || _a === void 0 ? void 0 : _a.getBounds();
        var sizeVector = vector_1.Vector3.sub(bounds.max, bounds.min).add(1);
        var bufferSize = sizeVector.x * sizeVector.y * sizeVector.z;
        var blockMapping = this._createBlockMapping(blockMesh);
        var blockStates = this._createBlockStates(blockMesh, blockMapping);
        var blockStatePalette = this._createBlockStatePalette(blockMapping);
        var numBlocks = blockMesh.getBlocks().length;
        var nbt = {
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
    };
    return Litematic;
}(base_exporter_1.IExporter));
exports.Litematic = Litematic;
//# sourceMappingURL=litematic_exporter.js.map