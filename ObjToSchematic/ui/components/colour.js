"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColourComponent = void 0;
const colour_1 = require("../../colour");
const config_1 = require("./config");
class ColourComponent extends config_1.ConfigComponent {
    constructor(colour) {
        super(colour);
    }
    _generateInnerHTML() {
        return `<input class="colour-swatch" type="color" id="${this._getId()}" value="${colour_1.RGBAUtil.toHexString(this.getValue())}">`;
    }
    registerEvents() {
        this._getElement().addEventListener('change', () => {
            const newColour = colour_1.RGBAUtil.fromHexString(this._getElement().value);
            this._setValue(newColour);
        });
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        if (this.enabled) {
            this._getElement().disabled = false;
        }
        else {
            this._getElement().disabled = true;
        }
    }
}
exports.ColourComponent = ColourComponent;
