"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRuntimeConstants = exports.AppConstants = void 0;
var AppConstants;
(function (AppConstants) {
    AppConstants.FACES_PER_VOXEL = 6;
    AppConstants.VERTICES_PER_FACE = 4;
    AppConstants.INDICES_PER_VOXEL = 24;
    AppConstants.COMPONENT_PER_SIZE_OFFSET = AppConstants.FACES_PER_VOXEL * AppConstants.VERTICES_PER_FACE;
    var ComponentSize;
    (function (ComponentSize) {
        ComponentSize.LIGHTING = 1;
        ComponentSize.TEXCOORD = 2;
        ComponentSize.POSITION = 3;
        ComponentSize.COLOUR = 4;
        ComponentSize.NORMAL = 3;
        ComponentSize.INDICES = 3;
        ComponentSize.OCCLUSION = 4;
    })(ComponentSize = AppConstants.ComponentSize || (AppConstants.ComponentSize = {}));
    var VoxelMeshBufferComponentOffsets;
    (function (VoxelMeshBufferComponentOffsets) {
        VoxelMeshBufferComponentOffsets.LIGHTING = ComponentSize.LIGHTING * AppConstants.COMPONENT_PER_SIZE_OFFSET;
        VoxelMeshBufferComponentOffsets.TEXCOORD = ComponentSize.TEXCOORD * AppConstants.COMPONENT_PER_SIZE_OFFSET;
        VoxelMeshBufferComponentOffsets.POSITION = ComponentSize.POSITION * AppConstants.COMPONENT_PER_SIZE_OFFSET;
        VoxelMeshBufferComponentOffsets.COLOUR = ComponentSize.COLOUR * AppConstants.COMPONENT_PER_SIZE_OFFSET;
        VoxelMeshBufferComponentOffsets.NORMAL = ComponentSize.NORMAL * AppConstants.COMPONENT_PER_SIZE_OFFSET;
        VoxelMeshBufferComponentOffsets.INDICES = 36;
        VoxelMeshBufferComponentOffsets.OCCLUSION = ComponentSize.OCCLUSION * AppConstants.COMPONENT_PER_SIZE_OFFSET;
    })(VoxelMeshBufferComponentOffsets = AppConstants.VoxelMeshBufferComponentOffsets || (AppConstants.VoxelMeshBufferComponentOffsets = {}));
    AppConstants.DATA_VERSION = 3105; // 1.19
})(AppConstants || (exports.AppConstants = AppConstants = {}));
var AppRuntimeConstants = /** @class */ (function () {
    function AppRuntimeConstants() {
        this.FALLABLE_BLOCKS = new Set([
            'minecraft:anvil',
            'minecraft:lime_concrete_powder',
            'minecraft:orange_concrete_powder',
            'minecraft:black_concrete_powder',
            'minecraft:brown_concrete_powder',
            'minecraft:cyan_concrete_powder',
            'minecraft:light_gray_concrete_powder',
            'minecraft:purple_concrete_powder',
            'minecraft:magenta_concrete_powder',
            'minecraft:light_blue_concrete_powder',
            'minecraft:yellow_concrete_powder',
            'minecraft:white_concrete_powder',
            'minecraft:blue_concrete_powder',
            'minecraft:red_concrete_powder',
            'minecraft:gray_concrete_powder',
            'minecraft:pink_concrete_powder',
            'minecraft:green_concrete_powder',
            'minecraft:dragon_egg',
            'minecraft:gravel',
            'minecraft:pointed_dripstone',
            'minecraft:red_sand',
            'minecraft:sand',
            'minecraft:scaffolding',
        ]);
        this.TRANSPARENT_BLOCKS = new Set([
            'minecraft:frosted_ice',
            'minecraft:glass',
            'minecraft:white_stained_glass',
            'minecraft:orange_stained_glass',
            'minecraft:magenta_stained_glass',
            'minecraft:light_blue_stained_glass',
            'minecraft:yellow_stained_glass',
            'minecraft:lime_stained_glass',
            'minecraft:pink_stained_glass',
            'minecraft:gray_stained_glass',
            'minecraft:light_gray_stained_glass',
            'minecraft:cyan_stained_glass',
            'minecraft:purple_stained_glass',
            'minecraft:blue_stained_glass',
            'minecraft:brown_stained_glass',
            'minecraft:green_stained_glass',
            'minecraft:red_stained_glass',
            'minecraft:black_stained_glass',
            'minecraft:ice',
            'minecraft:oak_leaves',
            'minecraft:spruce_leaves',
            'minecraft:birch_leaves',
            'minecraft:jungle_leaves',
            'minecraft:acacia_leaves',
            'minecraft:dark_oak_leaves',
            'minecraft:mangrove_leaves',
            'minecraft:azalea_leaves',
            'minecraft:flowering_azalea_leaves',
            'minecraft:slime_block',
            'minecraft:honey_block',
        ]);
        this.GRASS_LIKE_BLOCKS = new Set([
            'minecraft:grass_block',
            'minecraft:grass_path',
            'minecraft:podzol',
            'minecraft:crimson_nylium',
            'minecraft:warped_nylium',
            'minecraft:mycelium',
            'minecraft:farmland',
        ]);
        this.EMISSIVE_BLOCKS = new Set([
            'minecraft:respawn_anchor',
            'minecraft:magma_block',
            'minecraft:sculk_catalyst',
            'minecraft:crying_obsidian',
            'minecraft:shroomlight',
            'minecraft:sea_lantern',
            'minecraft:jack_o_lantern',
            'minecraft:glowstone',
            'minecraft:pearlescent_froglight',
            'minecraft:verdant_froglight',
            'minecraft:ochre_froglight',
        ]);
    }
    Object.defineProperty(AppRuntimeConstants, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    return AppRuntimeConstants;
}());
exports.AppRuntimeConstants = AppRuntimeConstants;
