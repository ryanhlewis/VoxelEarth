"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ditherer = void 0;
const error_util_1 = require("./util/error_util");
class Ditherer {
    static ditherRandom(colour, magnitude) {
        const offset = (Math.random() - 0.5) * magnitude;
        colour.r += offset;
        colour.g += offset;
        colour.b += offset;
    }
    static ditherOrdered(colour, position, magnitude) {
        const map = this._getThresholdValue(Math.abs(position.x % 4), Math.abs(position.y % 4), Math.abs(position.z % 4));
        const offset = map * magnitude;
        colour.r += offset;
        colour.g += offset;
        colour.b += offset;
    }
    static _getThresholdValue(x, y, z) {
        const size = 4;
        (0, error_util_1.ASSERT)(0 <= x && x < size && 0 <= y && y < size && 0 <= z && z < size);
        const index = (x + (size * y) + (size * size * z));
        (0, error_util_1.ASSERT)(0 <= index && index < size * size * size);
        return (Ditherer._mapMatrix[index] / (size * size * size)) - 0.5;
    }
}
exports.Ditherer = Ditherer;
Ditherer._mapMatrix = [
    0, 16, 2, 18, 48, 32, 50, 34,
    6, 22, 4, 20, 54, 38, 52, 36,
    24, 40, 26, 42, 8, 56, 10, 58,
    30, 46, 28, 44, 14, 62, 12, 60,
    3, 19, 5, 21, 51, 35, 53, 37,
    1, 17, 7, 23, 49, 33, 55, 39,
    27, 43, 29, 45, 11, 59, 13, 61,
    25, 41, 31, 47, 9, 57, 15, 63,
];
