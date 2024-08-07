import { ConfigComponent } from './config';
export declare class NumberComponent extends ConfigComponent<number, HTMLInputElement> {
    private _min;
    private _max;
    private _step;
    private _hovering;
    constructor();
    /**
     * Set the minimum value the input can be set to.
     */
    setMin(min: number): this;
    /**
     * Set the maximum value the input can be set to.
     */
    setMax(max: number): this;
    /**
     * Set the number of steps to display the value to.
     */
    setStep(step: number): this;
    registerEvents(): void;
    _generateInnerHTML(): string;
    protected _onEnabledChanged(): void;
    private _onTypedValue;
    protected _onValueChanged(): void;
    protected _updateStyles(): void;
}
