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
exports.TexturedMaterialComponent = void 0;
var texture_1 = require("../../texture");
var error_util_1 = require("../../util/error_util");
var misc_1 = require("../misc");
var combobox_1 = require("./combobox");
var config_1 = require("./config");
var image_1 = require("./image");
var material_type_1 = require("./material_type");
var slider_1 = require("./slider");
var TexturedMaterialComponent = /** @class */ (function (_super) {
    __extends(TexturedMaterialComponent, _super);
    function TexturedMaterialComponent(materialName, material) {
        var _this = _super.call(this, material) || this;
        _this._typeElement = new material_type_1.MaterialTypeComponent(material)
            .setLabel('materials.components.material_type');
        _this._filteringElement = new combobox_1.ComboboxComponent()
            .setLabel('materials.components.texture_filtering')
            .addItem({ payload: 'linear', displayLocKey: 'materials.components.linear' })
            .addItem({ payload: 'nearest', displayLocKey: 'materials.components.nearest' })
            .setDefaultValue(material.interpolation);
        _this._wrapElement = new combobox_1.ComboboxComponent()
            .setLabel('materials.components.texture_wrap')
            .addItem({ payload: 'clamp', displayLocKey: 'materials.components.clamp' })
            .addItem({ payload: 'repeat', displayLocKey: 'materials.components.repeat' })
            .setDefaultValue(material.extension);
        _this._transparencyElement = new combobox_1.ComboboxComponent()
            .setLabel('materials.components.transparency')
            .addItem({ payload: 'None', displayLocKey: 'materials.components.none' })
            .addItem({ payload: 'UseAlphaMap', displayLocKey: 'materials.components.alpha_map' })
            .addItem({ payload: 'UseAlphaValue', displayLocKey: 'materials.components.alpha_constant' })
            .addItem({ payload: 'UseDiffuseMapAlphaChannel', displayLocKey: 'materials.components.diffuse_map_alpha_channel' })
            .setDefaultValue(material.transparency.type);
        _this._ImageComponent = new image_1.ImageComponent(material.diffuse)
            .setLabel('materials.components.diffuse_map');
        switch (material.transparency.type) {
            case 'UseAlphaValue':
                _this._alphaValueElement = new slider_1.SliderComponent()
                    .setLabel('materials.components.alpha')
                    .setMin(0.0)
                    .setMax(1.0)
                    .setDefaultValue(material.transparency.alpha)
                    .setDecimals(2)
                    .setStep(0.01);
                break;
            case 'UseAlphaMap':
                _this._alphaMapElement = new image_1.ImageComponent(material.transparency.alpha)
                    .setLabel('materials.components.alpha_map');
                _this._alphaChannelElement = new combobox_1.ComboboxComponent()
                    .setLabel('materials.components.alpha_channel')
                    .addItem({ payload: texture_1.EImageChannel.R, displayLocKey: 'misc.red' })
                    .addItem({ payload: texture_1.EImageChannel.G, displayLocKey: 'misc.green' })
                    .addItem({ payload: texture_1.EImageChannel.B, displayLocKey: 'misc.blue' })
                    .addItem({ payload: texture_1.EImageChannel.A, displayLocKey: 'misc.alpha' })
                    .setDefaultValue(material.transparency.channel);
                break;
        }
        _this.setCanMinimise();
        return _this;
    }
    TexturedMaterialComponent.prototype.refresh = function () {
        var _a, _b, _c;
        _super.prototype.refresh.call(this);
        this._ImageComponent.refresh();
        this._typeElement.refresh();
        this._filteringElement.refresh();
        this._wrapElement.refresh();
        this._transparencyElement.refresh();
        (_a = this._alphaValueElement) === null || _a === void 0 ? void 0 : _a.refresh();
        (_b = this._alphaMapElement) === null || _b === void 0 ? void 0 : _b.refresh();
        (_c = this._alphaChannelElement) === null || _c === void 0 ? void 0 : _c.refresh();
    };
    TexturedMaterialComponent.prototype.registerEvents = function () {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this._ImageComponent.registerEvents();
        this._typeElement.registerEvents();
        this._filteringElement.registerEvents();
        this._wrapElement.registerEvents();
        this._transparencyElement.registerEvents();
        (_a = this._alphaValueElement) === null || _a === void 0 ? void 0 : _a.registerEvents();
        (_b = this._alphaMapElement) === null || _b === void 0 ? void 0 : _b.registerEvents();
        (_c = this._alphaChannelElement) === null || _c === void 0 ? void 0 : _c.registerEvents();
        this._ImageComponent.addValueChangedListener(function (newPath) {
            var material = _this.getValue();
            // TODO Unimplemented, promise should be resolved where it is used
            newPath.then(function (res) {
                material.diffuse = {
                    filetype: res.filetype,
                    raw: res.raw,
                };
            });
        });
        this._filteringElement.addValueChangedListener(function (newFiltering) {
            var material = _this.getValue();
            material.interpolation = newFiltering;
        });
        this._wrapElement.addValueChangedListener(function (newWrap) {
            var material = _this.getValue();
            material.extension = newWrap;
        });
        this._typeElement.onClickChangeTypeDelegate(function () {
            var _a;
            (_a = _this._onChangeTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(_this);
        });
        (_d = this._alphaValueElement) === null || _d === void 0 ? void 0 : _d.addValueChangedListener(function (newAlpha) {
            var material = _this.getValue();
            (0, error_util_1.ASSERT)(material.transparency.type === 'UseAlphaValue');
            material.transparency.alpha = newAlpha;
        });
        (_e = this._alphaMapElement) === null || _e === void 0 ? void 0 : _e.addValueChangedListener(function (newPath) {
            var material = _this.getValue();
            // TODO Unimplemented, promise should be resolved where it is used
            newPath.then(function (res) {
                (0, error_util_1.ASSERT)(material.transparency.type === 'UseAlphaMap');
                material.transparency.alpha = {
                    filetype: res.filetype,
                    raw: res.raw,
                };
            });
        });
        (_f = this._alphaChannelElement) === null || _f === void 0 ? void 0 : _f.addValueChangedListener(function (newChannel) {
            var material = _this.getValue();
            (0, error_util_1.ASSERT)(material.transparency.type === 'UseAlphaMap');
            material.transparency.channel = newChannel;
        });
        this._transparencyElement.addValueChangedListener(function (newTransparency) {
            var _a;
            (_a = _this._onChangeTransparencyTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(_this, newTransparency);
        });
    };
    TexturedMaterialComponent.prototype._generateInnerHTML = function () {
        var builder = new misc_1.HTMLBuilder();
        builder.add('<div class="component-group">');
        {
            builder.add(this._typeElement.generateHTML());
            builder.add(this._ImageComponent.generateHTML());
            builder.add(this._filteringElement.generateHTML());
            builder.add(this._wrapElement.generateHTML());
            builder.add(this._transparencyElement.generateHTML());
            if (this._alphaMapElement !== undefined) {
                (0, error_util_1.ASSERT)(this._alphaChannelElement !== undefined);
                builder.add(this._alphaMapElement.generateHTML());
                builder.add(this._alphaChannelElement.generateHTML());
            }
            if (this._alphaValueElement !== undefined) {
                builder.add(this._alphaValueElement.generateHTML());
            }
        }
        builder.add('</div>');
        return builder.toString();
    };
    TexturedMaterialComponent.prototype._onValueChanged = function () {
    };
    TexturedMaterialComponent.prototype._onEnabledChanged = function () {
        var _a, _b, _c;
        _super.prototype._onEnabledChanged.call(this);
        this._ImageComponent.setEnabled(this.enabled);
        this._typeElement.setEnabled(this.enabled);
        this._filteringElement.setEnabled(this.enabled);
        this._wrapElement.setEnabled(this.enabled);
        this._transparencyElement.setEnabled(this.enabled);
        (_a = this._alphaValueElement) === null || _a === void 0 ? void 0 : _a.setEnabled(this.enabled);
        (_b = this._alphaMapElement) === null || _b === void 0 ? void 0 : _b.setEnabled(this.enabled);
        (_c = this._alphaChannelElement) === null || _c === void 0 ? void 0 : _c.setEnabled(this.enabled);
    };
    TexturedMaterialComponent.prototype.finalise = function () {
        var _a, _b, _c;
        _super.prototype.finalise.call(this);
        this._ImageComponent.finalise();
        this._typeElement.finalise();
        this._filteringElement.finalise();
        this._wrapElement.finalise();
        this._transparencyElement.finalise();
        (_a = this._alphaValueElement) === null || _a === void 0 ? void 0 : _a.finalise();
        (_b = this._alphaMapElement) === null || _b === void 0 ? void 0 : _b.finalise();
        (_c = this._alphaChannelElement) === null || _c === void 0 ? void 0 : _c.finalise();
    };
    TexturedMaterialComponent.prototype.onChangeTypeDelegate = function (delegate) {
        this._onChangeTypeDelegate = delegate;
        return this;
    };
    TexturedMaterialComponent.prototype.onChangeTransparencyTypeDelegate = function (delegate) {
        this._onChangeTransparencyTypeDelegate = delegate;
        return this;
    };
    return TexturedMaterialComponent;
}(config_1.ConfigComponent));
exports.TexturedMaterialComponent = TexturedMaterialComponent;
//# sourceMappingURL=textured_material.js.map