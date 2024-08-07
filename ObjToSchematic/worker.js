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
exports.doWork = void 0;
const progress_1 = require("./progress");
const status_1 = require("./status");
const error_util_1 = require("./util/error_util");
const log_util_1 = require("./util/log_util");
const worker_client_1 = require("./worker_client");
function doWork(message) {
    return __awaiter(this, void 0, void 0, function* () {
        status_1.StatusHandler.Get.clear();
        if (message.action !== 'RenderNextVoxelMeshChunk' && message.action !== 'RenderNextBlockMeshChunk') {
            progress_1.ProgressManager.Get.clear();
        }
        try {
            switch (message.action) {
                case 'Init':
                    return Promise.resolve({
                        action: 'Init',
                        result: worker_client_1.WorkerClient.Get.init(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    });
                case 'Settings': {
                    const result = yield worker_client_1.WorkerClient.Get.settings(message.params);
                    return Promise.resolve({
                        action: 'Settings',
                        result: result,
                        messages: status_1.StatusHandler.getAll(),
                    });
                }
                case 'Import':
                    const result = yield worker_client_1.WorkerClient.Get.import(message.params);
                    return Promise.resolve({
                        action: 'Import',
                        result: result,
                        messages: status_1.StatusHandler.getAll(),
                    });
                case 'SetMaterials':
                    return Promise.resolve({
                        action: 'SetMaterials',
                        result: worker_client_1.WorkerClient.Get.setMaterials(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    });
                case 'RenderMesh':
                    return Promise.resolve({
                        action: 'RenderMesh',
                        result: worker_client_1.WorkerClient.Get.renderMesh(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    });
                case 'Voxelise':
                    return Promise.resolve({
                        action: 'Voxelise',
                        result: worker_client_1.WorkerClient.Get.voxelise(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    });
                /*
                case 'RenderVoxelMesh':
                    return {
                        action: 'RenderVoxelMesh',
                        result: WorkerClient.Get.renderVoxelMesh(message.params),
                        messages: StatusHandler.getAll(),
                    };
                */
                case 'RenderNextVoxelMeshChunk':
                    return Promise.resolve({
                        action: 'RenderNextVoxelMeshChunk',
                        result: worker_client_1.WorkerClient.Get.renderChunkedVoxelMesh(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    });
                case 'Assign':
                    return Promise.resolve({
                        action: 'Assign',
                        result: worker_client_1.WorkerClient.Get.assign(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    });
                /*
                case 'RenderBlockMesh':
                    return {
                        action: 'RenderBlockMesh',
                        result: WorkerClient.Get.renderBlockMesh(message.params),
                        messages: StatusHandler.getAll(),
                    };
                    */
                case 'RenderNextBlockMeshChunk':
                    return Promise.resolve({
                        action: 'RenderNextBlockMeshChunk',
                        result: worker_client_1.WorkerClient.Get.renderChunkedBlockMesh(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    });
                case 'Export':
                    return Promise.resolve({
                        action: 'Export',
                        result: worker_client_1.WorkerClient.Get.export(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    });
            }
        }
        catch (e) {
            (0, log_util_1.LOG_ERROR)(e);
            return { action: e instanceof error_util_1.AppError ? 'KnownError' : 'UnknownError', error: e };
        }
    });
}
exports.doWork = doWork;
