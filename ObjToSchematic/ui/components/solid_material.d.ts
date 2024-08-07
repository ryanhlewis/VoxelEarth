import { SolidMaterial } from '../../mesh';
import { ConfigComponent } from './config';
export declare class SolidMaterialComponent extends ConfigComponent<SolidMaterial, HTMLDivElement> {
    private _typeElement;
    private _ColourComponent;
    private _alphaElement;
    constructor(materialName: string, material: SolidMaterial);
    refresh(): void;
    registerEvents(): void;
    finalise(): void;
    protected _generateInnerHTML(): string;
    protected _onValueChanged(): void;
    protected _onEnabledChanged(): void;
    private _onChangeTypeDelegate?;
    onChangeTypeDelegate(delegate: () => void): this;
}
