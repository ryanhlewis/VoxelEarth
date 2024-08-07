import { AppContext } from '../app_context';
import { FallableBehaviour } from '../block_mesh';
import { TExporters } from '../exporters/exporters';
import { TLocalisedString } from '../localiser';
import { MaterialMapManager } from '../material-map';
import { EAction } from '../util';
import { TAxis } from '../util/type_util';
import { TDithering } from '../util/type_util';
import { TVoxelOverlapRule } from '../voxel_mesh';
import { TVoxelisers } from '../voxelisers/voxelisers';
import { ButtonComponent } from './components/button';
import { CheckboxComponent } from './components/checkbox';
import { ComboboxComponent } from './components/combobox';
import { ConfigComponent } from './components/config';
import { FileComponent } from './components/file_input';
import { PaletteComponent } from './components/palette';
import { PlaceholderComponent } from './components/placeholder';
import { SliderComponent } from './components/slider';
import { ToolbarItemComponent } from './components/toolbar_item';
import { VectorComponent } from './components/vector';
export type Group = {
    id: string;
    label: TLocalisedString;
    components: {
        [key: string]: ConfigComponent<any, any>;
    };
    componentOrder: string[];
    execButton?: ButtonComponent;
};
export interface ToolbarGroup {
    components: {
        [key: string]: ToolbarItemComponent;
    };
    componentOrder: string[];
}
export declare class UI {
    private static _instance;
    static get Get(): UI;
    constructor();
    uiOrder: string[];
    _ui: {
        settings: {
            id: string;
            label: TLocalisedString;
            components: {
                language: ComboboxComponent<string>;
                overrideHeight: SliderComponent;
            };
            componentOrder: string[];
        };
        import: {
            id: string;
            label: TLocalisedString;
            components: {
                input: FileComponent;
                rotation: VectorComponent;
            };
            componentOrder: string[];
            execButton: ButtonComponent;
        };
        materials: {
            id: string;
            label: TLocalisedString;
            components: {};
            componentOrder: any[];
            execButton: ButtonComponent;
        };
        voxelise: {
            id: string;
            label: TLocalisedString;
            components: {
                constraintAxis: ComboboxComponent<TAxis>;
                size: SliderComponent;
                voxeliser: ComboboxComponent<TVoxelisers>;
                ambientOcclusion: CheckboxComponent;
                multisampleColouring: CheckboxComponent;
                voxelOverlapRule: ComboboxComponent<TVoxelOverlapRule>;
                placeholder: PlaceholderComponent;
            };
            componentOrder: string[];
            execButton: ButtonComponent;
        };
        assign: {
            id: string;
            label: TLocalisedString;
            components: {
                textureAtlas: ComboboxComponent<string>;
                blockPalette: PaletteComponent;
                dithering: ComboboxComponent<TDithering>;
                ditheringMagnitude: SliderComponent;
                fallable: ComboboxComponent<FallableBehaviour>;
                colourAccuracy: SliderComponent;
                contextualAveraging: CheckboxComponent;
                errorWeight: SliderComponent;
                calculateLighting: CheckboxComponent;
                lightThreshold: SliderComponent;
                placeholder: PlaceholderComponent;
            };
            componentOrder: string[];
            execButton: ButtonComponent;
        };
        export: {
            id: string;
            label: TLocalisedString;
            components: {
                export: ComboboxComponent<TExporters>;
            };
            componentOrder: string[];
            execButton: ButtonComponent;
        };
    };
    private _toolbarLeft;
    private _toolbarRight;
    private _uiDull;
    private _toolbarLeftDull;
    private _toolbarRightDull;
    private _appContext?;
    bindToContext(context: AppContext): void;
    tick(isBusy: boolean): void;
    build(): void;
    private _forEachComponent;
    private _getGroupHeadingLabel;
    private _getGroupButtonLabel;
    private _handleLanguageChange;
    /**
     * Rebuilds the HTML for all components in an action group.
     */
    refreshComponents(action: EAction): void;
    private _getComponentsHTML;
    private _getGroupHTML;
    getActionButton(action: EAction): ButtonComponent;
    registerEvents(): void;
    get layout(): {
        settings: {
            id: string;
            label: TLocalisedString;
            components: {
                language: ComboboxComponent<string>;
                overrideHeight: SliderComponent;
            };
            componentOrder: string[];
        };
        import: {
            id: string;
            label: TLocalisedString;
            components: {
                input: FileComponent;
                rotation: VectorComponent;
            };
            componentOrder: string[];
            execButton: ButtonComponent;
        };
        materials: {
            id: string;
            label: TLocalisedString;
            components: {};
            componentOrder: any[];
            execButton: ButtonComponent;
        };
        voxelise: {
            id: string;
            label: TLocalisedString;
            components: {
                constraintAxis: ComboboxComponent<TAxis>;
                size: SliderComponent;
                voxeliser: ComboboxComponent<TVoxelisers>;
                ambientOcclusion: CheckboxComponent;
                multisampleColouring: CheckboxComponent;
                voxelOverlapRule: ComboboxComponent<TVoxelOverlapRule>;
                placeholder: PlaceholderComponent;
            };
            componentOrder: string[];
            execButton: ButtonComponent;
        };
        assign: {
            id: string;
            label: TLocalisedString;
            components: {
                textureAtlas: ComboboxComponent<string>;
                blockPalette: PaletteComponent;
                dithering: ComboboxComponent<TDithering>;
                ditheringMagnitude: SliderComponent;
                fallable: ComboboxComponent<FallableBehaviour>;
                colourAccuracy: SliderComponent;
                contextualAveraging: CheckboxComponent;
                errorWeight: SliderComponent;
                calculateLighting: CheckboxComponent;
                lightThreshold: SliderComponent;
                placeholder: PlaceholderComponent;
            };
            componentOrder: string[];
            execButton: ButtonComponent;
        };
        export: {
            id: string;
            label: TLocalisedString;
            components: {
                export: ComboboxComponent<TExporters>;
            };
            componentOrder: string[];
            execButton: ButtonComponent;
        };
    };
    get layoutDull(): {
        [key: string]: Group;
    };
    /**
     * Enable a specific action.
     */
    enable(action: EAction): void;
    /**
     * Enable all actions up to and including a specific action.
     */
    enableTo(action: EAction): void;
    /**
     * Disable a specific action and its dependent actions.
     */
    disable(action: EAction): void;
    /**
     * Disables all the actions.
     */
    disableAll(): void;
    /**
     * Util function to get the `Group` associated with an `EAction`.
     */
    private _getGroup;
    updateMaterialsAction(materialManager: MaterialMapManager): void;
}
