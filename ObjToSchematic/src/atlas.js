"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Atlas = void 0;
var path_1 = __importDefault(require("path"));
var vanilla_atlas_1 = __importDefault(require("../res/atlases/vanilla.atlas"));
var util_1 = require("./util");
var error_util_1 = require("./util/error_util");
var path_util_1 = require("./util/path_util");
/**
 * Atlases, unlike palettes, are not currently designed to be user-facing or
 * programmatically created. This class simply facilitates loading .atlas
 * files.
 */
var Atlas = /** @class */ (function () {
    function Atlas(atlasName) {
        this._blocks = new Map();
        this._atlasSize = 0;
        this._atlasName = atlasName;
    }
    Atlas.prototype.getBlocks = function () {
        return this._blocks;
    };
    Atlas.load = function (atlasName) {
        (0, error_util_1.ASSERT)(atlasName === 'vanilla');
        var atlas = new Atlas(atlasName);
        var atlasJSON = JSON.parse(vanilla_atlas_1.default);
        (0, error_util_1.ASSERT)(atlasJSON.formatVersion === 3, "The '".concat(atlasName, "' texture atlas uses an outdated format and needs to be recreated"));
        var atlasData = atlasJSON;
        atlas._atlasSize = atlasData.atlasSize;
        var getTextureUV = function (name) {
            var tex = atlasData.textures[name];
            return new util_1.UV((3 * tex.atlasColumn + 1) / (atlas._atlasSize * 3), (3 * tex.atlasRow + 1) / (atlas._atlasSize * 3));
        };
        for (var _i = 0, _a = atlasData.blocks; _i < _a.length; _i++) {
            var block = _a[_i];
            (0, error_util_1.ASSERT)(util_1.AppUtil.Text.isNamespacedBlock(block.name), 'Atlas block not namespaced');
            var atlasBlock = {
                name: block.name,
                colour: block.colour,
                faces: {
                    up: {
                        name: block.faces.up,
                        texcoord: getTextureUV(block.faces.up),
                        std: atlasData.textures[block.faces.up].std,
                        colour: atlasData.textures[block.faces.up].colour,
                    },
                    down: {
                        name: block.faces.down,
                        texcoord: getTextureUV(block.faces.down),
                        std: atlasData.textures[block.faces.down].std,
                        colour: atlasData.textures[block.faces.down].colour,
                    },
                    north: {
                        name: block.faces.north,
                        texcoord: getTextureUV(block.faces.north),
                        std: atlasData.textures[block.faces.north].std,
                        colour: atlasData.textures[block.faces.north].colour,
                    },
                    east: {
                        name: block.faces.east,
                        texcoord: getTextureUV(block.faces.east),
                        std: atlasData.textures[block.faces.east].std,
                        colour: atlasData.textures[block.faces.east].colour,
                    },
                    south: {
                        name: block.faces.south,
                        texcoord: getTextureUV(block.faces.south),
                        std: atlasData.textures[block.faces.south].std,
                        colour: atlasData.textures[block.faces.south].colour,
                    },
                    west: {
                        name: block.faces.west,
                        texcoord: getTextureUV(block.faces.west),
                        std: atlasData.textures[block.faces.west].std,
                        colour: atlasData.textures[block.faces.west].colour,
                    },
                },
            };
            atlas._blocks.set(block.name, atlasBlock);
        }
        return atlas;
    };
    Atlas.prototype.getAtlasSize = function () {
        return this._atlasSize;
    };
    Atlas.prototype.getAtlasTexturePath = function () {
        return path_1.default.join(path_util_1.AppPaths.Get.atlases, "./".concat(this._atlasName, ".png"));
    };
    /*
    public getBlocks(): TAtlasBlock[] {
        return Array.from(this._blocks.values());
    }
    */
    Atlas.prototype.hasBlock = function (blockName) {
        return this._blocks.has(blockName);
    };
    Atlas.getVanillaAtlas = function () {
        return Atlas.load('vanilla');
    };
    Atlas._isValidAtlasName = function (atlasName) {
        return atlasName.length > 0 && Atlas.ATLAS_NAME_REGEX.test(atlasName);
    };
    Atlas._getAtlasPath = function (atlasName) {
        return path_1.default.join(path_util_1.AppPaths.Get.atlases, "./".concat(atlasName, ".atlas"));
    };
    Atlas.ATLAS_NAME_REGEX = /^[a-zA-Z\-]+$/;
    return Atlas;
}());
exports.Atlas = Atlas;
//# sourceMappingURL=atlas.js.map