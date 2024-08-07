"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IVoxeliser = void 0;
const colour_1 = require("../colour");
const config_1 = require("../config");
const localiser_1 = require("../localiser");
const mesh_1 = require("../mesh");
const status_1 = require("../status");
const triangle_1 = require("../triangle");
const util_1 = require("../util");
const error_util_1 = require("../util/error_util");
const vector_1 = require("../vector");
class IVoxeliser {
    voxelise(mesh, voxeliseParams) {
        const voxelMesh = this._voxelise(mesh, voxeliseParams);
        status_1.StatusHandler.info((0, localiser_1.LOC)('voxelise.voxel_count', { count: voxelMesh.getVoxelCount() }));
        const dim = voxelMesh.getBounds().getDimensions().add(1);
        status_1.StatusHandler.info((0, localiser_1.LOC)('voxelise.voxel_mesh_dimensions', { x: dim.x, y: dim.y, z: dim.z }));
        return voxelMesh;
    }
    /**
     * `Location` should be in block-space.
     */
    _getVoxelColour(mesh, triangle, materialName, location, multisample) {
        const material = mesh.getMaterialByName(materialName);
        (0, error_util_1.ASSERT)(material !== undefined);
        if (material.type === mesh_1.MaterialType.solid) {
            return colour_1.RGBAUtil.copy(material.colour);
        }
        const samples = [];
        for (let i = 0; i < (multisample ? config_1.AppConfig.Get.MULTISAMPLE_COUNT : 1); ++i) {
            const offset = vector_1.Vector3.random().sub(0.5);
            samples.push(this._internalGetVoxelColour(mesh, triangle, materialName, offset.add(location)));
        }
        return colour_1.RGBAUtil.average(...samples);
    }
    _internalGetVoxelColour(mesh, triangle, materialName, location) {
        const material = mesh.getMaterialByName(materialName);
        (0, error_util_1.ASSERT)(material !== undefined && material.type === mesh_1.MaterialType.textured);
        const area01 = new triangle_1.Triangle(triangle.v0, triangle.v1, location).getArea();
        const area12 = new triangle_1.Triangle(triangle.v1, triangle.v2, location).getArea();
        const area20 = new triangle_1.Triangle(triangle.v2, triangle.v0, location).getArea();
        const total = area01 + area12 + area20;
        const w0 = area12 / total;
        const w1 = area20 / total;
        const w2 = area01 / total;
        const uv = new util_1.UV(triangle.uv0.u * w0 + triangle.uv1.u * w1 + triangle.uv2.u * w2, triangle.uv0.v * w0 + triangle.uv1.v * w1 + triangle.uv2.v * w2);
        if (isNaN(uv.u) || isNaN(uv.v)) {
            colour_1.RGBAUtil.copy(colour_1.RGBAColours.MAGENTA);
        }
        return mesh.sampleTextureMaterial(materialName, uv);
    }
}
exports.IVoxeliser = IVoxeliser;
