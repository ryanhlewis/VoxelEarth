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
exports.SolidMaterialComponent = void 0;
var colour_1 = require("./colour");
var config_1 = require("./config");
var material_type_1 = require("./material_type");
var slider_1 = require("./slider");
var SolidMaterialComponent = /** @class */ (function (_super) {
    __extends(SolidMaterialComponent, _super);
    function SolidMaterialComponent(materialName, material) {
        var _this = _super.call(this, material) || this;
        _this._typeElement = new material_type_1.MaterialTypeComponent(material)
            .setLabel('materials.components.material_type');
        _this._ColourComponent = new colour_1.ColourComponent(material.colour)
            .setLabel('voxelise.components.colour');
        _this._alphaElement = new slider_1.SliderComponent()
            .setLabel('materials.components.alpha')
            .setMin(0.0)
            .setMax(1.0)
            .setDefaultValue(material.colour.a)
            .setDecimals(2)
            .setStep(0.01);
        _this.setCanMinimise();
        return _this;
    }
    SolidMaterialComponent.prototype.refresh = function () {
        _super.prototype.refresh.call(this);
        this._typeElement.refresh();
        this._ColourComponent.refresh();
        this._alphaElement.refresh();
    };
    SolidMaterialComponent.prototype.registerEvents = function () {
        var _this = this;
        this._typeElement.registerEvents();
        this._ColourComponent.registerEvents();
        this._alphaElement.registerEvents();
        this._typeElement.onClickChangeTypeDelegate(function () {
            var _a;
            (_a = _this._onChangeTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(_this);
        });
        this._ColourComponent.addValueChangedListener(function (newColour) {
            _this.getValue().colour.r = newColour.r;
            _this.getValue().colour.g = newColour.g;
            _this.getValue().colour.b = newColour.b;
        });
        this._alphaElement.addValueChangedListener(function (newAlpha) {
            _this.getValue().colour.a = newAlpha;
        });
    };
    SolidMaterialComponent.prototype.finalise = function () {
        _super.prototype.finalise.call(this);
        this._typeElement.finalise();
        this._ColourComponent.finalise();
        this._alphaElement.finalise();
    };
    SolidMaterialComponent.prototype._generateInnerHTML = function () {
        return "\n            <div class=\"component-group\">\n                ".concat(this._typeElement.generateHTML(), "\n                ").concat(this._ColourComponent.generateHTML(), "\n                ").concat(this._alphaElement.generateHTML(), "\n            </div>\n        ");
    };
    SolidMaterialComponent.prototype._onValueChanged = function () {
    };
    SolidMaterialComponent.prototype._onEnabledChanged = function () {
        _super.prototype._onEnabledChanged.call(this);
        this._typeElement.setEnabled(this.enabled);
        this._ColourComponent.setEnabled(this.enabled);
        this._alphaElement.setEnabled(this.enabled);
    };
    SolidMaterialComponent.prototype.onChangeTypeDelegate = function (delegate) {
        this._onChangeTypeDelegate = delegate;
        return this;
    };
    return SolidMaterialComponent;
}(config_1.ConfigComponent));
exports.SolidMaterialComponent = SolidMaterialComponent;
//# sourceMappingURL=solid_material.js.map