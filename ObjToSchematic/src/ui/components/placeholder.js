"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceholderComponent = void 0;
var localiser_1 = require("../../localiser");
var ui_util_1 = require("../../util/ui_util");
var config_1 = require("./config");
var PlaceholderComponent = /** @class */ (function (_super) {
    __extends(PlaceholderComponent, _super);
    function PlaceholderComponent() {
        return _super.call(this, undefined) || this;
    }
    PlaceholderComponent.prototype.setPlaceholderText = function (p) {
        this.placeholderLocKey = p;
        this._placeholderlabel = (0, localiser_1.LOC)(p);
        return this;
    };
    PlaceholderComponent.prototype.refresh = function () {
        _super.prototype.refresh.call(this);
        this._placeholderlabel = (0, localiser_1.LOC)(this.placeholderLocKey);
        var placeholderElement = ui_util_1.UIUtil.getElementById("".concat(this._getId(), "-placeholder-text"));
        placeholderElement.innerHTML = this._placeholderlabel;
    };
    PlaceholderComponent.prototype.generateHTML = function () {
        return "\n            <div class=\"property\" style=\"justify-content: center; height: var(--property-height);\">\n                <div id=\"".concat(this._getLabelId(), "\"></div>\n                <div id=\"").concat(this._getId(), "-prop\"></div>\n                <i>").concat(this._generateInnerHTML(), "</i>\n            </div>\n        ");
    };
    PlaceholderComponent.prototype._generateInnerHTML = function () {
        return "\n            <div class=\"text-dark\" id=\"".concat(this._getId(), "-placeholder-text\">\n                ").concat(this._placeholderlabel, "\n            </div>\n        ");
    };
    PlaceholderComponent.prototype.registerEvents = function () {
    };
    return PlaceholderComponent;
}(config_1.ConfigComponent));
exports.PlaceholderComponent = PlaceholderComponent;
//# sourceMappingURL=placeholder.js.map