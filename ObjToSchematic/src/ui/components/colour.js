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
exports.ColourComponent = void 0;
var colour_1 = require("../../colour");
var config_1 = require("./config");
var ColourComponent = /** @class */ (function (_super) {
    __extends(ColourComponent, _super);
    function ColourComponent(colour) {
        return _super.call(this, colour) || this;
    }
    ColourComponent.prototype._generateInnerHTML = function () {
        return "<input class=\"colour-swatch\" type=\"color\" id=\"".concat(this._getId(), "\" value=\"").concat(colour_1.RGBAUtil.toHexString(this.getValue()), "\">");
    };
    ColourComponent.prototype.registerEvents = function () {
        var _this = this;
        this._getElement().addEventListener('change', function () {
            var newColour = colour_1.RGBAUtil.fromHexString(_this._getElement().value);
            _this._setValue(newColour);
        });
    };
    ColourComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        if (this.enabled) {
            this._getElement().disabled = false;
        }
        else {
            this._getElement().disabled = true;
        }
    };
    return ColourComponent;
}(config_1.ConfigComponent));
exports.ColourComponent = ColourComponent;
//# sourceMappingURL=colour.js.map