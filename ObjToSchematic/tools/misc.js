"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStandardDeviation = exports.getAverageColour = void 0;
function getAverageColour(image) {
    var r = 0;
    var g = 0;
    var b = 0;
    var a = 0;
    var weight = 0;
    for (var x = 0; x < 16; ++x) {
        for (var y = 0; y < 16; ++y) {
            var index = 4 * (16 * y + x);
            var rgba = image.slice(index, index + 4);
            var alpha = rgba[3] / 255;
            r += (rgba[0] / 255) * alpha;
            g += (rgba[1] / 255) * alpha;
            b += (rgba[2] / 255) * alpha;
            a += alpha;
            weight += alpha;
        }
    }
    var numPixels = 16 * 16;
    return {
        r: r / weight,
        g: g / weight,
        b: b / weight,
        a: a / numPixels,
    };
}
exports.getAverageColour = getAverageColour;
function getStandardDeviation(image, average) {
    var squaredDist = 0.0;
    var weight = 0.0;
    for (var x = 0; x < 16; ++x) {
        for (var y = 0; y < 16; ++y) {
            var index = 4 * (16 * y + x);
            var rgba = image.slice(index, index + 4);
            var alpha = rgba[3] / 255;
            weight += alpha;
            var r = (rgba[0] / 255) * alpha;
            var g = (rgba[1] / 255) * alpha;
            var b = (rgba[2] / 255) * alpha;
            squaredDist += Math.pow(r - average.r, 2) + Math.pow(g - average.g, 2) + Math.pow(b - average.b, 2);
        }
    }
    return Math.sqrt(squaredDist / weight);
}
exports.getStandardDeviation = getStandardDeviation;
//# sourceMappingURL=misc.js.map