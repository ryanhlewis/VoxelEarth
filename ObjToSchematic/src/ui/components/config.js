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
exports.ConfigComponent = void 0;
var localiser_1 = require("../../localiser");
var error_util_1 = require("../../util/error_util");
var ui_util_1 = require("../../util/ui_util");
var icons_1 = require("../icons");
var base_1 = require("./base");
/**
 * A `ConfigComponent` is a UI element that has a value the user can change.
 * For example, sliders, comboboxes and checkboxes are `ConfigComponent`.
 */
var ConfigComponent = /** @class */ (function (_super) {
    __extends(ConfigComponent, _super);
    function ConfigComponent(defaultValue) {
        var _this = _super.call(this) || this;
        _this._value = defaultValue;
        _this._label = '';
        _this._onValueChangedListeners = [];
        _this._onEnabledChangedListeners = [];
        _this._canMinimise = false;
        return _this;
    }
    ConfigComponent.prototype.setDefaultValue = function (value) {
        this._value = value;
        return this;
    };
    ConfigComponent.prototype.setLabel = function (p) {
        this._labelLocalisedKey = p;
        this._label = (0, localiser_1.LOC)(p);
        return this;
    };
    ConfigComponent.prototype.setUnlocalisedLabel = function (p) {
        this._label = p;
        return this;
    };
    ConfigComponent.prototype.refresh = function () {
        this._updateLabel();
        //const outer = UIUtil.getElementById(`${this._getId()}-prop`);
        //outer.innerHTML = this._generateInnerHTML();
    };
    ConfigComponent.prototype._updateLabel = function () {
        if (this._labelLocalisedKey !== undefined) {
            (0, error_util_1.ASSERT)(this._labelLocalisedKey !== undefined, "Missing localisation key ".concat(this._label));
            this._label = (0, localiser_1.LOC)(this._labelLocalisedKey);
            var labelElement = ui_util_1.UIUtil.getElementById(this._getLabelId());
            labelElement.innerHTML = this._label;
        }
    };
    /*
    public setLabel(label: TLocalisedString) {
        this._label = label;
        return this;
    }
    */
    /**
     * Get the currently set value of this UI element.
     */
    ConfigComponent.prototype.getValue = function () {
        (0, error_util_1.ASSERT)(this._value !== undefined, 'this._value is undefined');
        return this._value;
    };
    /**
     * Add a delegate that will be called when the value changes.
     */
    ConfigComponent.prototype.addValueChangedListener = function (delegate) {
        this._onValueChangedListeners.push(delegate);
        return this;
    };
    /**
     * Add a delegate that will be called when the value changes.
     */
    ConfigComponent.prototype.addEnabledChangedListener = function (delegate) {
        this._onEnabledChangedListeners.push(delegate);
        return this;
    };
    ConfigComponent.prototype.finalise = function () {
        var _this = this;
        if (this._canMinimise) {
            var minimiserElement_1 = ui_util_1.UIUtil.getElementById(this._getId() + '-minimiser');
            var labelElement_1 = ui_util_1.UIUtil.getElementById(this._getLabelId());
            var propElement_1 = ui_util_1.UIUtil.getElementById(this._getId() + '-prop');
            labelElement_1.addEventListener('click', function () {
                propElement_1.classList.toggle('hide');
                if (propElement_1.classList.contains('hide')) {
                    minimiserElement_1.innerHTML = icons_1.AppIcons.ARROW_RIGHT;
                }
                else {
                    minimiserElement_1.innerHTML = icons_1.AppIcons.ARROW_DOWN;
                }
            });
            labelElement_1.addEventListener('mouseenter', function () {
                if (_this.enabled) {
                    labelElement_1.style.color = '#d9d9d9';
                }
                labelElement_1.style.cursor = 'pointer';
            });
            labelElement_1.addEventListener('mouseleave', function () {
                labelElement_1.style.color = '';
                labelElement_1.style.cursor = '';
            });
        }
        _super.prototype.finalise.call(this);
        /*
        this._onValueChanged();
        this._onValueChangedListeners.forEach((listener) => {
            listener(this._value!);
        });
        */
    };
    ConfigComponent.prototype.setCanMinimise = function () {
        this._canMinimise = true;
        return this;
    };
    ConfigComponent.prototype.generateHTML = function () {
        return "\n            <div class=\"property\">\n                <div class=\"prop-key-container\" id=\"".concat(this._getLabelId(), "\">\n                    ").concat(this._label, "\n                    ").concat(this._canMinimise ? "<div style=\"display: flex;\" id=\"".concat(this._getId(), "-minimiser\">").concat(icons_1.AppIcons.ARROW_DOWN, "</div>") : '', "\n                </div>\n                <div class=\"prop-value-container\" id=\"").concat(this._getId(), "-prop\">\n                    ").concat(this._generateInnerHTML(), "\n                </div>\n            </div>\n        ");
    };
    ConfigComponent.prototype._onEnabledChanged = function () {
        var _this = this;
        var label = document.getElementById(this._getLabelId());
        if (this.enabled) {
            label === null || label === void 0 ? void 0 : label.classList.remove('text-dark');
            label === null || label === void 0 ? void 0 : label.classList.add('text-standard');
        }
        else {
            label === null || label === void 0 ? void 0 : label.classList.add('text-dark');
            label === null || label === void 0 ? void 0 : label.classList.remove('text-standard');
        }
        this._onEnabledChangedListeners.forEach(function (listener) {
            listener(_this.getEnabled());
        });
    };
    /**
     * Set the value of this UI element.
     */
    ConfigComponent.prototype._setValue = function (value) {
        var _this = this;
        this._value = value;
        this._onValueChanged();
        this._onValueChangedListeners.forEach(function (listener) {
            listener(_this._value);
        });
    };
    /**
     * A delegate that is called when the value of this element changes.
     */
    ConfigComponent.prototype._onValueChanged = function () {
    };
    ConfigComponent.prototype._getLabelId = function () {
        return this._getId() + '_label';
    };
    return ConfigComponent;
}(base_1.BaseComponent));
exports.ConfigComponent = ConfigComponent;
//# sourceMappingURL=config.js.map