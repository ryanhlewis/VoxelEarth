"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiscComponents = exports.HTMLBuilder = void 0;
var error_util_1 = require("../util/error_util");
var HTMLBuilder = /** @class */ (function () {
    function HTMLBuilder() {
        this._html = '';
    }
    HTMLBuilder.prototype.add = function (html) {
        this._html += html;
        return this;
    };
    HTMLBuilder.prototype.toString = function () {
        return this._html;
    };
    HTMLBuilder.prototype.placeInto = function (elementId) {
        var element = document.getElementById(elementId);
        (0, error_util_1.ASSERT)(element !== null, "Could not place HTML into element with id '".concat(elementId, "'"));
        element.innerHTML = this._html;
    };
    return HTMLBuilder;
}());
exports.HTMLBuilder = HTMLBuilder;
var MiscComponents;
(function (MiscComponents) {
    function createGroupHeader(label) {
        return "\n            <div class=\"container-group-heading\">\n                <div class=\"group-heading\">\n                    ".concat(label, "\n                </div>\n            </div>\n        ");
    }
    MiscComponents.createGroupHeader = createGroupHeader;
})(MiscComponents = exports.MiscComponents || (exports.MiscComponents = {}));
//# sourceMappingURL=misc.js.map