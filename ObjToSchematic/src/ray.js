"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rayIntersectTriangle = exports.axesToDirection = exports.Axes = void 0;
var error_util_1 = require("./util/error_util");
var vector_1 = require("./vector");
var EPSILON = 0.0000001;
/* eslint-disable */
var Axes;
(function (Axes) {
    Axes[Axes["x"] = 0] = "x";
    Axes[Axes["y"] = 1] = "y";
    Axes[Axes["z"] = 2] = "z";
})(Axes || (exports.Axes = Axes = {}));
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
    var edge1 = vector_1.Vector3.sub(v1, v0);
    var edge2 = vector_1.Vector3.sub(v2, v0);
    var rayDirection = axesToDirection(ray.axis);
    var h = vector_1.Vector3.cross(rayDirection, edge2);
    var a = vector_1.Vector3.dot(edge1, h);
    if (a > -EPSILON && a < EPSILON) {
        return; // Ray is parallel to triangle
    }
    var f = 1.0 / a;
    var s = vector_1.Vector3.sub(ray.origin, v0);
    var u = f * vector_1.Vector3.dot(s, h);
    if (u < 0.0 || u > 1.0) {
        return;
    }
    var q = vector_1.Vector3.cross(s, edge1);
    var v = f * vector_1.Vector3.dot(rayDirection, q);
    if (v < 0.0 || u + v > 1.0) {
        return;
    }
    var t = f * vector_1.Vector3.dot(edge2, q);
    if (t > EPSILON) {
        return vector_1.Vector3.add(ray.origin, vector_1.Vector3.mulScalar(rayDirection, t));
    }
}
exports.rayIntersectTriangle = rayIntersectTriangle;
