"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerClient = void 0;
const path_1 = require("path");
const atlas_1 = require("./atlas");
const block_mesh_1 = require("./block_mesh");
const buffer_1 = require("./buffer");
const event_1 = require("./event");
const exporters_1 = require("./exporters/exporters");
const importers_1 = require("./importers/importers");
const localiser_1 = require("./localiser");
const progress_1 = require("./progress");
const error_util_1 = require("./util/error_util");
const voxelisers_1 = require("./voxelisers/voxelisers");
class WorkerClient {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._voxelMeshChunkIndex = 0;
        this._blockMeshChunkIndex = 0;
    }
    /**
     * This function should only be called if the client is using the worker.
     */
    init(params) {
        event_1.EventManager.Get.add(event_1.EAppEvent.onTaskStart, (e) => {
            const message = {
                action: 'Progress',
                payload: {
                    type: 'Started',
                    taskId: e[0],
                },
            };
            postMessage(message);
        });
        event_1.EventManager.Get.add(event_1.EAppEvent.onTaskProgress, (e) => {
            const message = {
                action: 'Progress',
                payload: {
                    type: 'Progress',
                    taskId: e[0],
                    percentage: e[1],
                },
            };
            postMessage(message);
        });
        event_1.EventManager.Get.add(event_1.EAppEvent.onTaskEnd, (e) => {
            const message = {
                action: 'Progress',
                payload: {
                    type: 'Finished',
                    taskId: e[0],
                },
            };
            postMessage(message);
        });
        // TODO: Async: should await
        localiser_1.Localiser.Get.init();
        return {};
    }
    settings(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield localiser_1.Localiser.Get.changeLanguage(params.language);
            return {};
        });
    }
    import(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const parsed = path_1.default.parse(params.file.name);
            const importer = importers_1.ImporterFactor.GetImporter(parsed.ext === '.obj' ? 'obj' : 'gltf');
            this._loadedMesh = yield importer.import(params.file);
            this._loadedMesh.processMesh(params.rotation.y, params.rotation.x, params.rotation.z);
            return {
                triangleCount: this._loadedMesh.getTriangleCount(),
                dimensions: this._loadedMesh.getBounds().getDimensions(),
                materials: this._loadedMesh.getMaterials(),
            };
        });
    }
    setMaterials(params) {
        (0, error_util_1.ASSERT)(this._loadedMesh !== undefined);
        this._loadedMesh.setMaterials(params.materials);
        return {
            materials: this._loadedMesh.getMaterials(),
            materialsChanged: Array.from(params.materials.keys()), // TODO: Change to actual materials changed
        };
    }
    renderMesh(params) {
        (0, error_util_1.ASSERT)(this._loadedMesh !== undefined);
        return {
            buffers: buffer_1.BufferGenerator.fromMesh(this._loadedMesh),
            dimensions: this._loadedMesh.getBounds().getDimensions(),
        };
    }
    voxelise(params) {
        (0, error_util_1.ASSERT)(this._loadedMesh !== undefined);
        const voxeliser = voxelisers_1.VoxeliserFactory.GetVoxeliser(params.voxeliser);
        this._loadedVoxelMesh = voxeliser.voxelise(this._loadedMesh, params);
        this._loadedVoxelMesh.calculateNeighbours();
        this._voxelMeshChunkIndex = 0;
        return {};
    }
    renderChunkedVoxelMesh(params) {
        (0, error_util_1.ASSERT)(this._loadedVoxelMesh !== undefined);
        const isFirstChunk = this._voxelMeshChunkIndex === 0;
        if (isFirstChunk) {
            this._voxelMeshProgressHandle = progress_1.ProgressManager.Get.start('VoxelMeshBuffer');
            this._loadedVoxelMesh.setRenderParams(params);
        }
        const buffer = this._loadedVoxelMesh.getChunkedBuffer(this._voxelMeshChunkIndex);
        ++this._voxelMeshChunkIndex;
        if (this._voxelMeshProgressHandle !== undefined) {
            if (buffer.moreVoxelsToBuffer) {
                progress_1.ProgressManager.Get.progress(this._voxelMeshProgressHandle, buffer.progress);
            }
            else {
                progress_1.ProgressManager.Get.end(this._voxelMeshProgressHandle);
                this._voxelMeshProgressHandle = undefined;
            }
        }
        return {
            buffer: buffer,
            dimensions: this._loadedVoxelMesh.getBounds().getDimensions(),
            voxelSize: 1.0 / params.desiredHeight,
            moreVoxelsToBuffer: buffer.moreVoxelsToBuffer,
            isFirstChunk: isFirstChunk,
        };
    }
    assign(params) {
        (0, error_util_1.ASSERT)(this._loadedVoxelMesh !== undefined);
        this._loadedBlockMesh = block_mesh_1.BlockMesh.createFromVoxelMesh(this._loadedVoxelMesh, params);
        this._blockMeshChunkIndex = 0;
        return {};
    }
    //private _blockMeshProgressHandle?: TTaskHandle;
    renderChunkedBlockMesh(params) {
        (0, error_util_1.ASSERT)(this._loadedBlockMesh !== undefined);
        const isFirstChunk = this._blockMeshChunkIndex === 0;
        if (isFirstChunk) {
            //this._blockMeshProgressHandle = ProgressManager.Get.start('BlockMeshBuffer');
        }
        const buffer = this._loadedBlockMesh.getChunkedBuffer(this._blockMeshChunkIndex);
        ++this._blockMeshChunkIndex;
        /*
        if (this._blockMeshProgressHandle !== undefined) {
            if (buffer.moreBlocksToBuffer) {
                ProgressManager.Get.progress(this._blockMeshProgressHandle, buffer.progress);
            } else {
                ProgressManager.Get.end(this._blockMeshProgressHandle);
                this._blockMeshProgressHandle = undefined;
            }
        }
        */
        const atlas = atlas_1.Atlas.load(params.textureAtlas);
        (0, error_util_1.ASSERT)(atlas !== undefined);
        return {
            buffer: buffer,
            bounds: this._loadedBlockMesh.getVoxelMesh().getBounds(),
            atlasTexturePath: atlas.getAtlasTexturePath(),
            atlasSize: atlas.getAtlasSize(),
            moreBlocksToBuffer: buffer.moreBlocksToBuffer,
            isFirstChunk: isFirstChunk,
        };
    }
    /*
    public renderBlockMesh(params: RenderBlockMeshParams.Input): RenderBlockMeshParams.Output {
        ASSERT(this._loadedBlockMesh !== undefined);

        const atlas = Atlas.load(params.textureAtlas);
        ASSERT(atlas !== undefined);

        return {
            buffer: this._loadedBlockMesh.getBuffer(),
            dimensions: this._loadedBlockMesh.getVoxelMesh().getBounds().getDimensions(),
            atlasTexturePath: atlas.getAtlasTexturePath(),
            atlasSize: atlas.getAtlasSize(),
        };
    }
    */
    export(params) {
        (0, error_util_1.ASSERT)(this._loadedBlockMesh !== undefined);
        const exporter = exporters_1.ExporterFactory.GetExporter(params.exporter);
        const files = exporter.export(this._loadedBlockMesh);
        return {
            files: files,
        };
    }
}
exports.WorkerClient = WorkerClient;
