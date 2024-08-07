"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmoothVectorVariable = exports.SmoothVariable = exports.degreesToRadians = exports.checkNaN = exports.wayThrough = exports.mapRange = exports.between = exports.roundToNearest = exports.ceilToNearest = exports.floorToNearest = exports.clamp = exports.argMax = exports.AppMath = void 0;
var error_util_1 = require("./util/error_util");
var vector_1 = require("./vector");
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
    function nearlyEqual(a, b, tolerance) {
        if (tolerance === void 0) { tolerance = 0.0001; }
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
})(AppMath || (exports.AppMath = AppMath = {}));
var argMax = function (array) {
    return array.map(function (x, i) { return [x, i]; }).reduce(function (r, a) { return (a[0] > r[0] ? a : r); })[1];
};
exports.argMax = argMax;
var clamp = function (value, min, max) {
    return Math.max(Math.min(max, value), min);
};
exports.clamp = clamp;
var floorToNearest = function (value, base) {
    return Math.floor(value / base) * base;
};
exports.floorToNearest = floorToNearest;
var ceilToNearest = function (value, base) {
    return Math.ceil(value / base) * base;
};
exports.ceilToNearest = ceilToNearest;
var roundToNearest = function (value, base) {
    return Math.round(value / base) * base;
};
exports.roundToNearest = roundToNearest;
var between = function (value, min, max) {
    return min <= value && value <= max;
};
exports.between = between;
var mapRange = function (value, fromMin, fromMax, toMin, toMax) {
    return (value - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
};
exports.mapRange = mapRange;
var wayThrough = function (value, min, max) {
    // ASSERT(value >= min && value <= max);
    return (value - min) / (max - min);
};
exports.wayThrough = wayThrough;
/**
 * Throws is any number in args is NaN
 */
var checkNaN = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var existsNaN = args.some(function (arg) {
        return isNaN(arg);
    });
    (0, error_util_1.ASSERT)(!existsNaN, 'Found NaN');
};
exports.checkNaN = checkNaN;
exports.degreesToRadians = Math.PI / 180;
var SmoothVariable = /** @class */ (function () {
    function SmoothVariable(value, smoothing) {
        this._actual = value;
        this._target = value;
        this._smoothing = smoothing;
        this._min = -Infinity;
        this._max = Infinity;
    }
    SmoothVariable.prototype.setClamp = function (min, max) {
        this._min = min;
        this._max = max;
    };
    SmoothVariable.prototype.addToTarget = function (delta) {
        this._target = (0, exports.clamp)(this._target + delta, this._min, this._max);
    };
    SmoothVariable.prototype.setTarget = function (target) {
        this._target = (0, exports.clamp)(target, this._min, this._max);
    };
    SmoothVariable.prototype.setActual = function (actual) {
        this._actual = actual;
    };
    SmoothVariable.prototype.tick = function () {
        this._actual += (this._target - this._actual) * this._smoothing;
    };
    SmoothVariable.prototype.getActual = function () {
        return this._actual;
    };
    SmoothVariable.prototype.getTarget = function () {
        return this._target;
    };
    return SmoothVariable;
}());
exports.SmoothVariable = SmoothVariable;
var SmoothVectorVariable = /** @class */ (function () {
    function SmoothVectorVariable(value, smoothing) {
        this._actual = value;
        this._target = value;
        this._smoothing = smoothing;
    }
    SmoothVectorVariable.prototype.addToTarget = function (delta) {
        this._target = vector_1.Vector3.add(this._target, delta);
    };
    SmoothVectorVariable.prototype.setTarget = function (target) {
        this._target = target;
    };
    SmoothVectorVariable.prototype.tick = function () {
        this._actual.add(vector_1.Vector3.sub(this._target, this._actual).mulScalar(this._smoothing));
    };
    SmoothVectorVariable.prototype.getActual = function () {
        return this._actual;
    };
    SmoothVectorVariable.prototype.getTarget = function () {
        return this._target;
    };
    return SmoothVectorVariable;
}());
exports.SmoothVectorVariable = SmoothVectorVariable;
