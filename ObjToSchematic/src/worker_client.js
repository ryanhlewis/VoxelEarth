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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerClient = void 0;
var path_1 = __importDefault(require("path"));
var atlas_1 = require("./atlas");
var block_mesh_1 = require("./block_mesh");
var buffer_1 = require("./buffer");
var event_1 = require("./event");
var exporters_1 = require("./exporters/exporters");
var importers_1 = require("./importers/importers");
var localiser_1 = require("./localiser");
var progress_1 = require("./progress");
var error_util_1 = require("./util/error_util");
var voxelisers_1 = require("./voxelisers/voxelisers");
var WorkerClient = /** @class */ (function () {
    function WorkerClient() {
        this._voxelMeshChunkIndex = 0;
        this._blockMeshChunkIndex = 0;
    }
    Object.defineProperty(WorkerClient, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    /**
     * This function should only be called if the client is using the worker.
     */
    WorkerClient.prototype.init = function (params) {
        event_1.EventManager.Get.add(event_1.EAppEvent.onTaskStart, function (e) {
            var message = {
                action: 'Progress',
                payload: {
                    type: 'Started',
                    taskId: e[0],
                },
            };
            postMessage(message);
        });
        event_1.EventManager.Get.add(event_1.EAppEvent.onTaskProgress, function (e) {
            var message = {
                action: 'Progress',
                payload: {
                    type: 'Progress',
                    taskId: e[0],
                    percentage: e[1],
                },
            };
            postMessage(message);
        });
        event_1.EventManager.Get.add(event_1.EAppEvent.onTaskEnd, function (e) {
            var message = {
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
    };
    WorkerClient.prototype.settings = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, localiser_1.Localiser.Get.changeLanguage(params.language)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, {}];
                }
            });
        });
    };
    WorkerClient.prototype.import = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, importer, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        parsed = path_1.default.parse(params.file.name);
                        importer = importers_1.ImporterFactor.GetImporter(parsed.ext === '.obj' ? 'obj' : 'gltf');
                        _a = this;
                        return [4 /*yield*/, importer.import(params.file)];
                    case 1:
                        _a._loadedMesh = _b.sent();
                        this._loadedMesh.processMesh(params.rotation.y, params.rotation.x, params.rotation.z);
                        return [2 /*return*/, {
                                triangleCount: this._loadedMesh.getTriangleCount(),
                                dimensions: this._loadedMesh.getBounds().getDimensions(),
                                materials: this._loadedMesh.getMaterials(),
                            }];
                }
            });
        });
    };
    WorkerClient.prototype.setMaterials = function (params) {
        (0, error_util_1.ASSERT)(this._loadedMesh !== undefined);
        this._loadedMesh.setMaterials(params.materials);
        return {
            materials: this._loadedMesh.getMaterials(),
            materialsChanged: Array.from(params.materials.keys()), // TODO: Change to actual materials changed
        };
    };
    WorkerClient.prototype.renderMesh = function (params) {
        (0, error_util_1.ASSERT)(this._loadedMesh !== undefined);
        return {
            buffers: buffer_1.BufferGenerator.fromMesh(this._loadedMesh),
            dimensions: this._loadedMesh.getBounds().getDimensions(),
        };
    };
    WorkerClient.prototype.voxelise = function (params) {
        (0, error_util_1.ASSERT)(this._loadedMesh !== undefined);
        var voxeliser = voxelisers_1.VoxeliserFactory.GetVoxeliser(params.voxeliser);
        this._loadedVoxelMesh = voxeliser.voxelise(this._loadedMesh, params);
        this._loadedVoxelMesh.calculateNeighbours();
        this._voxelMeshChunkIndex = 0;
        return {};
    };
    WorkerClient.prototype.renderChunkedVoxelMesh = function (params) {
        (0, error_util_1.ASSERT)(this._loadedVoxelMesh !== undefined);
        var isFirstChunk = this._voxelMeshChunkIndex === 0;
        if (isFirstChunk) {
            this._voxelMeshProgressHandle = progress_1.ProgressManager.Get.start('VoxelMeshBuffer');
            this._loadedVoxelMesh.setRenderParams(params);
        }
        var buffer = this._loadedVoxelMesh.getChunkedBuffer(this._voxelMeshChunkIndex);
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
    };
    WorkerClient.prototype.assign = function (params) {
        (0, error_util_1.ASSERT)(this._loadedVoxelMesh !== undefined);
        this._loadedBlockMesh = block_mesh_1.BlockMesh.createFromVoxelMesh(this._loadedVoxelMesh, params);
        this._blockMeshChunkIndex = 0;
        return {};
    };
    //private _blockMeshProgressHandle?: TTaskHandle;
    WorkerClient.prototype.renderChunkedBlockMesh = function (params) {
        (0, error_util_1.ASSERT)(this._loadedBlockMesh !== undefined);
        var isFirstChunk = this._blockMeshChunkIndex === 0;
        if (isFirstChunk) {
            //this._blockMeshProgressHandle = ProgressManager.Get.start('BlockMeshBuffer');
        }
        var buffer = this._loadedBlockMesh.getChunkedBuffer(this._blockMeshChunkIndex);
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
        var atlas = atlas_1.Atlas.load(params.textureAtlas);
        (0, error_util_1.ASSERT)(atlas !== undefined);
        return {
            buffer: buffer,
            bounds: this._loadedBlockMesh.getVoxelMesh().getBounds(),
            atlasTexturePath: atlas.getAtlasTexturePath(),
            atlasSize: atlas.getAtlasSize(),
            moreBlocksToBuffer: buffer.moreBlocksToBuffer,
            isFirstChunk: isFirstChunk,
        };
    };
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
    WorkerClient.prototype.export = function (params) {
        (0, error_util_1.ASSERT)(this._loadedBlockMesh !== undefined);
        var exporter = exporters_1.ExporterFactory.GetExporter(params.exporter);
        var files = exporter.export(this._loadedBlockMesh);
        return {
            files: files,
        };
    };
    return WorkerClient;
}());
exports.WorkerClient = WorkerClient;
//# sourceMappingURL=worker_client.js.map