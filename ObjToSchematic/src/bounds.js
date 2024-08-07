"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bounds = void 0;
var vector_1 = require("./vector");
/**
 * A 3D cuboid volume defined by two opposing corners
 */
var Bounds = /** @class */ (function () {
    function Bounds(min, max) {
        this._min = min;
        this._max = max;
    }
    Bounds.prototype.extendByPoint = function (point) {
        this._min = vector_1.Vector3.min(this._min, point);
        this._max = vector_1.Vector3.max(this._max, point);
    };
    Bounds.prototype.extendByVolume = function (volume) {
        this._min = vector_1.Vector3.min(this._min, volume._min);
        this._max = vector_1.Vector3.max(this._max, volume._max);
    };
    // TODO: rename to `createInfinitesimalBounds`
    Bounds.getInfiniteBounds = function () {
        return new Bounds(new vector_1.Vector3(Infinity, Infinity, Infinity), new vector_1.Vector3(-Infinity, -Infinity, -Infinity));
    };
    Object.defineProperty(Bounds.prototype, "min", {
        get: function () {
            return this._min;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Bounds.prototype, "max", {
        get: function () {
            return this._max;
        },
        enumerable: false,
        configurable: true
    });
    // TODO: Rename to `calcCentre`
    Bounds.prototype.getCentre = function () {
        var extents = vector_1.Vector3.sub(this._max, this._min).divScalar(2);
        return vector_1.Vector3.add(this.min, extents);
    };
    // TODO: Rename to `calcDimensions`
    Bounds.prototype.getDimensions = function () {
        return vector_1.Vector3.sub(this._max, this._min);
    };
    return Bounds;
}());
exports.Bounds = Bounds;
