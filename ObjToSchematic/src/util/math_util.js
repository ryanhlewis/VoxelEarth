"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathUtil = void 0;
var MathUtil;
(function (MathUtil) {
    function uint8(x) {
        return x & 0xFF;
    }
    MathUtil.uint8 = uint8;
    function int8(x) {
        return uint8(x + 0x80) - 0x80;
    }
    MathUtil.int8 = int8;
    function uint32(x) {
        return x >>> 0;
    }
    MathUtil.uint32 = uint32;
    function int32(x) {
        return uint32(x + 0x80000000) - 0x80000000;
    }
    MathUtil.int32 = int32;
})(MathUtil = exports.MathUtil || (exports.MathUtil = {}));
//# sourceMappingURL=math_util.js.map