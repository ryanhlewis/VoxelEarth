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
exports.FullConfigComponent = void 0;
var config_1 = require("./config");
/**
 * A `FullConfigComponent` is a UI element that has a value the user can change.
 * For example, sliders, comboboxes and checkboxes are `ConfigComponent`.
 */
var FullConfigComponent = /** @class */ (function (_super) {
    __extends(FullConfigComponent, _super);
    function FullConfigComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FullConfigComponent.prototype.generateHTML = function () {
        return "\n            <div class=\"property\" style=\"flex-direction: column; align-items: start;\">\n                <div class=\"prop-key-container\" id=\"".concat(this._getLabelId(), "\">\n                    ").concat(this._label, "\n                </div>\n                ").concat(this._generateInnerHTML(), "\n            </div>\n        ");
    };
    return FullConfigComponent;
}(config_1.ConfigComponent));
exports.FullConfigComponent = FullConfigComponent;
//# sourceMappingURL=full_config.js.map