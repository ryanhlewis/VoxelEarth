"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPaths = exports.PathUtil = void 0;
const path_1 = require("path");
var PathUtil;
(function (PathUtil) {
    function join(...paths) {
        return path_1.default.join(...paths);
    }
    PathUtil.join = join;
})(PathUtil = exports.PathUtil || (exports.PathUtil = {}));
class AppPaths {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._base = PathUtil.join(__dirname, '../../..');
    }
    setBaseDir(dir) {
        this._base = dir;
        //const parsed = path.parse(dir);
        //ASSERT(parsed.base === 'ObjToSchematic', `AppPaths: Not correct base ${dir}`);
    }
    get base() {
        return this._base;
    }
    get resources() {
        return PathUtil.join(this._base, './res/');
    }
    get tools() {
        return PathUtil.join(this._base, './tools/');
    }
    get tests() {
        return PathUtil.join(this._base, './tests/');
    }
    get testData() {
        return PathUtil.join(this._base, './tests/data/');
    }
    get atlases() {
        return PathUtil.join(this.resources, './atlases/');
    }
    get palettes() {
        return PathUtil.join(this.resources, './palettes/');
    }
    get static() {
        return PathUtil.join(this.resources, './static/');
    }
    get shaders() {
        return PathUtil.join(this.resources, './shaders/');
    }
    get logs() {
        return PathUtil.join(this._base, './logs/');
    }
    /**
     * The `gen` directory stores any data generated at runtime.
     * This can safely be deleted when the program is not running and will
     * be empted upon each startup.
     */
    get gen() {
        return PathUtil.join(this._base, './gen/');
    }
}
exports.AppPaths = AppPaths;
