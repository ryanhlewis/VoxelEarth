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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppContext = void 0;
require("../styles.css");
var analytics_1 = require("./analytics");
var camera_1 = require("./camera");
var config_1 = require("./config");
var event_1 = require("./event");
var localiser_1 = require("./localiser");
var material_map_1 = require("./material-map");
var mouse_1 = require("./mouse");
var renderer_1 = require("./renderer");
var console_1 = require("./ui/console");
var layout_1 = require("./ui/layout");
var util_1 = require("./util");
var error_util_1 = require("./util/error_util");
var file_util_1 = require("./util/file_util");
var log_util_1 = require("./util/log_util");
var vector_1 = require("./vector");
var worker_controller_1 = require("./worker_controller");
var AppContext = /** @class */ (function () {
    function AppContext() {
        this._workerController = new worker_controller_1.WorkerController();
        this._materialManager = new material_map_1.MaterialMapManager(new Map());
        this._loadedFilename = null;
    }
    Object.defineProperty(AppContext, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    AppContext.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        analytics_1.AppAnalytics.Init();
                        return [4 /*yield*/, localiser_1.Localiser.Get.init()];
                    case 1:
                        _a.sent();
                        console_1.AppConsole.info((0, localiser_1.LOC)('init.initialising'));
                        log_util_1.Logger.Get.enableLOG();
                        log_util_1.Logger.Get.enableLOGMAJOR();
                        log_util_1.Logger.Get.enableLOGWARN();
                        config_1.AppConfig.Get.dumpConfig();
                        event_1.EventManager.Get.bindToContext(this.Get);
                        layout_1.UI.Get.bindToContext(this.Get);
                        layout_1.UI.Get.build();
                        layout_1.UI.Get.registerEvents();
                        layout_1.UI.Get.updateMaterialsAction(this.Get._materialManager);
                        layout_1.UI.Get.disableAll();
                        camera_1.ArcballCamera.Get.init();
                        mouse_1.MouseManager.Get.init();
                        window.addEventListener('contextmenu', function (e) { return e.preventDefault(); });
                        this.Get._workerController.execute({ action: 'Init', params: {} }).then(function () {
                            layout_1.UI.Get.enableTo(util_1.EAction.Import);
                            console_1.AppConsole.success((0, localiser_1.LOC)('init.ready'));
                        });
                        camera_1.ArcballCamera.Get.toggleAngleSnap();
                        event_1.EventManager.Get.add(event_1.EAppEvent.onLanguageChanged, function () {
                            _this.Get._workerController.execute({ action: 'Settings', params: { language: localiser_1.Localiser.Get.getCurrentLanguage() } }).then(function () {
                            });
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    AppContext.prototype.getLastAction = function () {
        return this._lastAction;
    };
    AppContext.prototype._import = function () {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var components, filetype, file, resultImport, resultRender;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        components = layout_1.UI.Get.layout.import.components;
                        console_1.AppConsole.info((0, localiser_1.LOC)('import.importing_mesh'));
                        file = components.input.getValue();
                        filetype = file.type;
                        return [4 /*yield*/, this._workerController.execute({
                                action: 'Import',
                                params: {
                                    file: file,
                                    rotation: components.rotation.getValue(),
                                },
                            })];
                    case 1:
                        resultImport = _d.sent();
                        (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Import)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                        if (this._handleErrors(resultImport)) {
                            return [2 /*return*/, false];
                        }
                        (0, error_util_1.ASSERT)(resultImport.action === 'Import');
                        console_1.AppConsole.success((0, localiser_1.LOC)('import.imported_mesh'));
                        this._addWorkerMessagesToConsole(resultImport.messages);
                        layout_1.UI.Get._ui.voxelise.components.constraintAxis.setValue('y');
                        layout_1.UI.Get._ui.voxelise.components.size.setValue(80);
                        this.minConstraint = vector_1.Vector3.copy(resultImport.result.dimensions)
                            .mulScalar(config_1.AppConfig.Get.CONSTRAINT_MINIMUM_HEIGHT).ceil();
                        this.maxConstraint = vector_1.Vector3.copy(resultImport.result.dimensions)
                            .mulScalar(config_1.AppConfig.Get.CONSTRAINT_MAXIMUM_HEIGHT).floor();
                        layout_1.UI.Get._ui.voxelise.components.constraintAxis.setOptionEnabled(0, this.minConstraint.x > 0 && this.minConstraint.x <= this.maxConstraint.x);
                        layout_1.UI.Get._ui.voxelise.components.constraintAxis.setOptionEnabled(2, this.minConstraint.z > 0 && this.minConstraint.z <= this.maxConstraint.z);
                        this._materialManager = new material_map_1.MaterialMapManager(resultImport.result.materials);
                        layout_1.UI.Get.updateMaterialsAction(this._materialManager);
                        this._loadedFilename = (_b = file.name.split('.')[0]) !== null && _b !== void 0 ? _b : 'result';
                        console_1.AppConsole.info((0, localiser_1.LOC)('import.rendering_mesh'));
                        return [4 /*yield*/, this._workerController.execute({
                                action: 'RenderMesh',
                                params: {},
                            })];
                    case 2:
                        resultRender = _d.sent();
                        (_c = layout_1.UI.Get.getActionButton(util_1.EAction.Import)) === null || _c === void 0 ? void 0 : _c.resetLoading();
                        if (this._handleErrors(resultRender)) {
                            return [2 /*return*/, false];
                        }
                        (0, error_util_1.ASSERT)(resultRender.action === 'RenderMesh');
                        this._addWorkerMessagesToConsole(resultRender.messages);
                        renderer_1.Renderer.Get.useMesh(resultRender.result);
                        console_1.AppConsole.success((0, localiser_1.LOC)('import.rendered_mesh'));
                        analytics_1.AppAnalytics.Event('import', {
                            'filetype': filetype,
                        });
                        return [2 /*return*/, true];
                }
            });
        });
    };
    AppContext.prototype._materials = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var resultMaterials;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console_1.AppConsole.info((0, localiser_1.LOC)('materials.updating_materials'));
                        return [4 /*yield*/, this._workerController.execute({
                                action: 'SetMaterials',
                                params: {
                                    materials: this._materialManager.materials,
                                },
                            })];
                    case 1:
                        resultMaterials = _b.sent();
                        (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Materials)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                        if (this._handleErrors(resultMaterials)) {
                            return [2 /*return*/, false];
                        }
                        (0, error_util_1.ASSERT)(resultMaterials.action === 'SetMaterials');
                        resultMaterials.result.materialsChanged.forEach(function (materialName) {
                            var material = _this._materialManager.materials.get(materialName);
                            (0, error_util_1.ASSERT)(material !== undefined);
                            renderer_1.Renderer.Get.recreateMaterialBuffer(materialName, material);
                            renderer_1.Renderer.Get.setModelToUse(renderer_1.MeshType.TriangleMesh);
                        });
                        this._addWorkerMessagesToConsole(resultMaterials.messages);
                        console_1.AppConsole.success((0, localiser_1.LOC)('materials.updated_materials'));
                        analytics_1.AppAnalytics.Event('materials');
                        return [2 /*return*/, true];
                }
            });
        });
    };
    AppContext.prototype._voxelise = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var components, resultVoxelise, moreVoxelsToBuffer, resultRender;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        components = layout_1.UI.Get.layout.voxelise.components;
                        console_1.AppConsole.info((0, localiser_1.LOC)('voxelise.loading_voxel_mesh'));
                        return [4 /*yield*/, this._workerController.execute({
                                action: 'Voxelise',
                                params: {
                                    constraintAxis: components.constraintAxis.getValue(),
                                    voxeliser: components.voxeliser.getValue(),
                                    size: components.size.getValue(),
                                    useMultisampleColouring: components.multisampleColouring.getValue(),
                                    enableAmbientOcclusion: components.ambientOcclusion.getValue(),
                                    voxelOverlapRule: components.voxelOverlapRule.getValue(),
                                },
                            })];
                    case 1:
                        resultVoxelise = _c.sent();
                        (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Voxelise)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                        if (this._handleErrors(resultVoxelise)) {
                            return [2 /*return*/, false];
                        }
                        (0, error_util_1.ASSERT)(resultVoxelise.action === 'Voxelise');
                        this._addWorkerMessagesToConsole(resultVoxelise.messages);
                        console_1.AppConsole.success((0, localiser_1.LOC)('voxelise.loaded_voxel_mesh'));
                        console_1.AppConsole.info((0, localiser_1.LOC)('voxelise.rendering_voxel_mesh'));
                        moreVoxelsToBuffer = false;
                        _c.label = 2;
                    case 2: return [4 /*yield*/, this._workerController.execute({
                            action: 'RenderNextVoxelMeshChunk',
                            params: {
                                enableAmbientOcclusion: components.ambientOcclusion.getValue(),
                                desiredHeight: components.size.getValue(),
                            },
                        })];
                    case 3:
                        resultRender = _c.sent();
                        (_b = layout_1.UI.Get.getActionButton(util_1.EAction.Voxelise)) === null || _b === void 0 ? void 0 : _b.resetLoading();
                        if (this._handleErrors(resultRender)) {
                            return [2 /*return*/, false];
                        }
                        (0, error_util_1.ASSERT)(resultRender.action === 'RenderNextVoxelMeshChunk');
                        moreVoxelsToBuffer = resultRender.result.moreVoxelsToBuffer;
                        this._addWorkerMessagesToConsole(resultRender.messages);
                        renderer_1.Renderer.Get.useVoxelMeshChunk(resultRender.result);
                        _c.label = 4;
                    case 4:
                        if (moreVoxelsToBuffer) return [3 /*break*/, 2];
                        _c.label = 5;
                    case 5:
                        console_1.AppConsole.success((0, localiser_1.LOC)('voxelise.rendered_voxel_mesh'));
                        analytics_1.AppAnalytics.Event('voxelise', {
                            constraintAxis: components.constraintAxis.getValue(),
                            voxeliser: components.voxeliser.getValue(),
                            size: components.size.getValue(),
                            useMultisampleColouring: components.multisampleColouring.getValue(),
                            enableAmbientOcclusion: components.ambientOcclusion.getValue(),
                            voxelOverlapRule: components.voxelOverlapRule.getValue(),
                        });
                        return [2 /*return*/, true];
                }
            });
        });
    };
    AppContext.prototype._assign = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var components, resultAssign, moreBlocksToBuffer, resultRender;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        components = layout_1.UI.Get.layout.assign.components;
                        console_1.AppConsole.info((0, localiser_1.LOC)('assign.loading_block_mesh'));
                        return [4 /*yield*/, this._workerController.execute({
                                action: 'Assign',
                                params: {
                                    textureAtlas: components.textureAtlas.getValue(),
                                    blockPalette: components.blockPalette.getValue().getBlocks(),
                                    dithering: components.dithering.getValue(),
                                    ditheringMagnitude: components.ditheringMagnitude.getValue(),
                                    colourSpace: util_1.ColourSpace.RGB,
                                    fallable: components.fallable.getValue(),
                                    resolution: Math.pow(2, components.colourAccuracy.getValue()),
                                    calculateLighting: components.calculateLighting.getValue(),
                                    lightThreshold: components.lightThreshold.getValue(),
                                    contextualAveraging: components.contextualAveraging.getValue(),
                                    errorWeight: components.errorWeight.getValue() / 10,
                                },
                            })];
                    case 1:
                        resultAssign = _c.sent();
                        (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Assign)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                        if (this._handleErrors(resultAssign)) {
                            return [2 /*return*/, false];
                        }
                        (0, error_util_1.ASSERT)(resultAssign.action === 'Assign');
                        this._addWorkerMessagesToConsole(resultAssign.messages);
                        console_1.AppConsole.success((0, localiser_1.LOC)('assign.loaded_block_mesh'));
                        renderer_1.Renderer.Get.setLightingAvailable(components.calculateLighting.getValue());
                        console_1.AppConsole.info((0, localiser_1.LOC)('assign.rendering_block_mesh'));
                        moreBlocksToBuffer = false;
                        _c.label = 2;
                    case 2: return [4 /*yield*/, this._workerController.execute({
                            action: 'RenderNextBlockMeshChunk',
                            params: {
                                textureAtlas: components.textureAtlas.getValue(),
                            },
                        })];
                    case 3:
                        resultRender = _c.sent();
                        (_b = layout_1.UI.Get.getActionButton(util_1.EAction.Assign)) === null || _b === void 0 ? void 0 : _b.resetLoading();
                        if (this._handleErrors(resultRender)) {
                            return [2 /*return*/, false];
                        }
                        (0, error_util_1.ASSERT)(resultRender.action === 'RenderNextBlockMeshChunk');
                        moreBlocksToBuffer = resultRender.result.moreBlocksToBuffer;
                        this._addWorkerMessagesToConsole(resultRender.messages);
                        renderer_1.Renderer.Get.useBlockMeshChunk(resultRender.result);
                        _c.label = 4;
                    case 4:
                        if (moreBlocksToBuffer) return [3 /*break*/, 2];
                        _c.label = 5;
                    case 5:
                        console_1.AppConsole.success((0, localiser_1.LOC)('assign.rendered_block_mesh'));
                        analytics_1.AppAnalytics.Event('assign', {
                            dithering: components.dithering.getValue(),
                            ditheringMagnitude: components.ditheringMagnitude.getValue(),
                            fallable: components.fallable.getValue(),
                            resolution: Math.pow(2, components.colourAccuracy.getValue()),
                            calculateLighting: components.calculateLighting.getValue(),
                            lightThreshold: components.lightThreshold.getValue(),
                            contextualAveraging: components.contextualAveraging.getValue(),
                            errorWeight: components.errorWeight.getValue() / 10,
                        });
                        return [2 /*return*/, true];
                }
            });
        });
    };
    AppContext.prototype._export = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var components, resultExport, fileExport_1, zipFiles;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        components = layout_1.UI.Get.layout.export.components;
                        console_1.AppConsole.info((0, localiser_1.LOC)('export.exporting_structure'));
                        return [4 /*yield*/, this._workerController.execute({
                                action: 'Export',
                                params: {
                                    exporter: components.export.getValue(),
                                },
                            })];
                    case 1:
                        resultExport = _b.sent();
                        (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Export)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                        if (this._handleErrors(resultExport)) {
                            return [2 /*return*/, false];
                        }
                        (0, error_util_1.ASSERT)(resultExport.action === 'Export');
                        this._addWorkerMessagesToConsole(resultExport.messages);
                        (0, error_util_1.ASSERT)(this._loadedFilename !== null);
                        fileExport_1 = resultExport.result.files;
                        if (fileExport_1.type === 'single') {
                            (0, file_util_1.download)(fileExport_1.content, "".concat(this._loadedFilename, "_OTS").concat(fileExport_1.extension));
                        }
                        else {
                            zipFiles = fileExport_1.regions.map(function (region) {
                                // .nbt exports need to be lowercase
                                return { content: region.content, filename: "ots_".concat(region.name).concat(fileExport_1.extension) };
                            });
                            (0, file_util_1.downloadAsZip)("".concat(this._loadedFilename, "_OTS.zip"), zipFiles);
                        }
                        console_1.AppConsole.success((0, localiser_1.LOC)('export.exported_structure'));
                        analytics_1.AppAnalytics.Event('export', {
                            exporter: components.export.getValue(),
                        });
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Check if the result from the worker is an error message
     * if so, handle it and return true, otherwise false.
     */
    AppContext.prototype._handleErrors = function (result) {
        if (result.action === 'KnownError') {
            console_1.AppConsole.error(result.error.message);
            return true;
        }
        else if (result.action === 'UnknownError') {
            console_1.AppConsole.error((0, localiser_1.LOC)('something_went_wrong'));
            (0, log_util_1.LOG_ERROR)(result.error);
            return true;
        }
        return false;
    };
    AppContext.prototype.do = function (action) {
        return __awaiter(this, void 0, void 0, function () {
            var success;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Disable the UI while the worker is working
                        layout_1.UI.Get.disableAll();
                        this._lastAction = action;
                        return [4 /*yield*/, this._executeAction(action)];
                    case 1:
                        success = _a.sent();
                        if (success) {
                            if (action === util_1.EAction.Import) {
                                layout_1.UI.Get.enableTo(util_1.EAction.Voxelise);
                            }
                            else {
                                layout_1.UI.Get.enableTo(action + 1);
                            }
                        }
                        else {
                            layout_1.UI.Get.enableTo(action);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    AppContext.prototype._addWorkerMessagesToConsole = function (messages) {
        messages.forEach(function (message) {
            console_1.AppConsole.add(message);
        });
    };
    AppContext.prototype._executeAction = function (action) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = action;
                        switch (_a) {
                            case util_1.EAction.Import: return [3 /*break*/, 1];
                            case util_1.EAction.Materials: return [3 /*break*/, 3];
                            case util_1.EAction.Voxelise: return [3 /*break*/, 5];
                            case util_1.EAction.Assign: return [3 /*break*/, 7];
                            case util_1.EAction.Export: return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 1: return [4 /*yield*/, this._import()];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this._materials()];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this._voxelise()];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this._assign()];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9: return [4 /*yield*/, this._export()];
                    case 10: return [2 /*return*/, _b.sent()];
                    case 11:
                        (0, error_util_1.ASSERT)(false);
                        return [2 /*return*/];
                }
            });
        });
    };
    AppContext.draw = function () {
        renderer_1.Renderer.Get.update();
        layout_1.UI.Get.tick(this.Get._workerController.isBusy());
        renderer_1.Renderer.Get.draw();
    };
    return AppContext;
}());
exports.AppContext = AppContext;
//# sourceMappingURL=app_context.js.map