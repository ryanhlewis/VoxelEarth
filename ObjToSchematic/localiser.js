"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOC = exports.Localiser = void 0;
const i18next_1 = require("i18next");
const base_1 = require("../loc/base");
const config_1 = require("./config");
const event_1 = require("./event");
const error_util_1 = require("./util/error_util");
class Localiser {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const localResources = {};
            base_1.locales.forEach((locale) => {
                localResources[locale.language_code] = { translation: locale.translations };
            });
            yield i18next_1.default.init({
                lng: config_1.AppConfig.Get.LOCALE,
                fallbackLng: 'en-GB',
                debug: true,
                resources: localResources,
            });
            (0, error_util_1.ASSERT)(i18next_1.default.isInitialized, 'i18next not initialised');
        });
    }
    changeLanguage(languageKey) {
        return __awaiter(this, void 0, void 0, function* () {
            yield i18next_1.default.changeLanguage(languageKey);
            event_1.EventManager.Get.broadcast(event_1.EAppEvent.onLanguageChanged);
        });
    }
    translate(p, options) {
        return i18next_1.default.t(p, options);
    }
    getCurrentLanguage() {
        return i18next_1.default.language;
    }
}
exports.Localiser = Localiser;
exports.LOC = Localiser.Get.translate;
