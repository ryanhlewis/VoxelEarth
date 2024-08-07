import { Atlas, TAtlasBlock } from './atlas';
import { RGBA, RGBA_255 } from './colour';
import { Palette } from './palette';
import { AppTypes } from './util';
export type TBlockCollection = {
    blocks: Map<AppTypes.TNamespacedBlockName, TAtlasBlock>;
    cache: Map<BigInt, TAtlasBlock>;
};
export declare enum EFaceVisibility {
    None = 0,
    Up = 1,
    Down = 2,
    North = 4,
    East = 8,
    South = 16,
    West = 32
}
/**
 * A new instance of AtlasPalette is created each time
 * a new voxel mesh is voxelised.
 */
export declare class AtlasPalette {
    private _atlas;
    private _palette;
    constructor(atlas: Atlas, palette: Palette);
    createBlockCollection(blocksToExclude: AppTypes.TNamespacedBlockName[]): TBlockCollection;
    /**
     * Convert a colour into a Minecraft block.
     * @param colour The colour that the returned block should match with.
     * @param resolution The colour accuracy, a uint8 from 1 to 255, inclusive.
     * @param blockToExclude A list of blocks that should not be used, this should be a subset of the palette blocks.
     * @returns
     */
    getBlock(colour: RGBA_255, blockCollection: TBlockCollection, faceVisibility: EFaceVisibility, errorWeight: number): TAtlasBlock;
    static getContextualFaceAverage(block: TAtlasBlock, faceVisibility: EFaceVisibility): {
        colour: RGBA;
        std: number;
    };
}
