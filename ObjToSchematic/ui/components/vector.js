"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorComponent = void 0;
const ui_util_1 = require("../../util/ui_util");
const vector_1 = require("../../vector");
const config_1 = require("./config");
class VectorComponent extends config_1.ConfigComponent {
    constructor() {
        super(new vector_1.Vector3(0, 0, 0));
        this._mouseover = null;
        this._showY = true;
    }
    /**
     * Set whether or not the Y axis has a UI element
     */
    setShowY(showY) {
        this._showY = showY;
        return this;
    }
    _generateInnerHTML() {
        let html = '';
        html += '<div class="spinbox-main-container">';
        html += `
            <div class="spinbox-element-container">
                <div class="spinbox-key" id="${this._getKeyId('x')}">X</div>
                <input type="number" class="spinbox-value struct-prop" min="-360" max="360" value="${this.getValue().x}" id="${this._getValueId('x')}"></input>
            </div>
        `;
        if (this._showY) {
            html += `
                <div class="spinbox-element-container">
                    <div class="spinbox-key" id="${this._getKeyId('y')}">Y</div>
                    <input type="number" class="spinbox-value struct-prop" min="-360" max="360" value="${this.getValue().y}" id="${this._getValueId('y')}"></input>
                </div>
            `;
        }
        html += `
            <div class="spinbox-element-container">
                <div class="spinbox-key" id="${this._getKeyId('z')}">Z</div>
                <input type="number" class="spinbox-value struct-prop" min="-360" max="360" value="${this.getValue().z}" id="${this._getValueId('z')}"></input>
            </div>
        `;
        html += '</div>';
        return html;
    }
    _getKeyId(axis) {
        return this._getId() + '-k' + axis;
    }
    _getValueId(axis) {
        return this._getId() + '-v' + axis;
    }
    _registerAxis(axis) {
        const elementValue = ui_util_1.UIUtil.getElementById(this._getValueId(axis));
        elementValue.onmouseenter = () => {
            var _a;
            this._mouseover = axis;
            this._updateStyles();
            (_a = this._onMouseEnterExit) === null || _a === void 0 ? void 0 : _a.call(this, 'enter', axis);
        };
        elementValue.onmouseleave = () => {
            var _a;
            this._mouseover = null;
            this._updateStyles();
            (_a = this._onMouseEnterExit) === null || _a === void 0 ? void 0 : _a.call(this, 'exit', axis);
        };
    }
    registerEvents() {
        this._registerAxis('x');
        if (this._showY) {
            this._registerAxis('y');
        }
        this._registerAxis('z');
        const elementX = ui_util_1.UIUtil.getElementById(this._getValueId('x'));
        const elementY = ui_util_1.UIUtil.getElementById(this._getValueId('y'));
        const elementZ = ui_util_1.UIUtil.getElementById(this._getValueId('z'));
        elementX.addEventListener('change', () => {
            this.getValue().x = parseInt(elementX.value);
        });
        elementY.addEventListener('change', () => {
            this.getValue().y = parseInt(elementY.value);
        });
        elementZ.addEventListener('change', () => {
            this.getValue().z = parseInt(elementZ.value);
        });
    }
    setOnMouseEnterExit(delegate) {
        this._onMouseEnterExit = delegate;
        return this;
    }
    _updateValue(e) {
        /*
        ASSERT(this.enabled, 'Not enabled');
        ASSERT(this._dragging !== null, 'Dragging nothing');

        const deltaX = e.clientX - this._lastClientX;
        this._lastClientX = e.clientX;

        const current = this.getValue().copy();

        switch (this._dragging) {
            case 'x':
                current.x = (current.x + deltaX) % this._wrap;
                break;
            case 'y':
                current.y = (current.y + deltaX) % this._wrap;
                break;
            case 'z':
                current.z = (current.z + deltaX) % this._wrap;
                break;
        }
        this._setValue(current);
        */
    }
    _updateStyles() {
        // Update keys
        {
            const elementXK = ui_util_1.UIUtil.getElementById(this._getKeyId('x'));
            elementXK.classList.remove('text-standard');
            elementXK.classList.add(this.enabled ? 'text-standard' : 'text-dark');
            const elementYK = ui_util_1.UIUtil.getElementById(this._getKeyId('y'));
            elementYK.classList.remove('text-standard');
            elementYK.classList.add(this.enabled ? 'text-standard' : 'text-dark');
            const elementZK = ui_util_1.UIUtil.getElementById(this._getKeyId('z'));
            elementZK.classList.remove('text-standard');
            elementZK.classList.add(this.enabled ? 'text-standard' : 'text-dark');
        }
        const elementXV = ui_util_1.UIUtil.getElementById(this._getValueId('x'));
        const elementYV = ui_util_1.UIUtil.getElementById(this._getValueId('y'));
        const elementZV = ui_util_1.UIUtil.getElementById(this._getValueId('z'));
        // Update styles
        {
            ui_util_1.UIUtil.updateStyles(elementXV, {
                isActive: false,
                isEnabled: this.enabled,
                isHovered: this._mouseover === 'x',
            });
            ui_util_1.UIUtil.updateStyles(elementYV, {
                isActive: false,
                isEnabled: this.enabled,
                isHovered: this._mouseover === 'y',
            });
            ui_util_1.UIUtil.updateStyles(elementZV, {
                isActive: false,
                isEnabled: this.enabled,
                isHovered: this._mouseover === 'z',
            });
        }
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        this._updateStyles();
    }
    _onValueChanged() {
        this._updateStyles();
    }
}
exports.VectorComponent = VectorComponent;
