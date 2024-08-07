"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedJSONExporter = void 0;
const base_exporter_1 = require("./base_exporter");
class IndexedJSONExporter extends base_exporter_1.IExporter {
    getFormatFilter() {
        return {
            name: 'Indexed JSON',
            extension: 'json',
        };
    }
    export(blockMesh) {
        const blocks = blockMesh.getBlocks();
        const blocksUsed = blockMesh.getBlockPalette();
        const blockToIndex = new Map();
        const indexToBlock = new Map();
        for (let i = 0; i < blocksUsed.length; ++i) {
            blockToIndex.set(blocksUsed[i], i);
            indexToBlock.set(i, blocksUsed[i]);
        }
        const blockArray = new Array();
        // Serialise all block except for the last one.
        for (let i = 0; i < blocks.length; ++i) {
            const block = blocks[i];
            const pos = block.voxel.position;
            blockArray.push([pos.x, pos.y, pos.z, blockToIndex.get(block.blockInfo.name)]);
        }
        const json = JSON.stringify({
            blocks: Object.fromEntries(indexToBlock),
            xyzi: blockArray,
        });
        return { type: 'single', extension: '.json', content: Buffer.from(json) };
    }
}
exports.IndexedJSONExporter = IndexedJSONExporter;
