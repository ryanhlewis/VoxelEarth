"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConsole = void 0;
const log_util_1 = require("../util/log_util");
const ui_util_1 = require("../util/ui_util");
const misc_1 = require("./misc");
class AppConsole {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._built = false;
        this._messages = [];
    }
    build() {
        const messagesHTML = new misc_1.HTMLBuilder();
        messagesHTML.add('<div id="inner-console" class="row-container" style="padding: 5px; height: 100%; overflow: auto; white-space: nowrap;">');
        {
            this._messages.forEach((message) => {
                messagesHTML.add(this._getMessageHTML(message));
            });
        }
        messagesHTML.add('</div>');
        messagesHTML.placeInto('console');
        this._built = true;
        this._scrollToBottom();
    }
    addLast() {
        if (!this._built) {
            return;
        }
        const consoleElement = ui_util_1.UIUtil.getElementById('inner-console');
        consoleElement.innerHTML += this._getMessageHTML(this._messages[this._messages.length - 1]);
        this._scrollToBottom();
    }
    _getMessageHTML(message) {
        switch (message.type) {
            case 'success':
                return `<div class="row-item text-success">[OKAY]: ${message.text}</div>`;
            case 'info':
                return `<div class="row-item text-info">[INFO]: ${message.text}</div>`;
            case 'warning':
                return `<div class="row-item text-warning">[WARN]: ${message.text}</div>`;
            case 'error':
                return `<div class="row-item text-error">[UHOH]: ${message.text}</div>`;
        }
    }
    static add(message) {
        switch (message.type) {
            case 'error':
                this.error(message.text);
                break;
            case 'warning':
                this.warning(message.text);
                break;
            case 'info':
                this.info(message.text);
                break;
            case 'success':
                this.success(message.text);
                break;
        }
    }
    static success(message) {
        (0, log_util_1.LOG)(message);
        this.Get._messages.push({ text: message, type: 'success' });
        this.Get.addLast();
    }
    static info(message) {
        (0, log_util_1.LOG)(message);
        this.Get._messages.push({ text: message, type: 'info' });
        this.Get.addLast();
    }
    static warning(message) {
        (0, log_util_1.LOG_WARN)(message);
        this.Get._messages.push({ text: message, type: 'warning' });
        this.Get.addLast();
    }
    static error(message) {
        (0, log_util_1.LOG_ERROR)(message);
        this.Get._messages.push({ text: message, type: 'error' });
        this.Get.addLast();
    }
    _scrollToBottom() {
        const consoleElement = ui_util_1.UIUtil.getElementById('inner-console');
        consoleElement.scrollTop = consoleElement.scrollHeight;
    }
}
exports.AppConsole = AppConsole;
