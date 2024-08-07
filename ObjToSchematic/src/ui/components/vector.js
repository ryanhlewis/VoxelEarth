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
exports.VectorComponent = void 0;
var ui_util_1 = require("../../util/ui_util");
var vector_1 = require("../../vector");
var config_1 = require("./config");
var VectorComponent = /** @class */ (function (_super) {
    __extends(VectorComponent, _super);
    function VectorComponent() {
        var _this = _super.call(this, new vector_1.Vector3(0, 0, 0)) || this;
        _this._mouseover = null;
        _this._showY = true;
        return _this;
    }
    /**
     * Set whether or not the Y axis has a UI element
     */
    VectorComponent.prototype.setShowY = function (showY) {
        this._showY = showY;
        return this;
    };
    VectorComponent.prototype._generateInnerHTML = function () {
        var html = '';
        html += '<div class="spinbox-main-container">';
        html += "\n            <div class=\"spinbox-element-container\">\n                <div class=\"spinbox-key\" id=\"".concat(this._getKeyId('x'), "\">X</div>\n                <input type=\"number\" class=\"spinbox-value struct-prop\" min=\"-360\" max=\"360\" value=\"").concat(this.getValue().x, "\" id=\"").concat(this._getValueId('x'), "\"></input>\n            </div>\n        ");
        if (this._showY) {
            html += "\n                <div class=\"spinbox-element-container\">\n                    <div class=\"spinbox-key\" id=\"".concat(this._getKeyId('y'), "\">Y</div>\n                    <input type=\"number\" class=\"spinbox-value struct-prop\" min=\"-360\" max=\"360\" value=\"").concat(this.getValue().y, "\" id=\"").concat(this._getValueId('y'), "\"></input>\n                </div>\n            ");
        }
        html += "\n            <div class=\"spinbox-element-container\">\n                <div class=\"spinbox-key\" id=\"".concat(this._getKeyId('z'), "\">Z</div>\n                <input type=\"number\" class=\"spinbox-value struct-prop\" min=\"-360\" max=\"360\" value=\"").concat(this.getValue().z, "\" id=\"").concat(this._getValueId('z'), "\"></input>\n            </div>\n        ");
        html += '</div>';
        return html;
    };
    VectorComponent.prototype._getKeyId = function (axis) {
        return this._getId() + '-k' + axis;
    };
    VectorComponent.prototype._getValueId = function (axis) {
        return this._getId() + '-v' + axis;
    };
    VectorComponent.prototype._registerAxis = function (axis) {
        var _this = this;
        var elementValue = ui_util_1.UIUtil.getElementById(this._getValueId(axis));
        elementValue.onmouseenter = function () {
            var _a;
            _this._mouseover = axis;
            _this._updateStyles();
            (_a = _this._onMouseEnterExit) === null || _a === void 0 ? void 0 : _a.call(_this, 'enter', axis);
        };
        elementValue.onmouseleave = function () {
            var _a;
            _this._mouseover = null;
            _this._updateStyles();
            (_a = _this._onMouseEnterExit) === null || _a === void 0 ? void 0 : _a.call(_this, 'exit', axis);
        };
    };
    VectorComponent.prototype.registerEvents = function () {
        var _this = this;
        this._registerAxis('x');
        if (this._showY) {
            this._registerAxis('y');
        }
        this._registerAxis('z');
        var elementX = ui_util_1.UIUtil.getElementById(this._getValueId('x'));
        var elementY = ui_util_1.UIUtil.getElementById(this._getValueId('y'));
        var elementZ = ui_util_1.UIUtil.getElementById(this._getValueId('z'));
        elementX.addEventListener('change', function () {
            _this.getValue().x = parseInt(elementX.value);
        });
        elementY.addEventListener('change', function () {
            _this.getValue().y = parseInt(elementY.value);
        });
        elementZ.addEventListener('change', function () {
            _this.getValue().z = parseInt(elementZ.value);
        });
    };
    VectorComponent.prototype.setOnMouseEnterExit = function (delegate) {
        this._onMouseEnterExit = delegate;
        return this;
    };
    VectorComponent.prototype._updateValue = function (e) {
        /*
        ASSERT(this.enabled, 'Not enabled');
        ASSERT(this._dragging !== null, 'Dragging nothing');

        const deltaX = e.clientX - this._lastClientX;
        this._lastClientX = e.clientX;

        const current = this.getValue().copy();

        switch (this._dragging) {
            case 'x':
                current.x = (current.x + deltaX) % this._wrap;
                break;
            case 'y':
                current.y = (current.y + deltaX) % this._wrap;
                break;
            case 'z':
                current.z = (current.z + deltaX) % this._wrap;
                break;
        }
        this._setValue(current);
        */
    };
    VectorComponent.prototype._updateStyles = function () {
        // Update keys
        {
            var elementXK = ui_util_1.UIUtil.getElementById(this._getKeyId('x'));
            elementXK.classList.remove('text-standard');
            elementXK.classList.add(this.enabled ? 'text-standard' : 'text-dark');
            var elementYK = ui_util_1.UIUtil.getElementById(this._getKeyId('y'));
            elementYK.classList.remove('text-standard');
            elementYK.classList.add(this.enabled ? 'text-standard' : 'text-dark');
            var elementZK = ui_util_1.UIUtil.getElementById(this._getKeyId('z'));
            elementZK.classList.remove('text-standard');
            elementZK.classList.add(this.enabled ? 'text-standard' : 'text-dark');
        }
        var elementXV = ui_util_1.UIUtil.getElementById(this._getValueId('x'));
        var elementYV = ui_util_1.UIUtil.getElementById(this._getValueId('y'));
        var elementZV = ui_util_1.UIUtil.getElementById(this._getValueId('z'));
        // Update styles
        {
            ui_util_1.UIUtil.updateStyles(elementXV, {
                isActive: false,
                isEnabled: this.enabled,
                isHovered: this._mouseover === 'x',
            });
            ui_util_1.UIUtil.updateStyles(elementYV, {
                isActive: false,
                isEnabled: this.enabled,
                isHovered: this._mouseover === 'y',
            });
            ui_util_1.UIUtil.updateStyles(elementZV, {
                isActive: false,
                isEnabled: this.enabled,
                isHovered: this._mouseover === 'z',
            });
        }
    };
    VectorComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        this._updateStyles();
    };
    VectorComponent.prototype._onValueChanged = function () {
        this._updateStyles();
    };
    return VectorComponent;
}(config_1.ConfigComponent));
exports.VectorComponent = VectorComponent;
//# sourceMappingURL=vector.js.map