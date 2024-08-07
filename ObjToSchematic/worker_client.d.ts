import { AssignParams, ExportParams, ImportParams, InitParams, RenderMeshParams, RenderNextBlockMeshChunkParams, RenderNextVoxelMeshChunkParams, SetMaterialsParams, SettingsParams, VoxeliseParams } from './worker_types';
export declare class WorkerClient {
    private static _instance;
    static get Get(): WorkerClient;
    private constructor();
    private _loadedMesh?;
    private _loadedVoxelMesh?;
    private _loadedBlockMesh?;
    /**
     * This function should only be called if the client is using the worker.
     */
    init(params: InitParams.Input): InitParams.Output;
    settings(params: SettingsParams.Input): Promise<SettingsParams.Output>;
    import(params: ImportParams.Input): Promise<ImportParams.Output>;
    setMaterials(params: SetMaterialsParams.Input): SetMaterialsParams.Output;
    renderMesh(params: RenderMeshParams.Input): RenderMeshParams.Output;
    voxelise(params: VoxeliseParams.Input): VoxeliseParams.Output;
    private _voxelMeshChunkIndex;
    private _voxelMeshProgressHandle?;
    renderChunkedVoxelMesh(params: RenderNextVoxelMeshChunkParams.Input): RenderNextVoxelMeshChunkParams.Output;
    assign(params: AssignParams.Input): AssignParams.Output;
    private _blockMeshChunkIndex;
    renderChunkedBlockMesh(params: RenderNextBlockMeshChunkParams.Input): RenderNextBlockMeshChunkParams.Output;
    export(params: ExportParams.Input): ExportParams.Output;
}
