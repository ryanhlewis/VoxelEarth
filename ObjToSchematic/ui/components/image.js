"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageComponent = void 0;
const localiser_1 = require("../../localiser");
const util_1 = require("../../util");
const error_util_1 = require("../../util/error_util");
const ui_util_1 = require("../../util/ui_util");
const icons_1 = require("../icons");
const config_1 = require("./config");
const toolbar_item_1 = require("./toolbar_item");
class ImageComponent extends config_1.ConfigComponent {
    constructor(param) {
        super(Promise.resolve(param !== null && param !== void 0 ? param : { raw: '', filetype: 'png' }));
        this._switchElement = new toolbar_item_1.ToolbarItemComponent({ id: 'sw', iconSVG: icons_1.AppIcons.UPLOAD })
            .setLabel((0, localiser_1.LOC)('materials.components.choose'))
            .onClick(() => {
            const inputElement = ui_util_1.UIUtil.getElementById(this._getId() + '-input');
            inputElement.click();
        });
        this._imageId = (0, util_1.getRandomID)();
    }
    _generateInnerHTML() {
        return `
            <div class="row-container">
                <div class="row-item">
                    <img id="${this._imageId}" alt="Texture Preview" class="texture-preview" loading="lazy"></img>
                    <div id="${this._imageId}-placeholder" class="texture-preview-placeholder">
                        <div class="row-container" style="align-items: center;">
                            <div class="row-item">${icons_1.AppIcons.IMAGE_MISSING}</div>
                            <div class="row-item">${(0, localiser_1.LOC)('materials.components.no_image_loaded')}</div>
                        </div>
                    </div>
                </div>
                <div class="row-item">
                    <input type="file" accept="image/png,image/jpeg" style="display: none;" id="${this._getId()}-input">
                    ${this._switchElement.generateHTML()}
                </div>
            </div>
        `;
    }
    registerEvents() {
        this._switchElement.registerEvents();
        const inputElement = ui_util_1.UIUtil.getElementById(this._getId() + '-input');
        inputElement.addEventListener('change', () => {
            const files = inputElement.files;
            if ((files === null || files === void 0 ? void 0 : files.length) === 1) {
                const file = files.item(0);
                (0, error_util_1.ASSERT)(file !== null);
                (0, error_util_1.ASSERT)(file.type === 'image/jpeg' || file.type === 'image/png', 'Unexpected image type');
                this._setValue(new Promise((res, rej) => {
                    const fileReader = new FileReader();
                    fileReader.onload = function () {
                        if (typeof fileReader.result === 'string') {
                            // convert image file to base64 string
                            res({ filetype: file.type === 'image/jpeg' ? 'jpg' : 'png', raw: fileReader.result });
                        }
                        else {
                            rej(Error());
                        }
                    };
                    fileReader.readAsDataURL(file);
                }));
            }
        });
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        const imageElement = ui_util_1.UIUtil.getElementById(this._imageId);
        const placeholderComponent = ui_util_1.UIUtil.getElementById(this._imageId + '-placeholder');
        if (!this.enabled) {
            imageElement.classList.add('disabled');
            placeholderComponent.classList.add('disabled');
        }
        else {
            imageElement.classList.remove('disabled');
            placeholderComponent.classList.remove('disabled');
        }
        this._switchElement.setEnabled(this.enabled);
    }
    _onValueChanged() {
        const inputElement = ui_util_1.UIUtil.getElementById(this._imageId);
        const placeholderComponent = ui_util_1.UIUtil.getElementById(this._imageId + '-placeholder');
        this.getValue()
            .then((res) => {
            if (res.raw === '') {
                throw Error();
            }
            this._switchElement.setActive(false);
            inputElement.src = res.raw;
            inputElement.style.display = 'unset';
            placeholderComponent.style.display = 'none';
        })
            .catch((err) => {
            this._switchElement.setActive(true);
            inputElement.src = '';
            inputElement.style.display = 'none';
            placeholderComponent.style.display = 'flex';
        });
    }
    finalise() {
        super.finalise();
        this._onValueChanged();
        this._onEnabledChanged();
    }
}
exports.ImageComponent = ImageComponent;
