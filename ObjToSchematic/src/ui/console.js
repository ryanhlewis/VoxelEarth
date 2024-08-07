"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConsole = void 0;
var log_util_1 = require("../util/log_util");
var ui_util_1 = require("../util/ui_util");
var misc_1 = require("./misc");
var AppConsole = /** @class */ (function () {
    function AppConsole() {
        this._built = false;
        this._messages = [];
    }
    Object.defineProperty(AppConsole, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    AppConsole.prototype.build = function () {
        var _this = this;
        var messagesHTML = new misc_1.HTMLBuilder();
        messagesHTML.add('<div id="inner-console" class="row-container" style="padding: 5px; height: 100%; overflow: auto; white-space: nowrap;">');
        {
            this._messages.forEach(function (message) {
                messagesHTML.add(_this._getMessageHTML(message));
            });
        }
        messagesHTML.add('</div>');
        messagesHTML.placeInto('console');
        this._built = true;
        this._scrollToBottom();
    };
    AppConsole.prototype.addLast = function () {
        if (!this._built) {
            return;
        }
        var consoleElement = ui_util_1.UIUtil.getElementById('inner-console');
        consoleElement.innerHTML += this._getMessageHTML(this._messages[this._messages.length - 1]);
        this._scrollToBottom();
    };
    AppConsole.prototype._getMessageHTML = function (message) {
        switch (message.type) {
            case 'success':
                return "<div class=\"row-item text-success\">[OKAY]: ".concat(message.text, "</div>");
            case 'info':
                return "<div class=\"row-item text-info\">[INFO]: ".concat(message.text, "</div>");
            case 'warning':
                return "<div class=\"row-item text-warning\">[WARN]: ".concat(message.text, "</div>");
            case 'error':
                return "<div class=\"row-item text-error\">[UHOH]: ".concat(message.text, "</div>");
        }
    };
    AppConsole.add = function (message) {
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
    };
    AppConsole.success = function (message) {
        (0, log_util_1.LOG)(message);
        this.Get._messages.push({ text: message, type: 'success' });
        this.Get.addLast();
    };
    AppConsole.info = function (message) {
        (0, log_util_1.LOG)(message);
        this.Get._messages.push({ text: message, type: 'info' });
        this.Get.addLast();
    };
    AppConsole.warning = function (message) {
        (0, log_util_1.LOG_WARN)(message);
        this.Get._messages.push({ text: message, type: 'warning' });
        this.Get.addLast();
    };
    AppConsole.error = function (message) {
        (0, log_util_1.LOG_ERROR)(message);
        this.Get._messages.push({ text: message, type: 'error' });
        this.Get.addLast();
    };
    AppConsole.prototype._scrollToBottom = function () {
        var consoleElement = ui_util_1.UIUtil.getElementById('inner-console');
        consoleElement.scrollTop = consoleElement.scrollHeight;
    };
    return AppConsole;
}());
exports.AppConsole = AppConsole;
//# sourceMappingURL=console.js.map