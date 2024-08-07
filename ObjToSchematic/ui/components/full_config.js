"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullConfigComponent = void 0;
const config_1 = require("./config");
/**
 * A `FullConfigComponent` is a UI element that has a value the user can change.
 * For example, sliders, comboboxes and checkboxes are `ConfigComponent`.
 */
class FullConfigComponent extends config_1.ConfigComponent {
    generateHTML() {
        return `
            <div class="property" style="flex-direction: column; align-items: start;">
                <div class="prop-key-container" id="${this._getLabelId()}">
                    ${this._label}
                </div>
                ${this._generateInnerHTML()}
            </div>
        `;
    }
}
exports.FullConfigComponent = FullConfigComponent;
