import { Mesh } from '../mesh';
import { VoxelMesh } from '../voxel_mesh';
import { VoxeliseParams } from '../worker_types';
import { IVoxeliser } from './base-voxeliser';
/**
 * This voxeliser works by projecting rays onto each triangle
 * on each of the principle angles and testing for intersections
 */
export declare class BVHRayVoxeliser extends IVoxeliser {
    protected _voxelise(mesh: Mesh, voxeliseParams: VoxeliseParams.Input): VoxelMesh;
}
