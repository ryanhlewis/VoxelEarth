"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalCorrectedRayVoxeliser = void 0;
const bounds_1 = require("../bounds");
const progress_1 = require("../progress");
const ray_1 = require("../ray");
const error_util_1 = require("../util/error_util");
const vector_1 = require("../vector");
const voxel_mesh_1 = require("../voxel_mesh");
const base_voxeliser_1 = require("./base-voxeliser");
/**
 * This voxeliser works by projecting rays onto each triangle
 * on each of the principle angles and testing for intersections
 */
class NormalCorrectedRayVoxeliser extends base_voxeliser_1.IVoxeliser {
    _voxelise(mesh, voxeliseParams) {
        this._mesh = mesh;
        this._voxelMesh = new voxel_mesh_1.VoxelMesh(voxeliseParams);
        this._voxeliseParams = voxeliseParams;
        const meshDimensions = mesh.getBounds().getDimensions();
        let scale;
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
        mesh.setTransform((vertex) => {
            return vertex.copy().mulScalar(scale);
        });
        const bounds = mesh.getBounds();
        this._size = vector_1.Vector3.sub(bounds.max.copy().ceil(), bounds.min.copy().floor());
        this._offset = new vector_1.Vector3(this._size.x % 2 === 0 ? 0.5 : 0.0, this._size.y % 2 === 0 ? 0.5 : 0.0, this._size.z % 2 === 0 ? 0.5 : 0.0);
        const numTris = mesh.getTriangleCount();
        const taskHandle = progress_1.ProgressManager.Get.start('Voxelising');
        for (let triIndex = 0; triIndex < numTris; ++triIndex) {
            progress_1.ProgressManager.Get.progress(taskHandle, triIndex / numTris);
            const uvTriangle = mesh.getUVTriangle(triIndex);
            const normals = mesh.getNormals(triIndex);
            const material = mesh.getMaterialByTriangle(triIndex);
            this._voxeliseTri(uvTriangle, material, normals);
        }
        progress_1.ProgressManager.Get.end(taskHandle);
        mesh.clearTransform();
        return this._voxelMesh;
    }
    _voxeliseTri(triangle, materialName, normals) {
        const rayList = this._generateRays(triangle.v0, triangle.v1, triangle.v2, this._offset);
        (0, error_util_1.ASSERT)(this._mesh !== undefined);
        (0, error_util_1.ASSERT)(this._voxeliseParams !== undefined);
        (0, error_util_1.ASSERT)(this._voxelMesh !== undefined);
        for (const ray of rayList) {
            const intersection = (0, ray_1.rayIntersectTriangle)(ray, triangle.v0, triangle.v1, triangle.v2);
            if (intersection) {
                // Move transition away from normal
                const norm = normals.v0.normalise();
                intersection.sub(vector_1.Vector3.mulScalar(norm, 0.5));
                // Correct size parity
                intersection.add(this._offset);
                let voxelPosition;
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
                const voxelColour = this._getVoxelColour(this._mesh, triangle, materialName, voxelPosition, this._voxeliseParams.useMultisampleColouring);
                this._voxelMesh.addVoxel(voxelPosition, voxelColour);
            }
        }
        ;
    }
    _generateRays(v0, v1, v2, offset) {
        const bounds = new bounds_1.Bounds(new vector_1.Vector3(Math.ceil(Math.min(v0.x, v1.x, v2.x)), Math.ceil(Math.min(v0.y, v1.y, v2.y)), Math.ceil(Math.min(v0.z, v1.z, v2.z))), new vector_1.Vector3(Math.floor(Math.max(v0.x, v1.x, v2.x)), Math.floor(Math.max(v0.y, v1.y, v2.y)), Math.floor(Math.max(v0.z, v1.z, v2.z))));
        const rayList = [];
        this._traverseX(rayList, bounds, offset);
        this._traverseY(rayList, bounds, offset);
        this._traverseZ(rayList, bounds, offset);
        return rayList;
    }
    _traverseX(rayList, bounds, offset) {
        for (let y = bounds.min.y - offset.y; y <= bounds.max.y + offset.y; ++y) {
            for (let z = bounds.min.z - offset.z; z <= bounds.max.z + offset.z; ++z) {
                rayList.push({
                    origin: new vector_1.Vector3(bounds.min.x - 1, y, z),
                    axis: ray_1.Axes.x,
                });
            }
        }
    }
    _traverseY(rayList, bounds, offset) {
        for (let x = bounds.min.x - offset.x; x <= bounds.max.x + offset.x; ++x) {
            for (let z = bounds.min.z - offset.z; z <= bounds.max.z + offset.z; ++z) {
                rayList.push({
                    origin: new vector_1.Vector3(x, bounds.min.y - 1, z),
                    axis: ray_1.Axes.y,
                });
            }
        }
    }
    _traverseZ(rayList, bounds, offset) {
        for (let x = bounds.min.x - offset.x; x <= bounds.max.x + offset.x; ++x) {
            for (let y = bounds.min.y - offset.y; y <= bounds.max.y + offset.y; ++y) {
                rayList.push({
                    origin: new vector_1.Vector3(x, y, bounds.min.z - 1),
                    axis: ray_1.Axes.z,
                });
            }
        }
    }
}
exports.NormalCorrectedRayVoxeliser = NormalCorrectedRayVoxeliser;
