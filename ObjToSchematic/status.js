"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusHandler = void 0;
const log_util_1 = require("./util/log_util");
/**
 * `StatusHandler` is used to track success, info, warning, and error messages.
 * There are separate singletons for the Client and Worker so when the Worker
 * has completed a Job it needs to send its status messages to the Client
 * along with its payload so that the messages can be displayed in the console.
 */
class StatusHandler {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._messages = [];
    }
    clear() {
        this._messages = [];
    }
    static success(message) {
        this.Get._messages.push({ text: message, type: 'success' });
    }
    static info(message) {
        this.Get._messages.push({ text: message, type: 'info' });
    }
    static warning(message) {
        this.Get._messages.push({ text: message, type: 'warning' });
    }
    static error(message) {
        this.Get._messages.push({ text: message, type: 'error' });
    }
    static getAll() {
        return this.Get._messages;
    }
    dump() {
        this._messages.forEach((message) => {
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
    }
}
exports.StatusHandler = StatusHandler;
