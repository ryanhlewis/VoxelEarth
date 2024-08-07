import { MaterialType, SolidMaterial, TexturedMaterial } from '../../mesh';
import { ConfigComponent } from './config';
export declare class MaterialTypeComponent extends ConfigComponent<MaterialType, HTMLDivElement> {
    private _solidButton;
    private _texturedButton;
    private _material;
    constructor(material: SolidMaterial | TexturedMaterial);
    _generateInnerHTML(): string;
    finalise(): void;
    registerEvents(): void;
    protected _onEnabledChanged(): void;
    protected _onValueChanged(): void;
    private _onClickChangeTypeDelegate?;
    onClickChangeTypeDelegate(delegate: () => void): this;
}
