"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberComponent = void 0;
const ui_util_1 = require("../../util/ui_util");
const config_1 = require("./config");
class NumberComponent extends config_1.ConfigComponent {
    constructor() {
        super(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
        this._min = 0;
        this._max = 1;
        this._step = 0.1;
        this._hovering = false;
    }
    /**
     * Set the minimum value the input can be set to.
     */
    setMin(min) {
        this._min = min;
        return this;
    }
    /**
     * Set the maximum value the input can be set to.
     */
    setMax(max) {
        this._max = max;
        return this;
    }
    /**
     * Set the number of steps to display the value to.
     */
    setStep(step) {
        this._step = step;
        return this;
    }
    registerEvents() {
        this._getElement().addEventListener('change', () => {
            this._setValue(parseInt(this._getElement().value));
        });
        this._getElement().addEventListener('mouseenter', () => {
            this._setHovered(true);
            this._updateStyles();
        });
        this._getElement().addEventListener('mouseleave', () => {
            this._setHovered(false);
            this._updateStyles();
        });
    }
    _generateInnerHTML() {
        return `
            <input class="struct-prop" type="number" style="width: 100%; text-align: start;" step="${this._step}" id="${this._getId()}" min="${this._min}" max="${this._max}" value="${this.getValue()}"></input>
        `;
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        const element = this._getElement();
        element.disabled = !this.enabled;
        this._updateStyles();
    }
    _onTypedValue() {
    }
    _onValueChanged() {
    }
    _updateStyles() {
        ui_util_1.UIUtil.updateStyles(ui_util_1.UIUtil.getElementById(this._getId()), {
            isActive: false,
            isEnabled: this.enabled,
            isHovered: this.hovered,
        });
    }
}
exports.NumberComponent = NumberComponent;
