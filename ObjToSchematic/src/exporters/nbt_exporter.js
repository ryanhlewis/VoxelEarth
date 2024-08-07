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
exports.NBTExporter = void 0;
var prismarine_nbt_1 = require("prismarine-nbt");
var constants_1 = require("../constants");
var util_1 = require("../util");
var nbt_util_1 = require("../util/nbt_util");
var vector_1 = require("../vector");
var base_exporter_1 = require("./base_exporter");
var error_util_1 = require("../util/error_util");
var NBTExporter = /** @class */ (function (_super) {
    __extends(NBTExporter, _super);
    function NBTExporter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NBTExporter.prototype.getFormatFilter = function () {
        return {
            name: 'Structure Blocks',
            extension: 'nbt',
        };
    };
    NBTExporter.prototype._processChunk = function (blockMesh, min, blockNameToIndex, palette) {
        var blocks = [];
        for (var _i = 0, _a = blockMesh.getBlocks(); _i < _a.length; _i++) {
            var block = _a[_i];
            var pos = block.voxel.position;
            var blockIndex = blockNameToIndex.get(block.blockInfo.name);
            if (blockIndex !== undefined) {
                if (pos.x >= min.x && pos.x < min.x + 48 && pos.y >= min.y && pos.y < min.y + 48 && pos.z >= min.z && pos.z < min.z + 48) {
                    var translatedPos = vector_1.Vector3.sub(block.voxel.position, min);
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
        var nbt = {
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
    };
    NBTExporter.prototype.export = function (blockMesh) {
        var bounds = blockMesh.getVoxelMesh().getBounds();
        /*
        const sizeVector = bounds.getDimensions().add(1);

        const isTooBig = sizeVector.x > 48 && sizeVector.y > 48 && sizeVector.z > 48;
        if (isTooBig) {
            StatusHandler.warning(LOC('export.nbt_exporter_too_big'));
        }
        */
        var blockNameToIndex = new Map();
        var palette = [];
        for (var _i = 0, _a = blockMesh.getBlockPalette(); _i < _a.length; _i++) {
            var blockName = _a[_i];
            palette.push({
                Name: {
                    type: prismarine_nbt_1.TagType.String,
                    value: util_1.AppUtil.Text.namespaceBlock(blockName),
                },
            });
            blockNameToIndex.set(blockName, palette.length - 1);
        }
        var regions = [];
        for (var x = bounds.min.x; x < bounds.max.x; x += 48) {
            for (var y = bounds.min.y; y < bounds.max.y; y += 48) {
                for (var z = bounds.min.z; z < bounds.max.z; z += 48) {
                    var buffer = this._processChunk(blockMesh, new vector_1.Vector3(x, y, z), blockNameToIndex, palette);
                    regions.push({ content: buffer, name: "x".concat(x - bounds.min.x, "_y").concat(y - bounds.min.y, "_z").concat(z - bounds.min.z) });
                }
            }
        }
        var out = {
            type: 'multiple',
            extension: '.nbt',
            regions: regions
        };
        return out;
    };
    return NBTExporter;
}(base_exporter_1.IExporter));
exports.NBTExporter = NBTExporter;
//# sourceMappingURL=nbt_exporter.js.map