"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var sharp_1 = __importDefault(require("sharp"));
var misc_1 = require("./misc");
var error_util_1 = require("../src/util/error_util");
var colour_1 = require("../src/colour");
commander_1.program
    .argument('<textures_directory>', 'The directory to load the blocks texture files from (assets/minecraft/textures/block)')
    .argument('<models_directory>', 'The directory to load the blocks model files from (assets/minecraft/models/block)')
    .argument('<output_directory>', 'The directory to write the texture atlas files to')
    .argument('<ignore_file_path>', 'Ignore file path');
commander_1.program.parse();
var paths = {
    textures: commander_1.program.args[0],
    models: commander_1.program.args[1],
    output: commander_1.program.args[2],
    ignore: commander_1.program.args[3],
};
// GO!
var ignoreList = new Set(fs_1.default.readFileSync(paths.ignore, 'utf8').split(/\r?\n/));
// Load all models to use
var allModels = fs_1.default.readdirSync(paths.models);
var loadedModels = allModels
    // Remove ignored models
    .filter(function (modelFileName) {
    return !ignoreList.has(modelFileName);
})
    // Get each models content
    .map(function (modelFileName) {
    var modelFilePath = path_1.default.join(paths.models, modelFileName);
    var fileContents = fs_1.default.readFileSync(modelFilePath, 'utf8');
    var model = JSON.parse(fileContents);
    switch (model.parent) {
        case 'minecraft:block/cube_column_horizontal':
            return {
                modelFileName: modelFileName,
                up: model.textures.side,
                down: model.textures.side,
                north: model.textures.end,
                south: model.textures.end,
                east: model.textures.side,
                west: model.textures.side,
            };
        case 'minecraft:block/cube_all':
            return {
                modelFileName: modelFileName,
                up: model.textures.all,
                down: model.textures.all,
                north: model.textures.all,
                south: model.textures.all,
                east: model.textures.all,
                west: model.textures.all,
            };
        case 'minecraft:block/cube_column':
            return {
                modelFileName: modelFileName,
                up: model.textures.end,
                down: model.textures.end,
                north: model.textures.side,
                south: model.textures.side,
                east: model.textures.side,
                west: model.textures.side,
            };
        case 'minecraft:block/cube_bottom_top':
            return {
                modelFileName: modelFileName,
                up: model.textures.top,
                down: model.textures.bottom,
                north: model.textures.side,
                south: model.textures.side,
                east: model.textures.side,
                west: model.textures.side,
            };
        case 'minecraft:block/cube':
            return {
                modelFileName: modelFileName,
                up: model.textures.up,
                down: model.textures.down,
                north: model.textures.north,
                south: model.textures.south,
                east: model.textures.east,
                west: model.textures.west,
            };
        case 'minecraft:block/template_single_face':
            return {
                modelFileName: modelFileName,
                up: model.textures.texture,
                down: model.textures.texture,
                north: model.textures.texture,
                south: model.textures.texture,
                east: model.textures.texture,
                west: model.textures.texture,
            };
        case 'minecraft:block/template_glazed_terracotta':
            return {
                modelFileName: modelFileName,
                up: model.textures.pattern,
                down: model.textures.pattern,
                north: model.textures.pattern,
                south: model.textures.pattern,
                east: model.textures.pattern,
                west: model.textures.pattern,
            };
        case 'minecraft:block/leaves':
            return {
                modelFileName: modelFileName,
                up: model.textures.all,
                down: model.textures.all,
                north: model.textures.all,
                south: model.textures.all,
                east: model.textures.all,
                west: model.textures.all,
            };
        default:
            return null;
    }
}, [])
    .filter(function (entry) {
    return entry !== null;
});
var allTextures = new Set();
loadedModels.forEach(function (model) {
    allTextures.add(model === null || model === void 0 ? void 0 : model.up);
    allTextures.add(model === null || model === void 0 ? void 0 : model.down);
    allTextures.add(model === null || model === void 0 ? void 0 : model.east);
    allTextures.add(model === null || model === void 0 ? void 0 : model.west);
    allTextures.add(model === null || model === void 0 ? void 0 : model.north);
    allTextures.add(model === null || model === void 0 ? void 0 : model.south);
});
var atlasSize = Math.ceil(Math.sqrt(allTextures.size));
var nextAtlasColumn = 0;
var nextAtlasRow = 0;
var textureData = Array.from(allTextures)
    .map(function (texture) { return __awaiter(void 0, void 0, void 0, function () {
    var shortName, texturePath, image, imageData, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                shortName = texture.split('/')[1];
                texturePath = path_1.default.join(paths.textures, shortName + '.png');
                image = (0, sharp_1.default)(texturePath);
                _b = (_a = Uint8ClampedArray).from;
                return [4 /*yield*/, image.raw().ensureAlpha(1.0).toBuffer()];
            case 1:
                imageData = _b.apply(_a, [_c.sent()]);
                return [2 /*return*/, {
                        textureName: texture,
                        texturePath: texturePath,
                        image: image,
                        imageData: imageData,
                    }];
        }
    });
}); });
Promise.all(textureData)
    .then(function (res) { return __awaiter(void 0, void 0, void 0, function () {
    var tmp;
    return __generator(this, function (_a) {
        tmp = res
            .sort(function (a, b) {
            return a.textureName < b.textureName ? -1 : 1;
        })
            .map(function (texture) { return __awaiter(void 0, void 0, void 0, function () {
            var averageColour, standardDeviation, atlasColumn, atlasRow;
            return __generator(this, function (_a) {
                averageColour = (0, misc_1.getAverageColour)(texture.imageData);
                standardDeviation = (0, misc_1.getStandardDeviation)(texture.imageData, averageColour);
                atlasColumn = nextAtlasColumn;
                atlasRow = nextAtlasRow;
                ++nextAtlasColumn;
                if (nextAtlasColumn >= atlasSize) {
                    ++nextAtlasRow;
                    nextAtlasColumn = 0;
                }
                return [2 /*return*/, {
                        textureName: texture.textureName,
                        texturePath: texture.texturePath,
                        atlasColumn: atlasColumn,
                        atlasRow: atlasRow,
                        colour: averageColour,
                        std: standardDeviation,
                    }];
            });
        }); });
        Promise.all(tmp)
            .then(function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var textureMap, baseImage, compositeData, blocks, textures, atlasFile;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        textureMap = new Map();
                        data.forEach(function (texture) {
                            textureMap.set(texture.textureName, {
                                atlasColumn: texture.atlasColumn,
                                atlasRow: texture.atlasRow,
                                colour: texture.colour,
                                std: texture.std,
                            });
                        });
                        return [4 /*yield*/, (0, sharp_1.default)({
                                create: {
                                    width: atlasSize * 16 * 3,
                                    height: atlasSize * 16 * 3,
                                    channels: 4,
                                    background: { r: 255, g: 255, b: 255, alpha: 0.0 },
                                }
                            })];
                    case 1:
                        baseImage = _a.sent();
                        compositeData = [];
                        data.forEach(function (x) {
                            for (var i = 0; i < 3; ++i) {
                                for (var j = 0; j < 3; ++j) {
                                    compositeData.push({
                                        input: x.texturePath,
                                        blend: 'over',
                                        left: (x.atlasColumn * 16) * 3 + 16 * i,
                                        top: (x.atlasRow * 16) * 3 + 16 * j,
                                    });
                                }
                            }
                        });
                        baseImage.composite(compositeData)
                            .toFile(path_1.default.join(paths.output, 'atlas.png'))
                            .then(function (res) {
                            console.log('Done!');
                        })
                            .catch(function (err) {
                            console.error(err);
                        });
                        blocks = loadedModels.map(function (model) {
                            (0, error_util_1.ASSERT)(model !== null);
                            var faces = {
                                up: model.up,
                                down: model.down,
                                north: model.north,
                                south: model.south,
                                east: model.east,
                                west: model.west,
                            };
                            var faceColours = Object.values(faces).map(function (texture) {
                                var textureData = textureMap.get(texture);
                                (0, error_util_1.ASSERT)(textureData !== undefined);
                                return textureData.colour;
                            });
                            return {
                                name: 'minecraft:' + model.modelFileName.split('.')[0],
                                faces: faces,
                                colour: colour_1.RGBAUtil.average.apply(colour_1.RGBAUtil, faceColours),
                            };
                        });
                        console.log(textureMap);
                        textures = {};
                        textureMap.forEach(function (value, key) {
                            textures[key] = value;
                        });
                        atlasFile = {
                            formatVersion: 3,
                            atlasSize: atlasSize,
                            blocks: blocks,
                            textures: textures,
                        };
                        fs_1.default.writeFileSync(path_1.default.join(paths.output, 'atlas.atlas'), JSON.stringify(atlasFile, null, 4));
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
//# sourceMappingURL=build-atlas.js.map