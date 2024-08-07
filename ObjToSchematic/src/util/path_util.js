"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPaths = void 0;
const path_1 = require("path");

class AppPaths {
    constructor() {
        this.resources = path_1.join(__dirname, '../../res');
        this.samples = path_1.join(this.resources, 'samples');
        this.atlases = path_1.join(this.resources, 'atlases');
        this.palettes = path_1.join(this.resources, 'palettes');
        this.shaders = path_1.join(this.resources, 'shaders');
    }

    setBaseDir(baseDir) {
        this.resources = path_1.join(baseDir, 'res');
        this.samples = path_1.join(this.resources, 'samples');
        this.atlases = path_1.join(this.resources, 'atlases');
        this.palettes = path_1.join(this.resources, 'palettes');
        this.shaders = path_1.join(this.resources, 'shaders');
    }

    static get() {
        if (!this.instance) {
            this.instance = new AppPaths();
        }
        return this.instance;
    }
}

exports.AppPaths = AppPaths;
