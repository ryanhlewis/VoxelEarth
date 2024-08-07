import { Bounds } from './bounds';
import { UV } from './util';
import { Vector3 } from './vector';
export declare class Triangle {
    v0: Vector3;
    v1: Vector3;
    v2: Vector3;
    constructor(v0: Vector3, v1: Vector3, v2: Vector3);
    getCentre(): Vector3;
    getArea(): number;
    getNormal(): Vector3;
    getBounds(): Bounds;
}
export declare class UVTriangle extends Triangle {
    uv0: UV;
    uv1: UV;
    uv2: UV;
    n0: Vector3;
    n1: Vector3;
    n2: Vector3;
    constructor(v0: Vector3, v1: Vector3, v2: Vector3, n0: Vector3, n1: Vector3, n2: Vector3, uv0: UV, uv1: UV, uv2: UV);
}
