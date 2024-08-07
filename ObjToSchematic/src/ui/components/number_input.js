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
exports.NumberComponent = void 0;
var ui_util_1 = require("../../util/ui_util");
var config_1 = require("./config");
var NumberComponent = /** @class */ (function (_super) {
    __extends(NumberComponent, _super);
    function NumberComponent() {
        var _this = _super.call(this, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) || this;
        _this._min = 0;
        _this._max = 1;
        _this._step = 0.1;
        _this._hovering = false;
        return _this;
    }
    /**
     * Set the minimum value the input can be set to.
     */
    NumberComponent.prototype.setMin = function (min) {
        this._min = min;
        return this;
    };
    /**
     * Set the maximum value the input can be set to.
     */
    NumberComponent.prototype.setMax = function (max) {
        this._max = max;
        return this;
    };
    /**
     * Set the number of steps to display the value to.
     */
    NumberComponent.prototype.setStep = function (step) {
        this._step = step;
        return this;
    };
    NumberComponent.prototype.registerEvents = function () {
        var _this = this;
        this._getElement().addEventListener('change', function () {
            _this._setValue(parseInt(_this._getElement().value));
        });
        this._getElement().addEventListener('mouseenter', function () {
            _this._setHovered(true);
            _this._updateStyles();
        });
        this._getElement().addEventListener('mouseleave', function () {
            _this._setHovered(false);
            _this._updateStyles();
        });
    };
    NumberComponent.prototype._generateInnerHTML = function () {
        return "\n            <input class=\"struct-prop\" type=\"number\" style=\"width: 100%; text-align: start;\" step=\"".concat(this._step, "\" id=\"").concat(this._getId(), "\" min=\"").concat(this._min, "\" max=\"").concat(this._max, "\" value=\"").concat(this.getValue(), "\"></input>\n        ");
    };
    NumberComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        var element = this._getElement();
        element.disabled = !this.enabled;
        this._updateStyles();
    };
    NumberComponent.prototype._onTypedValue = function () {
    };
    NumberComponent.prototype._onValueChanged = function () {
    };
    NumberComponent.prototype._updateStyles = function () {
        ui_util_1.UIUtil.updateStyles(ui_util_1.UIUtil.getElementById(this._getId()), {
            isActive: false,
            isEnabled: this.enabled,
            isHovered: this.hovered,
        });
    };
    return NumberComponent;
}(config_1.ConfigComponent));
exports.NumberComponent = NumberComponent;
//# sourceMappingURL=number_input.js.map