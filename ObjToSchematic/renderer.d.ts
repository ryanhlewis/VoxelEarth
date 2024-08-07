import * as twgl from 'twgl.js';
import { SolidMaterial, TexturedMaterial } from './mesh';
import { RenderMeshParams, RenderNextBlockMeshChunkParams, RenderNextVoxelMeshChunkParams } from './worker_types';
import { TAxis } from './util/type_util';
export declare enum MeshType {
    None = 0,
    TriangleMesh = 1,
    VoxelMesh = 2,
    BlockMesh = 3
}
export declare class Renderer {
    _gl: WebGL2RenderingContext;
    private _backgroundColour;
    private _atlasTexture?;
    private _atlasSize;
    private _meshToUse;
    private _voxelSize;
    private _gridOffset;
    private _sliceHeight;
    private _modelsAvailable;
    private _materialBuffers;
    _voxelBuffer?: twgl.BufferInfo[];
    private _blockBuffer?;
    private _blockBounds;
    private _axisBuffer;
    private _axisHighlightBuffer;
    private _isGridComponentEnabled;
    private _axesEnabled;
    private _nightVisionEnabled;
    private _sliceViewEnabled;
    private _gridBuffers;
    private _gridEnabled;
    private static _instance;
    static get Get(): Renderer;
    private constructor();
    update(): void;
    private _redraw;
    forceRedraw(): void;
    draw(): void;
    isSliceViewerEnabled(): boolean;
    toggleSliceViewerEnabled(): void;
    canIncrementSliceHeight(): boolean;
    canDecrementSliceHeight(): boolean;
    incrementSliceHeight(): void;
    decrementSliceHeight(): void;
    private _lightingAvailable;
    setLightingAvailable(isAvailable: boolean): void;
    toggleIsGridEnabled(): void;
    isGridEnabled(): boolean;
    isAxesEnabled(): boolean;
    toggleIsAxesEnabled(): void;
    canToggleNightVision(): boolean;
    toggleIsNightVisionEnabled(): void;
    isNightVisionEnabled(): boolean;
    toggleIsWireframeEnabled(): void;
    toggleIsNormalsEnabled(): void;
    toggleIsDevDebugEnabled(): void;
    clearMesh(): void;
    private _createInternalMaterial;
    recreateMaterialBuffer(materialName: string, material: SolidMaterial | TexturedMaterial): void;
    useMesh(params: RenderMeshParams.Output): void;
    private _allVoxelChunks;
    useVoxelMeshChunk(params: RenderNextVoxelMeshChunkParams.Output): void;
    useBlockMeshChunk(params: RenderNextBlockMeshChunkParams.Output): void;
    setAxisToHighlight(axis: TAxis): void;
    clearAxisToHighlight(): void;
    private _drawDebug;
    private _drawMesh;
    private _drawVoxelMesh;
    private _drawBlockMesh;
    private _drawMeshBuffer;
    setModelToUse(meshType: MeshType): void;
    private _setupScene;
    private _drawBuffer;
    getModelsAvailable(): number;
    getActiveMeshType(): MeshType;
}
