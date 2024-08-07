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
exports.SchemExporter = void 0;
var prismarine_nbt_1 = require("prismarine-nbt");
var constants_1 = require("../constants");
var util_1 = require("../util");
var log_util_1 = require("../util/log_util");
var math_util_1 = require("../util/math_util");
var nbt_util_1 = require("../util/nbt_util");
var vector_1 = require("../vector");
var base_exporter_1 = require("./base_exporter");
var SchemExporter = /** @class */ (function (_super) {
    __extends(SchemExporter, _super);
    function SchemExporter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SchemExporter.prototype.getFormatFilter = function () {
        return {
            name: 'Sponge Schematic',
            extension: 'schem',
        };
    };
    SchemExporter.prototype.export = function (blockMesh) {
        var bounds = blockMesh.getVoxelMesh().getBounds();
        var sizeVector = bounds.getDimensions().add(1);
        // https://github.com/SpongePowered/Schematic-Specification/blob/master/versions/schematic-3.md#paletteObject
        // const blockMapping: BlockMapping = {};
        var blockMapping = {
            'minecraft:air': { type: prismarine_nbt_1.TagType.Int, value: 0 },
        };
        var blockIndex = 1;
        for (var _i = 0, _a = blockMesh.getBlockPalette(); _i < _a.length; _i++) {
            var blockName = _a[_i];
            var namespacedBlockName = util_1.AppUtil.Text.namespaceBlock(blockName);
            blockMapping[namespacedBlockName] = { type: prismarine_nbt_1.TagType.Int, value: blockIndex };
            ++blockIndex;
        }
        (0, log_util_1.LOG)(blockMapping);
        // const paletteObject = SchemExporter._createBlockStatePalette(blockMapping);
        var blockData = new Array(sizeVector.x * sizeVector.y * sizeVector.z).fill(0);
        for (var _b = 0, _c = blockMesh.getBlocks(); _b < _c.length; _b++) {
            var block = _c[_b];
            var indexVector = vector_1.Vector3.sub(block.voxel.position, bounds.min);
            var bufferIndex = SchemExporter._getBufferIndex(sizeVector, indexVector);
            var namespacedBlockName = util_1.AppUtil.Text.namespaceBlock(block.blockInfo.name);
            blockData[bufferIndex] = blockMapping[namespacedBlockName].value;
        }
        var blockEncoding = [];
        for (var i = 0; i < blockData.length; ++i) {
            var id = blockData[i];
            while ((id & -128) != 0) {
                blockEncoding.push(id & 127 | 128);
                id >>>= 7;
            }
            blockEncoding.push(id);
        }
        for (var i = 0; i < blockEncoding.length; ++i) {
            blockEncoding[i] = math_util_1.MathUtil.int8(blockEncoding[i]);
        }
        var nbt = {
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
    };
    SchemExporter._getBufferIndex = function (dimensions, vec) {
        return vec.x + (vec.z * dimensions.x) + (vec.y * dimensions.x * dimensions.z);
    };
    SchemExporter.SCHEMA_VERSION = 2;
    return SchemExporter;
}(base_exporter_1.IExporter));
exports.SchemExporter = SchemExporter;
//# sourceMappingURL=schem_exporter.js.map