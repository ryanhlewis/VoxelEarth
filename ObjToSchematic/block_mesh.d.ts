import { Atlas } from './atlas';
import { BlockInfo } from './block_atlas';
import { TBlockMeshBufferDescription } from './buffer';
import { Palette } from './palette';
import { ColourSpace, TOptional } from './util';
import { Vector3 } from './vector';
import { Voxel, VoxelMesh } from './voxel_mesh';
import { AssignParams } from './worker_types';
interface Block {
    voxel: Voxel;
    blockInfo: BlockInfo;
}
export type FallableBehaviour = 'replace-falling' | 'replace-fallable' | 'place-string' | 'do-nothing';
export interface BlockMeshParams {
    textureAtlas: Atlas;
    blockPalette: Palette;
    colourSpace: ColourSpace;
    fallable: FallableBehaviour;
}
export declare class BlockMesh {
    private _blocksUsed;
    private _blocks;
    private _voxelMesh;
    private _atlas;
    private _lighting;
    static createFromVoxelMesh(voxelMesh: VoxelMesh, blockMeshParams: AssignParams.Input): BlockMesh;
    private constructor();
    /**
     * Before we turn a voxel into a block we have the opportunity to alter the voxel's colour.
     * This is where the colour accuracy bands colours together and where dithering is calculated.
     */
    private _getFinalVoxelColour;
    private _assignBlocks;
    getBlockLighting(position: Vector3): number[];
    setEmissiveBlock(pos: Vector3): boolean;
    getBlockAt(pos: Vector3): TOptional<Block>;
    getBlocks(): Block[];
    getBlockPalette(): string[];
    getVoxelMesh(): VoxelMesh;
    getAtlas(): Atlas;
    isEmissiveBlock(block: Block): boolean;
    isTransparentBlock(block: Block): boolean;
    private _bufferChunks;
    getChunkedBuffer(chunkIndex: number): TBlockMeshBufferDescription & {
        moreBlocksToBuffer: boolean;
        progress: number;
    };
    getAllChunkedBuffers(): (TBlockMeshBufferDescription & {
        moreBlocksToBuffer: boolean;
        progress: number;
    })[];
}
export {};
