import { BlockMesh } from './block_mesh';
import { Vector3 } from './vector';
declare enum EFace {
    Up = 0,
    Down = 1,
    North = 2,
    South = 3,
    East = 4,
    West = 5,
    None = 6
}
export type TLightLevel = {
    blockLightValue: number;
    sunLightValue: number;
};
export type TLightUpdate = TLightLevel & {
    pos: Vector3;
    from: EFace;
};
export declare class BlockMeshLighting {
    private _owner;
    private _limits;
    private _sunLightValues;
    private _blockLightValues;
    private _updates;
    private _skips;
    private _bounds;
    constructor(owner: BlockMesh);
    getLightLevel(vec: Vector3): TLightLevel;
    getMaxLightLevel(vec: Vector3): number;
    addLightToDarkness(threshold: number): void;
    private _calculateLimits;
    init(): void;
    addSunLightValues(): void;
    addEmissiveBlocks(): void;
    /**
     * Goes through each block location in `updates` and sets the light value
     * to the maximum of its current value and its update value.
     *
     * @Note **Modifies `updates`**
     */
    private _handleBlockLightUpdates;
    private _handleSunLightUpdates;
    private _isPosValid;
    dumpInfo(): void;
}
export {};
