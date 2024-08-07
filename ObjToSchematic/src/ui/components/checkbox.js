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
exports.CheckboxComponent = void 0;
var localiser_1 = require("../../localiser");
var ui_util_1 = require("../../util/ui_util");
var config_1 = require("./config");
var CheckboxComponent = /** @class */ (function (_super) {
    __extends(CheckboxComponent, _super);
    function CheckboxComponent() {
        var _this = _super.call(this, false) || this;
        _this._checked = { type: 'localised', key: 'misc.on' };
        _this._unchecked = { type: 'localised', key: 'misc.off' };
        return _this;
    }
    CheckboxComponent.prototype.setUnlocalisedCheckedText = function (text) {
        this._checked = {
            type: 'unlocalised', text: text,
        };
        return this;
    };
    CheckboxComponent.prototype.setUnlocalisedUncheckedText = function (text) {
        this._unchecked = {
            type: 'unlocalised', text: text,
        };
        return this;
    };
    CheckboxComponent.prototype.setCheckedText = function (key) {
        this._checked = {
            type: 'localised', key: key,
        };
        return this;
    };
    CheckboxComponent.prototype.setUncheckedText = function (key) {
        this._unchecked = {
            type: 'localised', key: key,
        };
        return this;
    };
    CheckboxComponent.prototype.registerEvents = function () {
        var _this = this;
        var CheckboxComponent = this._getElement();
        var textElement = ui_util_1.UIUtil.getElementById(this._getTextId());
        CheckboxComponent.addEventListener('mouseenter', function () {
            _this._onMouseEnterLeave(true);
        });
        CheckboxComponent.addEventListener('mouseleave', function () {
            _this._onMouseEnterLeave(false);
        });
        textElement.addEventListener('mouseenter', function () {
            _this._onMouseEnterLeave(true);
        });
        textElement.addEventListener('mouseleave', function () {
            _this._onMouseEnterLeave(false);
        });
        CheckboxComponent.addEventListener('click', function () {
            _this._onClick();
        });
        textElement.addEventListener('click', function () {
            _this._onClick();
        });
    };
    CheckboxComponent.prototype._onClick = function () {
        if (this.enabled) {
            this._setValue(!this.getValue());
        }
    };
    CheckboxComponent.prototype._onMouseEnterLeave = function (isHovering) {
        this._setHovered(isHovering);
        this._updateStyles();
    };
    CheckboxComponent.prototype._generateInnerHTML = function () {
        var displayText = this.getValue() ?
            (this._checked.type === 'localised' ? (0, localiser_1.LOC)(this._checked.key) : this._checked.text) :
            (this._unchecked.type === 'localised' ? (0, localiser_1.LOC)(this._unchecked.key) : this._unchecked.text);
        return "\n            <div class=\"struct-prop container-checkbox\" id=\"".concat(this._getId(), "\">\n                <svg id=\"").concat(this._getPipId(), "\" width=\"44\" height=\"44\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"#2c3e50\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n                    <path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"/>\n                    <path d=\"M5 12l5 5l10 -10\" />\n                </svg>\n            </div>\n            <div class=\"checkbox-text\" id=\"").concat(this._getTextId(), "\">").concat(displayText, "</div>\n        ");
    };
    CheckboxComponent.prototype._onValueChanged = function () {
        this._updateStyles();
    };
    CheckboxComponent.prototype.finalise = function () {
        this._onValueChanged();
    };
    CheckboxComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        this._updateStyles();
    };
    CheckboxComponent.prototype._getPipId = function () {
        return this._getId() + '-pip';
    };
    CheckboxComponent.prototype._getTextId = function () {
        return this._getId() + '-label';
    };
    CheckboxComponent.prototype.check = function () {
        this._setValue(true);
    };
    CheckboxComponent.prototype.uncheck = function () {
        this._setValue(false);
    };
    CheckboxComponent.prototype._updateStyles = function () {
        {
            var CheckboxComponent_1 = ui_util_1.UIUtil.getElementById(this._getId());
            ui_util_1.UIUtil.updateStyles(CheckboxComponent_1, {
                isEnabled: this.enabled,
                isHovered: this.hovered,
                isActive: this.getValue(),
            });
        }
        var checkboxPipElement = ui_util_1.UIUtil.getElementById(this._getPipId());
        var checkboxTextElement = ui_util_1.UIUtil.getElementById(this._getTextId());
        checkboxTextElement.classList.remove('text-dark');
        checkboxTextElement.classList.remove('text-standard');
        checkboxTextElement.classList.remove('text-light');
        var displayText = this.getValue() ?
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
    };
    CheckboxComponent.prototype.refresh = function () {
        _super.prototype.refresh.call(this);
        var displayText = this.getValue() ?
            (this._checked.type === 'localised' ? (0, localiser_1.LOC)(this._checked.key) : this._checked.text) :
            (this._unchecked.type === 'localised' ? (0, localiser_1.LOC)(this._unchecked.key) : this._unchecked.text);
        var checkboxTextElement = ui_util_1.UIUtil.getElementById(this._getTextId());
        checkboxTextElement.innerHTML = displayText;
    };
    return CheckboxComponent;
}(config_1.ConfigComponent));
exports.CheckboxComponent = CheckboxComponent;
//# sourceMappingURL=checkbox.js.map