"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SliderComponent = void 0;
const math_1 = require("../../math");
const error_util_1 = require("../../util/error_util");
const ui_util_1 = require("../../util/ui_util");
const config_1 = require("./config");
class SliderComponent extends config_1.ConfigComponent {
    constructor() {
        super();
        this._min = 0;
        this._max = 1;
        this._decimals = 1;
        this._step = 0.1;
        this._internalValue = 0.5;
        this._dragging = false;
        this._valueHovered = false;
    }
    setValue(value) {
        this._setValue(value);
    }
    setDefaultValue(value) {
        super.setDefaultValue(value);
        this._internalValue = value;
        return this;
    }
    /**
     * Set the minimum value the slider can be set to.
     */
    setMin(min) {
        this._min = min;
        return this;
    }
    /**
     * Set the maximum value the slider can be set to.
     */
    setMax(max) {
        this._max = max;
        return this;
    }
    /**
     * Set the number of decimals to display the value to.
     */
    setDecimals(decimals) {
        this._decimals = decimals;
        return this;
    }
    /**
     * Set the step the value is increased/decreased by.
     */
    setStep(step) {
        this._step = step;
        return this;
    }
    registerEvents() {
        const element = this._getElement();
        const elementBar = ui_util_1.UIUtil.getElementById(this._getSliderBarId());
        const elementValue = ui_util_1.UIUtil.getElementById(this._getSliderValueId());
        element.onmouseenter = () => {
            this._setHovered(true);
            this._updateStyles();
        };
        element.onmouseleave = () => {
            this._setHovered(false);
            this._updateStyles();
        };
        element.onmousedown = () => {
            this._dragging = true;
        };
        document.addEventListener('mousemove', (e) => {
            if (this._dragging) {
                this._onDragSlider(e);
            }
        });
        document.addEventListener('mouseup', (e) => {
            if (this._dragging) {
                this._onDragSlider(e);
            }
            this._dragging = false;
        });
        element.addEventListener('wheel', (e) => {
            if (!this._dragging && this.getEnabled()) {
                e.preventDefault();
                this._onScrollSlider(e);
            }
        });
        elementValue.addEventListener('change', () => {
            this._onTypedValue();
        });
        elementValue.addEventListener('mouseenter', () => {
            this._valueHovered = true;
            this._updateStyles();
        });
        elementValue.addEventListener('mouseleave', () => {
            this._valueHovered = false;
            this._updateStyles();
        });
    }
    _generateInnerHTML() {
        const norm = (this._internalValue - this._min) / (this._max - this._min);
        return `
            <input class="struct-prop comp-slider-value" type="number" id="${this._getSliderValueId()}" min="${this._min}" max="${this._max}" step="${this._step}" value="${this.getValue().toFixed(this._decimals)}">
            <div class="struct-prop comp-slider comp-slider-outer" id="${this._getId()}">
                <div class="struct-prop comp-slider comp-slider-inner" id="${this._getSliderBarId()}" style="width: ${norm * 100}%">
                </div>
            </div>
        `;
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        const elementValue = ui_util_1.UIUtil.getElementById(this._getSliderValueId());
        elementValue.disabled = this.disabled;
        const elementBar = ui_util_1.UIUtil.getElementById(this._getSliderBarId());
        const elementSlider = ui_util_1.UIUtil.getElementById(this._getId());
        if (this.enabled) {
            elementBar.classList.add('enabled');
            elementSlider.classList.add('enabled');
        }
        else {
            elementBar.classList.remove('enabled');
            elementSlider.classList.remove('enabled');
        }
        this._updateStyles();
    }
    _onValueChanged() {
        const percentage = (0, math_1.wayThrough)(this.getValue(), this._min, this._max);
        (0, error_util_1.ASSERT)(percentage >= 0.0 && percentage <= 1.0);
        ui_util_1.UIUtil.getElementById(this._getSliderBarId()).style.width = `${percentage * 100}%`;
        ui_util_1.UIUtil.getElementById(this._getSliderValueId()).value = this.getValue().toFixed(this._decimals);
    }
    _onScrollSlider(e) {
        if (!this.getEnabled()) {
            return;
        }
        this._internalValue -= (e.deltaY / 150) * this._step;
        this._internalValue = (0, math_1.clamp)(this._internalValue, this._min, this._max);
        this._onInternalValueUpdated();
    }
    _onDragSlider(e) {
        if (!this.getEnabled()) {
            return;
        }
        const box = this._getElement().getBoundingClientRect();
        const left = box.x;
        const right = box.x + box.width;
        this._internalValue = (0, math_1.mapRange)(e.clientX, left, right, this._min, this._max);
        this._internalValue = (0, math_1.clamp)(this._internalValue, this._min, this._max);
        this._onInternalValueUpdated();
    }
    _onTypedValue() {
        const elementValue = ui_util_1.UIUtil.getElementById(this._getSliderValueId());
        const typedNumber = parseFloat(elementValue.value);
        if (!isNaN(typedNumber)) {
            this._internalValue = (0, math_1.clamp)(typedNumber, this._min, this._max);
        }
        this._onInternalValueUpdated();
    }
    _onInternalValueUpdated() {
        const displayString = this._internalValue.toFixed(this._decimals);
        this._setValue(parseFloat(displayString));
    }
    /**
     * Gets the ID of the DOM element for the slider's value.
     */
    _getSliderValueId() {
        return this._getId() + '-value';
    }
    /**
     * Gets the ID of the DOM element for the slider's bar.
     */
    _getSliderBarId() {
        return this._getId() + '-bar';
    }
    _updateStyles() {
        const elementValue = ui_util_1.UIUtil.getElementById(this._getSliderValueId());
        ui_util_1.UIUtil.updateStyles(elementValue, {
            isHovered: this._valueHovered,
            isActive: false,
            isEnabled: this.enabled,
        });
        const elementBar = ui_util_1.UIUtil.getElementById(this._getSliderBarId());
        ui_util_1.UIUtil.updateStyles(elementBar, {
            isHovered: this.hovered,
            isActive: true,
            isEnabled: this.enabled,
        });
        const elementSlider = ui_util_1.UIUtil.getElementById(this._getId());
        ui_util_1.UIUtil.updateStyles(elementSlider, {
            isHovered: this.hovered,
            isActive: false,
            isEnabled: this.enabled,
        });
    }
}
exports.SliderComponent = SliderComponent;
