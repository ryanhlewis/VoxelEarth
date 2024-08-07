import { TTranslationMap } from '../../../loc/base';
import { DeepLeafKeys } from '../../localiser';
import { ConfigComponent } from './config';
export declare class CheckboxComponent extends ConfigComponent<boolean, HTMLSelectElement> {
    private _checked;
    private _unchecked;
    constructor();
    setUnlocalisedCheckedText(text: string): this;
    setUnlocalisedUncheckedText(text: string): this;
    setCheckedText(key: DeepLeafKeys<TTranslationMap>): this;
    setUncheckedText(key: DeepLeafKeys<TTranslationMap>): this;
    registerEvents(): void;
    private _onClick;
    private _onMouseEnterLeave;
    _generateInnerHTML(): string;
    protected _onValueChanged(): void;
    finalise(): void;
    protected _onEnabledChanged(): void;
    private _getPipId;
    private _getTextId;
    check(): void;
    uncheck(): void;
    protected _updateStyles(): void;
    refresh(): void;
}
