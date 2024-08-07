"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NBTExporter = void 0;
const prismarine_nbt_1 = require("prismarine-nbt");
const constants_1 = require("../constants");
const util_1 = require("../util");
const nbt_util_1 = require("../util/nbt_util");
const vector_1 = require("../vector");
const base_exporter_1 = require("./base_exporter");
const error_util_1 = require("../util/error_util");
class NBTExporter extends base_exporter_1.IExporter {
    getFormatFilter() {
        return {
            name: 'Structure Blocks',
            extension: 'nbt',
        };
    }
    _processChunk(blockMesh, min, blockNameToIndex, palette) {
        const blocks = [];
        for (const block of blockMesh.getBlocks()) {
            const pos = block.voxel.position;
            const blockIndex = blockNameToIndex.get(block.blockInfo.name);
            if (blockIndex !== undefined) {
                if (pos.x >= min.x && pos.x < min.x + 48 && pos.y >= min.y && pos.y < min.y + 48 && pos.z >= min.z && pos.z < min.z + 48) {
                    const translatedPos = vector_1.Vector3.sub(block.voxel.position, min);
                    (0, error_util_1.ASSERT)(translatedPos.x >= 0 && translatedPos.x < 48);
                    (0, error_util_1.ASSERT)(translatedPos.y >= 0 && translatedPos.y < 48);
                    (0, error_util_1.ASSERT)(translatedPos.z >= 0 && translatedPos.z < 48);
                    blocks.push({
                        pos: {
                            type: prismarine_nbt_1.TagType.List,
                            value: {
                                type: prismarine_nbt_1.TagType.Int,
                                value: translatedPos.toArray(),
                            },
                        },
                        state: {
                            type: prismarine_nbt_1.TagType.Int,
                            value: blockIndex,
                        },
                    });
                }
            }
        }
        (0, error_util_1.ASSERT)(blocks.length < 48 * 48 * 48);
        const nbt = {
            type: prismarine_nbt_1.TagType.Compound,
            name: 'SchematicBlocks',
            value: {
                DataVersion: {
                    type: prismarine_nbt_1.TagType.Int,
                    value: constants_1.AppConstants.DATA_VERSION,
                },
                size: {
                    type: prismarine_nbt_1.TagType.List,
                    value: {
                        type: prismarine_nbt_1.TagType.Int,
                        value: [48, 48, 48],
                    },
                },
                palette: {
                    type: prismarine_nbt_1.TagType.List,
                    value: {
                        type: prismarine_nbt_1.TagType.Compound,
                        value: palette,
                    },
                },
                blocks: {
                    type: prismarine_nbt_1.TagType.List,
                    value: {
                        type: prismarine_nbt_1.TagType.Compound,
                        value: blocks,
                    },
                },
            },
        };
        return (0, nbt_util_1.saveNBT)(nbt);
    }
    export(blockMesh) {
        const bounds = blockMesh.getVoxelMesh().getBounds();
        /*
        const sizeVector = bounds.getDimensions().add(1);

        const isTooBig = sizeVector.x > 48 && sizeVector.y > 48 && sizeVector.z > 48;
        if (isTooBig) {
            StatusHandler.warning(LOC('export.nbt_exporter_too_big'));
        }
        */
        const blockNameToIndex = new Map();
        const palette = [];
        for (const blockName of blockMesh.getBlockPalette()) {
            palette.push({
                Name: {
                    type: prismarine_nbt_1.TagType.String,
                    value: util_1.AppUtil.Text.namespaceBlock(blockName),
                },
            });
            blockNameToIndex.set(blockName, palette.length - 1);
        }
        const regions = [];
        for (let x = bounds.min.x; x < bounds.max.x; x += 48) {
            for (let y = bounds.min.y; y < bounds.max.y; y += 48) {
                for (let z = bounds.min.z; z < bounds.max.z; z += 48) {
                    const buffer = this._processChunk(blockMesh, new vector_1.Vector3(x, y, z), blockNameToIndex, palette);
                    regions.push({ content: buffer, name: `x${x - bounds.min.x}_y${y - bounds.min.y}_z${z - bounds.min.z}` });
                }
            }
        }
        const out = {
            type: 'multiple',
            extension: '.nbt',
            regions: regions
        };
        return out;
    }
}
exports.NBTExporter = NBTExporter;
