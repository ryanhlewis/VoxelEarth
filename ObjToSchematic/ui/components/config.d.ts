import { TTranslationMap } from '../../../loc/base';
import { DeepLeafKeys, TLocalisedString } from '../../localiser';
import { BaseComponent } from './base';
/**
 * A `ConfigComponent` is a UI element that has a value the user can change.
 * For example, sliders, comboboxes and checkboxes are `ConfigComponent`.
 */
export declare abstract class ConfigComponent<T, F> extends BaseComponent<F> {
    private _labelLocalisedKey?;
    protected _label: TLocalisedString;
    private _value?;
    private _onValueChangedListeners;
    private _onEnabledChangedListeners;
    private _canMinimise;
    constructor(defaultValue?: T);
    setDefaultValue(value: T): this;
    setLabel<P extends DeepLeafKeys<TTranslationMap>>(p: P): this;
    setUnlocalisedLabel(p: string): this;
    refresh(): void;
    private _updateLabel;
    /**
     * Get the currently set value of this UI element.
     */
    getValue(): T;
    /**
     * Add a delegate that will be called when the value changes.
     */
    addValueChangedListener(delegate: (newValue: T) => void): this;
    /**
     * Add a delegate that will be called when the value changes.
     */
    addEnabledChangedListener(delegate: (isEnabled: boolean) => void): this;
    finalise(): void;
    setCanMinimise(): this;
    generateHTML(): string;
    /**
     * The UI element that this label is describing.
     */
    protected abstract _generateInnerHTML(): string;
    protected _onEnabledChanged(): void;
    /**
     * Set the value of this UI element.
     */
    protected _setValue(value: T): void;
    /**
     * A delegate that is called when the value of this element changes.
     */
    protected _onValueChanged(): void;
    protected _getLabelId(): string;
}
