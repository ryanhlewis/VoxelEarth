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
exports.SliderComponent = void 0;
var math_1 = require("../../math");
var error_util_1 = require("../../util/error_util");
var ui_util_1 = require("../../util/ui_util");
var config_1 = require("./config");
var SliderComponent = /** @class */ (function (_super) {
    __extends(SliderComponent, _super);
    function SliderComponent() {
        var _this = _super.call(this) || this;
        _this._min = 0;
        _this._max = 1;
        _this._decimals = 1;
        _this._step = 0.1;
        _this._internalValue = 0.5;
        _this._dragging = false;
        _this._valueHovered = false;
        return _this;
    }
    SliderComponent.prototype.setValue = function (value) {
        this._setValue(value);
    };
    SliderComponent.prototype.setDefaultValue = function (value) {
        _super.prototype.setDefaultValue.call(this, value);
        this._internalValue = value;
        return this;
    };
    /**
     * Set the minimum value the slider can be set to.
     */
    SliderComponent.prototype.setMin = function (min) {
        this._min = min;
        return this;
    };
    /**
     * Set the maximum value the slider can be set to.
     */
    SliderComponent.prototype.setMax = function (max) {
        this._max = max;
        return this;
    };
    /**
     * Set the number of decimals to display the value to.
     */
    SliderComponent.prototype.setDecimals = function (decimals) {
        this._decimals = decimals;
        return this;
    };
    /**
     * Set the step the value is increased/decreased by.
     */
    SliderComponent.prototype.setStep = function (step) {
        this._step = step;
        return this;
    };
    SliderComponent.prototype.registerEvents = function () {
        var _this = this;
        var element = this._getElement();
        var elementBar = ui_util_1.UIUtil.getElementById(this._getSliderBarId());
        var elementValue = ui_util_1.UIUtil.getElementById(this._getSliderValueId());
        element.onmouseenter = function () {
            _this._setHovered(true);
            _this._updateStyles();
        };
        element.onmouseleave = function () {
            _this._setHovered(false);
            _this._updateStyles();
        };
        element.onmousedown = function () {
            _this._dragging = true;
        };
        document.addEventListener('mousemove', function (e) {
            if (_this._dragging) {
                _this._onDragSlider(e);
            }
        });
        document.addEventListener('mouseup', function (e) {
            if (_this._dragging) {
                _this._onDragSlider(e);
            }
            _this._dragging = false;
        });
        element.addEventListener('wheel', function (e) {
            if (!_this._dragging && _this.getEnabled()) {
                e.preventDefault();
                _this._onScrollSlider(e);
            }
        });
        elementValue.addEventListener('change', function () {
            _this._onTypedValue();
        });
        elementValue.addEventListener('mouseenter', function () {
            _this._valueHovered = true;
            _this._updateStyles();
        });
        elementValue.addEventListener('mouseleave', function () {
            _this._valueHovered = false;
            _this._updateStyles();
        });
    };
    SliderComponent.prototype._generateInnerHTML = function () {
        var norm = (this._internalValue - this._min) / (this._max - this._min);
        return "\n            <input class=\"struct-prop comp-slider-value\" type=\"number\" id=\"".concat(this._getSliderValueId(), "\" min=\"").concat(this._min, "\" max=\"").concat(this._max, "\" step=\"").concat(this._step, "\" value=\"").concat(this.getValue().toFixed(this._decimals), "\">\n            <div class=\"struct-prop comp-slider comp-slider-outer\" id=\"").concat(this._getId(), "\">\n                <div class=\"struct-prop comp-slider comp-slider-inner\" id=\"").concat(this._getSliderBarId(), "\" style=\"width: ").concat(norm * 100, "%\">\n                </div>\n            </div>\n        ");
    };
    SliderComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        var elementValue = ui_util_1.UIUtil.getElementById(this._getSliderValueId());
        elementValue.disabled = this.disabled;
        var elementBar = ui_util_1.UIUtil.getElementById(this._getSliderBarId());
        var elementSlider = ui_util_1.UIUtil.getElementById(this._getId());
        if (this.enabled) {
            elementBar.classList.add('enabled');
            elementSlider.classList.add('enabled');
        }
        else {
            elementBar.classList.remove('enabled');
            elementSlider.classList.remove('enabled');
        }
        this._updateStyles();
    };
    SliderComponent.prototype._onValueChanged = function () {
        var percentage = (0, math_1.wayThrough)(this.getValue(), this._min, this._max);
        (0, error_util_1.ASSERT)(percentage >= 0.0 && percentage <= 1.0);
        ui_util_1.UIUtil.getElementById(this._getSliderBarId()).style.width = "".concat(percentage * 100, "%");
        ui_util_1.UIUtil.getElementById(this._getSliderValueId()).value = this.getValue().toFixed(this._decimals);
    };
    SliderComponent.prototype._onScrollSlider = function (e) {
        if (!this.getEnabled()) {
            return;
        }
        this._internalValue -= (e.deltaY / 150) * this._step;
        this._internalValue = (0, math_1.clamp)(this._internalValue, this._min, this._max);
        this._onInternalValueUpdated();
    };
    SliderComponent.prototype._onDragSlider = function (e) {
        if (!this.getEnabled()) {
            return;
        }
        var box = this._getElement().getBoundingClientRect();
        var left = box.x;
        var right = box.x + box.width;
        this._internalValue = (0, math_1.mapRange)(e.clientX, left, right, this._min, this._max);
        this._internalValue = (0, math_1.clamp)(this._internalValue, this._min, this._max);
        this._onInternalValueUpdated();
    };
    SliderComponent.prototype._onTypedValue = function () {
        var elementValue = ui_util_1.UIUtil.getElementById(this._getSliderValueId());
        var typedNumber = parseFloat(elementValue.value);
        if (!isNaN(typedNumber)) {
            this._internalValue = (0, math_1.clamp)(typedNumber, this._min, this._max);
        }
        this._onInternalValueUpdated();
    };
    SliderComponent.prototype._onInternalValueUpdated = function () {
        var displayString = this._internalValue.toFixed(this._decimals);
        this._setValue(parseFloat(displayString));
    };
    /**
     * Gets the ID of the DOM element for the slider's value.
     */
    SliderComponent.prototype._getSliderValueId = function () {
        return this._getId() + '-value';
    };
    /**
     * Gets the ID of the DOM element for the slider's bar.
     */
    SliderComponent.prototype._getSliderBarId = function () {
        return this._getId() + '-bar';
    };
    SliderComponent.prototype._updateStyles = function () {
        var elementValue = ui_util_1.UIUtil.getElementById(this._getSliderValueId());
        ui_util_1.UIUtil.updateStyles(elementValue, {
            isHovered: this._valueHovered,
            isActive: false,
            isEnabled: this.enabled,
        });
        var elementBar = ui_util_1.UIUtil.getElementById(this._getSliderBarId());
        ui_util_1.UIUtil.updateStyles(elementBar, {
            isHovered: this.hovered,
            isActive: true,
            isEnabled: this.enabled,
        });
        var elementSlider = ui_util_1.UIUtil.getElementById(this._getId());
        ui_util_1.UIUtil.updateStyles(elementSlider, {
            isHovered: this.hovered,
            isActive: false,
            isEnabled: this.enabled,
        });
    };
    return SliderComponent;
}(config_1.ConfigComponent));
exports.SliderComponent = SliderComponent;
//# sourceMappingURL=slider.js.map