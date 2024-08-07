"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoxeliserFactory = void 0;
var error_util_1 = require("../util/error_util");
var bvh_ray_voxeliser_1 = require("./bvh-ray-voxeliser");
var bvh_ray_voxeliser_plus_thickness_1 = require("./bvh-ray-voxeliser-plus-thickness");
var normal_corrected_ray_voxeliser_1 = require("./normal-corrected-ray-voxeliser");
var ray_voxeliser_1 = require("./ray-voxeliser");
var VoxeliserFactory = /** @class */ (function () {
    function VoxeliserFactory() {
    }
    VoxeliserFactory.GetVoxeliser = function (voxeliser) {
        switch (voxeliser) {
            case 'bvh-ray':
                return new bvh_ray_voxeliser_1.BVHRayVoxeliser();
            case 'ncrb':
                return new normal_corrected_ray_voxeliser_1.NormalCorrectedRayVoxeliser();
            case 'ray-based':
                return new ray_voxeliser_1.RayVoxeliser();
            case 'bvh-ray-plus-thickness':
                return new bvh_ray_voxeliser_plus_thickness_1.BVHRayVoxeliserPlusThickness();
            default:
                (0, error_util_1.ASSERT)(false, 'Unreachable');
        }
    };
    return VoxeliserFactory;
}());
exports.VoxeliserFactory = VoxeliserFactory;
