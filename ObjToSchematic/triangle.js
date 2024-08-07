"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UVTriangle = exports.Triangle = void 0;
const bounds_1 = require("./bounds");
const vector_1 = require("./vector");
class Triangle {
    constructor(v0, v1, v2) {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
    }
    getCentre() {
        return vector_1.Vector3.divScalar(vector_1.Vector3.add(vector_1.Vector3.add(this.v0, this.v1), this.v2), 3.0);
    }
    getArea() {
        const a = vector_1.Vector3.sub(this.v0, this.v1).magnitude();
        const b = vector_1.Vector3.sub(this.v1, this.v2).magnitude();
        const c = vector_1.Vector3.sub(this.v2, this.v0).magnitude();
        const p = (a + b + c) / 2;
        return Math.sqrt(p * (p - a) * (p - b) * (p - c));
    }
    getNormal() {
        const u = vector_1.Vector3.sub(this.v0, this.v1);
        const v = vector_1.Vector3.sub(this.v0, this.v2);
        return vector_1.Vector3.cross(u, v).normalise();
    }
    getBounds() {
        return new bounds_1.Bounds(new vector_1.Vector3(Math.min(this.v0.x, this.v1.x, this.v2.x), Math.min(this.v0.y, this.v1.y, this.v2.y), Math.min(this.v0.z, this.v1.z, this.v2.z)), new vector_1.Vector3(Math.max(this.v0.x, this.v1.x, this.v2.x), Math.max(this.v0.y, this.v1.y, this.v2.y), Math.max(this.v0.z, this.v1.z, this.v2.z)));
    }
}
exports.Triangle = Triangle;
class UVTriangle extends Triangle {
    constructor(v0, v1, v2, n0, n1, n2, uv0, uv1, uv2) {
        super(v0, v1, v2);
        this.n0 = n0;
        this.n1 = n1;
        this.n2 = n2;
        this.uv0 = uv0;
        this.uv1 = uv1;
        this.uv2 = uv2;
    }
}
exports.UVTriangle = UVTriangle;
