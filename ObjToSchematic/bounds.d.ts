import { Vector3 } from './vector';
/**
 * A 3D cuboid volume defined by two opposing corners
 */
export declare class Bounds {
    private _min;
    private _max;
    constructor(min: Vector3, max: Vector3);
    extendByPoint(point: Vector3): void;
    extendByVolume(volume: Bounds): void;
    static getInfiniteBounds(): Bounds;
    get min(): Vector3;
    get max(): Vector3;
    getCentre(): Vector3;
    getDimensions(): Vector3;
}
