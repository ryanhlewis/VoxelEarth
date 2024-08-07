"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RayVoxeliser = void 0;
const bounds_1 = require("../bounds");
const linear_allocator_1 = require("../linear_allocator");
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
class RayVoxeliser extends base_voxeliser_1.IVoxeliser {
    constructor() {
        super(...arguments);
        this._rayList = new linear_allocator_1.LinearAllocator(() => {
            const ray = { origin: new vector_1.Vector3(0, 0, 0), axis: ray_1.Axes.x };
            return ray;
        });
        this._tmpBounds = new bounds_1.Bounds(new vector_1.Vector3(0, 0, 0), new vector_1.Vector3(0, 0, 0));
    }
    _voxelise(mesh, voxeliseParams) {
        this._mesh = mesh;
        this._voxelMesh = new voxel_mesh_1.VoxelMesh(voxeliseParams);
        this._voxeliseParams = voxeliseParams;
        const meshDimensions = mesh.getBounds().getDimensions();
        let scale;
        let offset = new vector_1.Vector3(0.0, 0.0, 0.0);
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
        mesh.setTransform((vertex) => {
            return vertex.copy().mulScalar(scale).add(offset);
        });
        const numTris = mesh.getTriangleCount();
        const taskHandle = progress_1.ProgressManager.Get.start('Voxelising');
        for (let triIndex = 0; triIndex < numTris; ++triIndex) {
            progress_1.ProgressManager.Get.progress(taskHandle, triIndex / numTris);
            const uvTriangle = mesh.getUVTriangle(triIndex);
            const material = mesh.getMaterialByTriangle(triIndex);
            this._voxeliseTri(uvTriangle, material);
        }
        progress_1.ProgressManager.Get.end(taskHandle);
        mesh.clearTransform();
        return this._voxelMesh;
    }
    _voxeliseTri(triangle, materialName) {
        this._rayList.reset();
        this._generateRays(triangle.v0, triangle.v1, triangle.v2);
        (0, error_util_1.ASSERT)(this._mesh !== undefined);
        (0, error_util_1.ASSERT)(this._voxeliseParams !== undefined);
        (0, error_util_1.ASSERT)(this._voxelMesh !== undefined);
        const voxelPosition = new vector_1.Vector3(0, 0, 0);
        const size = this._rayList.size();
        for (let i = 0; i < size; ++i) {
            const ray = this._rayList.get(i);
            const intersection = (0, ray_1.rayIntersectTriangle)(ray, triangle.v0, triangle.v1, triangle.v2);
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
                const voxelColour = this._getVoxelColour(this._mesh, triangle, materialName, voxelPosition, this._voxeliseParams.useMultisampleColouring);
                this._voxelMesh.addVoxel(voxelPosition, voxelColour);
            }
        }
        ;
    }
    _generateRays(v0, v1, v2) {
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
    }
    _traverseX(bounds) {
        for (let y = bounds.min.y; y <= bounds.max.y; ++y) {
            for (let z = bounds.min.z; z <= bounds.max.z; ++z) {
                const ray = this._rayList.place();
                ray.origin.x = bounds.min.x - 1;
                ray.origin.y = y;
                ray.origin.z = z;
                ray.axis = ray_1.Axes.x;
            }
        }
    }
    _traverseY(bounds) {
        for (let x = bounds.min.x; x <= bounds.max.x; ++x) {
            for (let z = bounds.min.z; z <= bounds.max.z; ++z) {
                const ray = this._rayList.place();
                ray.origin.x = x;
                ray.origin.y = bounds.min.y - 1;
                ray.origin.z = z;
                ray.axis = ray_1.Axes.y;
            }
        }
    }
    _traverseZ(bounds) {
        for (let x = bounds.min.x; x <= bounds.max.x; ++x) {
            for (let y = bounds.min.y; y <= bounds.max.y; ++y) {
                const ray = this._rayList.place();
                ray.origin.x = x;
                ray.origin.y = y;
                ray.origin.z = bounds.min.z - 1;
                ray.axis = ray_1.Axes.z;
            }
        }
    }
}
exports.RayVoxeliser = RayVoxeliser;
