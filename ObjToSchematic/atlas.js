"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Atlas = void 0;
const path_1 = require("path");
const vanilla_atlas_1 = require("../res/atlases/vanilla.atlas");
const util_1 = require("./util");
const error_util_1 = require("./util/error_util");
const path_util_1 = require("./util/path_util");
/**
 * Atlases, unlike palettes, are not currently designed to be user-facing or
 * programmatically created. This class simply facilitates loading .atlas
 * files.
 */
class Atlas {
    constructor(atlasName) {
        this._blocks = new Map();
        this._atlasSize = 0;
        this._atlasName = atlasName;
    }
    getBlocks() {
        return this._blocks;
    }
    static load(atlasName) {
        (0, error_util_1.ASSERT)(atlasName === 'vanilla');
        const atlas = new Atlas(atlasName);
        const atlasJSON = JSON.parse(vanilla_atlas_1.default);
        (0, error_util_1.ASSERT)(atlasJSON.formatVersion === 3, `The '${atlasName}' texture atlas uses an outdated format and needs to be recreated`);
        const atlasData = atlasJSON;
        atlas._atlasSize = atlasData.atlasSize;
        const getTextureUV = (name) => {
            const tex = atlasData.textures[name];
            return new util_1.UV((3 * tex.atlasColumn + 1) / (atlas._atlasSize * 3), (3 * tex.atlasRow + 1) / (atlas._atlasSize * 3));
        };
        for (const block of atlasData.blocks) {
            (0, error_util_1.ASSERT)(util_1.AppUtil.Text.isNamespacedBlock(block.name), 'Atlas block not namespaced');
            const atlasBlock = {
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
    }
    getAtlasSize() {
        return this._atlasSize;
    }
    getAtlasTexturePath() {
        return path_1.default.join(path_util_1.AppPaths.Get.atlases, `./${this._atlasName}.png`);
    }
    /*
    public getBlocks(): TAtlasBlock[] {
        return Array.from(this._blocks.values());
    }
    */
    hasBlock(blockName) {
        return this._blocks.has(blockName);
    }
    static getVanillaAtlas() {
        return Atlas.load('vanilla');
    }
    static _isValidAtlasName(atlasName) {
        return atlasName.length > 0 && Atlas.ATLAS_NAME_REGEX.test(atlasName);
    }
    static _getAtlasPath(atlasName) {
        return path_1.default.join(path_util_1.AppPaths.Get.atlases, `./${atlasName}.atlas`);
    }
}
exports.Atlas = Atlas;
Atlas.ATLAS_NAME_REGEX = /^[a-zA-Z\-]+$/;
