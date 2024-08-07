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
exports.IndexedJSONExporter = void 0;
var base_exporter_1 = require("./base_exporter");
var IndexedJSONExporter = /** @class */ (function (_super) {
    __extends(IndexedJSONExporter, _super);
    function IndexedJSONExporter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IndexedJSONExporter.prototype.getFormatFilter = function () {
        return {
            name: 'Indexed JSON',
            extension: 'json',
        };
    };
    IndexedJSONExporter.prototype.export = function (blockMesh) {
        var blocks = blockMesh.getBlocks();
        var blocksUsed = blockMesh.getBlockPalette();
        var blockToIndex = new Map();
        var indexToBlock = new Map();
        for (var i = 0; i < blocksUsed.length; ++i) {
            blockToIndex.set(blocksUsed[i], i);
            indexToBlock.set(i, blocksUsed[i]);
        }
        var blockArray = new Array();
        // Serialise all block except for the last one.
        for (var i = 0; i < blocks.length; ++i) {
            var block = blocks[i];
            var pos = block.voxel.position;
            blockArray.push([pos.x, pos.y, pos.z, blockToIndex.get(block.blockInfo.name)]);
        }
        var json = JSON.stringify({
            blocks: Object.fromEntries(indexToBlock),
            xyzi: blockArray,
        });
        return { type: 'single', extension: '.json', content: Buffer.from(json) };
    };
    return IndexedJSONExporter;
}(base_exporter_1.IExporter));
exports.IndexedJSONExporter = IndexedJSONExporter;
//# sourceMappingURL=indexed_json_exporter%20.js.map