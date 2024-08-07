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
exports.RayVoxeliser = void 0;
var bounds_1 = require("../bounds");
var linear_allocator_1 = require("../linear_allocator");
// var progress_1 = require("../progress");
var ray_1 = require("../ray");
var error_util_1 = require("../util/error_util");
var vector_1 = require("../vector");
var voxel_mesh_1 = require("../voxel_mesh");
var base_voxeliser_1 = require("./base-voxeliser");
/**
 * This voxeliser works by projecting rays onto each triangle
 * on each of the principle angles and testing for intersections
 */
var RayVoxeliser = /** @class */ (function (_super) {
    __extends(RayVoxeliser, _super);
    function RayVoxeliser() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._rayList = new linear_allocator_1.LinearAllocator(function () {
            var ray = { origin: new vector_1.Vector3(0, 0, 0), axis: ray_1.Axes.x };
            return ray;
        });
        _this._tmpBounds = new bounds_1.Bounds(new vector_1.Vector3(0, 0, 0), new vector_1.Vector3(0, 0, 0));
        return _this;
    }
    RayVoxeliser.prototype._voxelise = function (mesh, voxeliseParams) {
        this._mesh = mesh;
        this._voxelMesh = new voxel_mesh_1.VoxelMesh(voxeliseParams);
        this._voxeliseParams = voxeliseParams;
        var meshDimensions = mesh.getBounds().getDimensions();
        var scale;
        var offset = new vector_1.Vector3(0.0, 0.0, 0.0);
        switch (voxeliseParams.constraintAxis) {
            case 'x':
                scale = (voxeliseParams.size - 1) / meshDimensions.x;
                offset = (voxeliseParams.size % 2 === 0) ? new vector_1.Vector3(0.5, 0.0, 0.0) : new vector_1.Vector3(0.0, 0.0, 0.0);
                break;
            case 'y':
                scale = (voxeliseParams.size - 1) / meshDimensions.y;
                offset = (voxeliseParams.size % 2 === 0) ? new vector_1.Vector3(0.0, 0.5, 0.0) : new vector_1.Vector3(0.0, 0.0, 0.0);
                break;
            case 'z':
                scale = (voxeliseParams.size - 1) / meshDimensions.z;
                offset = (voxeliseParams.size % 2 === 0) ? new vector_1.Vector3(0.0, 0.0, 0.5) : new vector_1.Vector3(0.0, 0.0, 0.0);
                break;
        }
        mesh.setTransform(function (vertex) {
            return vertex.copy().mulScalar(scale).add(offset);
        });
        var numTris = mesh.getTriangleCount();
        // var taskHandle = progress_1.ProgressManager.Get.start('Voxelising');
        for (var triIndex = 0; triIndex < numTris; ++triIndex) {
            // progress_1.ProgressManager.Get.progress(taskHandle, triIndex / numTris);
            var uvTriangle = mesh.getUVTriangle(triIndex);
            var material = mesh.getMaterialByTriangle(triIndex);
            this._voxeliseTri(uvTriangle, material);
        }
        // progress_1.ProgressManager.Get.end(taskHandle);
        mesh.clearTransform();
        return this._voxelMesh;
    };
    RayVoxeliser.prototype._voxeliseTri = function (triangle, materialName) {
        this._rayList.reset();
        this._generateRays(triangle.v0, triangle.v1, triangle.v2);
        (0, error_util_1.ASSERT)(this._mesh !== undefined);
        (0, error_util_1.ASSERT)(this._voxeliseParams !== undefined);
        (0, error_util_1.ASSERT)(this._voxelMesh !== undefined);
        var voxelPosition = new vector_1.Vector3(0, 0, 0);
        var size = this._rayList.size();
        for (var i = 0; i < size; ++i) {
            var ray = this._rayList.get(i);
            var intersection = (0, ray_1.rayIntersectTriangle)(ray, triangle.v0, triangle.v1, triangle.v2);
            if (intersection) {
                switch (ray.axis) {
                    case ray_1.Axes.x:
                        voxelPosition.x = Math.round(intersection.x);
                        voxelPosition.y = intersection.y;
                        voxelPosition.z = intersection.z;
                        break;
                    case ray_1.Axes.y:
                        voxelPosition.x = intersection.x;
                        voxelPosition.y = Math.round(intersection.y);
                        voxelPosition.z = intersection.z;
                        break;
                    case ray_1.Axes.z:
                        voxelPosition.x = intersection.x;
                        voxelPosition.y = intersection.y;
                        voxelPosition.z = Math.round(intersection.z);
                        break;
                }
                var voxelColour = this._getVoxelColour(this._mesh, triangle, materialName, voxelPosition, this._voxeliseParams.useMultisampleColouring);
                this._voxelMesh.addVoxel(voxelPosition, voxelColour);
            }
        }
        ;
    };
    RayVoxeliser.prototype._generateRays = function (v0, v1, v2) {
        this._tmpBounds.min.x = Math.floor(Math.min(v0.x, v1.x, v2.x));
        this._tmpBounds.min.y = Math.floor(Math.min(v0.y, v1.y, v2.y));
        this._tmpBounds.min.z = Math.floor(Math.min(v0.z, v1.z, v2.z));
        this._tmpBounds.max.x = Math.floor(Math.max(v0.x, v1.x, v2.x));
        this._tmpBounds.max.y = Math.floor(Math.max(v0.y, v1.y, v2.y));
        this._tmpBounds.max.z = Math.floor(Math.max(v0.z, v1.z, v2.z));
        //const rayList: Array<Ray> = [];
        this._traverseX(this._tmpBounds);
        this._traverseY(this._tmpBounds);
        this._traverseZ(this._tmpBounds);
        //return rayList;
    };
    RayVoxeliser.prototype._traverseX = function (bounds) {
        for (var y = bounds.min.y; y <= bounds.max.y; ++y) {
            for (var z = bounds.min.z; z <= bounds.max.z; ++z) {
                var ray = this._rayList.place();
                ray.origin.x = bounds.min.x - 1;
                ray.origin.y = y;
                ray.origin.z = z;
                ray.axis = ray_1.Axes.x;
            }
        }
    };
    RayVoxeliser.prototype._traverseY = function (bounds) {
        for (var x = bounds.min.x; x <= bounds.max.x; ++x) {
            for (var z = bounds.min.z; z <= bounds.max.z; ++z) {
                var ray = this._rayList.place();
                ray.origin.x = x;
                ray.origin.y = bounds.min.y - 1;
                ray.origin.z = z;
                ray.axis = ray_1.Axes.y;
            }
        }
    };
    RayVoxeliser.prototype._traverseZ = function (bounds) {
        for (var x = bounds.min.x; x <= bounds.max.x; ++x) {
            for (var y = bounds.min.y; y <= bounds.max.y; ++y) {
                var ray = this._rayList.place();
                ray.origin.x = x;
                ray.origin.y = y;
                ray.origin.z = bounds.min.z - 1;
                ray.axis = ray_1.Axes.z;
            }
        }
    };
    return RayVoxeliser;
}(base_voxeliser_1.IVoxeliser));
exports.RayVoxeliser = RayVoxeliser;
