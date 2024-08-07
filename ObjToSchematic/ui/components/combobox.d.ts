import { TTranslationMap } from '../../../loc/base';
import { DeepLeafKeys } from '../../localiser';
import { ConfigComponent } from './config';
export type ComboBoxItem<T> = {
    payload: T;
    displayLocKey: DeepLeafKeys<TTranslationMap>;
} | {
    payload: T;
    displayText: string;
};
export declare class ComboboxComponent<T> extends ConfigComponent<T, HTMLSelectElement> {
    private _items;
    constructor();
    addItems(items: ComboBoxItem<T>[]): this;
    addItem(item: ComboBoxItem<T>): this;
    registerEvents(): void;
    setOptionEnabled(index: number, enabled: boolean): void;
    _generateInnerHTML(): string;
    protected _onValueChanged(): void;
    protected _onEnabledChanged(): void;
    protected _updateStyles(): void;
    finalise(): void;
    refresh(): void;
    setValue(value: T): void;
}
