"use strict";
//import { NBT, TagType } from 'prismarine-nbt';
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
exports.Schematic = void 0;
var prismarine_nbt_1 = require("prismarine-nbt");
var block_ids_1 = require("../../res/block_ids");
var localiser_1 = require("../localiser");
var status_1 = require("../status");
var log_util_1 = require("../util/log_util");
var nbt_util_1 = require("../util/nbt_util");
var vector_1 = require("../vector");
var base_exporter_1 = require("./base_exporter");
var Schematic = /** @class */ (function (_super) {
    __extends(Schematic, _super);
    function Schematic() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Schematic.prototype.getFormatFilter = function () {
        return {
            name: 'Schematic',
            extension: 'schematic',
        };
    };
    Schematic.prototype.export = function (blockMesh) {
        var nbt = this._convertToNBT(blockMesh);
        return { type: 'single', extension: '.schematic', content: (0, nbt_util_1.saveNBT)(nbt) };
    };
    Schematic.prototype._convertToNBT = function (blockMesh) {
        var bounds = blockMesh.getVoxelMesh().getBounds();
        var sizeVector = vector_1.Vector3.sub(bounds.max, bounds.min).add(1);
        var bufferSize = sizeVector.x * sizeVector.y * sizeVector.z;
        var blocksData = Array(bufferSize);
        var metaData = Array(bufferSize);
        // TODO Unimplemented
        var schematicBlocks = block_ids_1.BLOCK_IDS;
        var blocks = blockMesh.getBlocks();
        var unsupportedBlocks = new Set();
        var numBlocksUnsupported = 0;
        for (var _i = 0, blocks_1 = blocks; _i < blocks_1.length; _i++) {
            var block = blocks_1[_i];
            var indexVector = vector_1.Vector3.sub(block.voxel.position, bounds.min);
            var index = this._getBufferIndex(indexVector, sizeVector);
            if (block.blockInfo.name in schematicBlocks) {
                var schematicBlock = schematicBlocks[block.blockInfo.name];
                blocksData[index] = new Int8Array([schematicBlock.id])[0];
                metaData[index] = new Int8Array([schematicBlock.meta])[0];
            }
            else {
                blocksData[index] = 1; // Default to a Stone block
                metaData[index] = 0;
                unsupportedBlocks.add(block.blockInfo.name);
                ++numBlocksUnsupported;
            }
        }
        if (unsupportedBlocks.size > 0) {
            status_1.StatusHandler.warning((0, localiser_1.LOC)('export.schematic_unsupported_blocks', { count: numBlocksUnsupported, unique: unsupportedBlocks.size }));
            (0, log_util_1.LOG_WARN)(unsupportedBlocks);
        }
        // TODO Unimplemented
        var nbt = {
            type: prismarine_nbt_1.TagType.Compound,
            name: 'Schematic',
            value: {
                Width: { type: prismarine_nbt_1.TagType.Short, value: sizeVector.x },
                Height: { type: prismarine_nbt_1.TagType.Short, value: sizeVector.y },
                Length: { type: prismarine_nbt_1.TagType.Short, value: sizeVector.z },
                Materials: { type: prismarine_nbt_1.TagType.String, value: 'Alpha' },
                Blocks: { type: prismarine_nbt_1.TagType.ByteArray, value: blocksData },
                Data: { type: prismarine_nbt_1.TagType.ByteArray, value: metaData },
                Entities: { type: prismarine_nbt_1.TagType.List, value: { type: prismarine_nbt_1.TagType.Int, value: Array(0) } },
                TileEntities: { type: prismarine_nbt_1.TagType.List, value: { type: prismarine_nbt_1.TagType.Int, value: Array(0) } },
            },
        };
        return nbt;
    };
    Schematic.prototype._getBufferIndex = function (vec, sizeVector) {
        return (sizeVector.z * sizeVector.x * vec.y) + (sizeVector.x * vec.z) + vec.x;
    };
    return Schematic;
}(base_exporter_1.IExporter));
exports.Schematic = Schematic;
//# sourceMappingURL=schematic_exporter.js.map