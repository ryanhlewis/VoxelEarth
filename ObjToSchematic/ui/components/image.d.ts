import { TImageRawWrap } from '../../texture';
import { ConfigComponent } from './config';
export declare class ImageComponent extends ConfigComponent<Promise<TImageRawWrap>, HTMLImageElement> {
    private _switchElement;
    private _imageId;
    constructor(param?: TImageRawWrap);
    _generateInnerHTML(): string;
    registerEvents(): void;
    protected _onEnabledChanged(): void;
    protected _onValueChanged(): void;
    finalise(): void;
}
