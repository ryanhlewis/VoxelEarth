"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigComponent = void 0;
const localiser_1 = require("../../localiser");
const error_util_1 = require("../../util/error_util");
const ui_util_1 = require("../../util/ui_util");
const icons_1 = require("../icons");
const base_1 = require("./base");
/**
 * A `ConfigComponent` is a UI element that has a value the user can change.
 * For example, sliders, comboboxes and checkboxes are `ConfigComponent`.
 */
class ConfigComponent extends base_1.BaseComponent {
    constructor(defaultValue) {
        super();
        this._value = defaultValue;
        this._label = '';
        this._onValueChangedListeners = [];
        this._onEnabledChangedListeners = [];
        this._canMinimise = false;
    }
    setDefaultValue(value) {
        this._value = value;
        return this;
    }
    setLabel(p) {
        this._labelLocalisedKey = p;
        this._label = (0, localiser_1.LOC)(p);
        return this;
    }
    setUnlocalisedLabel(p) {
        this._label = p;
        return this;
    }
    refresh() {
        this._updateLabel();
        //const outer = UIUtil.getElementById(`${this._getId()}-prop`);
        //outer.innerHTML = this._generateInnerHTML();
    }
    _updateLabel() {
        if (this._labelLocalisedKey !== undefined) {
            (0, error_util_1.ASSERT)(this._labelLocalisedKey !== undefined, `Missing localisation key ${this._label}`);
            this._label = (0, localiser_1.LOC)(this._labelLocalisedKey);
            const labelElement = ui_util_1.UIUtil.getElementById(this._getLabelId());
            labelElement.innerHTML = this._label;
        }
    }
    /*
    public setLabel(label: TLocalisedString) {
        this._label = label;
        return this;
    }
    */
    /**
     * Get the currently set value of this UI element.
     */
    getValue() {
        (0, error_util_1.ASSERT)(this._value !== undefined, 'this._value is undefined');
        return this._value;
    }
    /**
     * Add a delegate that will be called when the value changes.
     */
    addValueChangedListener(delegate) {
        this._onValueChangedListeners.push(delegate);
        return this;
    }
    /**
     * Add a delegate that will be called when the value changes.
     */
    addEnabledChangedListener(delegate) {
        this._onEnabledChangedListeners.push(delegate);
        return this;
    }
    finalise() {
        if (this._canMinimise) {
            const minimiserElement = ui_util_1.UIUtil.getElementById(this._getId() + '-minimiser');
            const labelElement = ui_util_1.UIUtil.getElementById(this._getLabelId());
            const propElement = ui_util_1.UIUtil.getElementById(this._getId() + '-prop');
            labelElement.addEventListener('click', () => {
                propElement.classList.toggle('hide');
                if (propElement.classList.contains('hide')) {
                    minimiserElement.innerHTML = icons_1.AppIcons.ARROW_RIGHT;
                }
                else {
                    minimiserElement.innerHTML = icons_1.AppIcons.ARROW_DOWN;
                }
            });
            labelElement.addEventListener('mouseenter', () => {
                if (this.enabled) {
                    labelElement.style.color = '#d9d9d9';
                }
                labelElement.style.cursor = 'pointer';
            });
            labelElement.addEventListener('mouseleave', () => {
                labelElement.style.color = '';
                labelElement.style.cursor = '';
            });
        }
        super.finalise();
        /*
        this._onValueChanged();
        this._onValueChangedListeners.forEach((listener) => {
            listener(this._value!);
        });
        */
    }
    setCanMinimise() {
        this._canMinimise = true;
        return this;
    }
    generateHTML() {
        return `
            <div class="property">
                <div class="prop-key-container" id="${this._getLabelId()}">
                    ${this._label}
                    ${this._canMinimise ? `<div style="display: flex;" id="${this._getId()}-minimiser">${icons_1.AppIcons.ARROW_DOWN}</div>` : ''}
                </div>
                <div class="prop-value-container" id="${this._getId()}-prop">
                    ${this._generateInnerHTML()}
                </div>
            </div>
        `;
    }
    _onEnabledChanged() {
        const label = document.getElementById(this._getLabelId());
        if (this.enabled) {
            label === null || label === void 0 ? void 0 : label.classList.remove('text-dark');
            label === null || label === void 0 ? void 0 : label.classList.add('text-standard');
        }
        else {
            label === null || label === void 0 ? void 0 : label.classList.add('text-dark');
            label === null || label === void 0 ? void 0 : label.classList.remove('text-standard');
        }
        this._onEnabledChangedListeners.forEach((listener) => {
            listener(this.getEnabled());
        });
    }
    /**
     * Set the value of this UI element.
     */
    _setValue(value) {
        this._value = value;
        this._onValueChanged();
        this._onValueChangedListeners.forEach((listener) => {
            listener(this._value);
        });
    }
    /**
     * A delegate that is called when the value of this element changes.
     */
    _onValueChanged() {
    }
    _getLabelId() {
        return this._getId() + '_label';
    }
}
exports.ConfigComponent = ConfigComponent;
