"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UI = void 0;
var split_js_1 = __importDefault(require("split.js"));
var base_1 = require("../../loc/base");
var camera_1 = require("../camera");
var event_1 = require("../event");
var localiser_1 = require("../localiser");
var mesh_1 = require("../mesh");
var renderer_1 = require("../renderer");
var util_1 = require("../util");
var error_util_1 = require("../util/error_util");
var ui_util_1 = require("../util/ui_util");
var button_1 = require("./components/button");
var checkbox_1 = require("./components/checkbox");
var combobox_1 = require("./components/combobox");
var file_input_1 = require("./components/file_input");
var header_1 = require("./components/header");
var palette_1 = require("./components/palette");
var placeholder_1 = require("./components/placeholder");
var slider_1 = require("./components/slider");
var solid_material_1 = require("./components/solid_material");
var textured_material_1 = require("./components/textured_material");
var toolbar_item_1 = require("./components/toolbar_item");
var vector_1 = require("./components/vector");
var console_1 = require("./console");
var icons_1 = require("./icons");
var misc_1 = require("./misc");
var config_1 = require("../config");
var UI = /** @class */ (function () {
    function UI() {
        var _this = this;
        this.uiOrder = ['settings', 'import', 'materials', 'voxelise', 'assign', 'export'];
        this._ui = {
            'settings': {
                id: 'settings',
                label: (0, localiser_1.LOC)('settings.heading'),
                components: {
                    'language': new combobox_1.ComboboxComponent(),
                    'overrideHeight': new slider_1.SliderComponent()
                        .setMin(16)
                        .setMax(10000)
                        .setDefaultValue(380)
                        .setDecimals(0)
                        .setStep(1)
                        .setLabel('settings.components.overrideHeight')
                        .addValueChangedListener(function (newValue) {
                        config_1.AppConfig.Get.CONSTRAINT_MAXIMUM_HEIGHT = newValue;
                    })
                },
                componentOrder: ['language', 'overrideHeight'],
            },
            'import': {
                id: 'import',
                label: (0, localiser_1.LOC)('import.heading'),
                components: {
                    'input': new file_input_1.FileComponent()
                        .setLabel('import.components.input'),
                    'rotation': new vector_1.VectorComponent()
                        .setLabel('import.components.rotation')
                        .setOnMouseEnterExit(function (state, component) {
                        if (state === 'exit') {
                            renderer_1.Renderer.Get.clearAxisToHighlight();
                        }
                        else {
                            renderer_1.Renderer.Get.setAxisToHighlight(component);
                        }
                    }),
                },
                componentOrder: ['input', 'rotation'],
                execButton: new button_1.ButtonComponent()
                    .setOnClick(function () {
                    var _a;
                    (_a = _this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Import);
                })
                    .setLabel((0, localiser_1.LOC)('import.button')),
            },
            'materials': {
                id: 'materials',
                label: (0, localiser_1.LOC)('materials.heading'),
                components: {},
                componentOrder: [],
                execButton: new button_1.ButtonComponent()
                    .setOnClick(function () {
                    var _a;
                    (_a = _this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Materials);
                })
                    .setLabel((0, localiser_1.LOC)('materials.button')),
            },
            'voxelise': {
                id: 'voxelise',
                label: (0, localiser_1.LOC)('voxelise.heading'),
                components: {
                    'constraintAxis': new combobox_1.ComboboxComponent()
                        .addItem({ payload: 'y', displayLocKey: 'voxelise.components.y_axis' })
                        .addItem({ payload: 'x', displayLocKey: 'voxelise.components.x_axis' })
                        .addItem({ payload: 'z', displayLocKey: 'voxelise.components.z_axis' })
                        .setLabel('voxelise.components.constraint_axis')
                        .addValueChangedListener(function (value) {
                        switch (value) {
                            case 'x': {
                                (0, error_util_1.ASSERT)(_this._appContext !== undefined && _this._appContext.minConstraint !== undefined && _this._appContext.maxConstraint !== undefined);
                                console.log('min', _this._appContext.minConstraint, 'max', _this._appContext.maxConstraint);
                                _this._ui.voxelise.components.size.setMin(_this._appContext.minConstraint.x);
                                _this._ui.voxelise.components.size.setMax(_this._appContext.maxConstraint.x);
                                break;
                            }
                            case 'y': {
                                _this._ui.voxelise.components.size.setMin(config_1.AppConfig.Get.CONSTRAINT_MINIMUM_HEIGHT);
                                _this._ui.voxelise.components.size.setMax(config_1.AppConfig.Get.CONSTRAINT_MAXIMUM_HEIGHT);
                                break;
                            }
                            case 'z': {
                                (0, error_util_1.ASSERT)(_this._appContext !== undefined && _this._appContext.minConstraint !== undefined && _this._appContext.maxConstraint !== undefined);
                                console.log('min', _this._appContext.minConstraint, 'max', _this._appContext.maxConstraint);
                                _this._ui.voxelise.components.size.setMin(_this._appContext.minConstraint.z);
                                _this._ui.voxelise.components.size.setMax(_this._appContext.maxConstraint.z);
                                break;
                            }
                        }
                    }),
                    'size': new slider_1.SliderComponent()
                        .setMin(3)
                        .setMax(380)
                        .setDefaultValue(80)
                        .setDecimals(0)
                        .setStep(1)
                        .setLabel('voxelise.components.size'),
                    'voxeliser': new combobox_1.ComboboxComponent()
                        .addItem({ payload: 'ray-based', displayLocKey: 'voxelise.components.ray_based' })
                        .addItem({ payload: 'bvh-ray', displayLocKey: 'voxelise.components.bvh_ray' })
                        .addItem({ payload: 'ncrb', displayLocKey: 'voxelise.components.ncrb' })
                        .setLabel('voxelise.components.algorithm'),
                    'ambientOcclusion': new checkbox_1.CheckboxComponent()
                        .setCheckedText('voxelise.components.on_recommended')
                        .setUncheckedText('voxelise.components.off_faster')
                        .setDefaultValue(true)
                        .setLabel('voxelise.components.ambient_occlusion'),
                    'multisampleColouring': new checkbox_1.CheckboxComponent()
                        .setCheckedText('voxelise.components.on_recommended')
                        .setUncheckedText('voxelise.components.off_faster')
                        .setDefaultValue(true)
                        .setLabel('voxelise.components.multisampling'),
                    'voxelOverlapRule': new combobox_1.ComboboxComponent()
                        .addItem({
                        displayLocKey: 'voxelise.components.average_recommended',
                        payload: 'average',
                    })
                        .addItem({
                        displayLocKey: 'voxelise.components.first',
                        payload: 'first',
                    })
                        .setLabel('voxelise.components.voxel_overlap'),
                    'placeholder': new placeholder_1.PlaceholderComponent()
                        .setPlaceholderText('misc.advanced_settings'),
                },
                componentOrder: [
                    'constraintAxis',
                    'size',
                    'placeholder',
                    'voxeliser',
                    'ambientOcclusion',
                    'multisampleColouring',
                    'voxelOverlapRule',
                ],
                execButton: new button_1.ButtonComponent()
                    .setOnClick(function () {
                    var _a;
                    (_a = _this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Voxelise);
                })
                    .setLabel((0, localiser_1.LOC)('voxelise.button')),
            },
            'assign': {
                id: 'assign',
                label: (0, localiser_1.LOC)('assign.heading'),
                components: {
                    'textureAtlas': new combobox_1.ComboboxComponent()
                        .addItem({ displayLocKey: 'assign.components.vanilla', payload: 'vanilla' })
                        .setLabel('assign.components.texture_atlas')
                        .setShouldObeyGroupEnables(false),
                    'blockPalette': new palette_1.PaletteComponent()
                        .setLabel('assign.components.block_palette'),
                    'dithering': new combobox_1.ComboboxComponent()
                        .addItems([{
                            displayLocKey: 'assign.components.ordered',
                            payload: 'ordered',
                        },
                        {
                            displayLocKey: 'assign.components.random',
                            payload: 'random',
                        },
                        {
                            displayLocKey: 'assign.components.off',
                            payload: 'off',
                        }])
                        .setLabel('assign.components.dithering')
                        .addEnabledChangedListener(function (isEnabled) {
                        _this._ui.assign.components.ditheringMagnitude.setEnabled(isEnabled && _this._ui.assign.components.dithering.getValue() !== 'off', false);
                    })
                        .addValueChangedListener(function (newValue) {
                        _this._ui.assign.components.ditheringMagnitude.setEnabled(newValue !== 'off', false);
                    }),
                    'ditheringMagnitude': new slider_1.SliderComponent()
                        .setMin(1)
                        .setMax(64)
                        .setDefaultValue(32)
                        .setDecimals(0)
                        .setStep(1)
                        .setLabel('assign.components.dithering_magnitude')
                        .setShouldObeyGroupEnables(false),
                    'fallable': new combobox_1.ComboboxComponent()
                        .addItems([{
                            displayLocKey: 'assign.components.replace_falling',
                            payload: 'replace-falling',
                        },
                        {
                            displayLocKey: 'assign.components.replace_fallable',
                            payload: 'replace-fallable',
                        },
                        {
                            displayLocKey: 'assign.components.do_nothing',
                            payload: 'do-nothing',
                        }])
                        .setLabel('assign.components.fallable_blocks'),
                    'colourAccuracy': new slider_1.SliderComponent()
                        .setMin(1)
                        .setMax(8)
                        .setDefaultValue(5)
                        .setDecimals(1)
                        .setStep(0.1)
                        .setLabel('assign.components.colour_accuracy'),
                    'contextualAveraging': new checkbox_1.CheckboxComponent()
                        .setCheckedText('voxelise.components.on_recommended')
                        .setUncheckedText('voxelise.components.off_faster')
                        .setDefaultValue(true)
                        .setLabel('assign.components.smart_averaging'),
                    'errorWeight': new slider_1.SliderComponent()
                        .setMin(0.0)
                        .setMax(2.0)
                        .setDefaultValue(0.2)
                        .setDecimals(2)
                        .setStep(0.01)
                        .setLabel('assign.components.smoothness'),
                    'calculateLighting': new checkbox_1.CheckboxComponent()
                        .setCheckedText('misc.on')
                        .setUncheckedText('misc.off')
                        .setDefaultValue(false)
                        .setLabel('assign.components.calculate_lighting')
                        .addValueChangedListener(function (newValue) {
                        var isEnabled = _this._ui.assign.components.calculateLighting.getEnabled();
                        _this._ui.assign.components.lightThreshold.setEnabled(newValue && isEnabled, false);
                    })
                        .addEnabledChangedListener(function (isEnabled) {
                        var value = _this._ui.assign.components.calculateLighting.getValue();
                        _this._ui.assign.components.lightThreshold.setEnabled(value && isEnabled, false);
                    }),
                    'lightThreshold': new slider_1.SliderComponent()
                        .setMin(0)
                        .setMax(14)
                        .setDefaultValue(1)
                        .setDecimals(0)
                        .setStep(1)
                        .setLabel('assign.components.light_threshold')
                        .setShouldObeyGroupEnables(false),
                    'placeholder': new placeholder_1.PlaceholderComponent()
                        .setPlaceholderText('misc.advanced_settings'),
                },
                componentOrder: [
                    'blockPalette',
                    'dithering',
                    'placeholder',
                    'textureAtlas',
                    'ditheringMagnitude',
                    'fallable',
                    'colourAccuracy',
                    'contextualAveraging',
                    'errorWeight',
                    'calculateLighting',
                    'lightThreshold',
                ],
                execButton: new button_1.ButtonComponent()
                    .setOnClick(function () {
                    var _a;
                    (_a = _this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Assign);
                })
                    .setLabel((0, localiser_1.LOC)('assign.button')),
            },
            'export': {
                id: 'export',
                label: (0, localiser_1.LOC)('export.heading'),
                components: {
                    'export': new combobox_1.ComboboxComponent()
                        .addItems([
                        {
                            displayLocKey: 'export.components.litematic',
                            payload: 'litematic',
                        },
                        {
                            displayLocKey: 'export.components.schematic',
                            payload: 'schematic',
                        },
                        /*
                        {
                            displayText: 'Wavefront OBJ (.obj)',
                            payload: 'obj',
                        },
                        */
                        {
                            displayLocKey: 'export.components.sponge_schematic',
                            payload: 'schem',
                        },
                        {
                            displayLocKey: 'export.components.structure_blocks',
                            payload: 'nbt',
                        },
                        {
                            displayLocKey: 'export.components.indexed_json',
                            payload: 'indexed_json',
                        },
                        {
                            displayLocKey: 'export.components.uncompressed_json',
                            payload: 'uncompressed_json',
                        },
                    ])
                        .setLabel('export.components.exporter'),
                },
                componentOrder: ['export'],
                execButton: new button_1.ButtonComponent()
                    .setLabel((0, localiser_1.LOC)('export.button'))
                    .setOnClick(function () {
                    var _a;
                    (_a = _this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Export);
                }),
            },
        };
        this._toolbarLeft = {
            groups: {
                'viewmode': {
                    components: {
                        'mesh': new toolbar_item_1.ToolbarItemComponent({ id: 'mesh', iconSVG: icons_1.AppIcons.MESH })
                            .onClick(function () {
                            renderer_1.Renderer.Get.setModelToUse(renderer_1.MeshType.TriangleMesh);
                        })
                            .isActive(function () {
                            return renderer_1.Renderer.Get.getActiveMeshType() === renderer_1.MeshType.TriangleMesh;
                        })
                            .isEnabled(function () {
                            return renderer_1.Renderer.Get.getModelsAvailable() >= renderer_1.MeshType.TriangleMesh;
                        })
                            .setTooltip('toolbar.view_mesh'),
                        'voxelMesh': new toolbar_item_1.ToolbarItemComponent({ id: 'voxelMesh', iconSVG: icons_1.AppIcons.VOXEL })
                            .onClick(function () {
                            renderer_1.Renderer.Get.setModelToUse(renderer_1.MeshType.VoxelMesh);
                        })
                            .isActive(function () {
                            return renderer_1.Renderer.Get.getActiveMeshType() === renderer_1.MeshType.VoxelMesh;
                        })
                            .isEnabled(function () {
                            return renderer_1.Renderer.Get.getModelsAvailable() >= renderer_1.MeshType.VoxelMesh;
                        })
                            .setTooltip('toolbar.view_voxel_mesh'),
                        'blockMesh': new toolbar_item_1.ToolbarItemComponent({ id: 'blockMesh', iconSVG: icons_1.AppIcons.BLOCK })
                            .onClick(function () {
                            renderer_1.Renderer.Get.setModelToUse(renderer_1.MeshType.BlockMesh);
                        })
                            .isActive(function () {
                            return renderer_1.Renderer.Get.getActiveMeshType() === renderer_1.MeshType.BlockMesh;
                        })
                            .isEnabled(function () {
                            return renderer_1.Renderer.Get.getModelsAvailable() >= renderer_1.MeshType.BlockMesh;
                        })
                            .setTooltip('toolbar.view_block_mesh'),
                    },
                    componentOrder: ['mesh', 'voxelMesh', 'blockMesh'],
                },
                'debug': {
                    components: {
                        'grid': new toolbar_item_1.ToolbarItemComponent({ id: 'grid', iconSVG: icons_1.AppIcons.GRID })
                            .onClick(function () {
                            renderer_1.Renderer.Get.toggleIsGridEnabled();
                        })
                            .isActive(function () {
                            return renderer_1.Renderer.Get.isGridEnabled();
                        })
                            .isEnabled(function () {
                            return renderer_1.Renderer.Get.getActiveMeshType() !== renderer_1.MeshType.None;
                        })
                            .setTooltip('toolbar.toggle_grid'),
                        'axes': new toolbar_item_1.ToolbarItemComponent({ id: 'axes', iconSVG: icons_1.AppIcons.AXES })
                            .onClick(function () {
                            renderer_1.Renderer.Get.toggleIsAxesEnabled();
                        })
                            .isActive(function () {
                            return renderer_1.Renderer.Get.isAxesEnabled();
                        })
                            .setTooltip('toolbar.toggle_axes'),
                        'night-vision': new toolbar_item_1.ToolbarItemComponent({ id: 'night', iconSVG: icons_1.AppIcons.BULB })
                            .onClick(function () {
                            renderer_1.Renderer.Get.toggleIsNightVisionEnabled();
                        })
                            .isActive(function () {
                            return renderer_1.Renderer.Get.isNightVisionEnabled();
                        })
                            .isEnabled(function () {
                            return renderer_1.Renderer.Get.canToggleNightVision();
                        })
                            .setTooltip('toolbar.toggle_night_vision'),
                    },
                    componentOrder: ['grid', 'axes', 'night-vision'],
                },
                'sliceHeight': {
                    components: {
                        'slice': new toolbar_item_1.ToolbarItemComponent({ id: 'slice', iconSVG: icons_1.AppIcons.SLICE })
                            .onClick(function () {
                            renderer_1.Renderer.Get.toggleSliceViewerEnabled();
                        })
                            .isEnabled(function () {
                            return renderer_1.Renderer.Get.getActiveMeshType() === renderer_1.MeshType.BlockMesh;
                        })
                            .isActive(function () {
                            return renderer_1.Renderer.Get.isSliceViewerEnabled();
                        })
                            .setTooltip('toolbar.toggle_slice_viewer'),
                        'plus': new toolbar_item_1.ToolbarItemComponent({ id: 'plus', iconSVG: icons_1.AppIcons.PLUS })
                            .onClick(function () {
                            renderer_1.Renderer.Get.incrementSliceHeight();
                        })
                            .isEnabled(function () {
                            return renderer_1.Renderer.Get.isSliceViewerEnabled() &&
                                renderer_1.Renderer.Get.canIncrementSliceHeight();
                        })
                            .setTooltip('toolbar.decrement_slice'),
                        'minus': new toolbar_item_1.ToolbarItemComponent({ id: 'minus', iconSVG: icons_1.AppIcons.MINUS })
                            .onClick(function () {
                            renderer_1.Renderer.Get.decrementSliceHeight();
                        })
                            .isEnabled(function () {
                            return renderer_1.Renderer.Get.isSliceViewerEnabled() &&
                                renderer_1.Renderer.Get.canDecrementSliceHeight();
                        })
                            .setTooltip('toolbar.increment_slice'),
                    },
                    componentOrder: ['slice', 'plus', 'minus'],
                },
            },
            groupsOrder: ['viewmode', 'debug', 'sliceHeight'],
        };
        this._toolbarRight = {
            groups: {
                'zoom': {
                    components: {
                        'zoomOut': new toolbar_item_1.ToolbarItemComponent({ id: 'zout', iconSVG: icons_1.AppIcons.MINUS })
                            .onClick(function () {
                            camera_1.ArcballCamera.Get.onZoomOut();
                        })
                            .setTooltip('toolbar.zoom_out'),
                        'zoomIn': new toolbar_item_1.ToolbarItemComponent({ id: 'zin', iconSVG: icons_1.AppIcons.PLUS })
                            .onClick(function () {
                            camera_1.ArcballCamera.Get.onZoomIn();
                        })
                            .setTooltip('toolbar.zoom_in'),
                        'reset': new toolbar_item_1.ToolbarItemComponent({ id: 'reset', iconSVG: icons_1.AppIcons.CENTRE })
                            .onClick(function () {
                            camera_1.ArcballCamera.Get.reset();
                        })
                            .setTooltip('toolbar.reset_camera'),
                    },
                    componentOrder: ['zoomOut', 'zoomIn', 'reset'],
                },
                'camera': {
                    components: {
                        'perspective': new toolbar_item_1.ToolbarItemComponent({ id: 'pers', iconSVG: icons_1.AppIcons.PERSPECTIVE })
                            .onClick(function () {
                            camera_1.ArcballCamera.Get.setCameraMode('perspective');
                        })
                            .isActive(function () {
                            return camera_1.ArcballCamera.Get.isPerspective();
                        })
                            .setTooltip('toolbar.perspective_camera'),
                        'orthographic': new toolbar_item_1.ToolbarItemComponent({ id: 'orth', iconSVG: icons_1.AppIcons.ORTHOGRAPHIC })
                            .onClick(function () {
                            camera_1.ArcballCamera.Get.setCameraMode('orthographic');
                        })
                            .isActive(function () {
                            return camera_1.ArcballCamera.Get.isOrthographic();
                        })
                            .setTooltip('toolbar.orthographic_camera'),
                    },
                    componentOrder: ['perspective', 'orthographic'],
                },
            },
            groupsOrder: ['camera', 'zoom'],
        };
        this._uiDull = this._ui;
        this._toolbarLeftDull = this._toolbarLeft.groups;
        this._toolbarRightDull = this._toolbarRight.groups;
        var languageComponents = new combobox_1.ComboboxComponent()
            .setLabel('settings.components.language')
            .addValueChangedListener(function (newLanguageCode) {
            console_1.AppConsole.info((0, localiser_1.LOC)('settings.changing_language'));
            localiser_1.Localiser.Get.changeLanguage(newLanguageCode);
        });
        base_1.locales.forEach(function (locale) {
            languageComponents.addItem({
                displayText: locale.display_name,
                payload: locale.language_code,
            });
        });
        this._ui.settings.components.language = languageComponents;
        event_1.EventManager.Get.add(event_1.EAppEvent.onLanguageChanged, function () {
            _this._handleLanguageChange();
        });
        event_1.EventManager.Get.add(event_1.EAppEvent.onTaskProgress, function (e) {
            var _a, _b;
            var lastAction = (_a = _this._appContext) === null || _a === void 0 ? void 0 : _a.getLastAction();
            if (lastAction !== undefined) {
                (_b = _this.getActionButton(lastAction)) === null || _b === void 0 ? void 0 : _b.setProgress(e[1]);
            }
        });
    }
    Object.defineProperty(UI, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    UI.prototype.bindToContext = function (context) {
        this._appContext = context;
    };
    UI.prototype.tick = function (isBusy) {
        if (isBusy) {
            document.body.style.cursor = 'progress';
        }
        else {
            document.body.style.cursor = 'default';
        }
        var canvasColumn = ui_util_1.UIUtil.getElementById('col-canvas');
        if (camera_1.ArcballCamera.Get.isUserRotating || camera_1.ArcballCamera.Get.isUserTranslating) {
            canvasColumn.style.cursor = 'grabbing';
        }
        else {
            canvasColumn.style.cursor = 'grab';
        }
        for (var groupName in this._toolbarLeftDull) {
            var toolbarGroup = this._toolbarLeftDull[groupName];
            for (var _i = 0, _a = toolbarGroup.componentOrder; _i < _a.length; _i++) {
                var toolbarItem = _a[_i];
                toolbarGroup.components[toolbarItem].tick();
            }
        }
        for (var groupName in this._toolbarRightDull) {
            var toolbarGroup = this._toolbarRightDull[groupName];
            for (var _b = 0, _c = toolbarGroup.componentOrder; _b < _c.length; _b++) {
                var toolbarItem = _c[_b];
                toolbarGroup.components[toolbarItem].tick();
            }
        }
    };
    UI.prototype.build = function () {
        // Build properties
        {
            var sidebarHTML = new misc_1.HTMLBuilder();
            sidebarHTML.add("<div class=\"container-properties\">");
            {
                sidebarHTML.add(header_1.HeaderComponent.Get.generateHTML());
                for (var _i = 0, _a = this.uiOrder; _i < _a.length; _i++) {
                    var groupName = _a[_i];
                    var group = this._uiDull[groupName];
                    sidebarHTML.add(this._getGroupHTML(group));
                }
            }
            sidebarHTML.add("</div>");
            sidebarHTML.placeInto('properties');
        }
        // Build toolbar
        {
            var toolbarHTML = new misc_1.HTMLBuilder();
            // Left
            toolbarHTML.add('<div class="toolbar-column">');
            for (var _b = 0, _c = this._toolbarLeft.groupsOrder; _b < _c.length; _b++) {
                var toolbarGroupName = _c[_b];
                toolbarHTML.add('<div class="toolbar-group">');
                var toolbarGroup = this._toolbarLeftDull[toolbarGroupName];
                for (var _d = 0, _e = toolbarGroup.componentOrder; _d < _e.length; _d++) {
                    var groupElementName = _e[_d];
                    var groupElement = toolbarGroup.components[groupElementName];
                    toolbarHTML.add(groupElement.generateHTML());
                }
                toolbarHTML.add('</div>');
            }
            toolbarHTML.add('</div>');
            // Right
            toolbarHTML.add('<div class="toolbar-column">');
            for (var _f = 0, _g = this._toolbarRight.groupsOrder; _f < _g.length; _f++) {
                var toolbarGroupName = _g[_f];
                toolbarHTML.add('<div class="toolbar-group">');
                var toolbarGroup = this._toolbarRightDull[toolbarGroupName];
                for (var _h = 0, _j = toolbarGroup.componentOrder; _h < _j.length; _h++) {
                    var groupElementName = _j[_h];
                    var groupElement = toolbarGroup.components[groupElementName];
                    toolbarHTML.add(groupElement.generateHTML());
                }
                toolbarHTML.add('</div>');
            }
            toolbarHTML.add('</div>');
            toolbarHTML.placeInto('toolbar');
        }
        // Build console
        console_1.AppConsole.Get.build();
        (0, split_js_1.default)(['.column-sidebar', '.column-canvas'], {
            sizes: [20, 80],
            minSize: [600, 500],
            gutterSize: 5,
        });
        (0, split_js_1.default)(['.column-properties', '.column-console'], {
            sizes: [85, 15],
            minSize: [0, 0],
            direction: 'vertical',
            gutterSize: 5,
        });
    };
    UI.prototype._forEachComponent = function (action, functor) {
        var group = this._getGroup(action);
        for (var _i = 0, _a = group.componentOrder; _i < _a.length; _i++) {
            var elementName = _a[_i];
            var element = group.components[elementName];
            functor(element);
        }
    };
    UI.prototype._getGroupHeadingLabel = function (action) {
        switch (action) {
            case util_1.EAction.Settings:
                return (0, localiser_1.LOC)('settings.heading');
            case util_1.EAction.Import:
                return (0, localiser_1.LOC)('import.heading');
            case util_1.EAction.Materials:
                return (0, localiser_1.LOC)('materials.heading');
            case util_1.EAction.Voxelise:
                return (0, localiser_1.LOC)('voxelise.heading');
            case util_1.EAction.Assign:
                return (0, localiser_1.LOC)('assign.heading');
            case util_1.EAction.Export:
                return (0, localiser_1.LOC)('export.heading');
        }
        (0, error_util_1.ASSERT)(false);
    };
    UI.prototype._getGroupButtonLabel = function (action) {
        switch (action) {
            case util_1.EAction.Import:
                return (0, localiser_1.LOC)('import.button');
            case util_1.EAction.Materials:
                return (0, localiser_1.LOC)('materials.button');
            case util_1.EAction.Voxelise:
                return (0, localiser_1.LOC)('voxelise.button');
            case util_1.EAction.Assign:
                return (0, localiser_1.LOC)('assign.button');
            case util_1.EAction.Export:
                return (0, localiser_1.LOC)('export.button');
        }
        (0, error_util_1.ASSERT)(false, "Cannot get label of '".concat(action, "'"));
    };
    UI.prototype._handleLanguageChange = function () {
        header_1.HeaderComponent.Get.refresh();
        Object.values(this._toolbarLeft.groups).forEach(function (group) {
            Object.values(group.components).forEach(function (comp) {
                comp.updateTranslation();
            });
        });
        Object.values(this._toolbarRight.groups).forEach(function (group) {
            Object.values(group.components).forEach(function (comp) {
                comp.updateTranslation();
            });
        });
        for (var i = 0; i < util_1.EAction.MAX; ++i) {
            var group = this._getGroup(i);
            var header = ui_util_1.UIUtil.getElementById("component_header_".concat(group.id));
            group.label = this._getGroupHeadingLabel(i);
            header.innerHTML = misc_1.MiscComponents.createGroupHeader(group.label);
            if (group.execButton !== undefined) {
                var newButtonLabel = this._getGroupButtonLabel(i);
                group.execButton.setLabel(newButtonLabel).updateLabel();
            }
            this._forEachComponent(i, function (component) {
                component.refresh();
            });
        }
        console_1.AppConsole.success((0, localiser_1.LOC)('settings.changed_language'));
    };
    /**
     * Rebuilds the HTML for all components in an action group.
     */
    UI.prototype.refreshComponents = function (action) {
        var group = this._getGroup(action);
        var element = document.getElementById("subcomponents_".concat(group.id));
        (0, error_util_1.ASSERT)(element !== null);
        element.innerHTML = this._getComponentsHTML(group);
        this._forEachComponent(action, function (component) {
            component.registerEvents();
            component.finalise();
        });
    };
    UI.prototype._getComponentsHTML = function (group) {
        var groupHTML = '';
        for (var _i = 0, _a = group.componentOrder; _i < _a.length; _i++) {
            var elementName = _a[_i];
            var element = group.components[elementName];
            (0, error_util_1.ASSERT)(element !== undefined, "No element for: ".concat(elementName));
            groupHTML += element.generateHTML();
        }
        return groupHTML;
    };
    UI.prototype._getGroupHTML = function (group) {
        var _a, _b;
        return "\n            <div id=\"component_header_".concat(group.id, "\">\n                ").concat(misc_1.MiscComponents.createGroupHeader(group.label), "\n            </div>\n            <div class=\"component-group\" id=\"subcomponents_").concat(group.id, "\">\n                ").concat(this._getComponentsHTML(group), "\n            </div>\n            ").concat((_b = (_a = group.execButton) === null || _a === void 0 ? void 0 : _a.generateHTML()) !== null && _b !== void 0 ? _b : '', "\n        ");
    };
    UI.prototype.getActionButton = function (action) {
        var group = this._getGroup(action);
        return group.execButton;
    };
    UI.prototype.registerEvents = function () {
        var _a, _b;
        header_1.HeaderComponent.Get.registerEvents();
        header_1.HeaderComponent.Get.finalise();
        for (var action = 0; action < util_1.EAction.MAX; ++action) {
            this._forEachComponent(action, function (component) {
                component.registerEvents();
                component.finalise();
            });
            var group = this._getGroup(action);
            (_a = group.execButton) === null || _a === void 0 ? void 0 : _a.registerEvents();
            (_b = group.execButton) === null || _b === void 0 ? void 0 : _b.finalise();
        }
        // Register toolbar left
        for (var _i = 0, _c = this._toolbarLeft.groupsOrder; _i < _c.length; _i++) {
            var toolbarGroupName = _c[_i];
            var toolbarGroup = this._toolbarLeftDull[toolbarGroupName];
            for (var _d = 0, _e = toolbarGroup.componentOrder; _d < _e.length; _d++) {
                var groupElementName = _e[_d];
                var element = toolbarGroup.components[groupElementName];
                element.registerEvents();
                element.finalise();
            }
        }
        // Register toolbar right
        for (var _f = 0, _g = this._toolbarRight.groupsOrder; _f < _g.length; _f++) {
            var toolbarGroupName = _g[_f];
            var toolbarGroup = this._toolbarRightDull[toolbarGroupName];
            for (var _h = 0, _j = toolbarGroup.componentOrder; _h < _j.length; _h++) {
                var groupElementName = _j[_h];
                var element = toolbarGroup.components[groupElementName];
                element.registerEvents();
                element.finalise();
            }
        }
    };
    Object.defineProperty(UI.prototype, "layout", {
        get: function () {
            return this._ui;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UI.prototype, "layoutDull", {
        get: function () {
            return this._uiDull;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Enable a specific action.
     */
    UI.prototype.enable = function (action) {
        var _a;
        if (action < util_1.EAction.MAX) {
            this._forEachComponent(action, function (component) {
                component.setEnabled(true);
            });
            (_a = this._getGroup(action).execButton) === null || _a === void 0 ? void 0 : _a.setEnabled(true);
        }
    };
    /**
     * Enable all actions up to and including a specific action.
     */
    UI.prototype.enableTo = function (action) {
        for (var i = 0; i <= action; ++i) {
            this.enable(i);
        }
    };
    /**
     * Disable a specific action and its dependent actions.
     */
    UI.prototype.disable = function (action) {
        var _a;
        for (var i = action; i < util_1.EAction.MAX; ++i) {
            this._forEachComponent(i, function (component) {
                component.setEnabled(false);
            });
            (_a = this._getGroup(i).execButton) === null || _a === void 0 ? void 0 : _a.setEnabled(false);
        }
    };
    /**
     * Disables all the actions.
     */
    UI.prototype.disableAll = function () {
        this.disable(util_1.EAction.Settings);
    };
    /**
     * Util function to get the `Group` associated with an `EAction`.
     */
    UI.prototype._getGroup = function (action) {
        var key = this.uiOrder[action];
        return this._uiDull[key];
    };
    UI.prototype.updateMaterialsAction = function (materialManager) {
        var _this = this;
        this.layout.materials.components = {};
        this.layout.materials.componentOrder = [];
        if (materialManager.materials.size == 0) {
            this.layoutDull['materials'].components["placeholder_element"] = new placeholder_1.PlaceholderComponent()
                .setPlaceholderText('materials.components.no_materials_loaded');
            this.layoutDull['materials'].componentOrder.push("placeholder_element");
        }
        else {
            materialManager.materials.forEach(function (material, materialName) {
                if (material.type === mesh_1.MaterialType.solid) {
                    _this.layoutDull['materials'].components["mat_".concat(materialName)] = new solid_material_1.SolidMaterialComponent(materialName, material)
                        .setUnlocalisedLabel(materialName)
                        .onChangeTypeDelegate(function () {
                        materialManager.changeMaterialType(materialName, mesh_1.MaterialType.textured);
                        _this.updateMaterialsAction(materialManager);
                    });
                }
                else {
                    _this.layoutDull['materials'].components["mat_".concat(materialName)] = new textured_material_1.TexturedMaterialComponent(materialName, material)
                        .setUnlocalisedLabel(materialName)
                        .onChangeTypeDelegate(function () {
                        materialManager.changeMaterialType(materialName, mesh_1.MaterialType.solid);
                        _this.updateMaterialsAction(materialManager);
                    })
                        .onChangeTransparencyTypeDelegate(function (newTransparency) {
                        materialManager.changeTransparencyType(materialName, newTransparency);
                        _this.updateMaterialsAction(materialManager);
                    });
                }
                _this.layoutDull['materials'].componentOrder.push("mat_".concat(materialName));
            });
        }
        this.refreshComponents(util_1.EAction.Materials);
    };
    return UI;
}());
exports.UI = UI;
//# sourceMappingURL=layout.js.map