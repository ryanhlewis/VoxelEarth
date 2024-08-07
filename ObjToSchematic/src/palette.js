"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Palette = exports.PaletteManager = void 0;
var all_1 = require("../res/palettes/all");
var colourful_1 = require("../res/palettes/colourful");
var greyscale_1 = require("../res/palettes/greyscale");
var schematic_friendly_1 = require("../res/palettes/schematic-friendly");
var localiser_1 = require("./localiser");
var status_1 = require("./status");
var util_1 = require("./util");
var log_util_1 = require("./util/log_util");
var path_util_1 = require("./util/path_util");
var PaletteManager = /** @class */ (function () {
    function PaletteManager() {
    }
    PaletteManager.getPalettesInfo = function () {
        return [
            { id: 'all', name: 'All' },
            { id: 'colourful', name: 'Colourful' },
            { id: 'greyscale', name: 'Greyscale' },
            { id: 'schematic-friendly', name: 'Schematic-friendly' },
        ];
    };
    return PaletteManager;
}());
exports.PaletteManager = PaletteManager;
var Palette = /** @class */ (function () {
    function Palette() {
        this._blocks = new Set();
    }
    Palette.create = function () {
        return new Palette();
    };
    Palette.load = function (palette) {
        var outPalette = Palette.create();
        switch (palette) {
            case 'all':
                outPalette.add(all_1.PALETTE_ALL_RELEASE);
                break;
            case 'colourful':
                outPalette.add(colourful_1.PALETTE_COLOURFUL);
                break;
            case 'greyscale':
                outPalette.add(greyscale_1.PALETTE_GREYSCALE);
                break;
            case 'schematic-friendly':
                outPalette.add(schematic_friendly_1.PALETTE_SCHEMATIC_FRIENDLY);
                break;
        }
        return outPalette;
        return undefined;
        /*
        if (!Palette._isValidPaletteName(paletteName)) {
            return;
        }

        const palettePath = Palette._getPalettePath(paletteName);
        if (!fs.existsSync(palettePath)) {
            return;
        }

        const palette = Palette.create();

        const paletteFile = fs.readFileSync(palettePath, 'utf8');
        const paletteJSON = JSON.parse(paletteFile);
        const paletteVersion = paletteJSON.version;

        if (paletteVersion === undefined) {
            const paletteBlocks = paletteJSON.blocks;
            for (const blockName of paletteBlocks) {
                palette.add(AppUtil.Text.namespaceBlock(blockName));
            }
        } else if (paletteVersion === 1) {
            const paletteBlocks = paletteJSON.blocks;
            for (const blockName of paletteBlocks) {
                palette.add(blockName);
            }
        } else {
            ASSERT(false, `Unrecognised .palette file version: ${paletteVersion}`);
        }

        return palette;
        */
    };
    Palette.prototype.save = function (paletteName) {
        // TODO Unimplemented
        return false;
        /*
        if (!Palette._isValidPaletteName(paletteName)) {
            return false;
        }
        const filePath = Palette._getPalettePath(paletteName);

        const paletteJSON = {
            version: Palette._FILE_VERSION,
            blocks: this._blocks,
        };

        try {
            fs.writeFileSync(filePath, JSON.stringify(paletteJSON, null, 4));
            return true;
        } catch {
            return false;
        }
        */
    };
    Palette.prototype.add = function (blockNames) {
        var _this = this;
        blockNames.forEach(function (blockName) {
            if (!_this._blocks.has(blockName)) {
                _this._blocks.add(util_1.AppUtil.Text.namespaceBlock(blockName));
            }
        });
    };
    Palette.prototype.remove = function (blockName) {
        return this._blocks.delete(blockName);
    };
    Palette.prototype.has = function (blockName) {
        return this._blocks.has(util_1.AppUtil.Text.namespaceBlock(blockName));
    };
    Palette.prototype.count = function () {
        return this._blocks.size;
    };
    Palette.prototype.getBlocks = function () {
        return Array.from(this._blocks);
    };
    Palette.getAllPalette = function () {
        var palette = Palette.create();
        palette.add(all_1.PALETTE_ALL_RELEASE);
        return palette;
        //return Palette.load('all-release');
    };
    /**
     * Removes blocks from the palette if they do not
     * have texture data in the given atlas.
     */
    Palette.prototype.removeMissingAtlasBlocks = function (atlas) {
        var missingBlocks = [];
        var blocksCopy = Array.from(this._blocks);
        for (var _i = 0, blocksCopy_1 = blocksCopy; _i < blocksCopy_1.length; _i++) {
            var blockName = blocksCopy_1[_i];
            if (!atlas.hasBlock(blockName)) {
                missingBlocks.push(blockName);
                this.remove(blockName);
            }
        }
        if (missingBlocks.length > 0) {
            status_1.StatusHandler.warning((0, localiser_1.LOC)('assign.blocks_missing_textures', { count: missingBlocks }));
            (0, log_util_1.LOG_WARN)('Blocks missing atlas textures', missingBlocks);
        }
    };
    Palette._isValidPaletteName = function (paletteName) {
        return paletteName.length > 0 && Palette.PALETTE_NAME_REGEX.test(paletteName);
    };
    Palette._getPalettePath = function (paletteName) {
        return path_util_1.PathUtil.join(path_util_1.AppPaths.Get.palettes, "./".concat(paletteName, ".palette"));
    };
    Palette.PALETTE_NAME_REGEX = /^[a-zA-Z\- ]+$/;
    Palette.PALETTE_FILE_EXT = '.palette';
    Palette._FILE_VERSION = 1;
    return Palette;
}());
exports.Palette = Palette;
//# sourceMappingURL=palette.js.map