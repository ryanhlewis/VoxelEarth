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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageComponent = void 0;
var localiser_1 = require("../../localiser");
var util_1 = require("../../util");
var error_util_1 = require("../../util/error_util");
var ui_util_1 = require("../../util/ui_util");
var icons_1 = require("../icons");
var config_1 = require("./config");
var toolbar_item_1 = require("./toolbar_item");
var ImageComponent = /** @class */ (function (_super) {
    __extends(ImageComponent, _super);
    function ImageComponent(param) {
        var _this = _super.call(this, Promise.resolve(param !== null && param !== void 0 ? param : { raw: '', filetype: 'png' })) || this;
        _this._switchElement = new toolbar_item_1.ToolbarItemComponent({ id: 'sw', iconSVG: icons_1.AppIcons.UPLOAD })
            .setLabel((0, localiser_1.LOC)('materials.components.choose'))
            .onClick(function () {
            var inputElement = ui_util_1.UIUtil.getElementById(_this._getId() + '-input');
            inputElement.click();
        });
        _this._imageId = (0, util_1.getRandomID)();
        return _this;
    }
    ImageComponent.prototype._generateInnerHTML = function () {
        return "\n            <div class=\"row-container\">\n                <div class=\"row-item\">\n                    <img id=\"".concat(this._imageId, "\" alt=\"Texture Preview\" class=\"texture-preview\" loading=\"lazy\"></img>\n                    <div id=\"").concat(this._imageId, "-placeholder\" class=\"texture-preview-placeholder\">\n                        <div class=\"row-container\" style=\"align-items: center;\">\n                            <div class=\"row-item\">").concat(icons_1.AppIcons.IMAGE_MISSING, "</div>\n                            <div class=\"row-item\">").concat((0, localiser_1.LOC)('materials.components.no_image_loaded'), "</div>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"row-item\">\n                    <input type=\"file\" accept=\"image/png,image/jpeg\" style=\"display: none;\" id=\"").concat(this._getId(), "-input\">\n                    ").concat(this._switchElement.generateHTML(), "\n                </div>\n            </div>\n        ");
    };
    ImageComponent.prototype.registerEvents = function () {
        var _this = this;
        this._switchElement.registerEvents();
        var inputElement = ui_util_1.UIUtil.getElementById(this._getId() + '-input');
        inputElement.addEventListener('change', function () {
            var files = inputElement.files;
            if ((files === null || files === void 0 ? void 0 : files.length) === 1) {
                var file_1 = files.item(0);
                (0, error_util_1.ASSERT)(file_1 !== null);
                (0, error_util_1.ASSERT)(file_1.type === 'image/jpeg' || file_1.type === 'image/png', 'Unexpected image type');
                _this._setValue(new Promise(function (res, rej) {
                    var fileReader = new FileReader();
                    fileReader.onload = function () {
                        if (typeof fileReader.result === 'string') {
                            // convert image file to base64 string
                            res({ filetype: file_1.type === 'image/jpeg' ? 'jpg' : 'png', raw: fileReader.result });
                        }
                        else {
                            rej(Error());
                        }
                    };
                    fileReader.readAsDataURL(file_1);
                }));
            }
        });
    };
    ImageComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        var imageElement = ui_util_1.UIUtil.getElementById(this._imageId);
        var placeholderComponent = ui_util_1.UIUtil.getElementById(this._imageId + '-placeholder');
        if (!this.enabled) {
            imageElement.classList.add('disabled');
            placeholderComponent.classList.add('disabled');
        }
        else {
            imageElement.classList.remove('disabled');
            placeholderComponent.classList.remove('disabled');
        }
        this._switchElement.setEnabled(this.enabled);
    };
    ImageComponent.prototype._onValueChanged = function () {
        var _this = this;
        var inputElement = ui_util_1.UIUtil.getElementById(this._imageId);
        var placeholderComponent = ui_util_1.UIUtil.getElementById(this._imageId + '-placeholder');
        this.getValue()
            .then(function (res) {
            if (res.raw === '') {
                throw Error();
            }
            _this._switchElement.setActive(false);
            inputElement.src = res.raw;
            inputElement.style.display = 'unset';
            placeholderComponent.style.display = 'none';
        })
            .catch(function (err) {
            _this._switchElement.setActive(true);
            inputElement.src = '';
            inputElement.style.display = 'none';
            placeholderComponent.style.display = 'flex';
        });
    };
    ImageComponent.prototype.finalise = function () {
        _super.prototype.finalise.call(this);
        this._onValueChanged();
        this._onEnabledChanged();
    };
    return ImageComponent;
}(config_1.ConfigComponent));
exports.ImageComponent = ImageComponent;
//# sourceMappingURL=image.js.map