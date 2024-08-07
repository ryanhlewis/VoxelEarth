"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManager = exports.EAppEvent = void 0;
const layout_1 = require("./ui/layout");
const error_util_1 = require("./util/error_util");
const log_util_1 = require("./util/log_util");
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
class EventManager {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._eventsToListeners = new Map();
    }
    bindToContext(context) {
        this._appContext = context;
    }
    init() {
        EventManager.Get.add(EAppEvent.onTaskStart, (...data) => {
            var _a, _b;
            const lastAction = (_a = this._appContext) === null || _a === void 0 ? void 0 : _a.getLastAction();
            if (lastAction !== undefined) {
                (_b = layout_1.UI.Get.getActionButton(lastAction)) === null || _b === void 0 ? void 0 : _b.startLoading().setProgress(0.0);
            }
        });
        EventManager.Get.add(EAppEvent.onTaskProgress, (...data) => {
            var _a, _b;
            (0, error_util_1.ASSERT)(this._appContext !== undefined, 'Not bound to context');
            const lastAction = (_a = this._appContext) === null || _a === void 0 ? void 0 : _a.getLastAction();
            if (lastAction !== undefined) {
                (_b = layout_1.UI.Get.getActionButton(lastAction)) === null || _b === void 0 ? void 0 : _b.setProgress(data[0][1]);
            }
        });
        EventManager.Get.add(EAppEvent.onTaskEnd, (...data) => {
            var _a, _b;
            const lastAction = (_a = this._appContext) === null || _a === void 0 ? void 0 : _a.getLastAction();
            if (lastAction !== undefined) {
                (_b = layout_1.UI.Get.getActionButton(lastAction)) === null || _b === void 0 ? void 0 : _b.resetLoading();
            }
        });
    }
    add(event, delegate) {
        if (!this._eventsToListeners.has(event)) {
            this._eventsToListeners.set(event, []);
        }
        (0, error_util_1.ASSERT)(this._eventsToListeners.get(event) !== undefined, 'No event listener list');
        this._eventsToListeners.get(event).push(delegate);
    }
    broadcast(event, ...payload) {
        if (event !== EAppEvent.onTaskProgress) {
            (0, log_util_1.LOG)('[BROADCAST]', EAppEvent[event], payload);
        }
        const listeners = this._eventsToListeners.get(event);
        if (listeners) {
            for (const listener of listeners) {
                listener(payload);
            }
        }
    }
}
exports.EventManager = EventManager;
