"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RGBAColours = exports.RGBAUtil = void 0;
var config_1 = require("./config");
var hsv_rgb = require('hsv-rgb');
var RGBAUtil;
(function (RGBAUtil) {
    function toString(a) {
        return "(".concat(a.r, ", ").concat(a.g, ", ").concat(a.b, ", ").concat(a.a, ")");
    }
    RGBAUtil.toString = toString;
    function randomPretty() {
        var hue = Math.random() * 360;
        var sat = 65;
        var val = 85;
        var rgb = hsv_rgb(hue, sat, val);
        return {
            r: rgb[0] / 255,
            g: rgb[1] / 255,
            b: rgb[2] / 255,
            a: 1.0,
        };
    }
    RGBAUtil.randomPretty = randomPretty;
    function random() {
        return {
            r: Math.random(),
            g: Math.random(),
            b: Math.random(),
            a: 1.0,
        };
    }
    RGBAUtil.random = random;
    function toHexString(a) {
        var r = Math.floor(255 * a.r).toString(16).padStart(2, '0');
        var g = Math.floor(255 * a.g).toString(16).padStart(2, '0');
        var b = Math.floor(255 * a.b).toString(16).padStart(2, '0');
        return "#".concat(r).concat(g).concat(b);
    }
    RGBAUtil.toHexString = toHexString;
    function fromHexString(str) {
        return {
            r: parseInt(str.substring(1, 3), 16) / 255,
            g: parseInt(str.substring(3, 5), 16) / 255,
            b: parseInt(str.substring(5, 7), 16) / 255,
            a: 1.0,
        };
    }
    RGBAUtil.fromHexString = fromHexString;
    function toUint8String(a) {
        return "(".concat(Math.floor(255 * a.r), ", ").concat(Math.floor(255 * a.g), ", ").concat(Math.floor(255 * a.b), ", ").concat(Math.floor(255 * a.a), ")");
    }
    RGBAUtil.toUint8String = toUint8String;
    function toRGBA255(c) {
        var out = {
            r: c.r * 255,
            g: c.r * 255,
            b: c.r * 255,
            a: c.r * 255,
        };
        return out;
    }
    RGBAUtil.toRGBA255 = toRGBA255;
    function fromRGBA255(c) {
        var out = {
            r: c.r / 255,
            g: c.g / 255,
            b: c.b / 255,
            a: c.a / 255,
        };
        return out;
    }
    RGBAUtil.fromRGBA255 = fromRGBA255;
    function add(a, b) {
        a.r += b.r;
        a.g += b.g;
        a.b += b.b;
        a.a += b.a;
    }
    RGBAUtil.add = add;
    function lerp(a, b, alpha) {
        return {
            r: a.r * (1 - alpha) + b.r * alpha,
            g: a.g * (1 - alpha) + b.g * alpha,
            b: a.b * (1 - alpha) + b.b * alpha,
            a: a.a * (1 - alpha) + b.a * alpha,
        };
    }
    RGBAUtil.lerp = lerp;
    /**
     * Note this is a very naive approach to averaging a colour
     */
    function average() {
        var colours = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            colours[_i] = arguments[_i];
        }
        var avg = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
        for (var i = 0; i < colours.length; ++i) {
            avg.r += colours[i].r;
            avg.g += colours[i].g;
            avg.b += colours[i].b;
            avg.a += colours[i].a;
        }
        avg.r /= colours.length;
        avg.g /= colours.length;
        avg.b /= colours.length;
        avg.a /= colours.length;
        return avg;
    }
    RGBAUtil.average = average;
    function squaredDistance(a, b) {
        var squaredDistance = 0.0;
        squaredDistance += (a.r - b.r) * (a.r - b.r);
        squaredDistance += (a.g - b.g) * (a.g - b.g);
        squaredDistance += (a.b - b.b) * (a.b - b.b);
        squaredDistance += (a.a - b.a) * (a.a - b.a) * config_1.AppConfig.Get.ALPHA_BIAS;
        return squaredDistance;
    }
    RGBAUtil.squaredDistance = squaredDistance;
    function copy(a) {
        return {
            r: a.r,
            g: a.g,
            b: a.b,
            a: a.a,
        };
    }
    RGBAUtil.copy = copy;
    function copy255(a) {
        return {
            r: a.r,
            g: a.g,
            b: a.b,
            a: a.a,
        };
    }
    RGBAUtil.copy255 = copy255;
    function toArray(a) {
        return [a.r, a.g, a.b, a.a];
    }
    RGBAUtil.toArray = toArray;
    function bin(col, resolution) {
        var binnedColour = {
            r: Math.floor(Math.floor(col.r * resolution) * (255 / resolution)),
            g: Math.floor(Math.floor(col.g * resolution) * (255 / resolution)),
            b: Math.floor(Math.floor(col.b * resolution) * (255 / resolution)),
            a: Math.floor(Math.ceil(col.a * resolution) * (255 / resolution)),
        };
        return binnedColour;
    }
    RGBAUtil.bin = bin;
    /**
     * Encodes a colour as a single number.
     * Note this will bin colours together.
     * @param col The colour to hash.
     * @param resolution An uint8, the larger the more accurate the hash.
     */
    function hash(col, resolution) {
        var r = Math.floor(col.r * resolution);
        var g = Math.floor(col.g * resolution);
        var b = Math.floor(col.b * resolution);
        var a = Math.floor(col.a * resolution);
        var hash = r;
        hash = (hash << 8) + g;
        hash = (hash << 8) + b;
        hash = (hash << 8) + a;
        return hash;
    }
    RGBAUtil.hash = hash;
    function hash255(col) {
        var hash = col.r;
        hash = (hash << 8) + col.g;
        hash = (hash << 8) + col.b;
        hash = (hash << 8) + col.a;
        return hash;
    }
    RGBAUtil.hash255 = hash255;
})(RGBAUtil || (exports.RGBAUtil = RGBAUtil = {}));
var RGBAColours;
(function (RGBAColours) {
    RGBAColours.RED = { r: 1.0, g: 0.0, b: 0.0, a: 1.0 };
    RGBAColours.GREEN = { r: 0.0, g: 1.0, b: 0.0, a: 1.0 };
    RGBAColours.BLUE = { r: 0.0, g: 0.0, b: 1.0, a: 1.0 };
    RGBAColours.YELLOW = { r: 1.0, g: 1.0, b: 0.0, a: 1.0 };
    RGBAColours.CYAN = { r: 0.0, g: 1.0, b: 1.0, a: 1.0 };
    RGBAColours.MAGENTA = { r: 1.0, g: 0.0, b: 1.0, a: 1.0 };
    RGBAColours.WHITE = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
    RGBAColours.BLACK = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
})(RGBAColours || (exports.RGBAColours = RGBAColours = {}));
