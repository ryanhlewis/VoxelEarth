"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bounds = void 0;
const vector_1 = require("./vector");
/**
 * A 3D cuboid volume defined by two opposing corners
 */
class Bounds {
    constructor(min, max) {
        this._min = min;
        this._max = max;
    }
    extendByPoint(point) {
        this._min = vector_1.Vector3.min(this._min, point);
        this._max = vector_1.Vector3.max(this._max, point);
    }
    extendByVolume(volume) {
        this._min = vector_1.Vector3.min(this._min, volume._min);
        this._max = vector_1.Vector3.max(this._max, volume._max);
    }
    // TODO: rename to `createInfinitesimalBounds`
    static getInfiniteBounds() {
        return new Bounds(new vector_1.Vector3(Infinity, Infinity, Infinity), new vector_1.Vector3(-Infinity, -Infinity, -Infinity));
    }
    get min() {
        return this._min;
    }
    get max() {
        return this._max;
    }
    // TODO: Rename to `calcCentre`
    getCentre() {
        const extents = vector_1.Vector3.sub(this._max, this._min).divScalar(2);
        return vector_1.Vector3.add(this.min, extents);
    }
    // TODO: Rename to `calcDimensions`
    getDimensions() {
        return vector_1.Vector3.sub(this._max, this._min);
    }
}
exports.Bounds = Bounds;
