"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UVTriangle = exports.Triangle = void 0;
var bounds_1 = require("./bounds");
var vector_1 = require("./vector");
var Triangle = /** @class */ (function () {
    function Triangle(v0, v1, v2) {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
    }
    Triangle.prototype.getCentre = function () {
        return vector_1.Vector3.divScalar(vector_1.Vector3.add(vector_1.Vector3.add(this.v0, this.v1), this.v2), 3.0);
    };
    Triangle.prototype.getArea = function () {
        var a = vector_1.Vector3.sub(this.v0, this.v1).magnitude();
        var b = vector_1.Vector3.sub(this.v1, this.v2).magnitude();
        var c = vector_1.Vector3.sub(this.v2, this.v0).magnitude();
        var p = (a + b + c) / 2;
        return Math.sqrt(p * (p - a) * (p - b) * (p - c));
    };
    Triangle.prototype.getNormal = function () {
        var u = vector_1.Vector3.sub(this.v0, this.v1);
        var v = vector_1.Vector3.sub(this.v0, this.v2);
        return vector_1.Vector3.cross(u, v).normalise();
    };
    Triangle.prototype.getBounds = function () {
        return new bounds_1.Bounds(new vector_1.Vector3(Math.min(this.v0.x, this.v1.x, this.v2.x), Math.min(this.v0.y, this.v1.y, this.v2.y), Math.min(this.v0.z, this.v1.z, this.v2.z)), new vector_1.Vector3(Math.max(this.v0.x, this.v1.x, this.v2.x), Math.max(this.v0.y, this.v1.y, this.v2.y), Math.max(this.v0.z, this.v1.z, this.v2.z)));
    };
    return Triangle;
}());
exports.Triangle = Triangle;
var UVTriangle = /** @class */ (function (_super) {
    __extends(UVTriangle, _super);
    function UVTriangle(v0, v1, v2, n0, n1, n2, uv0, uv1, uv2) {
        var _this = _super.call(this, v0, v1, v2) || this;
        _this.n0 = n0;
        _this.n1 = n1;
        _this.n2 = n2;
        _this.uv0 = uv0;
        _this.uv1 = uv1;
        _this.uv2 = uv2;
        return _this;
    }
    return UVTriangle;
}(Triangle));
exports.UVTriangle = UVTriangle;
