"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppAnalytics = void 0;
var config_1 = require("./config");
var gtag = require('ga-gtag');
var AppAnalytics = /** @class */ (function () {
    function AppAnalytics() {
        this._ready = false;
    }
    Object.defineProperty(AppAnalytics, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    AppAnalytics.Init = function () {
        gtag.install('G-W0SCWQ7HGJ', { 'send_page_view': true });
        gtag.gtag('js', new Date());
        gtag.gtag('config', 'G-W0SCWQ7HGJ', config_1.AppConfig.Get.VERSION_TYPE === 'd' ? { 'debug_mode': true } : {});
        this.Get._ready = true;
        this.Event('init', {
            version: config_1.AppConfig.Get.getVersionString(),
        });
    };
    AppAnalytics.Event = function (id, attributes) {
        if (this.Get._ready) {
            console.log('[Analytics]: Tracked event', id, attributes);
            gtag.gtag('event', id, Object.assign(attributes !== null && attributes !== void 0 ? attributes : {}, config_1.AppConfig.Get.VERSION_TYPE === 'd' ? { 'debug_mode': true } : {}));
        }
    };
    return AppAnalytics;
}());
exports.AppAnalytics = AppAnalytics;
//# sourceMappingURL=analytics.js.map