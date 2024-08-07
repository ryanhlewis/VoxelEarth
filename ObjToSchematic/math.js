"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmoothVectorVariable = exports.SmoothVariable = exports.degreesToRadians = exports.checkNaN = exports.wayThrough = exports.mapRange = exports.between = exports.roundToNearest = exports.ceilToNearest = exports.floorToNearest = exports.clamp = exports.argMax = exports.AppMath = void 0;
const error_util_1 = require("./util/error_util");
const vector_1 = require("./vector");
var AppMath;
(function (AppMath) {
    AppMath.RADIANS_0 = degreesToRadians(0.0);
    AppMath.RADIANS_90 = degreesToRadians(90.0);
    AppMath.RADIANS_180 = degreesToRadians(180.0);
    AppMath.RADIANS_270 = degreesToRadians(270.0);
    function lerp(value, start, end) {
        return (1 - value) * start + value * end;
    }
    AppMath.lerp = lerp;
    function nearlyEqual(a, b, tolerance = 0.0001) {
        return Math.abs(a - b) < tolerance;
    }
    AppMath.nearlyEqual = nearlyEqual;
    function degreesToRadians(degrees) {
        return degrees * (Math.PI / 180.0);
    }
    AppMath.degreesToRadians = degreesToRadians;
    /**
     * Converts a float in [0, 1] to an int in [0, 255]
     * @param decimal A number in [0, 1]
     */
    function uint8(decimal) {
        return Math.floor(decimal * 255);
    }
    AppMath.uint8 = uint8;
    function largestPowerOfTwoLessThanN(n) {
        return Math.floor(Math.log2(n));
    }
    AppMath.largestPowerOfTwoLessThanN = largestPowerOfTwoLessThanN;
})(AppMath = exports.AppMath || (exports.AppMath = {}));
const argMax = (array) => {
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
};
exports.argMax = argMax;
const clamp = (value, min, max) => {
    return Math.max(Math.min(max, value), min);
};
exports.clamp = clamp;
const floorToNearest = (value, base) => {
    return Math.floor(value / base) * base;
};
exports.floorToNearest = floorToNearest;
const ceilToNearest = (value, base) => {
    return Math.ceil(value / base) * base;
};
exports.ceilToNearest = ceilToNearest;
const roundToNearest = (value, base) => {
    return Math.round(value / base) * base;
};
exports.roundToNearest = roundToNearest;
const between = (value, min, max) => {
    return min <= value && value <= max;
};
exports.between = between;
const mapRange = (value, fromMin, fromMax, toMin, toMax) => {
    return (value - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
};
exports.mapRange = mapRange;
const wayThrough = (value, min, max) => {
    // ASSERT(value >= min && value <= max);
    return (value - min) / (max - min);
};
exports.wayThrough = wayThrough;
/**
 * Throws is any number in args is NaN
 */
const checkNaN = (...args) => {
    const existsNaN = args.some((arg) => {
        return isNaN(arg);
    });
    (0, error_util_1.ASSERT)(!existsNaN, 'Found NaN');
};
exports.checkNaN = checkNaN;
exports.degreesToRadians = Math.PI / 180;
class SmoothVariable {
    constructor(value, smoothing) {
        this._actual = value;
        this._target = value;
        this._smoothing = smoothing;
        this._min = -Infinity;
        this._max = Infinity;
    }
    setClamp(min, max) {
        this._min = min;
        this._max = max;
    }
    addToTarget(delta) {
        this._target = (0, exports.clamp)(this._target + delta, this._min, this._max);
    }
    setTarget(target) {
        this._target = (0, exports.clamp)(target, this._min, this._max);
    }
    setActual(actual) {
        this._actual = actual;
    }
    tick() {
        this._actual += (this._target - this._actual) * this._smoothing;
    }
    getActual() {
        return this._actual;
    }
    getTarget() {
        return this._target;
    }
}
exports.SmoothVariable = SmoothVariable;
class SmoothVectorVariable {
    constructor(value, smoothing) {
        this._actual = value;
        this._target = value;
        this._smoothing = smoothing;
    }
    addToTarget(delta) {
        this._target = vector_1.Vector3.add(this._target, delta);
    }
    setTarget(target) {
        this._target = target;
    }
    tick() {
        this._actual.add(vector_1.Vector3.sub(this._target, this._actual).mulScalar(this._smoothing));
    }
    getActual() {
        return this._actual;
    }
    getTarget() {
        return this._target;
    }
}
exports.SmoothVectorVariable = SmoothVectorVariable;
