"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonComponent = void 0;
const ui_util_1 = require("../../util/ui_util");
const base_1 = require("./base");
class ButtonComponent extends base_1.BaseComponent {
    constructor() {
        super();
        this._label = 'Unknown';
        this._defaultLabel = 'Unknown';
        this._onClick = () => { };
    }
    /**
     * Sets the delegate that is called when this button is clicked.
     */
    setOnClick(delegate) {
        this._onClick = delegate;
        return this;
    }
    /**
     * Sets the label of this button.
     */
    setLabel(label) {
        this._label = label;
        this._defaultLabel = label;
        return this;
    }
    updateLabel() {
        const labelElement = ui_util_1.UIUtil.getElementById(`${this._getId()}-button-label`);
        labelElement.innerHTML = this._label;
        return this;
    }
    /**
     * Override the current label with a new value.
     */
    setLabelOverride(label) {
        this._label = label;
        this.updateLabel();
        return this;
    }
    /**
     * Remove the label override and set the label back to its default
     */
    removeLabelOverride() {
        this._label = this._defaultLabel;
        this.updateLabel();
        return this;
    }
    /**
     * Start the loading animation
     */
    startLoading() {
        this._getElement().classList.add('button-loading');
        return this;
    }
    /**
     * Set the progress bar progress.
     * @param progress A number between 0.0 and 1.0 inclusive.
     */
    setProgress(progress) {
        const progressBarElement = ui_util_1.UIUtil.getElementById(this._getProgressBarId());
        progressBarElement.style.width = `${progress * 100}%`;
        return this;
    }
    /**
     * Stop the loading animation
     */
    stopLoading() {
        this._getElement().classList.remove('button-loading');
        return this;
    }
    resetLoading() {
        this.stopLoading();
        this.setProgress(0.0);
    }
    generateHTML() {
        return `
            <div class="container-button">
                <div class="struct-prop button" id="${this._getId()}">
                    <div class="button-label" id="${this._getId()}-button-label">${this._label}</div>
                    <div class="button-progress" id="${this._getProgressBarId()}"></div>
                </div>
            </div>
        `;
    }
    registerEvents() {
        this._getElement().addEventListener('click', () => {
            var _a;
            if (this.enabled) {
                (_a = this._onClick) === null || _a === void 0 ? void 0 : _a.call(this);
            }
        });
        this._getElement().addEventListener('mouseenter', () => {
            this._setHovered(true);
            this._updateStyles();
        });
        this._getElement().addEventListener('mouseleave', () => {
            this._setHovered(false);
            this._updateStyles();
        });
    }
    _onEnabledChanged() {
        this._updateStyles();
    }
    finalise() {
        this._updateStyles();
    }
    /**
     * Gets the ID of the DOM element for the button's progress bar.
     */
    _getProgressBarId() {
        return this._getId() + '-progress';
    }
    _updateStyles() {
        ui_util_1.UIUtil.updateStyles(this._getElement(), {
            isActive: true,
            isEnabled: this.enabled,
            isHovered: this.hovered,
        });
    }
}
exports.ButtonComponent = ButtonComponent;
