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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppContext = void 0;
require("../styles.css");
const analytics_1 = require("./analytics");
const camera_1 = require("./camera");
const config_1 = require("./config");
const event_1 = require("./event");
const localiser_1 = require("./localiser");
const material_map_1 = require("./material-map");
const mouse_1 = require("./mouse");
const renderer_1 = require("./renderer");
const console_1 = require("./ui/console");
const layout_1 = require("./ui/layout");
const util_1 = require("./util");
const error_util_1 = require("./util/error_util");
const file_util_1 = require("./util/file_util");
const log_util_1 = require("./util/log_util");
const vector_1 = require("./vector");
const worker_controller_1 = require("./worker_controller");
class AppContext {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._workerController = new worker_controller_1.WorkerController();
        this._materialManager = new material_map_1.MaterialMapManager(new Map());
        this._loadedFilename = null;
    }
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            analytics_1.AppAnalytics.Init();
            yield localiser_1.Localiser.Get.init();
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
            window.addEventListener('contextmenu', (e) => e.preventDefault());
            this.Get._workerController.execute({ action: 'Init', params: {} }).then(() => {
                layout_1.UI.Get.enableTo(util_1.EAction.Import);
                console_1.AppConsole.success((0, localiser_1.LOC)('init.ready'));
            });
            camera_1.ArcballCamera.Get.toggleAngleSnap();
            event_1.EventManager.Get.add(event_1.EAppEvent.onLanguageChanged, () => {
                this.Get._workerController.execute({ action: 'Settings', params: { language: localiser_1.Localiser.Get.getCurrentLanguage() } }).then(() => {
                });
            });
        });
    }
    getLastAction() {
        return this._lastAction;
    }
    _import() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            // Gather data from the UI to send to the worker
            const components = layout_1.UI.Get.layout.import.components;
            let filetype;
            console_1.AppConsole.info((0, localiser_1.LOC)('import.importing_mesh'));
            {
                // Instruct the worker to perform the job and await the result
                const file = components.input.getValue();
                filetype = file.type;
                const resultImport = yield this._workerController.execute({
                    action: 'Import',
                    params: {
                        file: file,
                        rotation: components.rotation.getValue(),
                    },
                });
                (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Import)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                if (this._handleErrors(resultImport)) {
                    return false;
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
            }
            console_1.AppConsole.info((0, localiser_1.LOC)('import.rendering_mesh'));
            {
                // Instruct the worker to perform the job and await the result
                const resultRender = yield this._workerController.execute({
                    action: 'RenderMesh',
                    params: {},
                });
                (_c = layout_1.UI.Get.getActionButton(util_1.EAction.Import)) === null || _c === void 0 ? void 0 : _c.resetLoading();
                if (this._handleErrors(resultRender)) {
                    return false;
                }
                (0, error_util_1.ASSERT)(resultRender.action === 'RenderMesh');
                this._addWorkerMessagesToConsole(resultRender.messages);
                renderer_1.Renderer.Get.useMesh(resultRender.result);
            }
            console_1.AppConsole.success((0, localiser_1.LOC)('import.rendered_mesh'));
            analytics_1.AppAnalytics.Event('import', {
                'filetype': filetype,
            });
            return true;
        });
    }
    _materials() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            console_1.AppConsole.info((0, localiser_1.LOC)('materials.updating_materials'));
            {
                // Instruct the worker to perform the job and await the result
                const resultMaterials = yield this._workerController.execute({
                    action: 'SetMaterials',
                    params: {
                        materials: this._materialManager.materials,
                    },
                });
                (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Materials)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                if (this._handleErrors(resultMaterials)) {
                    return false;
                }
                (0, error_util_1.ASSERT)(resultMaterials.action === 'SetMaterials');
                resultMaterials.result.materialsChanged.forEach((materialName) => {
                    const material = this._materialManager.materials.get(materialName);
                    (0, error_util_1.ASSERT)(material !== undefined);
                    renderer_1.Renderer.Get.recreateMaterialBuffer(materialName, material);
                    renderer_1.Renderer.Get.setModelToUse(renderer_1.MeshType.TriangleMesh);
                });
                this._addWorkerMessagesToConsole(resultMaterials.messages);
            }
            console_1.AppConsole.success((0, localiser_1.LOC)('materials.updated_materials'));
            analytics_1.AppAnalytics.Event('materials');
            return true;
        });
    }
    _voxelise() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Gather data from the UI to send to the worker
            const components = layout_1.UI.Get.layout.voxelise.components;
            console_1.AppConsole.info((0, localiser_1.LOC)('voxelise.loading_voxel_mesh'));
            {
                // Instruct the worker to perform the job and await the result
                const resultVoxelise = yield this._workerController.execute({
                    action: 'Voxelise',
                    params: {
                        constraintAxis: components.constraintAxis.getValue(),
                        voxeliser: components.voxeliser.getValue(),
                        size: components.size.getValue(),
                        useMultisampleColouring: components.multisampleColouring.getValue(),
                        enableAmbientOcclusion: components.ambientOcclusion.getValue(),
                        voxelOverlapRule: components.voxelOverlapRule.getValue(),
                    },
                });
                (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Voxelise)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                if (this._handleErrors(resultVoxelise)) {
                    return false;
                }
                (0, error_util_1.ASSERT)(resultVoxelise.action === 'Voxelise');
                this._addWorkerMessagesToConsole(resultVoxelise.messages);
            }
            console_1.AppConsole.success((0, localiser_1.LOC)('voxelise.loaded_voxel_mesh'));
            console_1.AppConsole.info((0, localiser_1.LOC)('voxelise.rendering_voxel_mesh'));
            {
                let moreVoxelsToBuffer = false;
                do {
                    // Instruct the worker to perform the job and await the result
                    const resultRender = yield this._workerController.execute({
                        action: 'RenderNextVoxelMeshChunk',
                        params: {
                            enableAmbientOcclusion: components.ambientOcclusion.getValue(),
                            desiredHeight: components.size.getValue(),
                        },
                    });
                    (_b = layout_1.UI.Get.getActionButton(util_1.EAction.Voxelise)) === null || _b === void 0 ? void 0 : _b.resetLoading();
                    if (this._handleErrors(resultRender)) {
                        return false;
                    }
                    (0, error_util_1.ASSERT)(resultRender.action === 'RenderNextVoxelMeshChunk');
                    moreVoxelsToBuffer = resultRender.result.moreVoxelsToBuffer;
                    this._addWorkerMessagesToConsole(resultRender.messages);
                    renderer_1.Renderer.Get.useVoxelMeshChunk(resultRender.result);
                } while (moreVoxelsToBuffer);
            }
            console_1.AppConsole.success((0, localiser_1.LOC)('voxelise.rendered_voxel_mesh'));
            analytics_1.AppAnalytics.Event('voxelise', {
                constraintAxis: components.constraintAxis.getValue(),
                voxeliser: components.voxeliser.getValue(),
                size: components.size.getValue(),
                useMultisampleColouring: components.multisampleColouring.getValue(),
                enableAmbientOcclusion: components.ambientOcclusion.getValue(),
                voxelOverlapRule: components.voxelOverlapRule.getValue(),
            });
            return true;
        });
    }
    _assign() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // Gather data from the UI to send to the worker
            const components = layout_1.UI.Get.layout.assign.components;
            console_1.AppConsole.info((0, localiser_1.LOC)('assign.loading_block_mesh'));
            {
                // Instruct the worker to perform the job and await the result
                const resultAssign = yield this._workerController.execute({
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
                });
                (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Assign)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                if (this._handleErrors(resultAssign)) {
                    return false;
                }
                (0, error_util_1.ASSERT)(resultAssign.action === 'Assign');
                this._addWorkerMessagesToConsole(resultAssign.messages);
            }
            console_1.AppConsole.success((0, localiser_1.LOC)('assign.loaded_block_mesh'));
            renderer_1.Renderer.Get.setLightingAvailable(components.calculateLighting.getValue());
            console_1.AppConsole.info((0, localiser_1.LOC)('assign.rendering_block_mesh'));
            {
                let moreBlocksToBuffer = false;
                do {
                    // Instruct the worker to perform the job and await the result
                    const resultRender = yield this._workerController.execute({
                        action: 'RenderNextBlockMeshChunk',
                        params: {
                            textureAtlas: components.textureAtlas.getValue(),
                        },
                    });
                    (_b = layout_1.UI.Get.getActionButton(util_1.EAction.Assign)) === null || _b === void 0 ? void 0 : _b.resetLoading();
                    if (this._handleErrors(resultRender)) {
                        return false;
                    }
                    (0, error_util_1.ASSERT)(resultRender.action === 'RenderNextBlockMeshChunk');
                    moreBlocksToBuffer = resultRender.result.moreBlocksToBuffer;
                    this._addWorkerMessagesToConsole(resultRender.messages);
                    renderer_1.Renderer.Get.useBlockMeshChunk(resultRender.result);
                } while (moreBlocksToBuffer);
            }
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
            return true;
        });
    }
    _export() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Gather data from the UI to send to the worker
            const components = layout_1.UI.Get.layout.export.components;
            console_1.AppConsole.info((0, localiser_1.LOC)('export.exporting_structure'));
            {
                // Instruct the worker to perform the job and await the result
                const resultExport = yield this._workerController.execute({
                    action: 'Export',
                    params: {
                        exporter: components.export.getValue(),
                    },
                });
                (_a = layout_1.UI.Get.getActionButton(util_1.EAction.Export)) === null || _a === void 0 ? void 0 : _a.resetLoading();
                if (this._handleErrors(resultExport)) {
                    return false;
                }
                (0, error_util_1.ASSERT)(resultExport.action === 'Export');
                this._addWorkerMessagesToConsole(resultExport.messages);
                (0, error_util_1.ASSERT)(this._loadedFilename !== null);
                const fileExport = resultExport.result.files;
                if (fileExport.type === 'single') {
                    (0, file_util_1.download)(fileExport.content, `${this._loadedFilename}_OTS${fileExport.extension}`);
                }
                else {
                    const zipFiles = fileExport.regions.map((region) => {
                        // .nbt exports need to be lowercase
                        return { content: region.content, filename: `ots_${region.name}${fileExport.extension}` };
                    });
                    (0, file_util_1.downloadAsZip)(`${this._loadedFilename}_OTS.zip`, zipFiles);
                }
            }
            console_1.AppConsole.success((0, localiser_1.LOC)('export.exported_structure'));
            analytics_1.AppAnalytics.Event('export', {
                exporter: components.export.getValue(),
            });
            return true;
        });
    }
    /**
     * Check if the result from the worker is an error message
     * if so, handle it and return true, otherwise false.
     */
    _handleErrors(result) {
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
    }
    do(action) {
        return __awaiter(this, void 0, void 0, function* () {
            // Disable the UI while the worker is working
            layout_1.UI.Get.disableAll();
            this._lastAction = action;
            const success = yield this._executeAction(action);
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
        });
    }
    _addWorkerMessagesToConsole(messages) {
        messages.forEach((message) => {
            console_1.AppConsole.add(message);
        });
    }
    _executeAction(action) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (action) {
                case util_1.EAction.Import:
                    return yield this._import();
                case util_1.EAction.Materials:
                    return yield this._materials();
                case util_1.EAction.Voxelise:
                    return yield this._voxelise();
                case util_1.EAction.Assign:
                    return yield this._assign();
                case util_1.EAction.Export:
                    return yield this._export();
            }
            (0, error_util_1.ASSERT)(false);
        });
    }
    static draw() {
        renderer_1.Renderer.Get.update();
        layout_1.UI.Get.tick(this.Get._workerController.isBusy());
        renderer_1.Renderer.Get.draw();
    }
}
exports.AppContext = AppContext;
