"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceholderComponent = void 0;
const localiser_1 = require("../../localiser");
const ui_util_1 = require("../../util/ui_util");
const config_1 = require("./config");
class PlaceholderComponent extends config_1.ConfigComponent {
    constructor() {
        super(undefined);
    }
    setPlaceholderText(p) {
        this.placeholderLocKey = p;
        this._placeholderlabel = (0, localiser_1.LOC)(p);
        return this;
    }
    refresh() {
        super.refresh();
        this._placeholderlabel = (0, localiser_1.LOC)(this.placeholderLocKey);
        const placeholderElement = ui_util_1.UIUtil.getElementById(`${this._getId()}-placeholder-text`);
        placeholderElement.innerHTML = this._placeholderlabel;
    }
    generateHTML() {
        return `
            <div class="property" style="justify-content: center; height: var(--property-height);">
                <div id="${this._getLabelId()}"></div>
                <div id="${this._getId()}-prop"></div>
                <i>${this._generateInnerHTML()}</i>
            </div>
        `;
    }
    _generateInnerHTML() {
        return `
            <div class="text-dark" id="${this._getId()}-placeholder-text">
                ${this._placeholderlabel}
            </div>
        `;
    }
    registerEvents() {
    }
}
exports.PlaceholderComponent = PlaceholderComponent;
