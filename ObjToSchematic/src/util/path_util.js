"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPaths = exports.PathUtil = void 0;
var path_1 = __importDefault(require("path"));
var PathUtil;
(function (PathUtil) {
    function join() {
        var paths = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            paths[_i] = arguments[_i];
        }
        return path_1.default.join.apply(path_1.default, paths);
    }
    PathUtil.join = join;
})(PathUtil = exports.PathUtil || (exports.PathUtil = {}));
var AppPaths = /** @class */ (function () {
    function AppPaths() {
        this._base = PathUtil.join(__dirname, '../../..');
    }
    Object.defineProperty(AppPaths, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    AppPaths.prototype.setBaseDir = function (dir) {
        this._base = dir;
        //const parsed = path.parse(dir);
        //ASSERT(parsed.base === 'ObjToSchematic', `AppPaths: Not correct base ${dir}`);
    };
    Object.defineProperty(AppPaths.prototype, "base", {
        get: function () {
            return this._base;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "resources", {
        get: function () {
            return PathUtil.join(this._base, './res/');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "tools", {
        get: function () {
            return PathUtil.join(this._base, './tools/');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "tests", {
        get: function () {
            return PathUtil.join(this._base, './tests/');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "testData", {
        get: function () {
            return PathUtil.join(this._base, './tests/data/');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "atlases", {
        get: function () {
            return PathUtil.join(this.resources, './atlases/');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "palettes", {
        get: function () {
            return PathUtil.join(this.resources, './palettes/');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "static", {
        get: function () {
            return PathUtil.join(this.resources, './static/');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "shaders", {
        get: function () {
            return PathUtil.join(this.resources, './shaders/');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "logs", {
        get: function () {
            return PathUtil.join(this._base, './logs/');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AppPaths.prototype, "gen", {
        /**
         * The `gen` directory stores any data generated at runtime.
         * This can safely be deleted when the program is not running and will
         * be empted upon each startup.
         */
        get: function () {
            return PathUtil.join(this._base, './gen/');
        },
        enumerable: false,
        configurable: true
    });
    return AppPaths;
}());
exports.AppPaths = AppPaths;
//# sourceMappingURL=path_util.js.map