import { Atlas } from './atlas';
import { AppTypes, TOptional } from './util';
export type TPalettes = 'all' | 'colourful' | 'greyscale' | 'schematic-friendly';
export declare class PaletteManager {
    static getPalettesInfo(): {
        id: TPalettes;
        name: string;
    }[];
}
export declare class Palette {
    static PALETTE_NAME_REGEX: RegExp;
    static PALETTE_FILE_EXT: string;
    private static _FILE_VERSION;
    private _blocks;
    private constructor();
    static create(): Palette;
    static load(palette: TPalettes): TOptional<Palette>;
    save(paletteName: string): boolean;
    add(blockNames: AppTypes.TNamespacedBlockName[]): void;
    remove(blockName: string): boolean;
    has(blockName: string): boolean;
    count(): number;
    getBlocks(): string[];
    static getAllPalette(): TOptional<Palette>;
    /**
     * Removes blocks from the palette if they do not
     * have texture data in the given atlas.
     */
    removeMissingAtlasBlocks(atlas: Atlas): void;
    private static _isValidPaletteName;
    private static _getPalettePath;
}
