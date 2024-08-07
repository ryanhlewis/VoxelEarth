"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressManager = void 0;
var event_1 = require("./event");
var error_util_1 = require("./util/error_util");
var log_util_1 = require("./util/log_util");
var ProgressManager = /** @class */ (function () {
    function ProgressManager() {
        this._tasks = [];
    }
    Object.defineProperty(ProgressManager, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Start tracking the progress of a task.
     * @param taskId The id of the task (created here).
     */
    ProgressManager.prototype.start = function (taskId) {
        (0, error_util_1.ASSERT)(!this._tasks.includes(taskId), "Task with id '".concat(taskId, "' already being tracked"));
        this._tasks.push(taskId);
        event_1.EventManager.Get.broadcast(event_1.EAppEvent.onTaskStart, taskId);
        (0, log_util_1.LOGF)("[PROGRESS]: Start '".concat(taskId, " (").concat(this._tasks.length, " task(s))'"));
        return {
            nextPercentage: 0.0,
            id: taskId,
        };
    };
    /**
     * Announce progress has been made on a task.
     * @param taskId The id of the task (created in `start`).
     * @param percentage A number between 0.0 and 1.0, inclusive.
     */
    ProgressManager.prototype.progress = function (tracker, percentage) {
        if (percentage > tracker.nextPercentage) {
            //LOGF(`[PROGRESS]: Progress '${tracker.id}' (${this._tasks.length} task(s))'`);
            event_1.EventManager.Get.broadcast(event_1.EAppEvent.onTaskProgress, tracker.id, percentage);
            tracker.nextPercentage += 0.05;
        }
    };
    /**
     * Announce a task has completed.
     * @param taskId The id of the task (created in `start`).
     */
    ProgressManager.prototype.end = function (tracker) {
        (0, log_util_1.LOGF)("[PROGRESS]: End '".concat(tracker.id, "' (").concat(this._tasks.length, " task(s))'"));
        var taskIndex = this._tasks.findIndex(function (task) { return task === tracker.id; });
        (0, error_util_1.ASSERT)(taskIndex !== -1, "Task with that id '".concat(tracker.id, "' is not being tracked, ").concat(this._tasks));
        this._tasks.splice(taskIndex, 1);
        event_1.EventManager.Get.broadcast(event_1.EAppEvent.onTaskEnd, tracker.id);
    };
    ProgressManager.prototype.clear = function () {
        this._tasks = [];
    };
    return ProgressManager;
}());
exports.ProgressManager = ProgressManager;
//# sourceMappingURL=progress.js.map