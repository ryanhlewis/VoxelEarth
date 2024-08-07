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
exports.ButtonComponent = void 0;
var ui_util_1 = require("../../util/ui_util");
var base_1 = require("./base");
var ButtonComponent = /** @class */ (function (_super) {
    __extends(ButtonComponent, _super);
    function ButtonComponent() {
        var _this = _super.call(this) || this;
        _this._label = 'Unknown';
        _this._defaultLabel = 'Unknown';
        _this._onClick = function () { };
        return _this;
    }
    /**
     * Sets the delegate that is called when this button is clicked.
     */
    ButtonComponent.prototype.setOnClick = function (delegate) {
        this._onClick = delegate;
        return this;
    };
    /**
     * Sets the label of this button.
     */
    ButtonComponent.prototype.setLabel = function (label) {
        this._label = label;
        this._defaultLabel = label;
        return this;
    };
    ButtonComponent.prototype.updateLabel = function () {
        var labelElement = ui_util_1.UIUtil.getElementById("".concat(this._getId(), "-button-label"));
        labelElement.innerHTML = this._label;
        return this;
    };
    /**
     * Override the current label with a new value.
     */
    ButtonComponent.prototype.setLabelOverride = function (label) {
        this._label = label;
        this.updateLabel();
        return this;
    };
    /**
     * Remove the label override and set the label back to its default
     */
    ButtonComponent.prototype.removeLabelOverride = function () {
        this._label = this._defaultLabel;
        this.updateLabel();
        return this;
    };
    /**
     * Start the loading animation
     */
    ButtonComponent.prototype.startLoading = function () {
        this._getElement().classList.add('button-loading');
        return this;
    };
    /**
     * Set the progress bar progress.
     * @param progress A number between 0.0 and 1.0 inclusive.
     */
    ButtonComponent.prototype.setProgress = function (progress) {
        var progressBarElement = ui_util_1.UIUtil.getElementById(this._getProgressBarId());
        progressBarElement.style.width = "".concat(progress * 100, "%");
        return this;
    };
    /**
     * Stop the loading animation
     */
    ButtonComponent.prototype.stopLoading = function () {
        this._getElement().classList.remove('button-loading');
        return this;
    };
    ButtonComponent.prototype.resetLoading = function () {
        this.stopLoading();
        this.setProgress(0.0);
    };
    ButtonComponent.prototype.generateHTML = function () {
        return "\n            <div class=\"container-button\">\n                <div class=\"struct-prop button\" id=\"".concat(this._getId(), "\">\n                    <div class=\"button-label\" id=\"").concat(this._getId(), "-button-label\">").concat(this._label, "</div>\n                    <div class=\"button-progress\" id=\"").concat(this._getProgressBarId(), "\"></div>\n                </div>\n            </div>\n        ");
    };
    ButtonComponent.prototype.registerEvents = function () {
        var _this = this;
        this._getElement().addEventListener('click', function () {
            var _a;
            if (_this.enabled) {
                (_a = _this._onClick) === null || _a === void 0 ? void 0 : _a.call(_this);
            }
        });
        this._getElement().addEventListener('mouseenter', function () {
            _this._setHovered(true);
            _this._updateStyles();
        });
        this._getElement().addEventListener('mouseleave', function () {
            _this._setHovered(false);
            _this._updateStyles();
        });
    };
    ButtonComponent.prototype._onEnabledChanged = function () {
        this._updateStyles();
    };
    ButtonComponent.prototype.finalise = function () {
        this._updateStyles();
    };
    /**
     * Gets the ID of the DOM element for the button's progress bar.
     */
    ButtonComponent.prototype._getProgressBarId = function () {
        return this._getId() + '-progress';
    };
    ButtonComponent.prototype._updateStyles = function () {
        ui_util_1.UIUtil.updateStyles(this._getElement(), {
            isActive: true,
            isEnabled: this.enabled,
            isHovered: this.hovered,
        });
    };
    return ButtonComponent;
}(base_1.BaseComponent));
exports.ButtonComponent = ButtonComponent;
//# sourceMappingURL=button.js.map