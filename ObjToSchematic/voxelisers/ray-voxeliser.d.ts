import { Mesh } from '../mesh';
import { VoxelMesh } from '../voxel_mesh';
import { VoxeliseParams } from '../worker_types';
import { IVoxeliser } from './base-voxeliser';
/**
 * This voxeliser works by projecting rays onto each triangle
 * on each of the principle angles and testing for intersections
 */
export declare class RayVoxeliser extends IVoxeliser {
    private _mesh?;
    private _voxelMesh?;
    private _voxeliseParams?;
    protected _voxelise(mesh: Mesh, voxeliseParams: VoxeliseParams.Input): VoxelMesh;
    private _rayList;
    private _voxeliseTri;
    private _tmpBounds;
    private _generateRays;
    private _traverseX;
    private _traverseY;
    private _traverseZ;
}
