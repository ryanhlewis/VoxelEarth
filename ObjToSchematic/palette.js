"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Palette = exports.PaletteManager = void 0;
const all_1 = require("../res/palettes/all");
const colourful_1 = require("../res/palettes/colourful");
const greyscale_1 = require("../res/palettes/greyscale");
const schematic_friendly_1 = require("../res/palettes/schematic-friendly");
const localiser_1 = require("./localiser");
const status_1 = require("./status");
const util_1 = require("./util");
const log_util_1 = require("./util/log_util");
const path_util_1 = require("./util/path_util");
class PaletteManager {
    static getPalettesInfo() {
        return [
            { id: 'all', name: 'All' },
            { id: 'colourful', name: 'Colourful' },
            { id: 'greyscale', name: 'Greyscale' },
            { id: 'schematic-friendly', name: 'Schematic-friendly' },
        ];
    }
}
exports.PaletteManager = PaletteManager;
class Palette {
    constructor() {
        this._blocks = new Set();
    }
    static create() {
        return new Palette();
    }
    static load(palette) {
        const outPalette = Palette.create();
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
    }
    save(paletteName) {
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
    }
    add(blockNames) {
        blockNames.forEach((blockName) => {
            if (!this._blocks.has(blockName)) {
                this._blocks.add(util_1.AppUtil.Text.namespaceBlock(blockName));
            }
        });
    }
    remove(blockName) {
        return this._blocks.delete(blockName);
    }
    has(blockName) {
        return this._blocks.has(util_1.AppUtil.Text.namespaceBlock(blockName));
    }
    count() {
        return this._blocks.size;
    }
    getBlocks() {
        return Array.from(this._blocks);
    }
    static getAllPalette() {
        const palette = Palette.create();
        palette.add(all_1.PALETTE_ALL_RELEASE);
        return palette;
        //return Palette.load('all-release');
    }
    /**
     * Removes blocks from the palette if they do not
     * have texture data in the given atlas.
     */
    removeMissingAtlasBlocks(atlas) {
        const missingBlocks = [];
        const blocksCopy = Array.from(this._blocks);
        for (const blockName of blocksCopy) {
            if (!atlas.hasBlock(blockName)) {
                missingBlocks.push(blockName);
                this.remove(blockName);
            }
        }
        if (missingBlocks.length > 0) {
            status_1.StatusHandler.warning((0, localiser_1.LOC)('assign.blocks_missing_textures', { count: missingBlocks }));
            (0, log_util_1.LOG_WARN)('Blocks missing atlas textures', missingBlocks);
        }
    }
    static _isValidPaletteName(paletteName) {
        return paletteName.length > 0 && Palette.PALETTE_NAME_REGEX.test(paletteName);
    }
    static _getPalettePath(paletteName) {
        return path_util_1.PathUtil.join(path_util_1.AppPaths.Get.palettes, `./${paletteName}.palette`);
    }
}
exports.Palette = Palette;
Palette.PALETTE_NAME_REGEX = /^[a-zA-Z\- ]+$/;
Palette.PALETTE_FILE_EXT = '.palette';
Palette._FILE_VERSION = 1;
