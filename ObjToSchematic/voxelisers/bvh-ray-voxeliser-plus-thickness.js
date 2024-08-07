"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BVHRayVoxeliserPlusThickness = void 0;
const progress_1 = require("../progress");
const ray_1 = require("../ray");
const error_util_1 = require("../util/error_util");
const log_util_1 = require("../util/log_util");
const vector_1 = require("../vector");
const voxel_mesh_1 = require("../voxel_mesh");
const base_voxeliser_1 = require("./base-voxeliser");
const bvhtree = require('bvh-tree');
/**
 * This voxeliser works by projecting rays onto each triangle
 * on each of the principle angles and testing for intersections
 */
class BVHRayVoxeliserPlusThickness extends base_voxeliser_1.IVoxeliser {
    _voxelise(mesh, voxeliseParams) {
        const voxelMesh = new voxel_mesh_1.VoxelMesh(voxeliseParams);
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
        // Build BVH
        const triangles = Array(mesh._tris.length);
        for (let triIndex = 0; triIndex < mesh.getTriangleCount(); ++triIndex) {
            const positionData = mesh.getVertices(triIndex);
            triangles[triIndex] = [positionData.v0, positionData.v1, positionData.v2];
        }
        const MAX_TRIANGLES_PER_NODE = 8;
        (0, log_util_1.LOG)('Creating BVH...');
        const bvh = new bvhtree.BVH(triangles, MAX_TRIANGLES_PER_NODE);
        (0, log_util_1.LOG)('BVH created...');
        // Generate rays
        const bounds = mesh.getBounds();
        bounds.min.floor();
        bounds.max.ceil();
        const planeDims = vector_1.Vector3.sub(bounds.max, bounds.min).add(1);
        const numRays = (planeDims.x * planeDims.y) + (planeDims.x * planeDims.z) + (planeDims.y * planeDims.z);
        const rays = new Array(numRays);
        let rayIndex = 0;
        {
            // Generate x-plane rays
            for (let y = bounds.min.y; y <= bounds.max.y; ++y) {
                for (let z = bounds.min.z; z <= bounds.max.z; ++z) {
                    rays[rayIndex++] = {
                        origin: new vector_1.Vector3(bounds.min.x - 1, y, z),
                        axis: ray_1.Axes.x,
                    };
                }
            }
            // Generate y-plane rays
            for (let x = bounds.min.x; x <= bounds.max.x; ++x) {
                for (let z = bounds.min.z; z <= bounds.max.z; ++z) {
                    rays[rayIndex++] = {
                        origin: new vector_1.Vector3(x, bounds.min.y - 1, z),
                        axis: ray_1.Axes.y,
                    };
                }
            }
            // Generate z-plane rays
            for (let x = bounds.min.x; x <= bounds.max.x; ++x) {
                for (let y = bounds.min.y; y <= bounds.max.y; ++y) {
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
        const taskHandle = progress_1.ProgressManager.Get.start('Voxelising');
        for (rayIndex = 0; rayIndex < rays.length; ++rayIndex) {
            progress_1.ProgressManager.Get.progress(taskHandle, rayIndex / rays.length);
            const ray = rays[rayIndex];
            const intersections = bvh.intersectRay(ray.origin, (0, ray_1.axesToDirection)(ray.axis), false);
            for (const intersection of intersections) {
                const point = intersection.intersectionPoint;
                const position = new vector_1.Vector3(point.x, point.y, point.z);
                // Shrinking towards the perpendicular vector
                const triangle = mesh.getUVTriangle(intersection.triangleIndex);
                const v0 = vector_1.Vector3.sub(triangle.v1, triangle.v0);
                const v1 = vector_1.Vector3.sub(triangle.v2, triangle.v0);
                const crossVec = vector_1.Vector3.cross(v1, v0);
                const depthPosition = position.copy().add(crossVec.normalise().mulScalar(0.5)).round();
                const voxelColour = this._getVoxelColour(mesh, mesh.getUVTriangle(intersection.triangleIndex), mesh.getMaterialByTriangle(intersection.triangleIndex), position, voxeliseParams.useMultisampleColouring);
                voxelMesh.addVoxel(position, voxelColour);
                if (!depthPosition.equals(position)) {
                    voxelMesh.addVoxel(depthPosition, voxelColour);
                }
            }
        }
        progress_1.ProgressManager.Get.end(taskHandle);
        mesh.clearTransform();
        return voxelMesh;
    }
}
exports.BVHRayVoxeliserPlusThickness = BVHRayVoxeliserPlusThickness;
