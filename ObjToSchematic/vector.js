"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fastCrossZAxis = exports.fastCrossYAxis = exports.fastCrossXAxis = exports.Vector3 = void 0;
const error_util_1 = require("./util/error_util");
class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    setFrom(vec) {
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
    }
    static fromArray(arr) {
        (0, error_util_1.ASSERT)(arr.length === 3);
        return new Vector3(arr[0], arr[1], arr[2]);
    }
    toArray() {
        return [this.x, this.y, this.z];
    }
    static random() {
        return new Vector3(Math.random(), Math.random(), Math.random());
    }
    static parse(line) {
        const regex = /[+-]?\d+(\.\d+)?/g;
        const floats = line.match(regex).map(function (v) {
            return parseFloat(v);
        });
        return new Vector3(floats[0], floats[1], floats[2]);
    }
    static copy(vec) {
        return new Vector3(vec.x, vec.y, vec.z);
    }
    static add(vec, toAdd) {
        return Vector3.copy(vec).add(toAdd);
    }
    static sub(vec, toAdd) {
        return Vector3.copy(vec).sub(toAdd);
    }
    add(toAdd) {
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
    }
    sub(toAdd) {
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
    }
    static dot(vecA, vecB) {
        return vecA.x * vecB.x + vecA.y * vecB.y + vecA.z * vecB.z;
    }
    copy() {
        return Vector3.copy(this);
    }
    static mulScalar(vec, scalar) {
        return new Vector3(scalar * vec.x, scalar * vec.y, scalar * vec.z);
    }
    mulScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }
    static divScalar(vec, scalar) {
        return new Vector3(vec.x / scalar, vec.y / scalar, vec.z / scalar);
    }
    divScalar(scalar) {
        this.x /= scalar;
        this.y /= scalar;
        this.z /= scalar;
        return this;
    }
    static lessThanEqualTo(vecA, vecB) {
        return vecA.x <= vecB.x && vecA.y <= vecB.y && vecA.z <= vecB.z;
    }
    static round(vec) {
        return new Vector3(Math.round(vec.x), Math.round(vec.y), Math.round(vec.z));
    }
    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);
        return this;
    }
    static abs(vec) {
        return new Vector3(Math.abs(vec.x), Math.abs(vec.y), Math.abs(vec.z));
    }
    static cross(vecA, vecB) {
        return new Vector3(vecA.y * vecB.z - vecA.z * vecB.y, vecA.z * vecB.x - vecA.x * vecB.z, vecA.x * vecB.y - vecA.y * vecB.x);
    }
    static min(vecA, vecB) {
        return new Vector3(Math.min(vecA.x, vecB.x), Math.min(vecA.y, vecB.y), Math.min(vecA.z, vecB.z));
    }
    static max(vecA, vecB) {
        return new Vector3(Math.max(vecA.x, vecB.x), Math.max(vecA.y, vecB.y), Math.max(vecA.z, vecB.z));
    }
    magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }
    normalise() {
        const mag = this.magnitude();
        this.x /= mag;
        this.y /= mag;
        this.z /= mag;
        return this;
    }
    static get xAxis() {
        return new Vector3(1.0, 0.0, 0.0);
    }
    static get yAxis() {
        return new Vector3(0.0, 1.0, 0.0);
    }
    static get zAxis() {
        return new Vector3(0.0, 0.0, 1.0);
    }
    isNumber() {
        return !isNaN(this.x) && !isNaN(this.y) && !isNaN(this.z);
    }
    negate() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }
    floor() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        this.z = Math.floor(this.z);
        return this;
    }
    ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        this.z = Math.ceil(this.z);
        return this;
    }
    // Begin IHashable interface
    hash() {
        return ((this.x + 10000000) << 42) + ((this.y + 10000000) << 21) + (this.z + 10000000);
    }
    equals(other) {
        return this.x == other.x && this.y == other.y && this.z == other.z;
    }
    // End IHashable interface
    stringify() {
        return `${this.x}_${this.y}_${this.z}`;
    }
    intoArray(array, start) {
        array[start + 0] = this.x;
        array[start + 1] = this.y;
        array[start + 2] = this.z;
    }
}
exports.Vector3 = Vector3;
const fastCrossXAxis = (vec) => {
    return new Vector3(0.0, -vec.z, vec.y);
};
exports.fastCrossXAxis = fastCrossXAxis;
const fastCrossYAxis = (vec) => {
    return new Vector3(vec.z, 0.0, -vec.x);
};
exports.fastCrossYAxis = fastCrossYAxis;
const fastCrossZAxis = (vec) => {
    return new Vector3(-vec.y, vec.x, 0.0);
};
exports.fastCrossZAxis = fastCrossZAxis;
