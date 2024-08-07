import { RGBA_255 } from './colour';
import { Vector3 } from './vector';
export declare class Ditherer {
    static ditherRandom(colour: RGBA_255, magnitude: number): void;
    static ditherOrdered(colour: RGBA_255, position: Vector3, magnitude: number): void;
    private static _mapMatrix;
    private static _getThresholdValue;
}
