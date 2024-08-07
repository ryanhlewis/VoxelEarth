"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileComponent = void 0;
const path = require("path");
const error_util_1 = require("../../util/error_util");
const ui_util_1 = require("../../util/ui_util");
const config_1 = require("./config");
const localiser_1 = require("../../localiser");
class FileComponent extends config_1.ConfigComponent {
    constructor() {
        super();
        this._loadedFilePath = null;
    }
    _generateInnerHTML() {
        var _a;
        return `
            <div class="input-file struct-prop" id="${this._getId()}">
                <input type="file" accept=".obj,,.glb" style="display: none;" id="${this._getId()}-input">
                ${(_a = this._loadedFilePath) !== null && _a !== void 0 ? _a : (0, localiser_1.LOC)('import.components.no_file_chosen')}
            </div>
        `;
    }
    registerEvents() {
        this._getElement().addEventListener('mouseenter', () => {
            this._setHovered(true);
            this._updateStyles();
        });
        this._getElement().addEventListener('mouseleave', () => {
            this._setHovered(false);
            this._updateStyles();
        });
        const inputElement = ui_util_1.UIUtil.getElementById(this._getId() + '-input');
        inputElement.addEventListener('change', () => {
            const files = inputElement.files;
            if ((files === null || files === void 0 ? void 0 : files.length) === 1) {
                const file = files.item(0);
                (0, error_util_1.ASSERT)(file !== null);
                this._loadedFilePath = file.name;
                this._setValue(file);
            }
        });
        this._getElement().addEventListener('click', () => {
            if (this.enabled) {
                inputElement.click();
            }
        });
    }
    _onValueChanged() {
        this._updateStyles();
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        this._updateStyles();
    }
    _updateStyles() {
        if (this._loadedFilePath) {
            const parsedPath = path.parse(this._loadedFilePath);
            this._getElement().innerHTML = parsedPath.name + parsedPath.ext;
        }
        else {
            this._getElement().innerHTML = `<i>${(0, localiser_1.LOC)('import.components.no_file_chosen')}</i>`;
        }
        ui_util_1.UIUtil.updateStyles(this._getElement(), {
            isHovered: this.hovered,
            isEnabled: this.enabled,
            isActive: false,
        });
    }
    refresh() {
        this._getElement().innerHTML = `<i>${(0, localiser_1.LOC)('import.components.no_file_chosen')}</i>`;
    }
}
exports.FileComponent = FileComponent;
