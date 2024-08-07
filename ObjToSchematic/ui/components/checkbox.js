"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckboxComponent = void 0;
const localiser_1 = require("../../localiser");
const ui_util_1 = require("../../util/ui_util");
const config_1 = require("./config");
class CheckboxComponent extends config_1.ConfigComponent {
    constructor() {
        super(false);
        this._checked = { type: 'localised', key: 'misc.on' };
        this._unchecked = { type: 'localised', key: 'misc.off' };
    }
    setUnlocalisedCheckedText(text) {
        this._checked = {
            type: 'unlocalised', text: text,
        };
        return this;
    }
    setUnlocalisedUncheckedText(text) {
        this._unchecked = {
            type: 'unlocalised', text: text,
        };
        return this;
    }
    setCheckedText(key) {
        this._checked = {
            type: 'localised', key: key,
        };
        return this;
    }
    setUncheckedText(key) {
        this._unchecked = {
            type: 'localised', key: key,
        };
        return this;
    }
    registerEvents() {
        const CheckboxComponent = this._getElement();
        const textElement = ui_util_1.UIUtil.getElementById(this._getTextId());
        CheckboxComponent.addEventListener('mouseenter', () => {
            this._onMouseEnterLeave(true);
        });
        CheckboxComponent.addEventListener('mouseleave', () => {
            this._onMouseEnterLeave(false);
        });
        textElement.addEventListener('mouseenter', () => {
            this._onMouseEnterLeave(true);
        });
        textElement.addEventListener('mouseleave', () => {
            this._onMouseEnterLeave(false);
        });
        CheckboxComponent.addEventListener('click', () => {
            this._onClick();
        });
        textElement.addEventListener('click', () => {
            this._onClick();
        });
    }
    _onClick() {
        if (this.enabled) {
            this._setValue(!this.getValue());
        }
    }
    _onMouseEnterLeave(isHovering) {
        this._setHovered(isHovering);
        this._updateStyles();
    }
    _generateInnerHTML() {
        const displayText = this.getValue() ?
            (this._checked.type === 'localised' ? (0, localiser_1.LOC)(this._checked.key) : this._checked.text) :
            (this._unchecked.type === 'localised' ? (0, localiser_1.LOC)(this._unchecked.key) : this._unchecked.text);
        return `
            <div class="struct-prop container-checkbox" id="${this._getId()}">
                <svg id="${this._getPipId()}" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M5 12l5 5l10 -10" />
                </svg>
            </div>
            <div class="checkbox-text" id="${this._getTextId()}">${displayText}</div>
        `;
    }
    _onValueChanged() {
        this._updateStyles();
    }
    finalise() {
        this._onValueChanged();
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        this._updateStyles();
    }
    _getPipId() {
        return this._getId() + '-pip';
    }
    _getTextId() {
        return this._getId() + '-label';
    }
    check() {
        this._setValue(true);
    }
    uncheck() {
        this._setValue(false);
    }
    _updateStyles() {
        {
            const CheckboxComponent = ui_util_1.UIUtil.getElementById(this._getId());
            ui_util_1.UIUtil.updateStyles(CheckboxComponent, {
                isEnabled: this.enabled,
                isHovered: this.hovered,
                isActive: this.getValue(),
            });
        }
        const checkboxPipElement = ui_util_1.UIUtil.getElementById(this._getPipId());
        const checkboxTextElement = ui_util_1.UIUtil.getElementById(this._getTextId());
        checkboxTextElement.classList.remove('text-dark');
        checkboxTextElement.classList.remove('text-standard');
        checkboxTextElement.classList.remove('text-light');
        const displayText = this.getValue() ?
            (this._checked.type === 'localised' ? (0, localiser_1.LOC)(this._checked.key) : this._checked.text) :
            (this._unchecked.type === 'localised' ? (0, localiser_1.LOC)(this._unchecked.key) : this._unchecked.text);
        checkboxTextElement.innerHTML = displayText;
        checkboxPipElement.style.visibility = this.getValue() ? 'visible' : 'hidden';
        if (this.enabled) {
            if (this.hovered) {
                checkboxTextElement.classList.add('text-light');
            }
            else {
                checkboxTextElement.classList.add('text-standard');
            }
        }
        else {
            checkboxTextElement.classList.add('text-dark');
        }
    }
    refresh() {
        super.refresh();
        const displayText = this.getValue() ?
            (this._checked.type === 'localised' ? (0, localiser_1.LOC)(this._checked.key) : this._checked.text) :
            (this._unchecked.type === 'localised' ? (0, localiser_1.LOC)(this._unchecked.key) : this._unchecked.text);
        const checkboxTextElement = ui_util_1.UIUtil.getElementById(this._getTextId());
        checkboxTextElement.innerHTML = displayText;
    }
}
exports.CheckboxComponent = CheckboxComponent;
