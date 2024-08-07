"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialMapManager = void 0;
const colour_1 = require("./colour");
const mesh_1 = require("./mesh");
const texture_1 = require("./texture");
const error_util_1 = require("./util/error_util");
class MaterialMapManager {
    constructor(materials) {
        this.materials = materials;
    }
    changeTransparencyType(materialName, newTransparencyType) {
        const currentMaterial = this.materials.get(materialName);
        (0, error_util_1.ASSERT)(currentMaterial !== undefined, 'Cannot change transparency type of non-existent material');
        (0, error_util_1.ASSERT)(currentMaterial.type === mesh_1.MaterialType.textured);
        switch (newTransparencyType) {
            case 'None':
                currentMaterial.transparency = { type: 'None' };
                break;
            case 'UseAlphaMap':
                currentMaterial.transparency = {
                    type: 'UseAlphaMap',
                    alpha: undefined,
                    channel: texture_1.EImageChannel.R,
                };
                break;
            case 'UseAlphaValue':
                currentMaterial.transparency = {
                    type: 'UseAlphaValue',
                    alpha: 1.0,
                };
                break;
            case 'UseDiffuseMapAlphaChannel':
                currentMaterial.transparency = {
                    type: 'UseDiffuseMapAlphaChannel',
                };
                break;
        }
        this.materials.set(materialName, currentMaterial);
    }
    /**
     * Convert a material to a new type, i.e. textured to solid.
     * Will return if the material is already the given type.
     */
    changeMaterialType(materialName, newMaterialType) {
        const currentMaterial = this.materials.get(materialName);
        (0, error_util_1.ASSERT)(currentMaterial !== undefined, 'Cannot change material type of non-existent material');
        if (currentMaterial.type === newMaterialType) {
            return;
        }
        switch (newMaterialType) {
            case mesh_1.MaterialType.solid:
                (0, error_util_1.ASSERT)(currentMaterial.type === mesh_1.MaterialType.textured, 'Old material expect to be texture');
                this.materials.set(materialName, {
                    type: mesh_1.MaterialType.solid,
                    colour: colour_1.RGBAUtil.randomPretty(),
                    canBeTextured: true,
                    needsAttention: true,
                });
                break;
            case mesh_1.MaterialType.textured:
                (0, error_util_1.ASSERT)(currentMaterial.type === mesh_1.MaterialType.solid, 'Old material expect to be solid');
                this.materials.set(materialName, {
                    type: mesh_1.MaterialType.textured,
                    transparency: {
                        type: 'None',
                    },
                    extension: 'repeat',
                    interpolation: 'linear',
                    needsAttention: true,
                    diffuse: undefined,
                });
                break;
        }
    }
}
exports.MaterialMapManager = MaterialMapManager;
