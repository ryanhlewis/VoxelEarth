"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialMapManager = void 0;
var colour_1 = require("./colour");
var mesh_1 = require("./mesh");
var texture_1 = require("./texture");
var error_util_1 = require("./util/error_util");
var MaterialMapManager = /** @class */ (function () {
    function MaterialMapManager(materials) {
        this.materials = materials;
    }
    MaterialMapManager.prototype.changeTransparencyType = function (materialName, newTransparencyType) {
        var currentMaterial = this.materials.get(materialName);
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
    };
    /**
     * Convert a material to a new type, i.e. textured to solid.
     * Will return if the material is already the given type.
     */
    MaterialMapManager.prototype.changeMaterialType = function (materialName, newMaterialType) {
        var currentMaterial = this.materials.get(materialName);
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
    };
    return MaterialMapManager;
}());
exports.MaterialMapManager = MaterialMapManager;
//# sourceMappingURL=material-map.js.map