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
exports.UncompressedJSONExporter = void 0;
var base_exporter_1 = require("./base_exporter");
var UncompressedJSONExporter = /** @class */ (function (_super) {
    __extends(UncompressedJSONExporter, _super);
    function UncompressedJSONExporter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UncompressedJSONExporter.prototype.getFormatFilter = function () {
        return {
            name: 'Uncompressed JSON',
            extension: 'json',
        };
    };
    UncompressedJSONExporter.prototype.export = function (blockMesh) {
        var blocks = blockMesh.getBlocks();
        var lines = new Array();
        lines.push('[');
        // Serialise all block except for the last one.
        for (var i = 0; i < blocks.length - 1; ++i) {
            var block = blocks[i];
            var pos = block.voxel.position;
            lines.push("{ \"x\": ".concat(pos.x, ", \"y\": ").concat(pos.y, ", \"z\": ").concat(pos.z, ", \"block_name\": \"").concat(block.blockInfo.name, "\" },"));
        }
        // Serialise the last block but don't include the comma at the end.
        {
            var block = blocks[blocks.length - 1];
            var pos = block.voxel.position;
            lines.push("{ \"x\": ".concat(pos.x, ", \"y\": ").concat(pos.y, ", \"z\": ").concat(pos.z, ", \"block_name\": \"").concat(block.blockInfo.name, "\" }"));
        }
        lines.push(']');
        var json = lines.join('');
        return { type: 'single', extension: '.json', content: Buffer.from(json) };
    };
    return UncompressedJSONExporter;
}(base_exporter_1.IExporter));
exports.UncompressedJSONExporter = UncompressedJSONExporter;
//# sourceMappingURL=uncompressed_json_exporter.js.map