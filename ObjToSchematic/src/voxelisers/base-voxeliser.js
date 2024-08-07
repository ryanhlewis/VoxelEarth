"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IVoxeliser = void 0;
var colour_1 = require("../colour");
var config_1 = require("../config");
// var localiser_1 = require("../localiser");
var mesh_1 = require("../mesh");
var status_1 = require("../status");
var triangle_1 = require("../triangle");
var util_1 = require("../util");
var error_util_1 = require("../util/error_util");
var vector_1 = require("../vector");
var IVoxeliser = /** @class */ (function () {
    function IVoxeliser() {
    }
    IVoxeliser.prototype.voxelise = function (mesh, voxeliseParams) {
        var voxelMesh = this._voxelise(mesh, voxeliseParams);
        // status_1.StatusHandler.info((0, localiser_1.LOC)('voxelise.voxel_count', { count: voxelMesh.getVoxelCount() }));
        var dim = voxelMesh.getBounds().getDimensions().add(1);
        // status_1.StatusHandler.info((0, localiser_1.LOC)('voxelise.voxel_mesh_dimensions', { x: dim.x, y: dim.y, z: dim.z }));
        return voxelMesh;
    };
    /**
     * `Location` should be in block-space.
     */
    IVoxeliser.prototype._getVoxelColour = function (mesh, triangle, materialName, location, multisample) {
        var material = mesh.getMaterialByName(materialName);
        (0, error_util_1.ASSERT)(material !== undefined);
        if (material.type === mesh_1.MaterialType.solid) {
            return colour_1.RGBAUtil.copy(material.colour);
        }
        var samples = [];
        for (var i = 0; i < (multisample ? config_1.AppConfig.Get.MULTISAMPLE_COUNT : 1); ++i) {
            var offset = vector_1.Vector3.random().sub(0.5);
            samples.push(this._internalGetVoxelColour(mesh, triangle, materialName, offset.add(location)));
        }
        return colour_1.RGBAUtil.average.apply(colour_1.RGBAUtil, samples);
    };
    IVoxeliser.prototype._internalGetVoxelColour = function (mesh, triangle, materialName, location) {
        var material = mesh.getMaterialByName(materialName);
        (0, error_util_1.ASSERT)(material !== undefined && material.type === mesh_1.MaterialType.textured);
        var area01 = new triangle_1.Triangle(triangle.v0, triangle.v1, location).getArea();
        var area12 = new triangle_1.Triangle(triangle.v1, triangle.v2, location).getArea();
        var area20 = new triangle_1.Triangle(triangle.v2, triangle.v0, location).getArea();
        var total = area01 + area12 + area20;
        var w0 = area12 / total;
        var w1 = area20 / total;
        var w2 = area01 / total;
        var uv = new util_1.UV(triangle.uv0.u * w0 + triangle.uv1.u * w1 + triangle.uv2.u * w2, triangle.uv0.v * w0 + triangle.uv1.v * w1 + triangle.uv2.v * w2);
        if (isNaN(uv.u) || isNaN(uv.v)) {
            colour_1.RGBAUtil.copy(colour_1.RGBAColours.MAGENTA);
        }
        return mesh.sampleTextureMaterial(materialName, uv);
    };
    return IVoxeliser;
}());
exports.IVoxeliser = IVoxeliser;
