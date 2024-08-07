import { Vector3 } from './vector';
export declare enum Axes {
    x = 0,
    y = 1,
    z = 2
}
export declare function axesToDirection(axis: Axes): Vector3;
export interface Ray {
    origin: Vector3;
    axis: Axes;
}
export declare function rayIntersectTriangle(ray: Ray, v0: Vector3, v1: Vector3, v2: Vector3): (Vector3 | undefined);
