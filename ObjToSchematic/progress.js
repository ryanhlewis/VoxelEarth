"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressManager = void 0;
const event_1 = require("./event");
const error_util_1 = require("./util/error_util");
const log_util_1 = require("./util/log_util");
class ProgressManager {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._tasks = [];
    }
    /**
     * Start tracking the progress of a task.
     * @param taskId The id of the task (created here).
     */
    start(taskId) {
        (0, error_util_1.ASSERT)(!this._tasks.includes(taskId), `Task with id '${taskId}' already being tracked`);
        this._tasks.push(taskId);
        event_1.EventManager.Get.broadcast(event_1.EAppEvent.onTaskStart, taskId);
        (0, log_util_1.LOGF)(`[PROGRESS]: Start '${taskId} (${this._tasks.length} task(s))'`);
        return {
            nextPercentage: 0.0,
            id: taskId,
        };
    }
    /**
     * Announce progress has been made on a task.
     * @param taskId The id of the task (created in `start`).
     * @param percentage A number between 0.0 and 1.0, inclusive.
     */
    progress(tracker, percentage) {
        if (percentage > tracker.nextPercentage) {
            //LOGF(`[PROGRESS]: Progress '${tracker.id}' (${this._tasks.length} task(s))'`);
            event_1.EventManager.Get.broadcast(event_1.EAppEvent.onTaskProgress, tracker.id, percentage);
            tracker.nextPercentage += 0.05;
        }
    }
    /**
     * Announce a task has completed.
     * @param taskId The id of the task (created in `start`).
     */
    end(tracker) {
        (0, log_util_1.LOGF)(`[PROGRESS]: End '${tracker.id}' (${this._tasks.length} task(s))'`);
        const taskIndex = this._tasks.findIndex((task) => { return task === tracker.id; });
        (0, error_util_1.ASSERT)(taskIndex !== -1, `Task with that id '${tracker.id}' is not being tracked, ${this._tasks}`);
        this._tasks.splice(taskIndex, 1);
        event_1.EventManager.Get.broadcast(event_1.EAppEvent.onTaskEnd, tracker.id);
    }
    clear() {
        this._tasks = [];
    }
}
exports.ProgressManager = ProgressManager;
