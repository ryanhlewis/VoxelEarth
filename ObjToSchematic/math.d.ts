import { Vector3 } from './vector';
export declare namespace AppMath {
    const RADIANS_0: number;
    const RADIANS_90: number;
    const RADIANS_180: number;
    const RADIANS_270: number;
    function lerp(value: number, start: number, end: number): number;
    function nearlyEqual(a: number, b: number, tolerance?: number): boolean;
    function degreesToRadians(degrees: number): number;
    /**
     * Converts a float in [0, 1] to an int in [0, 255]
     * @param decimal A number in [0, 1]
     */
    function uint8(decimal: number): number;
    function largestPowerOfTwoLessThanN(n: number): number;
}
export declare const argMax: (array: [number]) => number;
export declare const clamp: (value: number, min: number, max: number) => number;
export declare const floorToNearest: (value: number, base: number) => number;
export declare const ceilToNearest: (value: number, base: number) => number;
export declare const roundToNearest: (value: number, base: number) => number;
export declare const between: (value: number, min: number, max: number) => boolean;
export declare const mapRange: (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) => number;
export declare const wayThrough: (value: number, min: number, max: number) => number;
/**
 * Throws is any number in args is NaN
 */
export declare const checkNaN: (...args: number[]) => void;
export declare const degreesToRadians: number;
export declare class SmoothVariable {
    private _actual;
    private _target;
    private _smoothing;
    private _min;
    private _max;
    constructor(value: number, smoothing: number);
    setClamp(min: number, max: number): void;
    addToTarget(delta: number): void;
    setTarget(target: number): void;
    setActual(actual: number): void;
    tick(): void;
    getActual(): number;
    getTarget(): number;
}
export declare class SmoothVectorVariable {
    private _actual;
    private _target;
    private _smoothing;
    constructor(value: Vector3, smoothing: number);
    addToTarget(delta: Vector3): void;
    setTarget(target: Vector3): void;
    tick(): void;
    getActual(): Vector3;
    getTarget(): Vector3;
}
