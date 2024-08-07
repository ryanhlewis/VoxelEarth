"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveNBT = void 0;
var prismarine_nbt_1 = require("prismarine-nbt");
var zlib_1 = __importDefault(require("zlib"));
function saveNBT(nbt) {
    var uncompressedBuffer = (0, prismarine_nbt_1.writeUncompressed)(nbt, 'big');
    return zlib_1.default.gzipSync(uncompressedBuffer);
}
exports.saveNBT = saveNBT;
//# sourceMappingURL=nbt_util.js.map