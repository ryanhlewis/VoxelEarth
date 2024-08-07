"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fastCrossZAxis = exports.fastCrossYAxis = exports.fastCrossXAxis = exports.Vector3 = void 0;
var error_util_1 = require("./util/error_util");
var Vector3 = /** @class */ (function () {
    function Vector3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vector3.prototype.set = function (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };
    Vector3.prototype.setFrom = function (vec) {
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
    };
    Vector3.fromArray = function (arr) {
        (0, error_util_1.ASSERT)(arr.length === 3);
        return new Vector3(arr[0], arr[1], arr[2]);
    };
    Vector3.prototype.toArray = function () {
        return [this.x, this.y, this.z];
    };
    Vector3.random = function () {
        return new Vector3(Math.random(), Math.random(), Math.random());
    };
    Vector3.parse = function (line) {
        var regex = /[+-]?\d+(\.\d+)?/g;
        var floats = line.match(regex).map(function (v) {
            return parseFloat(v);
        });
        return new Vector3(floats[0], floats[1], floats[2]);
    };
    Vector3.copy = function (vec) {
        return new Vector3(vec.x, vec.y, vec.z);
    };
    Vector3.add = function (vec, toAdd) {
        return Vector3.copy(vec).add(toAdd);
    };
    Vector3.sub = function (vec, toAdd) {
        return Vector3.copy(vec).sub(toAdd);
    };
    Vector3.prototype.add = function (toAdd) {
        if (toAdd instanceof Vector3) {
            this.x += toAdd.x;
            this.y += toAdd.y;
            this.z += toAdd.z;
            return this;
        }
        else {
            this.x += toAdd;
            this.y += toAdd;
            this.z += toAdd;
            return this;
        }
    };
    Vector3.prototype.sub = function (toAdd) {
        if (toAdd instanceof Vector3) {
            this.x -= toAdd.x;
            this.y -= toAdd.y;
            this.z -= toAdd.z;
            return this;
        }
        else {
            this.x -= toAdd;
            this.y -= toAdd;
            this.z -= toAdd;
            return this;
        }
    };
    Vector3.dot = function (vecA, vecB) {
        return vecA.x * vecB.x + vecA.y * vecB.y + vecA.z * vecB.z;
    };
    Vector3.prototype.copy = function () {
        return Vector3.copy(this);
    };
    Vector3.mulScalar = function (vec, scalar) {
        return new Vector3(scalar * vec.x, scalar * vec.y, scalar * vec.z);
    };
    Vector3.prototype.mulScalar = function (scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    };
    Vector3.divScalar = function (vec, scalar) {
        return new Vector3(vec.x / scalar, vec.y / scalar, vec.z / scalar);
    };
    Vector3.prototype.divScalar = function (scalar) {
        this.x /= scalar;
        this.y /= scalar;
        this.z /= scalar;
        return this;
    };
    Vector3.lessThanEqualTo = function (vecA, vecB) {
        return vecA.x <= vecB.x && vecA.y <= vecB.y && vecA.z <= vecB.z;
    };
    Vector3.round = function (vec) {
        return new Vector3(Math.round(vec.x), Math.round(vec.y), Math.round(vec.z));
    };
    Vector3.prototype.round = function () {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);
        return this;
    };
    Vector3.abs = function (vec) {
        return new Vector3(Math.abs(vec.x), Math.abs(vec.y), Math.abs(vec.z));
    };
    Vector3.cross = function (vecA, vecB) {
        return new Vector3(vecA.y * vecB.z - vecA.z * vecB.y, vecA.z * vecB.x - vecA.x * vecB.z, vecA.x * vecB.y - vecA.y * vecB.x);
    };
    Vector3.min = function (vecA, vecB) {
        return new Vector3(Math.min(vecA.x, vecB.x), Math.min(vecA.y, vecB.y), Math.min(vecA.z, vecB.z));
    };
    Vector3.max = function (vecA, vecB) {
        return new Vector3(Math.max(vecA.x, vecB.x), Math.max(vecA.y, vecB.y), Math.max(vecA.z, vecB.z));
    };
    Vector3.prototype.magnitude = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    };
    Vector3.prototype.normalise = function () {
        var mag = this.magnitude();
        this.x /= mag;
        this.y /= mag;
        this.z /= mag;
        return this;
    };
    Object.defineProperty(Vector3, "xAxis", {
        get: function () {
            return new Vector3(1.0, 0.0, 0.0);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Vector3, "yAxis", {
        get: function () {
            return new Vector3(0.0, 1.0, 0.0);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Vector3, "zAxis", {
        get: function () {
            return new Vector3(0.0, 0.0, 1.0);
        },
        enumerable: false,
        configurable: true
    });
    Vector3.prototype.isNumber = function () {
        return !isNaN(this.x) && !isNaN(this.y) && !isNaN(this.z);
    };
    Vector3.prototype.negate = function () {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    };
    Vector3.prototype.floor = function () {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        this.z = Math.floor(this.z);
        return this;
    };
    Vector3.prototype.ceil = function () {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        this.z = Math.ceil(this.z);
        return this;
    };
    // Begin IHashable interface
    Vector3.prototype.hash = function () {
        return ((this.x + 10000000) << 42) + ((this.y + 10000000) << 21) + (this.z + 10000000);
    };
    Vector3.prototype.equals = function (other) {
        return this.x == other.x && this.y == other.y && this.z == other.z;
    };
    // End IHashable interface
    Vector3.prototype.stringify = function () {
        return "".concat(this.x, "_").concat(this.y, "_").concat(this.z);
    };
    Vector3.prototype.intoArray = function (array, start) {
        array[start + 0] = this.x;
        array[start + 1] = this.y;
        array[start + 2] = this.z;
    };
    return Vector3;
}());
exports.Vector3 = Vector3;
var fastCrossXAxis = function (vec) {
    return new Vector3(0.0, -vec.z, vec.y);
};
exports.fastCrossXAxis = fastCrossXAxis;
var fastCrossYAxis = function (vec) {
    return new Vector3(vec.z, 0.0, -vec.x);
};
exports.fastCrossYAxis = fastCrossYAxis;
var fastCrossZAxis = function (vec) {
    return new Vector3(-vec.y, vec.x, 0.0);
};
exports.fastCrossZAxis = fastCrossZAxis;
