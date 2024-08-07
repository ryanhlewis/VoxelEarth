"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TexturedMaterialComponent = void 0;
const texture_1 = require("../../texture");
const error_util_1 = require("../../util/error_util");
const misc_1 = require("../misc");
const combobox_1 = require("./combobox");
const config_1 = require("./config");
const image_1 = require("./image");
const material_type_1 = require("./material_type");
const slider_1 = require("./slider");
class TexturedMaterialComponent extends config_1.ConfigComponent {
    constructor(materialName, material) {
        super(material);
        this._typeElement = new material_type_1.MaterialTypeComponent(material)
            .setLabel('materials.components.material_type');
        this._filteringElement = new combobox_1.ComboboxComponent()
            .setLabel('materials.components.texture_filtering')
            .addItem({ payload: 'linear', displayLocKey: 'materials.components.linear' })
            .addItem({ payload: 'nearest', displayLocKey: 'materials.components.nearest' })
            .setDefaultValue(material.interpolation);
        this._wrapElement = new combobox_1.ComboboxComponent()
            .setLabel('materials.components.texture_wrap')
            .addItem({ payload: 'clamp', displayLocKey: 'materials.components.clamp' })
            .addItem({ payload: 'repeat', displayLocKey: 'materials.components.repeat' })
            .setDefaultValue(material.extension);
        this._transparencyElement = new combobox_1.ComboboxComponent()
            .setLabel('materials.components.transparency')
            .addItem({ payload: 'None', displayLocKey: 'materials.components.none' })
            .addItem({ payload: 'UseAlphaMap', displayLocKey: 'materials.components.alpha_map' })
            .addItem({ payload: 'UseAlphaValue', displayLocKey: 'materials.components.alpha_constant' })
            .addItem({ payload: 'UseDiffuseMapAlphaChannel', displayLocKey: 'materials.components.diffuse_map_alpha_channel' })
            .setDefaultValue(material.transparency.type);
        this._ImageComponent = new image_1.ImageComponent(material.diffuse)
            .setLabel('materials.components.diffuse_map');
        switch (material.transparency.type) {
            case 'UseAlphaValue':
                this._alphaValueElement = new slider_1.SliderComponent()
                    .setLabel('materials.components.alpha')
                    .setMin(0.0)
                    .setMax(1.0)
                    .setDefaultValue(material.transparency.alpha)
                    .setDecimals(2)
                    .setStep(0.01);
                break;
            case 'UseAlphaMap':
                this._alphaMapElement = new image_1.ImageComponent(material.transparency.alpha)
                    .setLabel('materials.components.alpha_map');
                this._alphaChannelElement = new combobox_1.ComboboxComponent()
                    .setLabel('materials.components.alpha_channel')
                    .addItem({ payload: texture_1.EImageChannel.R, displayLocKey: 'misc.red' })
                    .addItem({ payload: texture_1.EImageChannel.G, displayLocKey: 'misc.green' })
                    .addItem({ payload: texture_1.EImageChannel.B, displayLocKey: 'misc.blue' })
                    .addItem({ payload: texture_1.EImageChannel.A, displayLocKey: 'misc.alpha' })
                    .setDefaultValue(material.transparency.channel);
                break;
        }
        this.setCanMinimise();
    }
    refresh() {
        var _a, _b, _c;
        super.refresh();
        this._ImageComponent.refresh();
        this._typeElement.refresh();
        this._filteringElement.refresh();
        this._wrapElement.refresh();
        this._transparencyElement.refresh();
        (_a = this._alphaValueElement) === null || _a === void 0 ? void 0 : _a.refresh();
        (_b = this._alphaMapElement) === null || _b === void 0 ? void 0 : _b.refresh();
        (_c = this._alphaChannelElement) === null || _c === void 0 ? void 0 : _c.refresh();
    }
    registerEvents() {
        var _a, _b, _c, _d, _e, _f;
        this._ImageComponent.registerEvents();
        this._typeElement.registerEvents();
        this._filteringElement.registerEvents();
        this._wrapElement.registerEvents();
        this._transparencyElement.registerEvents();
        (_a = this._alphaValueElement) === null || _a === void 0 ? void 0 : _a.registerEvents();
        (_b = this._alphaMapElement) === null || _b === void 0 ? void 0 : _b.registerEvents();
        (_c = this._alphaChannelElement) === null || _c === void 0 ? void 0 : _c.registerEvents();
        this._ImageComponent.addValueChangedListener((newPath) => {
            const material = this.getValue();
            // TODO Unimplemented, promise should be resolved where it is used
            newPath.then((res) => {
                material.diffuse = {
                    filetype: res.filetype,
                    raw: res.raw,
                };
            });
        });
        this._filteringElement.addValueChangedListener((newFiltering) => {
            const material = this.getValue();
            material.interpolation = newFiltering;
        });
        this._wrapElement.addValueChangedListener((newWrap) => {
            const material = this.getValue();
            material.extension = newWrap;
        });
        this._typeElement.onClickChangeTypeDelegate(() => {
            var _a;
            (_a = this._onChangeTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(this);
        });
        (_d = this._alphaValueElement) === null || _d === void 0 ? void 0 : _d.addValueChangedListener((newAlpha) => {
            const material = this.getValue();
            (0, error_util_1.ASSERT)(material.transparency.type === 'UseAlphaValue');
            material.transparency.alpha = newAlpha;
        });
        (_e = this._alphaMapElement) === null || _e === void 0 ? void 0 : _e.addValueChangedListener((newPath) => {
            const material = this.getValue();
            // TODO Unimplemented, promise should be resolved where it is used
            newPath.then((res) => {
                (0, error_util_1.ASSERT)(material.transparency.type === 'UseAlphaMap');
                material.transparency.alpha = {
                    filetype: res.filetype,
                    raw: res.raw,
                };
            });
        });
        (_f = this._alphaChannelElement) === null || _f === void 0 ? void 0 : _f.addValueChangedListener((newChannel) => {
            const material = this.getValue();
            (0, error_util_1.ASSERT)(material.transparency.type === 'UseAlphaMap');
            material.transparency.channel = newChannel;
        });
        this._transparencyElement.addValueChangedListener((newTransparency) => {
            var _a;
            (_a = this._onChangeTransparencyTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(this, newTransparency);
        });
    }
    _generateInnerHTML() {
        const builder = new misc_1.HTMLBuilder();
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
    }
    _onValueChanged() {
    }
    _onEnabledChanged() {
        var _a, _b, _c;
        super._onEnabledChanged();
        this._ImageComponent.setEnabled(this.enabled);
        this._typeElement.setEnabled(this.enabled);
        this._filteringElement.setEnabled(this.enabled);
        this._wrapElement.setEnabled(this.enabled);
        this._transparencyElement.setEnabled(this.enabled);
        (_a = this._alphaValueElement) === null || _a === void 0 ? void 0 : _a.setEnabled(this.enabled);
        (_b = this._alphaMapElement) === null || _b === void 0 ? void 0 : _b.setEnabled(this.enabled);
        (_c = this._alphaChannelElement) === null || _c === void 0 ? void 0 : _c.setEnabled(this.enabled);
    }
    finalise() {
        var _a, _b, _c;
        super.finalise();
        this._ImageComponent.finalise();
        this._typeElement.finalise();
        this._filteringElement.finalise();
        this._wrapElement.finalise();
        this._transparencyElement.finalise();
        (_a = this._alphaValueElement) === null || _a === void 0 ? void 0 : _a.finalise();
        (_b = this._alphaMapElement) === null || _b === void 0 ? void 0 : _b.finalise();
        (_c = this._alphaChannelElement) === null || _c === void 0 ? void 0 : _c.finalise();
    }
    onChangeTypeDelegate(delegate) {
        this._onChangeTypeDelegate = delegate;
        return this;
    }
    onChangeTransparencyTypeDelegate(delegate) {
        this._onChangeTransparencyTypeDelegate = delegate;
        return this;
    }
}
exports.TexturedMaterialComponent = TexturedMaterialComponent;
