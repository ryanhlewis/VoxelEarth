"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppAnalytics = void 0;
const config_1 = require("./config");
const gtag = require('ga-gtag');
class AppAnalytics {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._ready = false;
    }
    static Init() {
        gtag.install('G-W0SCWQ7HGJ', { 'send_page_view': true });
        gtag.gtag('js', new Date());
        gtag.gtag('config', 'G-W0SCWQ7HGJ', config_1.AppConfig.Get.VERSION_TYPE === 'd' ? { 'debug_mode': true } : {});
        this.Get._ready = true;
        this.Event('init', {
            version: config_1.AppConfig.Get.getVersionString(),
        });
    }
    static Event(id, attributes) {
        if (this.Get._ready) {
            console.log('[Analytics]: Tracked event', id, attributes);
            gtag.gtag('event', id, Object.assign(attributes !== null && attributes !== void 0 ? attributes : {}, config_1.AppConfig.Get.VERSION_TYPE === 'd' ? { 'debug_mode': true } : {}));
        }
    }
}
exports.AppAnalytics = AppAnalytics;
