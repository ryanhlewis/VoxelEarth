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
exports.BVHRayVoxeliser = void 0;
// var progress_1 = require("../progress");
var ray_1 = require("../ray");
var error_util_1 = require("../util/error_util");
var log_util_1 = require("../util/log_util");
var vector_1 = require("../vector");
var voxel_mesh_1 = require("../voxel_mesh");
var base_voxeliser_1 = require("./base-voxeliser");
var bvhtree = require('bvh-tree');
/**
 * This voxeliser works by projecting rays onto each triangle
 * on each of the principle angles and testing for intersections
 */
var BVHRayVoxeliser = /** @class */ (function (_super) {
    __extends(BVHRayVoxeliser, _super);
    function BVHRayVoxeliser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BVHRayVoxeliser.prototype._voxelise = function (mesh, voxeliseParams) {
        var voxelMesh = new voxel_mesh_1.VoxelMesh(voxeliseParams);
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
        // Build BVH
        var triangles = Array(mesh._tris.length);
        for (var triIndex = 0; triIndex < mesh.getTriangleCount(); ++triIndex) {
            var positionData = mesh.getVertices(triIndex);
            triangles[triIndex] = [positionData.v0, positionData.v1, positionData.v2];
        }
        var MAX_TRIANGLES_PER_NODE = 8;
        (0, log_util_1.LOG)('Creating BVH...');
        var bvh = new bvhtree.BVH(triangles, MAX_TRIANGLES_PER_NODE);
        (0, log_util_1.LOG)('BVH created...');
        // Generate rays
        var bounds = mesh.getBounds();
        bounds.min.floor();
        bounds.max.ceil();
        var planeDims = vector_1.Vector3.sub(bounds.max, bounds.min).add(1);
        var numRays = (planeDims.x * planeDims.y) + (planeDims.x * planeDims.z) + (planeDims.y * planeDims.z);
        var rays = new Array(numRays);
        var rayIndex = 0;
        {
            // Generate x-plane rays
            for (var y = bounds.min.y; y <= bounds.max.y; ++y) {
                for (var z = bounds.min.z; z <= bounds.max.z; ++z) {
                    rays[rayIndex++] = {
                        origin: new vector_1.Vector3(bounds.min.x - 1, y, z),
                        axis: ray_1.Axes.x,
                    };
                }
            }
            // Generate y-plane rays
            for (var x = bounds.min.x; x <= bounds.max.x; ++x) {
                for (var z = bounds.min.z; z <= bounds.max.z; ++z) {
                    rays[rayIndex++] = {
                        origin: new vector_1.Vector3(x, bounds.min.y - 1, z),
                        axis: ray_1.Axes.y,
                    };
                }
            }
            // Generate z-plane rays
            for (var x = bounds.min.x; x <= bounds.max.x; ++x) {
                for (var y = bounds.min.y; y <= bounds.max.y; ++y) {
                    rays[rayIndex++] = {
                        origin: new vector_1.Vector3(x, y, bounds.min.z - 1),
                        axis: ray_1.Axes.z,
                    };
                }
            }
        }
        (0, error_util_1.ASSERT)(rays.length === rayIndex);
        (0, log_util_1.LOG)('Rays created...');
        // Ray test BVH
        // var taskHandle = progress_1.ProgressManager.Get.start('Voxelising');
        for (rayIndex = 0; rayIndex < rays.length; ++rayIndex) {
            // progress_1.ProgressManager.Get.progress(taskHandle, rayIndex / rays.length);
            var ray = rays[rayIndex];
            var intersections = bvh.intersectRay(ray.origin, (0, ray_1.axesToDirection)(ray.axis), false);
            for (var _i = 0, intersections_1 = intersections; _i < intersections_1.length; _i++) {
                var intersection = intersections_1[_i];
                var point = intersection.intersectionPoint;
                var position = new vector_1.Vector3(point.x, point.y, point.z);
                var voxelColour = this._getVoxelColour(mesh, mesh.getUVTriangle(intersection.triangleIndex), mesh.getMaterialByTriangle(intersection.triangleIndex), position, voxeliseParams.useMultisampleColouring);
                voxelMesh.addVoxel(position, voxelColour);
            }
        }
        // progress_1.ProgressManager.Get.end(taskHandle);
        mesh.clearTransform();
        return voxelMesh;
    };
    return BVHRayVoxeliser;
}(base_voxeliser_1.IVoxeliser));
exports.BVHRayVoxeliser = BVHRayVoxeliser;
