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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOC = exports.Localiser = void 0;
var i18next_1 = require("i18next");
var base_1 = require("../loc/base");
var config_1 = require("./config");
var event_1 = require("./event");
var error_util_1 = require("./util/error_util");
var Localiser = /** @class */ (function () {
    function Localiser() {
    }
    Object.defineProperty(Localiser, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    Localiser.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var localResources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        localResources = {};
                        base_1.locales.forEach(function (locale) {
                            localResources[locale.language_code] = { translation: locale.translations };
                        });
                        return [4 /*yield*/, i18next_1.init({
                                lng: config_1.AppConfig.Get.LOCALE,
                                fallbackLng: 'en-GB',
                                debug: true,
                                resources: localResources,
                            })];
                    case 1:
                        _a.sent();
                        (0, error_util_1.ASSERT)(i18next_1.isInitialized, 'i18next not initialised');
                        return [2 /*return*/];
                }
            });
        });
    };
    Localiser.prototype.changeLanguage = function (languageKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, i18next_1.changeLanguage(languageKey)];
                    case 1:
                        _a.sent();
                        event_1.EventManager.Get.broadcast(event_1.EAppEvent.onLanguageChanged);
                        return [2 /*return*/];
                }
            });
        });
    };
    Localiser.prototype.translate = function (p, options) {
        return i18next_1.t(p, options);
    };
    Localiser.prototype.getCurrentLanguage = function () {
        return i18next_1.language;
    };
    return Localiser;
}());
exports.Localiser = Localiser;
exports.LOC = Localiser.Get.translate;
