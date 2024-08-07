"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarItemComponent = void 0;
const error_util_1 = require("../../util/error_util");
const ui_util_1 = require("../../util/ui_util");
const base_1 = require("./base");
const localiser_1 = require("../../localiser");
class ToolbarItemComponent extends base_1.BaseComponent {
    constructor(params) {
        super();
        this._isActive = false;
        this._grow = false;
        {
            const parser = new DOMParser();
            const svgParse = parser.parseFromString(params.iconSVG, 'text/html');
            const svgs = svgParse.getElementsByTagName('svg');
            (0, error_util_1.ASSERT)(svgs.length === 1, 'Missing SVG');
            this._iconSVG = svgs[0];
            this._iconSVG.id = this._getId() + '-svg';
        }
        this._label = '';
        this._tooltipLocKey = null;
    }
    setGrow() {
        this._grow = true;
        return this;
    }
    updateTranslation() {
        if (this._tooltipLocKey) {
            ui_util_1.UIUtil.getElementById(this._getId() + '-tooltip').innerHTML = (0, localiser_1.LOC)(this._tooltipLocKey);
        }
    }
    setActive(isActive) {
        this._isActive = isActive;
        this._updateStyles();
    }
    setLabel(label) {
        this._label = label;
        return this;
    }
    tick() {
        if (this._isEnabledDelegate !== undefined) {
            const newIsEnabled = this._isEnabledDelegate();
            if (newIsEnabled != this.enabled) {
                this.setEnabled(newIsEnabled);
                this._updateStyles();
            }
        }
        if (this._isActiveDelegate !== undefined) {
            const newIsActive = this._isActiveDelegate();
            if (newIsActive !== this._isActive) {
                this._isActive = newIsActive;
                this._updateStyles();
            }
        }
    }
    _onEnabledChanged() {
        this._updateStyles();
    }
    isActive(delegate) {
        this._isActiveDelegate = delegate;
        return this;
    }
    isEnabled(delegate) {
        this._isEnabledDelegate = delegate;
        return this;
    }
    onClick(delegate) {
        this._onClick = delegate;
        return this;
    }
    setTooltip(text) {
        this._tooltipLocKey = text;
        return this;
    }
    generateHTML() {
        if (this._grow) {
            return `
                <div class="struct-prop container-icon-button" style="width: unset; flex-grow: 1;" id="${this._getId()}">
                    ${this._iconSVG.outerHTML} ${this._label}
                </div>
            `;
        }
        else {
            if (this._tooltipLocKey === null) {
                return `
                <div class="struct-prop container-icon-button " style="aspect-ratio: 1;" id="${this._getId()}">
                    ${this._iconSVG.outerHTML} ${this._label}
                </div>
            `;
            }
            else {
                return `
                    <div class="struct-prop container-icon-button hover-text" style="aspect-ratio: 1;" id="${this._getId()}">
                        ${this._iconSVG.outerHTML} ${this._label}
                        <span class="tooltip-text left" id="${this._getId()}-tooltip">${(0, localiser_1.LOC)(this._tooltipLocKey)}</span>
                    </div>
                `;
            }
        }
    }
    registerEvents() {
        const element = document.getElementById(this._getId());
        (0, error_util_1.ASSERT)(element !== null);
        element.addEventListener('click', () => {
            if (this.enabled && this._onClick) {
                this._onClick();
            }
        });
        element.addEventListener('mouseenter', () => {
            this._setHovered(true);
            this._updateStyles();
        });
        element.addEventListener('mouseleave', () => {
            this._setHovered(false);
            this._updateStyles();
        });
    }
    finalise() {
        this._updateStyles();
    }
    _getSVGElement() {
        const svgId = this._getId() + '-svg';
        return ui_util_1.UIUtil.getElementById(svgId);
    }
    _updateStyles() {
        ui_util_1.UIUtil.updateStyles(this._getElement(), {
            isActive: this._isActive,
            isEnabled: this.enabled,
            isHovered: this.hovered,
        });
    }
}
exports.ToolbarItemComponent = ToolbarItemComponent;
