"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtlasPalette = exports.EFaceVisibility = void 0;
var colour_1 = require("./colour");
var math_1 = require("./math");
var error_util_1 = require("./util/error_util");
/* eslint-disable */
var EFaceVisibility;
(function (EFaceVisibility) {
    EFaceVisibility[EFaceVisibility["None"] = 0] = "None";
    EFaceVisibility[EFaceVisibility["Up"] = 1] = "Up";
    EFaceVisibility[EFaceVisibility["Down"] = 2] = "Down";
    EFaceVisibility[EFaceVisibility["North"] = 4] = "North";
    EFaceVisibility[EFaceVisibility["East"] = 8] = "East";
    EFaceVisibility[EFaceVisibility["South"] = 16] = "South";
    EFaceVisibility[EFaceVisibility["West"] = 32] = "West";
})(EFaceVisibility || (exports.EFaceVisibility = EFaceVisibility = {}));
/* eslint-enable */
/**
 * A new instance of AtlasPalette is created each time
 * a new voxel mesh is voxelised.
 */
var AtlasPalette = /** @class */ (function () {
    function AtlasPalette(atlas, palette) {
        this._atlas = atlas;
        this._palette = palette;
        this._palette.removeMissingAtlasBlocks(this._atlas);
    }
    AtlasPalette.prototype.createBlockCollection = function (blocksToExclude) {
        var blocksNamesToUse = this._palette.getBlocks();
        {
            // Remove excluded blocks
            for (var _i = 0, blocksToExclude_1 = blocksToExclude; _i < blocksToExclude_1.length; _i++) {
                var blockToExclude = blocksToExclude_1[_i];
                var index = blocksNamesToUse.indexOf(blockToExclude);
                if (index != -1) {
                    blocksNamesToUse.splice(index, 1);
                }
            }
        }
        var blocksToUse = {
            blocks: new Map(),
            cache: new Map(),
        };
        var atlasBlocks = this._atlas.getBlocks();
        {
            // Only add block data for blocks in the palette
            atlasBlocks.forEach(function (atlasBlock, blockName) {
                if (blocksNamesToUse.includes(blockName)) {
                    blocksToUse.blocks.set(blockName, atlasBlock);
                }
            });
        }
        (0, error_util_1.ASSERT)(blocksToUse.blocks.size >= 1, 'Must have at least one block cached');
        return blocksToUse;
    };
    /**
     * Convert a colour into a Minecraft block.
     * @param colour The colour that the returned block should match with.
     * @param resolution The colour accuracy, a uint8 from 1 to 255, inclusive.
     * @param blockToExclude A list of blocks that should not be used, this should be a subset of the palette blocks.
     * @returns
     */
    AtlasPalette.prototype.getBlock = function (colour, blockCollection, faceVisibility, errorWeight) {
        var colourHash = colour_1.RGBAUtil.hash255(colour);
        var contextHash = (BigInt(colourHash) << BigInt(6)) + BigInt(faceVisibility);
        // If we've already calculated the block associated with this colour, return it.
        var cachedBlock = blockCollection.cache.get(contextHash);
        if (cachedBlock !== undefined) {
            return cachedBlock;
        }
        // Find closest block in colour
        var minError = Infinity;
        var blockChoice;
        {
            blockCollection.blocks.forEach(function (blockData) {
                var context = AtlasPalette.getContextualFaceAverage(blockData, faceVisibility);
                var contextualBlockColour = faceVisibility !== EFaceVisibility.None ? context.colour : blockData.colour;
                var contextualStd = faceVisibility !== EFaceVisibility.None ? context.std : 0.0;
                var floatColour = colour_1.RGBAUtil.fromRGBA255(colour);
                var rgbError = colour_1.RGBAUtil.squaredDistance(floatColour, contextualBlockColour);
                var stdError = contextualStd;
                var totalError = math_1.AppMath.lerp(errorWeight, rgbError, stdError);
                if (totalError < minError) {
                    minError = totalError;
                    blockChoice = blockData;
                }
            });
        }
        if (blockChoice !== undefined) {
            blockCollection.cache.set(contextHash, blockChoice);
            return blockChoice;
        }
        (0, error_util_1.ASSERT)(false, 'Unreachable, always at least one possible block');
    };
    AtlasPalette.getContextualFaceAverage = function (block, faceVisibility) {
        var averageColour = { r: 0, g: 0, b: 0, a: 0 };
        var averageStd = 0.0; // Taking the average of a std is a bit naughty
        var count = 0;
        if (faceVisibility & EFaceVisibility.Up) {
            colour_1.RGBAUtil.add(averageColour, block.faces.up.colour);
            averageStd += block.faces.up.std;
            ++count;
        }
        if (faceVisibility & EFaceVisibility.Down) {
            colour_1.RGBAUtil.add(averageColour, block.faces.down.colour);
            averageStd += block.faces.down.std;
            ++count;
        }
        if (faceVisibility & EFaceVisibility.North) {
            colour_1.RGBAUtil.add(averageColour, block.faces.north.colour);
            averageStd += block.faces.north.std;
            ++count;
        }
        if (faceVisibility & EFaceVisibility.East) {
            colour_1.RGBAUtil.add(averageColour, block.faces.east.colour);
            averageStd += block.faces.east.std;
            ++count;
        }
        if (faceVisibility & EFaceVisibility.South) {
            colour_1.RGBAUtil.add(averageColour, block.faces.south.colour);
            averageStd += block.faces.south.std;
            ++count;
        }
        if (faceVisibility & EFaceVisibility.West) {
            colour_1.RGBAUtil.add(averageColour, block.faces.west.colour);
            averageStd += block.faces.west.std;
            ++count;
        }
        averageColour.r /= count;
        averageColour.g /= count;
        averageColour.b /= count;
        averageColour.a /= count;
        return {
            colour: averageColour,
            std: averageStd / count,
        };
    };
    return AtlasPalette;
}());
exports.AtlasPalette = AtlasPalette;
