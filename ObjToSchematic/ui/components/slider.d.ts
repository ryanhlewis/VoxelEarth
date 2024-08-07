import { ConfigComponent } from './config';
export type TSliderParams = {
    min: number;
    max: number;
    value: number;
    decimals: number;
    step: number;
};
export declare class SliderComponent extends ConfigComponent<number, HTMLDivElement> {
    private _min;
    private _max;
    private _decimals;
    private _step;
    private _dragging;
    private _internalValue;
    private _valueHovered;
    constructor();
    setValue(value: number): void;
    setDefaultValue(value: number): this;
    /**
     * Set the minimum value the slider can be set to.
     */
    setMin(min: number): this;
    /**
     * Set the maximum value the slider can be set to.
     */
    setMax(max: number): this;
    /**
     * Set the number of decimals to display the value to.
     */
    setDecimals(decimals: number): this;
    /**
     * Set the step the value is increased/decreased by.
     */
    setStep(step: number): this;
    registerEvents(): void;
    _generateInnerHTML(): string;
    protected _onEnabledChanged(): void;
    protected _onValueChanged(): void;
    private _onScrollSlider;
    private _onDragSlider;
    private _onTypedValue;
    private _onInternalValueUpdated;
    /**
     * Gets the ID of the DOM element for the slider's value.
     */
    private _getSliderValueId;
    /**
     * Gets the ID of the DOM element for the slider's bar.
     */
    private _getSliderBarId;
    protected _updateStyles(): void;
}
