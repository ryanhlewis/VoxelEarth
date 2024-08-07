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
exports.MaterialTypeComponent = void 0;
var localiser_1 = require("../../localiser");
var mesh_1 = require("../../mesh");
var icons_1 = require("../icons");
var config_1 = require("./config");
var toolbar_item_1 = require("./toolbar_item");
var MaterialTypeComponent = /** @class */ (function (_super) {
    __extends(MaterialTypeComponent, _super);
    function MaterialTypeComponent(material) {
        var _this = _super.call(this, material.type) || this;
        _this._material = material;
        _this._solidButton = new toolbar_item_1.ToolbarItemComponent({ id: 'sw1', iconSVG: icons_1.AppIcons.COLOUR_SWATCH })
            .setLabel((0, localiser_1.LOC)('materials.components.solid'))
            .setGrow()
            .onClick(function () {
            var _a;
            if (_this._material.type === mesh_1.MaterialType.textured) {
                (_a = _this._onClickChangeTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(_this);
            }
        });
        _this._texturedButton = new toolbar_item_1.ToolbarItemComponent({ id: 'sw2', iconSVG: icons_1.AppIcons.IMAGE })
            .setLabel((0, localiser_1.LOC)('materials.components.textured'))
            .setGrow()
            .onClick(function () {
            var _a;
            if (_this._material.type === mesh_1.MaterialType.solid) {
                (_a = _this._onClickChangeTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(_this);
            }
        });
        return _this;
    }
    MaterialTypeComponent.prototype._generateInnerHTML = function () {
        return "\n            <div class=\"toolbar-group\" style=\"width: 100%;\">\n                ".concat(this._solidButton.generateHTML(), "\n                ").concat(this._texturedButton.generateHTML(), "\n            </div>\n        ");
    };
    MaterialTypeComponent.prototype.finalise = function () {
        this._solidButton.finalise();
        this._texturedButton.finalise();
        this._solidButton.setActive(this._material.type === mesh_1.MaterialType.solid);
        this._texturedButton.setActive(this._material.type === mesh_1.MaterialType.textured);
    };
    MaterialTypeComponent.prototype.registerEvents = function () {
        this._solidButton.registerEvents();
        this._texturedButton.registerEvents();
    };
    MaterialTypeComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        this._solidButton.setEnabled(this.enabled);
        this._texturedButton.setEnabled(this.enabled && (this._material.type === mesh_1.MaterialType.textured || this._material.canBeTextured));
    };
    MaterialTypeComponent.prototype._onValueChanged = function () {
    };
    MaterialTypeComponent.prototype.onClickChangeTypeDelegate = function (delegate) {
        this._onClickChangeTypeDelegate = delegate;
        return this;
    };
    return MaterialTypeComponent;
}(config_1.ConfigComponent));
exports.MaterialTypeComponent = MaterialTypeComponent;
//# sourceMappingURL=material_type.js.map