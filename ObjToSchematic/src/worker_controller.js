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
exports.WorkerController = void 0;
var config_1 = require("./config");
var event_1 = require("./event");
var error_util_1 = require("./util/error_util");
var log_util_1 = require("./util/log_util");
var worker_1 = require("./worker");
// @ts-ignore
var worker_interface_worker_ts_1 = __importDefault(require("./worker_interface.worker.ts"));
var WorkerController = /** @class */ (function () {
    function WorkerController() {
        if (config_1.AppConfig.Get.USE_WORKER_THREAD) {
            this._worker = new worker_interface_worker_ts_1.default();
            if (this._worker) {
                this._worker.onmessage = this._onWorkerMessage.bind(this);
            }
        }
        this._jobQueue = [];
        this._jobStartTime = 0;
        this._timerOn = false;
    }
    WorkerController.prototype.execute = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (res, rej) {
                        var success = _this.addJob({
                            id: 'ExecuteJob',
                            payload: payload,
                            callback: res,
                        });
                        (0, error_util_1.ASSERT)(success, 'Already performing a job');
                    })];
            });
        });
    };
    WorkerController.prototype.addJob = function (newJob) {
        var isJobAlreadyQueued = this._jobQueue.some(function (queuedJob) { return queuedJob.id === newJob.id; });
        if (isJobAlreadyQueued) {
            (0, log_util_1.LOG)('[WorkerController]: Job already queued with ID', newJob.id);
            return false;
        }
        this._jobQueue.push(newJob);
        this._tryStartNextJob();
        return true;
    };
    WorkerController.prototype.isBusy = function () {
        return this._jobPending !== undefined && config_1.AppConfig.Get.USE_WORKER_THREAD;
    };
    WorkerController.prototype._onWorkerMessage = function (payload) {
        (0, error_util_1.ASSERT)(this._jobPending !== undefined, "Received worker message when no job is pending");
        if (payload.data.action === 'Progress') {
            switch (payload.data.payload.type) {
                case 'Started':
                    event_1.EventManager.Get.broadcast(event_1.EAppEvent.onTaskStart, payload.data.payload.taskId);
                    break;
                case 'Progress':
                    event_1.EventManager.Get.broadcast(event_1.EAppEvent.onTaskProgress, payload.data.payload.taskId, payload.data.payload.percentage);
                    break;
                case 'Finished':
                    event_1.EventManager.Get.broadcast(event_1.EAppEvent.onTaskEnd, payload.data.payload.taskId);
                    break;
            }
            return;
        }
        var endTimer = true;
        if (payload.data.action === 'RenderNextVoxelMeshChunk') {
            if (payload.data.result.moreVoxelsToBuffer) {
                endTimer = false;
            }
        }
        else if (payload.data.action === 'RenderNextBlockMeshChunk') {
            if (payload.data.result.moreBlocksToBuffer) {
                endTimer = false;
            }
        }
        if (endTimer) {
            var deltaTime = Date.now() - this._jobStartTime;
            (0, log_util_1.LOG)("[WorkerController]: '".concat(this._jobPending.id, "' completed in ").concat(deltaTime, "ms"));
            this._timerOn = false;
        }
        if (this._jobPending.callback) {
            this._jobPending.callback(payload.data);
        }
        this._jobPending = undefined;
        this._tryStartNextJob();
    };
    WorkerController.prototype._tryStartNextJob = function () {
        if (this.isBusy()) {
            return;
        }
        this._jobPending = this._jobQueue.shift();
        if (this._jobPending === undefined) {
            return;
        }
        if (!this._timerOn) {
            (0, log_util_1.LOG)("[WorkerController]: Starting Job '".concat(this._jobPending.id, "' (").concat(this._jobQueue.length, " remaining)"));
            (0, log_util_1.LOG)("[WorkerController]: ".concat(JSON.stringify(this._jobPending.payload, null, 4)));
            this._jobStartTime = Date.now();
            this._timerOn = true;
        }
        if (config_1.AppConfig.Get.USE_WORKER_THREAD) {
            (0, error_util_1.ASSERT)(this._worker !== undefined, 'No worker instance');
            this._worker.postMessage(this._jobPending.payload);
        }
        else {
            var pendingJob_1 = this._jobPending;
            (0, worker_1.doWork)(this._jobPending.payload).then(function (result) {
                if (pendingJob_1.callback) {
                    pendingJob_1.callback(result);
                }
            });
        }
    };
    return WorkerController;
}());
exports.WorkerController = WorkerController;
//# sourceMappingURL=worker_controller.js.map