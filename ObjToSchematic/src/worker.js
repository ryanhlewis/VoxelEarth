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
Object.defineProperty(exports, "__esModule", { value: true });
exports.doWork = void 0;
var progress_1 = require("./progress");
var status_1 = require("./status");
var error_util_1 = require("./util/error_util");
var log_util_1 = require("./util/log_util");
var worker_client_1 = require("./worker_client");
function doWork(message) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, result_1, result, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    status_1.StatusHandler.Get.clear();
                    if (message.action !== 'RenderNextVoxelMeshChunk' && message.action !== 'RenderNextBlockMeshChunk') {
                        progress_1.ProgressManager.Get.clear();
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 15, , 16]);
                    _a = message.action;
                    switch (_a) {
                        case 'Init': return [3 /*break*/, 2];
                        case 'Settings': return [3 /*break*/, 3];
                        case 'Import': return [3 /*break*/, 5];
                        case 'SetMaterials': return [3 /*break*/, 7];
                        case 'RenderMesh': return [3 /*break*/, 8];
                        case 'Voxelise': return [3 /*break*/, 9];
                        case 'RenderNextVoxelMeshChunk': return [3 /*break*/, 10];
                        case 'Assign': return [3 /*break*/, 11];
                        case 'RenderNextBlockMeshChunk': return [3 /*break*/, 12];
                        case 'Export': return [3 /*break*/, 13];
                    }
                    return [3 /*break*/, 14];
                case 2: return [2 /*return*/, Promise.resolve({
                        action: 'Init',
                        result: worker_client_1.WorkerClient.Get.init(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    })];
                case 3: return [4 /*yield*/, worker_client_1.WorkerClient.Get.settings(message.params)];
                case 4:
                    result_1 = _b.sent();
                    return [2 /*return*/, Promise.resolve({
                            action: 'Settings',
                            result: result_1,
                            messages: status_1.StatusHandler.getAll(),
                        })];
                case 5: return [4 /*yield*/, worker_client_1.WorkerClient.Get.import(message.params)];
                case 6:
                    result = _b.sent();
                    return [2 /*return*/, Promise.resolve({
                            action: 'Import',
                            result: result,
                            messages: status_1.StatusHandler.getAll(),
                        })];
                case 7: return [2 /*return*/, Promise.resolve({
                        action: 'SetMaterials',
                        result: worker_client_1.WorkerClient.Get.setMaterials(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    })];
                case 8: return [2 /*return*/, Promise.resolve({
                        action: 'RenderMesh',
                        result: worker_client_1.WorkerClient.Get.renderMesh(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    })];
                case 9: return [2 /*return*/, Promise.resolve({
                        action: 'Voxelise',
                        result: worker_client_1.WorkerClient.Get.voxelise(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    })];
                case 10: return [2 /*return*/, Promise.resolve({
                        action: 'RenderNextVoxelMeshChunk',
                        result: worker_client_1.WorkerClient.Get.renderChunkedVoxelMesh(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    })];
                case 11: return [2 /*return*/, Promise.resolve({
                        action: 'Assign',
                        result: worker_client_1.WorkerClient.Get.assign(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    })];
                case 12: return [2 /*return*/, Promise.resolve({
                        action: 'RenderNextBlockMeshChunk',
                        result: worker_client_1.WorkerClient.Get.renderChunkedBlockMesh(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    })];
                case 13: return [2 /*return*/, Promise.resolve({
                        action: 'Export',
                        result: worker_client_1.WorkerClient.Get.export(message.params),
                        messages: status_1.StatusHandler.getAll(),
                    })];
                case 14: return [3 /*break*/, 16];
                case 15:
                    e_1 = _b.sent();
                    (0, log_util_1.LOG_ERROR)(e_1);
                    return [2 /*return*/, { action: e_1 instanceof error_util_1.AppError ? 'KnownError' : 'UnknownError', error: e_1 }];
                case 16: return [2 /*return*/];
            }
        });
    });
}
exports.doWork = doWork;
//# sourceMappingURL=worker.js.map