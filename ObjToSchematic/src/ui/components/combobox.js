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
exports.ComboboxComponent = void 0;
var localiser_1 = require("../../localiser");
var ui_util_1 = require("../../util/ui_util");
var icons_1 = require("../icons");
var misc_1 = require("../misc");
var config_1 = require("./config");
var ComboboxComponent = /** @class */ (function (_super) {
    __extends(ComboboxComponent, _super);
    function ComboboxComponent() {
        var _this = _super.call(this) || this;
        _this._items = [];
        return _this;
    }
    ComboboxComponent.prototype.addItems = function (items) {
        var _this = this;
        items.forEach(function (item) {
            _this.addItem(item);
        });
        return this;
    };
    ComboboxComponent.prototype.addItem = function (item) {
        if (this._items.length === 0) {
            this.setDefaultValue(item.payload);
        }
        this._items.push(item);
        //this._setValue(this._items[0].payload);
        return this;
    };
    ComboboxComponent.prototype.registerEvents = function () {
        var _this = this;
        this._getElement().addEventListener('mouseenter', function () {
            _this._setHovered(true);
            _this._updateStyles();
        });
        this._getElement().addEventListener('mouseleave', function () {
            _this._setHovered(false);
            _this._updateStyles();
        });
        this._getElement().addEventListener('change', function (e) {
            var selectedValue = _this._items[_this._getElement().selectedIndex].payload;
            _this._setValue(selectedValue);
        });
    };
    ComboboxComponent.prototype.setOptionEnabled = function (index, enabled) {
        var option = ui_util_1.UIUtil.getElementById(this._getId() + '-' + index);
        option.disabled = !enabled;
    };
    ComboboxComponent.prototype._generateInnerHTML = function () {
        var _this = this;
        var builder = new misc_1.HTMLBuilder();
        builder.add('<div style="position: relative; width: 100%;">');
        builder.add("<select class=\"struct-prop\" name=\"".concat(this._getId(), "\" id=\"").concat(this._getId(), "\">"));
        this._items.forEach(function (item, index) {
            if ('displayLocKey' in item) {
                builder.add("<option id=\"".concat(_this._getId(), "-").concat(index, "\" value=\"").concat(item.payload, "\">").concat((0, localiser_1.LOC)(item.displayLocKey), "</option>"));
            }
            else {
                builder.add("<option id=\"".concat(_this._getId(), "-").concat(index, "\" value=\"").concat(item.payload, "\">").concat(item.displayText, "</option>"));
            }
        });
        builder.add('</select>');
        builder.add("<div id=\"".concat(this._getId(), "-arrow\" class=\"checkbox-arrow\">"));
        builder.add(icons_1.AppIcons.ARROW_DOWN);
        builder.add("</div>");
        builder.add('</div>');
        return builder.toString();
    };
    ComboboxComponent.prototype._onValueChanged = function () {
        _super.prototype._onValueChanged.call(this);
    };
    ComboboxComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        this._getElement().disabled = this.disabled;
        this._updateStyles();
    };
    ComboboxComponent.prototype._updateStyles = function () {
        ui_util_1.UIUtil.updateStyles(this._getElement(), {
            isHovered: this.hovered,
            isEnabled: this.enabled,
            isActive: false,
        });
        var arrowElement = ui_util_1.UIUtil.getElementById(this._getId() + '-arrow');
        arrowElement.classList.remove('text-dark');
        arrowElement.classList.remove('text-standard');
        arrowElement.classList.remove('text-light');
        if (this.enabled) {
            if (this.hovered) {
                arrowElement.classList.add('text-light');
            }
            else {
                arrowElement.classList.add('text-standard');
            }
        }
        else {
            arrowElement.classList.add('text-dark');
        }
    };
    ComboboxComponent.prototype.finalise = function () {
        var _this = this;
        _super.prototype.finalise.call(this);
        var selectedIndex = this._items.findIndex(function (item) { return item.payload === _this.getValue(); });
        var element = this._getElement();
        element.selectedIndex = selectedIndex;
        this._updateStyles();
    };
    ComboboxComponent.prototype.refresh = function () {
        var _this = this;
        _super.prototype.refresh.call(this);
        this._items.forEach(function (item, index) {
            if ('displayLocKey' in item) {
                var element = ui_util_1.UIUtil.getElementById(_this._getId() + '-' + index);
                element.text = (0, localiser_1.LOC)(item.displayLocKey);
            }
        });
    };
    ComboboxComponent.prototype.setValue = function (value) {
        this._setValue(value);
    };
    return ComboboxComponent;
}(config_1.ConfigComponent));
exports.ComboboxComponent = ComboboxComponent;
//# sourceMappingURL=combobox.js.map