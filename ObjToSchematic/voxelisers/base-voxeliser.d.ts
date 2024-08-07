import { RGBA } from '../colour';
import { Mesh } from '../mesh';
import { UVTriangle } from '../triangle';
import { Vector3 } from '../vector';
import { VoxelMesh } from '../voxel_mesh';
import { VoxeliseParams } from '../worker_types';
export declare abstract class IVoxeliser {
    voxelise(mesh: Mesh, voxeliseParams: VoxeliseParams.Input): VoxelMesh;
    protected abstract _voxelise(mesh: Mesh, voxeliseParams: VoxeliseParams.Input): VoxelMesh;
    /**
     * `Location` should be in block-space.
     */
    protected _getVoxelColour(mesh: Mesh, triangle: UVTriangle, materialName: string, location: Vector3, multisample: boolean): RGBA;
    private _internalGetVoxelColour;
}
