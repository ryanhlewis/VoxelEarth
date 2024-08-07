"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomID = exports.ColourSpace = exports.UV = exports.EAction = exports.AppUtil = void 0;
const math_1 = require("./math");
var AppUtil;
(function (AppUtil) {
    let Text;
    (function (Text) {
        function capitaliseFirstLetter(text) {
            return text.charAt(0).toUpperCase() + text.slice(1);
        }
        Text.capitaliseFirstLetter = capitaliseFirstLetter;
        /**
         * Namespaces a block name if it is not already namespaced
         * For example `namespaceBlock('stone')` returns `'minecraft:stone'`
         */
        function namespaceBlock(blockName) {
            // https://minecraft.wiki/w/Resource_location#Namespaces
            return isNamespacedBlock(blockName) ? blockName : ('minecraft:' + blockName);
        }
        Text.namespaceBlock = namespaceBlock;
        function isNamespacedBlock(blockName) {
            return blockName.includes(':');
        }
        Text.isNamespacedBlock = isNamespacedBlock;
    })(Text = AppUtil.Text || (AppUtil.Text = {}));
    let Array;
    (function (Array) {
        /**
         * An optimised function for repeating a subarray contained within a buffer multiple times by
         * repeatedly doubling the subarray's length.
         */
        function repeatedFill(buffer, start, startLength, desiredCount) {
            const pow = math_1.AppMath.largestPowerOfTwoLessThanN(desiredCount);
            let len = startLength;
            for (let i = 0; i < pow; ++i) {
                buffer.copyWithin(start + len, start, start + len);
                len *= 2;
            }
            const finalLength = desiredCount * startLength;
            buffer.copyWithin(start + len, start, start + finalLength - len);
        }
        Array.repeatedFill = repeatedFill;
    })(Array = AppUtil.Array || (AppUtil.Array = {}));
})(AppUtil = exports.AppUtil || (exports.AppUtil = {}));
/* eslint-disable */
var EAction;
(function (EAction) {
    EAction[EAction["Settings"] = 0] = "Settings";
    EAction[EAction["Import"] = 1] = "Import";
    EAction[EAction["Materials"] = 2] = "Materials";
    EAction[EAction["Voxelise"] = 3] = "Voxelise";
    EAction[EAction["Assign"] = 4] = "Assign";
    EAction[EAction["Export"] = 5] = "Export";
    EAction[EAction["MAX"] = 6] = "MAX";
})(EAction = exports.EAction || (exports.EAction = {}));
class UV {
    constructor(u, v) {
        this.u = u;
        this.v = v;
    }
    copy() {
        return new UV(this.u, this.v);
    }
}
exports.UV = UV;
/* eslint-disable */
var ColourSpace;
(function (ColourSpace) {
    ColourSpace[ColourSpace["RGB"] = 0] = "RGB";
    ColourSpace[ColourSpace["LAB"] = 1] = "LAB";
})(ColourSpace = exports.ColourSpace || (exports.ColourSpace = {}));
function getRandomID() {
    return (Math.random() + 1).toString(36).substring(7);
}
exports.getRandomID = getRandomID;
