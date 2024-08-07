import { Bounds } from './bounds';
import { RGBA } from './colour';
import { TImageRawWrap, TTransparencyOptions } from './texture';
import { UVTriangle } from './triangle';
import { UV } from './util';
import { TTexelExtension, TTexelInterpolation } from './util/type_util';
import { Vector3 } from './vector';
interface VertexIndices {
    x: number;
    y: number;
    z: number;
}
export interface Tri {
    positionIndices: VertexIndices;
    texcoordIndices?: VertexIndices;
    normalIndices?: VertexIndices;
    material: string;
}
export declare enum MaterialType {
    solid = 0,
    textured = 1
}
type BaseMaterial = {
    needsAttention: boolean;
};
export type SolidMaterial = BaseMaterial & {
    type: MaterialType.solid;
    colour: RGBA;
    canBeTextured: boolean;
};
export type TexturedMaterial = BaseMaterial & {
    type: MaterialType.textured;
    diffuse?: TImageRawWrap;
    interpolation: TTexelInterpolation;
    extension: TTexelExtension;
    transparency: TTransparencyOptions;
};
export type MaterialMap = Map<string, SolidMaterial | TexturedMaterial>;
export declare class Mesh {
    readonly id: string;
    _vertices: Vector3[];
    _normals: Vector3[];
    _uvs: UV[];
    _tris: Tri[];
    private _materials;
    private _loadedTextures;
    constructor(vertices: Vector3[], normals: Vector3[], uvs: UV[], tris: Tri[], materials: MaterialMap);
    processMesh(pitch: number, roll: number, yaw: number): void;
    private _rotateMesh;
    getBounds(): Bounds;
    translateMesh(offset: Vector3): void;
    scaleMesh(scaleFactor: number): void;
    private _checkMesh;
    private _checkMaterials;
    private _centreMesh;
    private _normaliseMesh;
    private _loadTextures;
    getVertices(triIndex: number): {
        v0: Vector3;
        v1: Vector3;
        v2: Vector3;
    };
    getUVs(triIndex: number): {
        uv0: UV;
        uv1: UV;
        uv2: UV;
    };
    getNormals(triIndex: number): {
        v0: Vector3;
        v1: Vector3;
        v2: Vector3;
    };
    getUVTriangle(triIndex: number): UVTriangle;
    getMaterialByTriangle(triIndex: number): string;
    getMaterialByName(materialName: string): SolidMaterial | TexturedMaterial;
    setMaterials(materialMap: MaterialMap): void;
    getMaterials(): MaterialMap;
    sampleTextureMaterial(materialName: string, uv: UV): RGBA;
    getTriangleCount(): number;
    private _transform?;
    setTransform(transform: (vertex: Vector3) => Vector3): void;
    clearTransform(): void;
}
export {};
