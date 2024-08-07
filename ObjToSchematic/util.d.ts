export declare namespace AppUtil {
    namespace Text {
        function capitaliseFirstLetter(text: string): string;
        /**
         * Namespaces a block name if it is not already namespaced
         * For example `namespaceBlock('stone')` returns `'minecraft:stone'`
         */
        function namespaceBlock(blockName: string): AppTypes.TNamespacedBlockName;
        function isNamespacedBlock(blockName: string): boolean;
    }
    namespace Array {
        /**
         * An optimised function for repeating a subarray contained within a buffer multiple times by
         * repeatedly doubling the subarray's length.
         */
        function repeatedFill(buffer: Float32Array, start: number, startLength: number, desiredCount: number): void;
    }
}
export declare enum EAction {
    Settings = 0,
    Import = 1,
    Materials = 2,
    Voxelise = 3,
    Assign = 4,
    Export = 5,
    MAX = 6
}
export declare namespace AppTypes {
    type TNamespacedBlockName = string;
}
export declare class UV {
    u: number;
    v: number;
    constructor(u: number, v: number);
    copy(): UV;
}
export declare enum ColourSpace {
    RGB = 0,
    LAB = 1
}
export type TOptional<T> = T | undefined;
export declare function getRandomID(): string;
