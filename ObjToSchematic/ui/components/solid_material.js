"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolidMaterialComponent = void 0;
const colour_1 = require("./colour");
const config_1 = require("./config");
const material_type_1 = require("./material_type");
const slider_1 = require("./slider");
class SolidMaterialComponent extends config_1.ConfigComponent {
    constructor(materialName, material) {
        super(material);
        this._typeElement = new material_type_1.MaterialTypeComponent(material)
            .setLabel('materials.components.material_type');
        this._ColourComponent = new colour_1.ColourComponent(material.colour)
            .setLabel('voxelise.components.colour');
        this._alphaElement = new slider_1.SliderComponent()
            .setLabel('materials.components.alpha')
            .setMin(0.0)
            .setMax(1.0)
            .setDefaultValue(material.colour.a)
            .setDecimals(2)
            .setStep(0.01);
        this.setCanMinimise();
    }
    refresh() {
        super.refresh();
        this._typeElement.refresh();
        this._ColourComponent.refresh();
        this._alphaElement.refresh();
    }
    registerEvents() {
        this._typeElement.registerEvents();
        this._ColourComponent.registerEvents();
        this._alphaElement.registerEvents();
        this._typeElement.onClickChangeTypeDelegate(() => {
            var _a;
            (_a = this._onChangeTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(this);
        });
        this._ColourComponent.addValueChangedListener((newColour) => {
            this.getValue().colour.r = newColour.r;
            this.getValue().colour.g = newColour.g;
            this.getValue().colour.b = newColour.b;
        });
        this._alphaElement.addValueChangedListener((newAlpha) => {
            this.getValue().colour.a = newAlpha;
        });
    }
    finalise() {
        super.finalise();
        this._typeElement.finalise();
        this._ColourComponent.finalise();
        this._alphaElement.finalise();
    }
    _generateInnerHTML() {
        return `
            <div class="component-group">
                ${this._typeElement.generateHTML()}
                ${this._ColourComponent.generateHTML()}
                ${this._alphaElement.generateHTML()}
            </div>
        `;
    }
    _onValueChanged() {
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        this._typeElement.setEnabled(this.enabled);
        this._ColourComponent.setEnabled(this.enabled);
        this._alphaElement.setEnabled(this.enabled);
    }
    onChangeTypeDelegate(delegate) {
        this._onChangeTypeDelegate = delegate;
        return this;
    }
}
exports.SolidMaterialComponent = SolidMaterialComponent;
