"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusHandler = void 0;
var log_util_1 = require("./util/log_util");
/**
 * `StatusHandler` is used to track success, info, warning, and error messages.
 * There are separate singletons for the Client and Worker so when the Worker
 * has completed a Job it needs to send its status messages to the Client
 * along with its payload so that the messages can be displayed in the console.
 */
var StatusHandler = /** @class */ (function () {
    function StatusHandler() {
        this._messages = [];
    }
    Object.defineProperty(StatusHandler, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    StatusHandler.prototype.clear = function () {
        this._messages = [];
    };
    StatusHandler.success = function (message) {
        this.Get._messages.push({ text: message, type: 'success' });
    };
    StatusHandler.info = function (message) {
        this.Get._messages.push({ text: message, type: 'info' });
    };
    StatusHandler.warning = function (message) {
        this.Get._messages.push({ text: message, type: 'warning' });
    };
    StatusHandler.error = function (message) {
        this.Get._messages.push({ text: message, type: 'error' });
    };
    StatusHandler.getAll = function () {
        return this.Get._messages;
    };
    StatusHandler.prototype.dump = function () {
        this._messages.forEach(function (message) {
            switch (message.type) {
                case 'info':
                case 'success':
                    (0, log_util_1.LOG)(message.text);
                    break;
                case 'warning':
                    (0, log_util_1.LOG_WARN)(message.text);
                    break;
                case 'error':
                    (0, log_util_1.LOG_ERROR)(message.text);
                    break;
            }
        });
        return this;
    };
    return StatusHandler;
}());
exports.StatusHandler = StatusHandler;
