"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UncompressedJSONExporter = void 0;
const base_exporter_1 = require("./base_exporter");
class UncompressedJSONExporter extends base_exporter_1.IExporter {
    getFormatFilter() {
        return {
            name: 'Uncompressed JSON',
            extension: 'json',
        };
    }
    export(blockMesh) {
        const blocks = blockMesh.getBlocks();
        const lines = new Array();
        lines.push('[');
        // Serialise all block except for the last one.
        for (let i = 0; i < blocks.length - 1; ++i) {
            const block = blocks[i];
            const pos = block.voxel.position;
            lines.push(`{ "x": ${pos.x}, "y": ${pos.y}, "z": ${pos.z}, "block_name": "${block.blockInfo.name}" },`);
        }
        // Serialise the last block but don't include the comma at the end.
        {
            const block = blocks[blocks.length - 1];
            const pos = block.voxel.position;
            lines.push(`{ "x": ${pos.x}, "y": ${pos.y}, "z": ${pos.z}, "block_name": "${block.blockInfo.name}" }`);
        }
        lines.push(']');
        const json = lines.join('');
        return { type: 'single', extension: '.json', content: Buffer.from(json) };
    }
}
exports.UncompressedJSONExporter = UncompressedJSONExporter;
