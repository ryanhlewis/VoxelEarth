"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rayIntersectTriangle = exports.axesToDirection = exports.Axes = void 0;
const error_util_1 = require("./util/error_util");
const vector_1 = require("./vector");
const EPSILON = 0.0000001;
/* eslint-disable */
var Axes;
(function (Axes) {
    Axes[Axes["x"] = 0] = "x";
    Axes[Axes["y"] = 1] = "y";
    Axes[Axes["z"] = 2] = "z";
})(Axes = exports.Axes || (exports.Axes = {}));
/* eslint-enable */
function axesToDirection(axis) {
    if (axis === Axes.x) {
        return new vector_1.Vector3(1, 0, 0);
    }
    if (axis === Axes.y) {
        return new vector_1.Vector3(0, 1, 0);
    }
    if (axis === Axes.z) {
        return new vector_1.Vector3(0, 0, 1);
    }
    (0, error_util_1.ASSERT)(false);
}
exports.axesToDirection = axesToDirection;
function rayIntersectTriangle(ray, v0, v1, v2) {
    const edge1 = vector_1.Vector3.sub(v1, v0);
    const edge2 = vector_1.Vector3.sub(v2, v0);
    const rayDirection = axesToDirection(ray.axis);
    const h = vector_1.Vector3.cross(rayDirection, edge2);
    const a = vector_1.Vector3.dot(edge1, h);
    if (a > -EPSILON && a < EPSILON) {
        return; // Ray is parallel to triangle
    }
    const f = 1.0 / a;
    const s = vector_1.Vector3.sub(ray.origin, v0);
    const u = f * vector_1.Vector3.dot(s, h);
    if (u < 0.0 || u > 1.0) {
        return;
    }
    const q = vector_1.Vector3.cross(s, edge1);
    const v = f * vector_1.Vector3.dot(rayDirection, q);
    if (v < 0.0 || u + v > 1.0) {
        return;
    }
    const t = f * vector_1.Vector3.dot(edge2, q);
    if (t > EPSILON) {
        return vector_1.Vector3.add(ray.origin, vector_1.Vector3.mulScalar(rayDirection, t));
    }
}
exports.rayIntersectTriangle = rayIntersectTriangle;
