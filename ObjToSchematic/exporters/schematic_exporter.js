"use strict";
//import { NBT, TagType } from 'prismarine-nbt';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schematic = void 0;
const prismarine_nbt_1 = require("prismarine-nbt");
const block_ids_1 = require("../../res/block_ids");
const localiser_1 = require("../localiser");
const status_1 = require("../status");
const log_util_1 = require("../util/log_util");
const nbt_util_1 = require("../util/nbt_util");
const vector_1 = require("../vector");
const base_exporter_1 = require("./base_exporter");
class Schematic extends base_exporter_1.IExporter {
    getFormatFilter() {
        return {
            name: 'Schematic',
            extension: 'schematic',
        };
    }
    export(blockMesh) {
        const nbt = this._convertToNBT(blockMesh);
        return { type: 'single', extension: '.schematic', content: (0, nbt_util_1.saveNBT)(nbt) };
    }
    _convertToNBT(blockMesh) {
        const bounds = blockMesh.getVoxelMesh().getBounds();
        const sizeVector = vector_1.Vector3.sub(bounds.max, bounds.min).add(1);
        const bufferSize = sizeVector.x * sizeVector.y * sizeVector.z;
        const blocksData = Array(bufferSize);
        const metaData = Array(bufferSize);
        // TODO Unimplemented
        const schematicBlocks = block_ids_1.BLOCK_IDS;
        const blocks = blockMesh.getBlocks();
        const unsupportedBlocks = new Set();
        let numBlocksUnsupported = 0;
        for (const block of blocks) {
            const indexVector = vector_1.Vector3.sub(block.voxel.position, bounds.min);
            const index = this._getBufferIndex(indexVector, sizeVector);
            if (block.blockInfo.name in schematicBlocks) {
                const schematicBlock = schematicBlocks[block.blockInfo.name];
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
        const nbt = {
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
    }
    _getBufferIndex(vec, sizeVector) {
        return (sizeVector.z * sizeVector.x * vec.y) + (sizeVector.x * vec.z) + vec.x;
    }
}
exports.Schematic = Schematic;
