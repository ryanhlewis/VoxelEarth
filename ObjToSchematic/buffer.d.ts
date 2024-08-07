import { BlockMesh } from './block_mesh';
import { Mesh, SolidMaterial, TexturedMaterial } from './mesh';
import { VoxelMesh } from './voxel_mesh';
import { RenderNextVoxelMeshChunkParams } from './worker_types';
export type TMeshBuffer = {
    position: {
        numComponents: 3;
        data: Float32Array;
    };
    texcoord: {
        numComponents: 2;
        data: Float32Array;
    };
    normal: {
        numComponents: 3;
        data: Float32Array;
    };
    indices: {
        numComponents: 3;
        data: Uint32Array;
    };
};
export type TMeshBufferDescription = {
    material: SolidMaterial | (TexturedMaterial);
    buffer: TMeshBuffer;
    numElements: number;
    materialName: string;
};
export type TVoxelMeshBuffer = {
    position: {
        numComponents: 3;
        data: Float32Array;
    };
    colour: {
        numComponents: 4;
        data: Float32Array;
    };
    occlusion: {
        numComponents: 4;
        data: Float32Array;
    };
    texcoord: {
        numComponents: 2;
        data: Float32Array;
    };
    normal: {
        numComponents: 3;
        data: Float32Array;
    };
    indices: {
        numComponents: 3;
        data: Uint32Array;
    };
};
export type TVoxelMeshBufferDescription = {
    buffer: TVoxelMeshBuffer;
    numElements: number;
};
export type TBlockMeshBuffer = {
    position: {
        numComponents: 3;
        data: Float32Array;
    };
    colour: {
        numComponents: 4;
        data: Float32Array;
    };
    occlusion: {
        numComponents: 4;
        data: Float32Array;
    };
    texcoord: {
        numComponents: 2;
        data: Float32Array;
    };
    normal: {
        numComponents: 3;
        data: Float32Array;
    };
    blockTexcoord: {
        numComponents: 2;
        data: Float32Array;
    };
    blockPosition: {
        numComponents: 3;
        data: Float32Array;
    };
    lighting: {
        numComponents: 1;
        data: Float32Array;
    };
    indices: {
        numComponents: 3;
        data: Uint32Array;
    };
};
export type TBlockMeshBufferDescription = {
    buffer: TBlockMeshBuffer;
    numElements: number;
};
export declare class ChunkedBufferGenerator {
    static fromVoxelMesh(voxelMesh: VoxelMesh, params: RenderNextVoxelMeshChunkParams.Input, chunkIndex: number): TVoxelMeshBufferDescription & {
        moreVoxelsToBuffer: boolean;
        progress: number;
    };
    static fromBlockMesh(blockMesh: BlockMesh, chunkIndex: number): TBlockMeshBufferDescription & {
        moreBlocksToBuffer: boolean;
        progress: number;
    };
}
export declare class BufferGenerator {
    static fromMesh(mesh: Mesh): TMeshBufferDescription[];
    static createMaterialBuffer(triangleCount: number): TMeshBuffer;
    static createVoxelMeshBuffer(numVoxels: number): TVoxelMeshBuffer;
    static createBlockMeshBuffer(numBlocks: number, voxelMeshBuffer: TVoxelMeshBuffer): TBlockMeshBuffer;
}
