"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialTypeComponent = void 0;
const localiser_1 = require("../../localiser");
const mesh_1 = require("../../mesh");
const icons_1 = require("../icons");
const config_1 = require("./config");
const toolbar_item_1 = require("./toolbar_item");
class MaterialTypeComponent extends config_1.ConfigComponent {
    constructor(material) {
        super(material.type);
        this._material = material;
        this._solidButton = new toolbar_item_1.ToolbarItemComponent({ id: 'sw1', iconSVG: icons_1.AppIcons.COLOUR_SWATCH })
            .setLabel((0, localiser_1.LOC)('materials.components.solid'))
            .setGrow()
            .onClick(() => {
            var _a;
            if (this._material.type === mesh_1.MaterialType.textured) {
                (_a = this._onClickChangeTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(this);
            }
        });
        this._texturedButton = new toolbar_item_1.ToolbarItemComponent({ id: 'sw2', iconSVG: icons_1.AppIcons.IMAGE })
            .setLabel((0, localiser_1.LOC)('materials.components.textured'))
            .setGrow()
            .onClick(() => {
            var _a;
            if (this._material.type === mesh_1.MaterialType.solid) {
                (_a = this._onClickChangeTypeDelegate) === null || _a === void 0 ? void 0 : _a.call(this);
            }
        });
    }
    _generateInnerHTML() {
        return `
            <div class="toolbar-group" style="width: 100%;">
                ${this._solidButton.generateHTML()}
                ${this._texturedButton.generateHTML()}
            </div>
        `;
    }
    finalise() {
        this._solidButton.finalise();
        this._texturedButton.finalise();
        this._solidButton.setActive(this._material.type === mesh_1.MaterialType.solid);
        this._texturedButton.setActive(this._material.type === mesh_1.MaterialType.textured);
    }
    registerEvents() {
        this._solidButton.registerEvents();
        this._texturedButton.registerEvents();
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        this._solidButton.setEnabled(this.enabled);
        this._texturedButton.setEnabled(this.enabled && (this._material.type === mesh_1.MaterialType.textured || this._material.canBeTextured));
    }
    _onValueChanged() {
    }
    onClickChangeTypeDelegate(delegate) {
        this._onClickChangeTypeDelegate = delegate;
        return this;
    }
}
exports.MaterialTypeComponent = MaterialTypeComponent;
