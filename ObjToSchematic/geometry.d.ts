import { Bounds } from './bounds';
import { RGBA } from './colour';
import { Mesh } from './mesh';
import { AttributeData, RenderBuffer } from './render_buffer';
import { UVTriangle } from './triangle';
import { Vector3 } from './vector';
import { VoxelMesh } from './voxel_mesh';
export declare class GeometryTemplates {
    private static readonly _default_cube;
    static getTriangleBufferData(triangle: UVTriangle): AttributeData;
    static getBoxBufferData(centre: Vector3): AttributeData;
}
export declare class DebugGeometryTemplates {
    static cross(centre: Vector3, radius: number, colour: RGBA): AttributeData;
    static line(start: Vector3, end: Vector3, colour: RGBA): AttributeData;
    static cube(centre: Vector3, size: number, colour: RGBA): AttributeData;
    static bounds(bounds: Bounds, colour: RGBA): AttributeData;
    static circle(centre: Vector3, normal: Vector3, radius: number, colour: RGBA, steps?: number): AttributeData;
    static cone(tipCentre: Vector3, tipHeight: number, normal: Vector3, radius: number, colour: RGBA, quarterSteps: number): AttributeData;
    static arrow(start: Vector3, end: Vector3, colour: RGBA): AttributeData;
    static COLOUR_MINOR: RGBA;
    static COLOUR_MAJOR: RGBA;
    static gridX(dimensions: Vector3, spacing?: number): RenderBuffer;
    static gridY(dimensions: Vector3, spacing?: number): RenderBuffer;
    static gridZ(dimensions: Vector3, spacing?: number): RenderBuffer;
    static meshWireframe(mesh: Mesh, colour: RGBA): RenderBuffer;
    static voxelMeshWireframe(voxelMesh: VoxelMesh, colour: RGBA, voxelSize: number): RenderBuffer;
    static meshNormals(mesh: Mesh, colour: RGBA): RenderBuffer;
    static _generateCirclePoints(centre: Vector3, normal: Vector3, radius: number, steps: number): Vector3[];
}
