"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManager = exports.EAppEvent = void 0;
var layout_1 = require("./ui/layout");
var error_util_1 = require("./util/error_util");
var log_util_1 = require("./util/log_util");
/* eslint-disable */
var EAppEvent;
(function (EAppEvent) {
    EAppEvent[EAppEvent["onTaskStart"] = 0] = "onTaskStart";
    EAppEvent[EAppEvent["onTaskProgress"] = 1] = "onTaskProgress";
    EAppEvent[EAppEvent["onTaskEnd"] = 2] = "onTaskEnd";
    EAppEvent[EAppEvent["onComboBoxChanged"] = 3] = "onComboBoxChanged";
    EAppEvent[EAppEvent["onLanguageChanged"] = 4] = "onLanguageChanged";
})(EAppEvent = exports.EAppEvent || (exports.EAppEvent = {}));
/* eslint-enable */
var EventManager = /** @class */ (function () {
    function EventManager() {
        this._eventsToListeners = new Map();
    }
    Object.defineProperty(EventManager, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    EventManager.prototype.bindToContext = function (context) {
        this._appContext = context;
    };
    EventManager.prototype.init = function () {
        var _this = this;
        EventManager.Get.add(EAppEvent.onTaskStart, function () {
            var _a, _b;
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            var lastAction = (_a = _this._appContext) === null || _a === void 0 ? void 0 : _a.getLastAction();
            if (lastAction !== undefined) {
                (_b = layout_1.UI.Get.getActionButton(lastAction)) === null || _b === void 0 ? void 0 : _b.startLoading().setProgress(0.0);
            }
        });
        EventManager.Get.add(EAppEvent.onTaskProgress, function () {
            var _a, _b;
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            (0, error_util_1.ASSERT)(_this._appContext !== undefined, 'Not bound to context');
            var lastAction = (_a = _this._appContext) === null || _a === void 0 ? void 0 : _a.getLastAction();
            if (lastAction !== undefined) {
                (_b = layout_1.UI.Get.getActionButton(lastAction)) === null || _b === void 0 ? void 0 : _b.setProgress(data[0][1]);
            }
        });
        EventManager.Get.add(EAppEvent.onTaskEnd, function () {
            var _a, _b;
            var data = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                data[_i] = arguments[_i];
            }
            var lastAction = (_a = _this._appContext) === null || _a === void 0 ? void 0 : _a.getLastAction();
            if (lastAction !== undefined) {
                (_b = layout_1.UI.Get.getActionButton(lastAction)) === null || _b === void 0 ? void 0 : _b.resetLoading();
            }
        });
    };
    EventManager.prototype.add = function (event, delegate) {
        if (!this._eventsToListeners.has(event)) {
            this._eventsToListeners.set(event, []);
        }
        (0, error_util_1.ASSERT)(this._eventsToListeners.get(event) !== undefined, 'No event listener list');
        this._eventsToListeners.get(event).push(delegate);
    };
    EventManager.prototype.broadcast = function (event) {
        var payload = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            payload[_i - 1] = arguments[_i];
        }
        if (event !== EAppEvent.onTaskProgress) {
            (0, log_util_1.LOG)('[BROADCAST]', EAppEvent[event], payload);
        }
        var listeners = this._eventsToListeners.get(event);
        if (listeners) {
            for (var _a = 0, listeners_1 = listeners; _a < listeners_1.length; _a++) {
                var listener = listeners_1[_a];
                listener(payload);
            }
        }
    };
    return EventManager;
}());
exports.EventManager = EventManager;
//# sourceMappingURL=event.js.map