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
exports.WorkerController = void 0;
const config_1 = require("./config");
const event_1 = require("./event");
const error_util_1 = require("./util/error_util");
const log_util_1 = require("./util/log_util");
const worker_1 = require("./worker");
// @ts-ignore
const worker_interface_worker_ts_1 = require("./worker_interface.worker.ts");
class WorkerController {
    constructor() {
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
    execute(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => {
                const success = this.addJob({
                    id: 'ExecuteJob',
                    payload: payload,
                    callback: res,
                });
                (0, error_util_1.ASSERT)(success, 'Already performing a job');
            });
        });
    }
    addJob(newJob) {
        const isJobAlreadyQueued = this._jobQueue.some((queuedJob) => { return queuedJob.id === newJob.id; });
        if (isJobAlreadyQueued) {
            (0, log_util_1.LOG)('[WorkerController]: Job already queued with ID', newJob.id);
            return false;
        }
        this._jobQueue.push(newJob);
        this._tryStartNextJob();
        return true;
    }
    isBusy() {
        return this._jobPending !== undefined && config_1.AppConfig.Get.USE_WORKER_THREAD;
    }
    _onWorkerMessage(payload) {
        (0, error_util_1.ASSERT)(this._jobPending !== undefined, `Received worker message when no job is pending`);
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
        let endTimer = true;
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
            const deltaTime = Date.now() - this._jobStartTime;
            (0, log_util_1.LOG)(`[WorkerController]: '${this._jobPending.id}' completed in ${deltaTime}ms`);
            this._timerOn = false;
        }
        if (this._jobPending.callback) {
            this._jobPending.callback(payload.data);
        }
        this._jobPending = undefined;
        this._tryStartNextJob();
    }
    _tryStartNextJob() {
        if (this.isBusy()) {
            return;
        }
        this._jobPending = this._jobQueue.shift();
        if (this._jobPending === undefined) {
            return;
        }
        if (!this._timerOn) {
            (0, log_util_1.LOG)(`[WorkerController]: Starting Job '${this._jobPending.id}' (${this._jobQueue.length} remaining)`);
            (0, log_util_1.LOG)(`[WorkerController]: ${JSON.stringify(this._jobPending.payload, null, 4)}`);
            this._jobStartTime = Date.now();
            this._timerOn = true;
        }
        if (config_1.AppConfig.Get.USE_WORKER_THREAD) {
            (0, error_util_1.ASSERT)(this._worker !== undefined, 'No worker instance');
            this._worker.postMessage(this._jobPending.payload);
        }
        else {
            const pendingJob = this._jobPending;
            (0, worker_1.doWork)(this._jobPending.payload).then((result) => {
                if (pendingJob.callback) {
                    pendingJob.callback(result);
                }
            });
        }
    }
}
exports.WorkerController = WorkerController;
