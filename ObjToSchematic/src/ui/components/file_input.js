"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileComponent = void 0;
var path = __importStar(require("path"));
var error_util_1 = require("../../util/error_util");
var ui_util_1 = require("../../util/ui_util");
var config_1 = require("./config");
var localiser_1 = require("../../localiser");
var FileComponent = /** @class */ (function (_super) {
    __extends(FileComponent, _super);
    function FileComponent() {
        var _this = _super.call(this) || this;
        _this._loadedFilePath = null;
        return _this;
    }
    FileComponent.prototype._generateInnerHTML = function () {
        var _a;
        return "\n            <div class=\"input-file struct-prop\" id=\"".concat(this._getId(), "\">\n                <input type=\"file\" accept=\".obj,,.glb\" style=\"display: none;\" id=\"").concat(this._getId(), "-input\">\n                ").concat((_a = this._loadedFilePath) !== null && _a !== void 0 ? _a : (0, localiser_1.LOC)('import.components.no_file_chosen'), "\n            </div>\n        ");
    };
    FileComponent.prototype.registerEvents = function () {
        var _this = this;
        this._getElement().addEventListener('mouseenter', function () {
            _this._setHovered(true);
            _this._updateStyles();
        });
        this._getElement().addEventListener('mouseleave', function () {
            _this._setHovered(false);
            _this._updateStyles();
        });
        var inputElement = ui_util_1.UIUtil.getElementById(this._getId() + '-input');
        inputElement.addEventListener('change', function () {
            var files = inputElement.files;
            if ((files === null || files === void 0 ? void 0 : files.length) === 1) {
                var file = files.item(0);
                (0, error_util_1.ASSERT)(file !== null);
                _this._loadedFilePath = file.name;
                _this._setValue(file);
            }
        });
        this._getElement().addEventListener('click', function () {
            if (_this.enabled) {
                inputElement.click();
            }
        });
    };
    FileComponent.prototype._onValueChanged = function () {
        this._updateStyles();
    };
    FileComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        this._updateStyles();
    };
    FileComponent.prototype._updateStyles = function () {
        if (this._loadedFilePath) {
            var parsedPath = path.parse(this._loadedFilePath);
            this._getElement().innerHTML = parsedPath.name + parsedPath.ext;
        }
        else {
            this._getElement().innerHTML = "<i>".concat((0, localiser_1.LOC)('import.components.no_file_chosen'), "</i>");
        }
        ui_util_1.UIUtil.updateStyles(this._getElement(), {
            isHovered: this.hovered,
            isEnabled: this.enabled,
            isActive: false,
        });
    };
    FileComponent.prototype.refresh = function () {
        this._getElement().innerHTML = "<i>".concat((0, localiser_1.LOC)('import.components.no_file_chosen'), "</i>");
    };
    return FileComponent;
}(config_1.ConfigComponent));
exports.FileComponent = FileComponent;
//# sourceMappingURL=file_input.js.map