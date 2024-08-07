import { EFaceVisibility } from './block_assigner';
import { Bounds } from './bounds';
import { TVoxelMeshBufferDescription } from './buffer';
import { RGBA } from './colour';
import { TOptional } from './util';
import { Vector3 } from './vector';
import { RenderNextVoxelMeshChunkParams, VoxeliseParams } from './worker_types';
export interface Voxel {
    position: Vector3;
    colour: RGBA;
    collisions: number;
    neighbours: number;
}
export type TVoxelOverlapRule = 'first' | 'average';
export type TVoxelMeshParams = Pick<VoxeliseParams.Input, 'voxelOverlapRule' | 'enableAmbientOcclusion'>;
export declare class VoxelMesh {
    private _voxels;
    private _bounds;
    private _voxelMeshParams;
    constructor(voxelMeshParams: TVoxelMeshParams);
    getVoxels(): Voxel[];
    isVoxelAt(pos: Vector3): boolean;
    isOpaqueVoxelAt(pos: Vector3): boolean;
    getVoxelAt(pos: Vector3): TOptional<Voxel>;
    static getFullFaceVisibility(): EFaceVisibility;
    getFaceVisibility(pos: Vector3): EFaceVisibility;
    addVoxel(inPos: Vector3, colour: RGBA): void;
    getBounds(): Bounds;
    getVoxelCount(): number;
    private static _Neighbours;
    /**
     * Goes through each voxel and calculates what voxel neighbours it has.
     * This is used for ambient occlusion.
     * @note This does NOT check all 27 neighbours, i.e. it does not check voxels
     * directly up, down, north, south, east, west as they're not needed.
     */
    calculateNeighbours(): void;
    getNeighbours(pos: Vector3): number;
    hasNeighbour(pos: Vector3, offset: Vector3): boolean;
    private _renderParams?;
    private _recreateBuffer;
    setRenderParams(params: RenderNextVoxelMeshChunkParams.Input): void;
    private _bufferChunks;
    getChunkedBuffer(chunkIndex: number): TVoxelMeshBufferDescription & {
        moreVoxelsToBuffer: boolean;
        progress: number;
    };
}
