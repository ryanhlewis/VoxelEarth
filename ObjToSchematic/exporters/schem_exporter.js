"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemExporter = void 0;
const prismarine_nbt_1 = require("prismarine-nbt");
const constants_1 = require("../constants");
const util_1 = require("../util");
const log_util_1 = require("../util/log_util");
const math_util_1 = require("../util/math_util");
const nbt_util_1 = require("../util/nbt_util");
const vector_1 = require("../vector");
const base_exporter_1 = require("./base_exporter");
class SchemExporter extends base_exporter_1.IExporter {
    getFormatFilter() {
        return {
            name: 'Sponge Schematic',
            extension: 'schem',
        };
    }
    export(blockMesh) {
        const bounds = blockMesh.getVoxelMesh().getBounds();
        const sizeVector = bounds.getDimensions().add(1);
        // https://github.com/SpongePowered/Schematic-Specification/blob/master/versions/schematic-3.md#paletteObject
        // const blockMapping: BlockMapping = {};
        const blockMapping = {
            'minecraft:air': { type: prismarine_nbt_1.TagType.Int, value: 0 },
        };
        let blockIndex = 1;
        for (const blockName of blockMesh.getBlockPalette()) {
            const namespacedBlockName = util_1.AppUtil.Text.namespaceBlock(blockName);
            blockMapping[namespacedBlockName] = { type: prismarine_nbt_1.TagType.Int, value: blockIndex };
            ++blockIndex;
        }
        (0, log_util_1.LOG)(blockMapping);
        // const paletteObject = SchemExporter._createBlockStatePalette(blockMapping);
        const blockData = new Array(sizeVector.x * sizeVector.y * sizeVector.z).fill(0);
        for (const block of blockMesh.getBlocks()) {
            const indexVector = vector_1.Vector3.sub(block.voxel.position, bounds.min);
            const bufferIndex = SchemExporter._getBufferIndex(sizeVector, indexVector);
            const namespacedBlockName = util_1.AppUtil.Text.namespaceBlock(block.blockInfo.name);
            blockData[bufferIndex] = blockMapping[namespacedBlockName].value;
        }
        const blockEncoding = [];
        for (let i = 0; i < blockData.length; ++i) {
            let id = blockData[i];
            while ((id & -128) != 0) {
                blockEncoding.push(id & 127 | 128);
                id >>>= 7;
            }
            blockEncoding.push(id);
        }
        for (let i = 0; i < blockEncoding.length; ++i) {
            blockEncoding[i] = math_util_1.MathUtil.int8(blockEncoding[i]);
        }
        const nbt = {
            type: prismarine_nbt_1.TagType.Compound,
            name: 'Schematic',
            value: {
                Version: { type: prismarine_nbt_1.TagType.Int, value: SchemExporter.SCHEMA_VERSION },
                DataVersion: { type: prismarine_nbt_1.TagType.Int, value: constants_1.AppConstants.DATA_VERSION },
                Width: { type: prismarine_nbt_1.TagType.Short, value: sizeVector.x },
                Height: { type: prismarine_nbt_1.TagType.Short, value: sizeVector.y },
                Length: { type: prismarine_nbt_1.TagType.Short, value: sizeVector.z },
                PaletteMax: { type: prismarine_nbt_1.TagType.Int, value: blockIndex },
                Palette: { type: prismarine_nbt_1.TagType.Compound, value: blockMapping },
                BlockData: { type: prismarine_nbt_1.TagType.ByteArray, value: blockEncoding },
            },
        };
        return { type: 'single', extension: '.schem', content: (0, nbt_util_1.saveNBT)(nbt) };
    }
    static _getBufferIndex(dimensions, vec) {
        return vec.x + (vec.z * dimensions.x) + (vec.y * dimensions.x * dimensions.z);
    }
}
exports.SchemExporter = SchemExporter;
SchemExporter.SCHEMA_VERSION = 2;
