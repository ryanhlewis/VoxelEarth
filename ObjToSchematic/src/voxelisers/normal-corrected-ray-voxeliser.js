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
exports.NormalCorrectedRayVoxeliser = void 0;
var bounds_1 = require("../bounds");
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
var NormalCorrectedRayVoxeliser = /** @class */ (function (_super) {
    __extends(NormalCorrectedRayVoxeliser, _super);
    function NormalCorrectedRayVoxeliser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NormalCorrectedRayVoxeliser.prototype._voxelise = function (mesh, voxeliseParams) {
        this._mesh = mesh;
        this._voxelMesh = new voxel_mesh_1.VoxelMesh(voxeliseParams);
        this._voxeliseParams = voxeliseParams;
        var meshDimensions = mesh.getBounds().getDimensions();
        var scale;
        switch (voxeliseParams.constraintAxis) {
            case 'x':
                scale = voxeliseParams.size / meshDimensions.x;
                break;
            case 'y':
                scale = voxeliseParams.size / meshDimensions.y;
                break;
            case 'z':
                scale = voxeliseParams.size / meshDimensions.z;
                break;
        }
        mesh.setTransform(function (vertex) {
            return vertex.copy().mulScalar(scale);
        });
        var bounds = mesh.getBounds();
        this._size = vector_1.Vector3.sub(bounds.max.copy().ceil(), bounds.min.copy().floor());
        this._offset = new vector_1.Vector3(this._size.x % 2 === 0 ? 0.5 : 0.0, this._size.y % 2 === 0 ? 0.5 : 0.0, this._size.z % 2 === 0 ? 0.5 : 0.0);
        var numTris = mesh.getTriangleCount();
        // var taskHandle = progress_1.ProgressManager.Get.start('Voxelising');
        for (var triIndex = 0; triIndex < numTris; ++triIndex) {
            // progress_1.ProgressManager.Get.progress(taskHandle, triIndex / numTris);
            var uvTriangle = mesh.getUVTriangle(triIndex);
            var normals = mesh.getNormals(triIndex);
            var material = mesh.getMaterialByTriangle(triIndex);
            this._voxeliseTri(uvTriangle, material, normals);
        }
        // progress_1.ProgressManager.Get.end(taskHandle);
        mesh.clearTransform();
        return this._voxelMesh;
    };
    NormalCorrectedRayVoxeliser.prototype._voxeliseTri = function (triangle, materialName, normals) {
        var rayList = this._generateRays(triangle.v0, triangle.v1, triangle.v2, this._offset);
        (0, error_util_1.ASSERT)(this._mesh !== undefined);
        (0, error_util_1.ASSERT)(this._voxeliseParams !== undefined);
        (0, error_util_1.ASSERT)(this._voxelMesh !== undefined);
        for (var _i = 0, rayList_1 = rayList; _i < rayList_1.length; _i++) {
            var ray = rayList_1[_i];
            var intersection = (0, ray_1.rayIntersectTriangle)(ray, triangle.v0, triangle.v1, triangle.v2);
            if (intersection) {
                // Move transition away from normal
                var norm = normals.v0.normalise();
                intersection.sub(vector_1.Vector3.mulScalar(norm, 0.5));
                // Correct size parity
                intersection.add(this._offset);
                var voxelPosition = void 0;
                switch (ray.axis) {
                    case ray_1.Axes.x:
                        voxelPosition = new vector_1.Vector3(Math.round(intersection.x), intersection.y, intersection.z);
                        break;
                    case ray_1.Axes.y:
                        voxelPosition = new vector_1.Vector3(intersection.x, Math.round(intersection.y), intersection.z);
                        break;
                    case ray_1.Axes.z:
                        voxelPosition = new vector_1.Vector3(intersection.x, intersection.y, Math.round(intersection.z));
                        break;
                }
                var voxelColour = this._getVoxelColour(this._mesh, triangle, materialName, voxelPosition, this._voxeliseParams.useMultisampleColouring);
                this._voxelMesh.addVoxel(voxelPosition, voxelColour);
            }
        }
        ;
    };
    NormalCorrectedRayVoxeliser.prototype._generateRays = function (v0, v1, v2, offset) {
        var bounds = new bounds_1.Bounds(new vector_1.Vector3(Math.ceil(Math.min(v0.x, v1.x, v2.x)), Math.ceil(Math.min(v0.y, v1.y, v2.y)), Math.ceil(Math.min(v0.z, v1.z, v2.z))), new vector_1.Vector3(Math.floor(Math.max(v0.x, v1.x, v2.x)), Math.floor(Math.max(v0.y, v1.y, v2.y)), Math.floor(Math.max(v0.z, v1.z, v2.z))));
        var rayList = [];
        this._traverseX(rayList, bounds, offset);
        this._traverseY(rayList, bounds, offset);
        this._traverseZ(rayList, bounds, offset);
        return rayList;
    };
    NormalCorrectedRayVoxeliser.prototype._traverseX = function (rayList, bounds, offset) {
        for (var y = bounds.min.y - offset.y; y <= bounds.max.y + offset.y; ++y) {
            for (var z = bounds.min.z - offset.z; z <= bounds.max.z + offset.z; ++z) {
                rayList.push({
                    origin: new vector_1.Vector3(bounds.min.x - 1, y, z),
                    axis: ray_1.Axes.x,
                });
            }
        }
    };
    NormalCorrectedRayVoxeliser.prototype._traverseY = function (rayList, bounds, offset) {
        for (var x = bounds.min.x - offset.x; x <= bounds.max.x + offset.x; ++x) {
            for (var z = bounds.min.z - offset.z; z <= bounds.max.z + offset.z; ++z) {
                rayList.push({
                    origin: new vector_1.Vector3(x, bounds.min.y - 1, z),
                    axis: ray_1.Axes.y,
                });
            }
        }
    };
    NormalCorrectedRayVoxeliser.prototype._traverseZ = function (rayList, bounds, offset) {
        for (var x = bounds.min.x - offset.x; x <= bounds.max.x + offset.x; ++x) {
            for (var y = bounds.min.y - offset.y; y <= bounds.max.y + offset.y; ++y) {
                rayList.push({
                    origin: new vector_1.Vector3(x, y, bounds.min.z - 1),
                    axis: ray_1.Axes.z,
                });
            }
        }
    };
    return NormalCorrectedRayVoxeliser;
}(base_voxeliser_1.IVoxeliser));
exports.NormalCorrectedRayVoxeliser = NormalCorrectedRayVoxeliser;
