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
exports.ToolbarItemComponent = void 0;
var error_util_1 = require("../../util/error_util");
var ui_util_1 = require("../../util/ui_util");
var base_1 = require("./base");
var localiser_1 = require("../../localiser");
var ToolbarItemComponent = /** @class */ (function (_super) {
    __extends(ToolbarItemComponent, _super);
    function ToolbarItemComponent(params) {
        var _this = _super.call(this) || this;
        _this._isActive = false;
        _this._grow = false;
        {
            var parser = new DOMParser();
            var svgParse = parser.parseFromString(params.iconSVG, 'text/html');
            var svgs = svgParse.getElementsByTagName('svg');
            (0, error_util_1.ASSERT)(svgs.length === 1, 'Missing SVG');
            _this._iconSVG = svgs[0];
            _this._iconSVG.id = _this._getId() + '-svg';
        }
        _this._label = '';
        _this._tooltipLocKey = null;
        return _this;
    }
    ToolbarItemComponent.prototype.setGrow = function () {
        this._grow = true;
        return this;
    };
    ToolbarItemComponent.prototype.updateTranslation = function () {
        if (this._tooltipLocKey) {
            ui_util_1.UIUtil.getElementById(this._getId() + '-tooltip').innerHTML = (0, localiser_1.LOC)(this._tooltipLocKey);
        }
    };
    ToolbarItemComponent.prototype.setActive = function (isActive) {
        this._isActive = isActive;
        this._updateStyles();
    };
    ToolbarItemComponent.prototype.setLabel = function (label) {
        this._label = label;
        return this;
    };
    ToolbarItemComponent.prototype.tick = function () {
        if (this._isEnabledDelegate !== undefined) {
            var newIsEnabled = this._isEnabledDelegate();
            if (newIsEnabled != this.enabled) {
                this.setEnabled(newIsEnabled);
                this._updateStyles();
            }
        }
        if (this._isActiveDelegate !== undefined) {
            var newIsActive = this._isActiveDelegate();
            if (newIsActive !== this._isActive) {
                this._isActive = newIsActive;
                this._updateStyles();
            }
        }
    };
    ToolbarItemComponent.prototype._onEnabledChanged = function () {
        this._updateStyles();
    };
    ToolbarItemComponent.prototype.isActive = function (delegate) {
        this._isActiveDelegate = delegate;
        return this;
    };
    ToolbarItemComponent.prototype.isEnabled = function (delegate) {
        this._isEnabledDelegate = delegate;
        return this;
    };
    ToolbarItemComponent.prototype.onClick = function (delegate) {
        this._onClick = delegate;
        return this;
    };
    ToolbarItemComponent.prototype.setTooltip = function (text) {
        this._tooltipLocKey = text;
        return this;
    };
    ToolbarItemComponent.prototype.generateHTML = function () {
        if (this._grow) {
            return "\n                <div class=\"struct-prop container-icon-button\" style=\"width: unset; flex-grow: 1;\" id=\"".concat(this._getId(), "\">\n                    ").concat(this._iconSVG.outerHTML, " ").concat(this._label, "\n                </div>\n            ");
        }
        else {
            if (this._tooltipLocKey === null) {
                return "\n                <div class=\"struct-prop container-icon-button \" style=\"aspect-ratio: 1;\" id=\"".concat(this._getId(), "\">\n                    ").concat(this._iconSVG.outerHTML, " ").concat(this._label, "\n                </div>\n            ");
            }
            else {
                return "\n                    <div class=\"struct-prop container-icon-button hover-text\" style=\"aspect-ratio: 1;\" id=\"".concat(this._getId(), "\">\n                        ").concat(this._iconSVG.outerHTML, " ").concat(this._label, "\n                        <span class=\"tooltip-text left\" id=\"").concat(this._getId(), "-tooltip\">").concat((0, localiser_1.LOC)(this._tooltipLocKey), "</span>\n                    </div>\n                ");
            }
        }
    };
    ToolbarItemComponent.prototype.registerEvents = function () {
        var _this = this;
        var element = document.getElementById(this._getId());
        (0, error_util_1.ASSERT)(element !== null);
        element.addEventListener('click', function () {
            if (_this.enabled && _this._onClick) {
                _this._onClick();
            }
        });
        element.addEventListener('mouseenter', function () {
            _this._setHovered(true);
            _this._updateStyles();
        });
        element.addEventListener('mouseleave', function () {
            _this._setHovered(false);
            _this._updateStyles();
        });
    };
    ToolbarItemComponent.prototype.finalise = function () {
        this._updateStyles();
    };
    ToolbarItemComponent.prototype._getSVGElement = function () {
        var svgId = this._getId() + '-svg';
        return ui_util_1.UIUtil.getElementById(svgId);
    };
    ToolbarItemComponent.prototype._updateStyles = function () {
        ui_util_1.UIUtil.updateStyles(this._getElement(), {
            isActive: this._isActive,
            isEnabled: this.enabled,
            isHovered: this.hovered,
        });
    };
    return ToolbarItemComponent;
}(base_1.BaseComponent));
exports.ToolbarItemComponent = ToolbarItemComponent;
//# sourceMappingURL=toolbar_item.js.map