import { TLocalisedString } from '../../localiser';
import { BaseComponent } from './base';
export declare class ButtonComponent extends BaseComponent<HTMLDivElement> {
    private _label;
    private _defaultLabel;
    private _onClick;
    constructor();
    /**
     * Sets the delegate that is called when this button is clicked.
     */
    setOnClick(delegate: () => void): this;
    /**
     * Sets the label of this button.
     */
    setLabel(label: TLocalisedString): this;
    updateLabel(): this;
    /**
     * Override the current label with a new value.
     */
    setLabelOverride(label: TLocalisedString): this;
    /**
     * Remove the label override and set the label back to its default
     */
    removeLabelOverride(): this;
    /**
     * Start the loading animation
     */
    startLoading(): this;
    /**
     * Set the progress bar progress.
     * @param progress A number between 0.0 and 1.0 inclusive.
     */
    setProgress(progress: number): this;
    /**
     * Stop the loading animation
     */
    stopLoading(): this;
    resetLoading(): void;
    generateHTML(): string;
    registerEvents(): void;
    protected _onEnabledChanged(): void;
    finalise(): void;
    /**
     * Gets the ID of the DOM element for the button's progress bar.
     */
    private _getProgressBarId;
    protected _updateStyles(): void;
}
