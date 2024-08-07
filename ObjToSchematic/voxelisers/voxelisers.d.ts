import { IVoxeliser } from './base-voxeliser';
export type TVoxelisers = 'bvh-ray' | 'ncrb' | 'ray-based' | 'bvh-ray-plus-thickness';
export declare class VoxeliserFactory {
    static GetVoxeliser(voxeliser: TVoxelisers): IVoxeliser;
}
