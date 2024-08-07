import { Vector3 } from './vector';
import { VoxelMesh } from './voxel_mesh';
export declare class OcclusionManager {
    private _occlusionNeighboursIndices;
    private _occlusions;
    private _localNeighbourhoodCache;
    private _occlusionsSetup;
    private static _instance;
    static get Get(): OcclusionManager;
    private constructor();
    getBlankOcclusions(): number[];
    getOcclusions(buffer: Float32Array, centre: Vector3, voxelMesh: VoxelMesh): void;
    static getNeighbourIndex(neighbour: Vector3): number;
    private _setupOcclusions;
    private _getOcclusionMapIndex;
}
