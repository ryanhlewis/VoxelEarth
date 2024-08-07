"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscComponents = exports.HTMLBuilder = void 0;
const error_util_1 = require("../util/error_util");
class HTMLBuilder {
    constructor() {
        this._html = '';
    }
    add(html) {
        this._html += html;
        return this;
    }
    toString() {
        return this._html;
    }
    placeInto(elementId) {
        const element = document.getElementById(elementId);
        (0, error_util_1.ASSERT)(element !== null, `Could not place HTML into element with id '${elementId}'`);
        element.innerHTML = this._html;
    }
}
exports.HTMLBuilder = HTMLBuilder;
var MiscComponents;
(function (MiscComponents) {
    function createGroupHeader(label) {
        return `
            <div class="container-group-heading">
                <div class="group-heading">
                    ${label}
                </div>
            </div>
        `;
    }
    MiscComponents.createGroupHeader = createGroupHeader;
})(MiscComponents = exports.MiscComponents || (exports.MiscComponents = {}));
