"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveNBT = void 0;
const prismarine_nbt_1 = require("prismarine-nbt");
const zlib_1 = require("zlib");
function saveNBT(nbt) {
    const uncompressedBuffer = (0, prismarine_nbt_1.writeUncompressed)(nbt, 'big');
    return zlib_1.default.gzipSync(uncompressedBuffer);
}
exports.saveNBT = saveNBT;
