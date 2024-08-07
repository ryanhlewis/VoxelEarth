"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UI = void 0;
const split_js_1 = require("split.js");
const base_1 = require("../../loc/base");
const camera_1 = require("../camera");
const event_1 = require("../event");
const localiser_1 = require("../localiser");
const mesh_1 = require("../mesh");
const renderer_1 = require("../renderer");
const util_1 = require("../util");
const error_util_1 = require("../util/error_util");
const ui_util_1 = require("../util/ui_util");
const button_1 = require("./components/button");
const checkbox_1 = require("./components/checkbox");
const combobox_1 = require("./components/combobox");
const file_input_1 = require("./components/file_input");
const header_1 = require("./components/header");
const palette_1 = require("./components/palette");
const placeholder_1 = require("./components/placeholder");
const slider_1 = require("./components/slider");
const solid_material_1 = require("./components/solid_material");
const textured_material_1 = require("./components/textured_material");
const toolbar_item_1 = require("./components/toolbar_item");
const vector_1 = require("./components/vector");
const console_1 = require("./console");
const icons_1 = require("./icons");
const misc_1 = require("./misc");
const config_1 = require("../config");
class UI {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
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
                        .addValueChangedListener((newValue) => {
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
                        .setOnMouseEnterExit((state, component) => {
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
                    .setOnClick(() => {
                    var _a;
                    (_a = this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Import);
                })
                    .setLabel((0, localiser_1.LOC)('import.button')),
            },
            'materials': {
                id: 'materials',
                label: (0, localiser_1.LOC)('materials.heading'),
                components: {},
                componentOrder: [],
                execButton: new button_1.ButtonComponent()
                    .setOnClick(() => {
                    var _a;
                    (_a = this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Materials);
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
                        .addValueChangedListener((value) => {
                        switch (value) {
                            case 'x': {
                                (0, error_util_1.ASSERT)(this._appContext !== undefined && this._appContext.minConstraint !== undefined && this._appContext.maxConstraint !== undefined);
                                console.log('min', this._appContext.minConstraint, 'max', this._appContext.maxConstraint);
                                this._ui.voxelise.components.size.setMin(this._appContext.minConstraint.x);
                                this._ui.voxelise.components.size.setMax(this._appContext.maxConstraint.x);
                                break;
                            }
                            case 'y': {
                                this._ui.voxelise.components.size.setMin(config_1.AppConfig.Get.CONSTRAINT_MINIMUM_HEIGHT);
                                this._ui.voxelise.components.size.setMax(config_1.AppConfig.Get.CONSTRAINT_MAXIMUM_HEIGHT);
                                break;
                            }
                            case 'z': {
                                (0, error_util_1.ASSERT)(this._appContext !== undefined && this._appContext.minConstraint !== undefined && this._appContext.maxConstraint !== undefined);
                                console.log('min', this._appContext.minConstraint, 'max', this._appContext.maxConstraint);
                                this._ui.voxelise.components.size.setMin(this._appContext.minConstraint.z);
                                this._ui.voxelise.components.size.setMax(this._appContext.maxConstraint.z);
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
                    .setOnClick(() => {
                    var _a;
                    (_a = this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Voxelise);
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
                        .addEnabledChangedListener((isEnabled) => {
                        this._ui.assign.components.ditheringMagnitude.setEnabled(isEnabled && this._ui.assign.components.dithering.getValue() !== 'off', false);
                    })
                        .addValueChangedListener((newValue) => {
                        this._ui.assign.components.ditheringMagnitude.setEnabled(newValue !== 'off', false);
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
                        .addValueChangedListener((newValue) => {
                        const isEnabled = this._ui.assign.components.calculateLighting.getEnabled();
                        this._ui.assign.components.lightThreshold.setEnabled(newValue && isEnabled, false);
                    })
                        .addEnabledChangedListener((isEnabled) => {
                        const value = this._ui.assign.components.calculateLighting.getValue();
                        this._ui.assign.components.lightThreshold.setEnabled(value && isEnabled, false);
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
                    .setOnClick(() => {
                    var _a;
                    (_a = this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Assign);
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
                    .setOnClick(() => {
                    var _a;
                    (_a = this._appContext) === null || _a === void 0 ? void 0 : _a.do(util_1.EAction.Export);
                }),
            },
        };
        this._toolbarLeft = {
            groups: {
                'viewmode': {
                    components: {
                        'mesh': new toolbar_item_1.ToolbarItemComponent({ id: 'mesh', iconSVG: icons_1.AppIcons.MESH })
                            .onClick(() => {
                            renderer_1.Renderer.Get.setModelToUse(renderer_1.MeshType.TriangleMesh);
                        })
                            .isActive(() => {
                            return renderer_1.Renderer.Get.getActiveMeshType() === renderer_1.MeshType.TriangleMesh;
                        })
                            .isEnabled(() => {
                            return renderer_1.Renderer.Get.getModelsAvailable() >= renderer_1.MeshType.TriangleMesh;
                        })
                            .setTooltip('toolbar.view_mesh'),
                        'voxelMesh': new toolbar_item_1.ToolbarItemComponent({ id: 'voxelMesh', iconSVG: icons_1.AppIcons.VOXEL })
                            .onClick(() => {
                            renderer_1.Renderer.Get.setModelToUse(renderer_1.MeshType.VoxelMesh);
                        })
                            .isActive(() => {
                            return renderer_1.Renderer.Get.getActiveMeshType() === renderer_1.MeshType.VoxelMesh;
                        })
                            .isEnabled(() => {
                            return renderer_1.Renderer.Get.getModelsAvailable() >= renderer_1.MeshType.VoxelMesh;
                        })
                            .setTooltip('toolbar.view_voxel_mesh'),
                        'blockMesh': new toolbar_item_1.ToolbarItemComponent({ id: 'blockMesh', iconSVG: icons_1.AppIcons.BLOCK })
                            .onClick(() => {
                            renderer_1.Renderer.Get.setModelToUse(renderer_1.MeshType.BlockMesh);
                        })
                            .isActive(() => {
                            return renderer_1.Renderer.Get.getActiveMeshType() === renderer_1.MeshType.BlockMesh;
                        })
                            .isEnabled(() => {
                            return renderer_1.Renderer.Get.getModelsAvailable() >= renderer_1.MeshType.BlockMesh;
                        })
                            .setTooltip('toolbar.view_block_mesh'),
                    },
                    componentOrder: ['mesh', 'voxelMesh', 'blockMesh'],
                },
                'debug': {
                    components: {
                        'grid': new toolbar_item_1.ToolbarItemComponent({ id: 'grid', iconSVG: icons_1.AppIcons.GRID })
                            .onClick(() => {
                            renderer_1.Renderer.Get.toggleIsGridEnabled();
                        })
                            .isActive(() => {
                            return renderer_1.Renderer.Get.isGridEnabled();
                        })
                            .isEnabled(() => {
                            return renderer_1.Renderer.Get.getActiveMeshType() !== renderer_1.MeshType.None;
                        })
                            .setTooltip('toolbar.toggle_grid'),
                        'axes': new toolbar_item_1.ToolbarItemComponent({ id: 'axes', iconSVG: icons_1.AppIcons.AXES })
                            .onClick(() => {
                            renderer_1.Renderer.Get.toggleIsAxesEnabled();
                        })
                            .isActive(() => {
                            return renderer_1.Renderer.Get.isAxesEnabled();
                        })
                            .setTooltip('toolbar.toggle_axes'),
                        'night-vision': new toolbar_item_1.ToolbarItemComponent({ id: 'night', iconSVG: icons_1.AppIcons.BULB })
                            .onClick(() => {
                            renderer_1.Renderer.Get.toggleIsNightVisionEnabled();
                        })
                            .isActive(() => {
                            return renderer_1.Renderer.Get.isNightVisionEnabled();
                        })
                            .isEnabled(() => {
                            return renderer_1.Renderer.Get.canToggleNightVision();
                        })
                            .setTooltip('toolbar.toggle_night_vision'),
                    },
                    componentOrder: ['grid', 'axes', 'night-vision'],
                },
                'sliceHeight': {
                    components: {
                        'slice': new toolbar_item_1.ToolbarItemComponent({ id: 'slice', iconSVG: icons_1.AppIcons.SLICE })
                            .onClick(() => {
                            renderer_1.Renderer.Get.toggleSliceViewerEnabled();
                        })
                            .isEnabled(() => {
                            return renderer_1.Renderer.Get.getActiveMeshType() === renderer_1.MeshType.BlockMesh;
                        })
                            .isActive(() => {
                            return renderer_1.Renderer.Get.isSliceViewerEnabled();
                        })
                            .setTooltip('toolbar.toggle_slice_viewer'),
                        'plus': new toolbar_item_1.ToolbarItemComponent({ id: 'plus', iconSVG: icons_1.AppIcons.PLUS })
                            .onClick(() => {
                            renderer_1.Renderer.Get.incrementSliceHeight();
                        })
                            .isEnabled(() => {
                            return renderer_1.Renderer.Get.isSliceViewerEnabled() &&
                                renderer_1.Renderer.Get.canIncrementSliceHeight();
                        })
                            .setTooltip('toolbar.decrement_slice'),
                        'minus': new toolbar_item_1.ToolbarItemComponent({ id: 'minus', iconSVG: icons_1.AppIcons.MINUS })
                            .onClick(() => {
                            renderer_1.Renderer.Get.decrementSliceHeight();
                        })
                            .isEnabled(() => {
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
                            .onClick(() => {
                            camera_1.ArcballCamera.Get.onZoomOut();
                        })
                            .setTooltip('toolbar.zoom_out'),
                        'zoomIn': new toolbar_item_1.ToolbarItemComponent({ id: 'zin', iconSVG: icons_1.AppIcons.PLUS })
                            .onClick(() => {
                            camera_1.ArcballCamera.Get.onZoomIn();
                        })
                            .setTooltip('toolbar.zoom_in'),
                        'reset': new toolbar_item_1.ToolbarItemComponent({ id: 'reset', iconSVG: icons_1.AppIcons.CENTRE })
                            .onClick(() => {
                            camera_1.ArcballCamera.Get.reset();
                        })
                            .setTooltip('toolbar.reset_camera'),
                    },
                    componentOrder: ['zoomOut', 'zoomIn', 'reset'],
                },
                'camera': {
                    components: {
                        'perspective': new toolbar_item_1.ToolbarItemComponent({ id: 'pers', iconSVG: icons_1.AppIcons.PERSPECTIVE })
                            .onClick(() => {
                            camera_1.ArcballCamera.Get.setCameraMode('perspective');
                        })
                            .isActive(() => {
                            return camera_1.ArcballCamera.Get.isPerspective();
                        })
                            .setTooltip('toolbar.perspective_camera'),
                        'orthographic': new toolbar_item_1.ToolbarItemComponent({ id: 'orth', iconSVG: icons_1.AppIcons.ORTHOGRAPHIC })
                            .onClick(() => {
                            camera_1.ArcballCamera.Get.setCameraMode('orthographic');
                        })
                            .isActive(() => {
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
        const languageComponents = new combobox_1.ComboboxComponent()
            .setLabel('settings.components.language')
            .addValueChangedListener((newLanguageCode) => {
            console_1.AppConsole.info((0, localiser_1.LOC)('settings.changing_language'));
            localiser_1.Localiser.Get.changeLanguage(newLanguageCode);
        });
        base_1.locales.forEach((locale) => {
            languageComponents.addItem({
                displayText: locale.display_name,
                payload: locale.language_code,
            });
        });
        this._ui.settings.components.language = languageComponents;
        event_1.EventManager.Get.add(event_1.EAppEvent.onLanguageChanged, () => {
            this._handleLanguageChange();
        });
        event_1.EventManager.Get.add(event_1.EAppEvent.onTaskProgress, (e) => {
            var _a, _b;
            const lastAction = (_a = this._appContext) === null || _a === void 0 ? void 0 : _a.getLastAction();
            if (lastAction !== undefined) {
                (_b = this.getActionButton(lastAction)) === null || _b === void 0 ? void 0 : _b.setProgress(e[1]);
            }
        });
    }
    bindToContext(context) {
        this._appContext = context;
    }
    tick(isBusy) {
        if (isBusy) {
            document.body.style.cursor = 'progress';
        }
        else {
            document.body.style.cursor = 'default';
        }
        const canvasColumn = ui_util_1.UIUtil.getElementById('col-canvas');
        if (camera_1.ArcballCamera.Get.isUserRotating || camera_1.ArcballCamera.Get.isUserTranslating) {
            canvasColumn.style.cursor = 'grabbing';
        }
        else {
            canvasColumn.style.cursor = 'grab';
        }
        for (const groupName in this._toolbarLeftDull) {
            const toolbarGroup = this._toolbarLeftDull[groupName];
            for (const toolbarItem of toolbarGroup.componentOrder) {
                toolbarGroup.components[toolbarItem].tick();
            }
        }
        for (const groupName in this._toolbarRightDull) {
            const toolbarGroup = this._toolbarRightDull[groupName];
            for (const toolbarItem of toolbarGroup.componentOrder) {
                toolbarGroup.components[toolbarItem].tick();
            }
        }
    }
    build() {
        // Build properties
        {
            const sidebarHTML = new misc_1.HTMLBuilder();
            sidebarHTML.add(`<div class="container-properties">`);
            {
                sidebarHTML.add(header_1.HeaderComponent.Get.generateHTML());
                for (const groupName of this.uiOrder) {
                    const group = this._uiDull[groupName];
                    sidebarHTML.add(this._getGroupHTML(group));
                }
            }
            sidebarHTML.add(`</div>`);
            sidebarHTML.placeInto('properties');
        }
        // Build toolbar
        {
            const toolbarHTML = new misc_1.HTMLBuilder();
            // Left
            toolbarHTML.add('<div class="toolbar-column">');
            for (const toolbarGroupName of this._toolbarLeft.groupsOrder) {
                toolbarHTML.add('<div class="toolbar-group">');
                const toolbarGroup = this._toolbarLeftDull[toolbarGroupName];
                for (const groupElementName of toolbarGroup.componentOrder) {
                    const groupElement = toolbarGroup.components[groupElementName];
                    toolbarHTML.add(groupElement.generateHTML());
                }
                toolbarHTML.add('</div>');
            }
            toolbarHTML.add('</div>');
            // Right
            toolbarHTML.add('<div class="toolbar-column">');
            for (const toolbarGroupName of this._toolbarRight.groupsOrder) {
                toolbarHTML.add('<div class="toolbar-group">');
                const toolbarGroup = this._toolbarRightDull[toolbarGroupName];
                for (const groupElementName of toolbarGroup.componentOrder) {
                    const groupElement = toolbarGroup.components[groupElementName];
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
    }
    _forEachComponent(action, functor) {
        const group = this._getGroup(action);
        for (const elementName of group.componentOrder) {
            const element = group.components[elementName];
            functor(element);
        }
    }
    _getGroupHeadingLabel(action) {
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
    }
    _getGroupButtonLabel(action) {
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
        (0, error_util_1.ASSERT)(false, `Cannot get label of '${action}'`);
    }
    _handleLanguageChange() {
        header_1.HeaderComponent.Get.refresh();
        Object.values(this._toolbarLeft.groups).forEach((group) => {
            Object.values(group.components).forEach((comp) => {
                comp.updateTranslation();
            });
        });
        Object.values(this._toolbarRight.groups).forEach((group) => {
            Object.values(group.components).forEach((comp) => {
                comp.updateTranslation();
            });
        });
        for (let i = 0; i < util_1.EAction.MAX; ++i) {
            const group = this._getGroup(i);
            const header = ui_util_1.UIUtil.getElementById(`component_header_${group.id}`);
            group.label = this._getGroupHeadingLabel(i);
            header.innerHTML = misc_1.MiscComponents.createGroupHeader(group.label);
            if (group.execButton !== undefined) {
                const newButtonLabel = this._getGroupButtonLabel(i);
                group.execButton.setLabel(newButtonLabel).updateLabel();
            }
            this._forEachComponent(i, (component) => {
                component.refresh();
            });
        }
        console_1.AppConsole.success((0, localiser_1.LOC)('settings.changed_language'));
    }
    /**
     * Rebuilds the HTML for all components in an action group.
     */
    refreshComponents(action) {
        const group = this._getGroup(action);
        const element = document.getElementById(`subcomponents_${group.id}`);
        (0, error_util_1.ASSERT)(element !== null);
        element.innerHTML = this._getComponentsHTML(group);
        this._forEachComponent(action, (component) => {
            component.registerEvents();
            component.finalise();
        });
    }
    _getComponentsHTML(group) {
        let groupHTML = '';
        for (const elementName of group.componentOrder) {
            const element = group.components[elementName];
            (0, error_util_1.ASSERT)(element !== undefined, `No element for: ${elementName}`);
            groupHTML += element.generateHTML();
        }
        return groupHTML;
    }
    _getGroupHTML(group) {
        var _a, _b;
        return `
            <div id="component_header_${group.id}">
                ${misc_1.MiscComponents.createGroupHeader(group.label)}
            </div>
            <div class="component-group" id="subcomponents_${group.id}">
                ${this._getComponentsHTML(group)}
            </div>
            ${(_b = (_a = group.execButton) === null || _a === void 0 ? void 0 : _a.generateHTML()) !== null && _b !== void 0 ? _b : ''}
        `;
    }
    getActionButton(action) {
        const group = this._getGroup(action);
        return group.execButton;
    }
    registerEvents() {
        var _a, _b;
        header_1.HeaderComponent.Get.registerEvents();
        header_1.HeaderComponent.Get.finalise();
        for (let action = 0; action < util_1.EAction.MAX; ++action) {
            this._forEachComponent(action, (component) => {
                component.registerEvents();
                component.finalise();
            });
            const group = this._getGroup(action);
            (_a = group.execButton) === null || _a === void 0 ? void 0 : _a.registerEvents();
            (_b = group.execButton) === null || _b === void 0 ? void 0 : _b.finalise();
        }
        // Register toolbar left
        for (const toolbarGroupName of this._toolbarLeft.groupsOrder) {
            const toolbarGroup = this._toolbarLeftDull[toolbarGroupName];
            for (const groupElementName of toolbarGroup.componentOrder) {
                const element = toolbarGroup.components[groupElementName];
                element.registerEvents();
                element.finalise();
            }
        }
        // Register toolbar right
        for (const toolbarGroupName of this._toolbarRight.groupsOrder) {
            const toolbarGroup = this._toolbarRightDull[toolbarGroupName];
            for (const groupElementName of toolbarGroup.componentOrder) {
                const element = toolbarGroup.components[groupElementName];
                element.registerEvents();
                element.finalise();
            }
        }
    }
    get layout() {
        return this._ui;
    }
    get layoutDull() {
        return this._uiDull;
    }
    /**
     * Enable a specific action.
     */
    enable(action) {
        var _a;
        if (action < util_1.EAction.MAX) {
            this._forEachComponent(action, (component) => {
                component.setEnabled(true);
            });
            (_a = this._getGroup(action).execButton) === null || _a === void 0 ? void 0 : _a.setEnabled(true);
        }
    }
    /**
     * Enable all actions up to and including a specific action.
     */
    enableTo(action) {
        for (let i = 0; i <= action; ++i) {
            this.enable(i);
        }
    }
    /**
     * Disable a specific action and its dependent actions.
     */
    disable(action) {
        var _a;
        for (let i = action; i < util_1.EAction.MAX; ++i) {
            this._forEachComponent(i, (component) => {
                component.setEnabled(false);
            });
            (_a = this._getGroup(i).execButton) === null || _a === void 0 ? void 0 : _a.setEnabled(false);
        }
    }
    /**
     * Disables all the actions.
     */
    disableAll() {
        this.disable(util_1.EAction.Settings);
    }
    /**
     * Util function to get the `Group` associated with an `EAction`.
     */
    _getGroup(action) {
        const key = this.uiOrder[action];
        return this._uiDull[key];
    }
    updateMaterialsAction(materialManager) {
        this.layout.materials.components = {};
        this.layout.materials.componentOrder = [];
        if (materialManager.materials.size == 0) {
            this.layoutDull['materials'].components[`placeholder_element`] = new placeholder_1.PlaceholderComponent()
                .setPlaceholderText('materials.components.no_materials_loaded');
            this.layoutDull['materials'].componentOrder.push(`placeholder_element`);
        }
        else {
            materialManager.materials.forEach((material, materialName) => {
                if (material.type === mesh_1.MaterialType.solid) {
                    this.layoutDull['materials'].components[`mat_${materialName}`] = new solid_material_1.SolidMaterialComponent(materialName, material)
                        .setUnlocalisedLabel(materialName)
                        .onChangeTypeDelegate(() => {
                        materialManager.changeMaterialType(materialName, mesh_1.MaterialType.textured);
                        this.updateMaterialsAction(materialManager);
                    });
                }
                else {
                    this.layoutDull['materials'].components[`mat_${materialName}`] = new textured_material_1.TexturedMaterialComponent(materialName, material)
                        .setUnlocalisedLabel(materialName)
                        .onChangeTypeDelegate(() => {
                        materialManager.changeMaterialType(materialName, mesh_1.MaterialType.solid);
                        this.updateMaterialsAction(materialManager);
                    })
                        .onChangeTransparencyTypeDelegate((newTransparency) => {
                        materialManager.changeTransparencyType(materialName, newTransparency);
                        this.updateMaterialsAction(materialManager);
                    });
                }
                this.layoutDull['materials'].componentOrder.push(`mat_${materialName}`);
            });
        }
        this.refreshComponents(util_1.EAction.Materials);
    }
}
exports.UI = UI;
