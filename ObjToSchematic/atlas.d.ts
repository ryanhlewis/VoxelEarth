import { RGBA } from './colour';
import { AppTypes, TOptional, UV } from './util';
export type TAtlasBlockFace = {
    name: string;
    texcoord: UV;
    colour: RGBA;
    std: number;
};
export type TAtlasBlock = {
    name: string;
    colour: RGBA;
    faces: {
        up: TAtlasBlockFace;
        down: TAtlasBlockFace;
        north: TAtlasBlockFace;
        east: TAtlasBlockFace;
        south: TAtlasBlockFace;
        west: TAtlasBlockFace;
    };
};
/**
 * Atlases, unlike palettes, are not currently designed to be user-facing or
 * programmatically created. This class simply facilitates loading .atlas
 * files.
 */
export declare class Atlas {
    static ATLAS_NAME_REGEX: RegExp;
    private _blocks;
    private _atlasSize;
    private _atlasName;
    private constructor();
    getBlocks(): Map<string, TAtlasBlock>;
    static load(atlasName: string): TOptional<Atlas>;
    getAtlasSize(): number;
    getAtlasTexturePath(): any;
    hasBlock(blockName: AppTypes.TNamespacedBlockName): boolean;
    static getVanillaAtlas(): TOptional<Atlas>;
    private static _isValidAtlasName;
    private static _getAtlasPath;
}
