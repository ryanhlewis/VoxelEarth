"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComboboxComponent = void 0;
const localiser_1 = require("../../localiser");
const ui_util_1 = require("../../util/ui_util");
const icons_1 = require("../icons");
const misc_1 = require("../misc");
const config_1 = require("./config");
class ComboboxComponent extends config_1.ConfigComponent {
    constructor() {
        super();
        this._items = [];
    }
    addItems(items) {
        items.forEach((item) => {
            this.addItem(item);
        });
        return this;
    }
    addItem(item) {
        if (this._items.length === 0) {
            this.setDefaultValue(item.payload);
        }
        this._items.push(item);
        //this._setValue(this._items[0].payload);
        return this;
    }
    registerEvents() {
        this._getElement().addEventListener('mouseenter', () => {
            this._setHovered(true);
            this._updateStyles();
        });
        this._getElement().addEventListener('mouseleave', () => {
            this._setHovered(false);
            this._updateStyles();
        });
        this._getElement().addEventListener('change', (e) => {
            const selectedValue = this._items[this._getElement().selectedIndex].payload;
            this._setValue(selectedValue);
        });
    }
    setOptionEnabled(index, enabled) {
        const option = ui_util_1.UIUtil.getElementById(this._getId() + '-' + index);
        option.disabled = !enabled;
    }
    _generateInnerHTML() {
        const builder = new misc_1.HTMLBuilder();
        builder.add('<div style="position: relative; width: 100%;">');
        builder.add(`<select class="struct-prop" name="${this._getId()}" id="${this._getId()}">`);
        this._items.forEach((item, index) => {
            if ('displayLocKey' in item) {
                builder.add(`<option id="${this._getId()}-${index}" value="${item.payload}">${(0, localiser_1.LOC)(item.displayLocKey)}</option>`);
            }
            else {
                builder.add(`<option id="${this._getId()}-${index}" value="${item.payload}">${item.displayText}</option>`);
            }
        });
        builder.add('</select>');
        builder.add(`<div id="${this._getId()}-arrow" class="checkbox-arrow">`);
        builder.add(icons_1.AppIcons.ARROW_DOWN);
        builder.add(`</div>`);
        builder.add('</div>');
        return builder.toString();
    }
    _onValueChanged() {
        super._onValueChanged();
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        this._getElement().disabled = this.disabled;
        this._updateStyles();
    }
    _updateStyles() {
        ui_util_1.UIUtil.updateStyles(this._getElement(), {
            isHovered: this.hovered,
            isEnabled: this.enabled,
            isActive: false,
        });
        const arrowElement = ui_util_1.UIUtil.getElementById(this._getId() + '-arrow');
        arrowElement.classList.remove('text-dark');
        arrowElement.classList.remove('text-standard');
        arrowElement.classList.remove('text-light');
        if (this.enabled) {
            if (this.hovered) {
                arrowElement.classList.add('text-light');
            }
            else {
                arrowElement.classList.add('text-standard');
            }
        }
        else {
            arrowElement.classList.add('text-dark');
        }
    }
    finalise() {
        super.finalise();
        const selectedIndex = this._items.findIndex((item) => item.payload === this.getValue());
        const element = this._getElement();
        element.selectedIndex = selectedIndex;
        this._updateStyles();
    }
    refresh() {
        super.refresh();
        this._items.forEach((item, index) => {
            if ('displayLocKey' in item) {
                const element = ui_util_1.UIUtil.getElementById(this._getId() + '-' + index);
                element.text = (0, localiser_1.LOC)(item.displayLocKey);
            }
        });
    }
    setValue(value) {
        this._setValue(value);
    }
}
exports.ComboboxComponent = ComboboxComponent;
