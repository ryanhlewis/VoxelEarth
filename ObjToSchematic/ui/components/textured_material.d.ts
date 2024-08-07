import { TexturedMaterial } from '../../mesh';
import { TTransparencyTypes } from '../../texture';
import { ConfigComponent } from './config';
export declare class TexturedMaterialComponent extends ConfigComponent<TexturedMaterial, HTMLDivElement> {
    private _typeElement;
    private _filteringElement;
    private _wrapElement;
    private _transparencyElement;
    private _ImageComponent;
    private _alphaValueElement?;
    private _alphaMapElement?;
    private _alphaChannelElement?;
    constructor(materialName: string, material: TexturedMaterial);
    refresh(): void;
    registerEvents(): void;
    protected _generateInnerHTML(): string;
    protected _onValueChanged(): void;
    protected _onEnabledChanged(): void;
    finalise(): void;
    private _onChangeTypeDelegate?;
    onChangeTypeDelegate(delegate: () => void): this;
    private _onChangeTransparencyTypeDelegate?;
    onChangeTransparencyTypeDelegate(delegate: (newTransparency: TTransparencyTypes) => void): this;
}
