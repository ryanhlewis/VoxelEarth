"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaletteComponent = void 0;
const all_1 = require("../../../res/palettes/all");
const localiser_1 = require("../../localiser");
const palette_1 = require("../../palette");
const util_1 = require("../../util");
const error_util_1 = require("../../util/error_util");
const file_util_1 = require("../../util/file_util");
const ui_util_1 = require("../../util/ui_util");
const console_1 = require("../console");
const icons_1 = require("../icons");
const checkbox_1 = require("./checkbox");
const config_1 = require("./config");
const toolbar_item_1 = require("./toolbar_item");
class PaletteComponent extends config_1.ConfigComponent {
    constructor() {
        super();
        this._palette = palette_1.Palette.create();
        this._palette.add(all_1.PALETTE_ALL_RELEASE);
        this._setValue(this._palette);
        this._checkboxes = [];
        all_1.PALETTE_ALL_RELEASE.forEach((block) => {
            this._checkboxes.push({
                block: block,
                element: new checkbox_1.CheckboxComponent()
                    .setDefaultValue(true)
                    .setUnlocalisedCheckedText(block)
                    .setUnlocalisedUncheckedText(block),
            });
        });
        this._selectAll = new toolbar_item_1.ToolbarItemComponent({ iconSVG: icons_1.AppIcons.SELECT_ALL, id: 'select-all' })
            .onClick(() => {
            this._checkboxes.forEach((checkbox) => {
                checkbox.element.check();
            });
            this._onCountSelectedChanged();
        });
        this._deselectAll = new toolbar_item_1.ToolbarItemComponent({ iconSVG: icons_1.AppIcons.DESELECT_ALL, id: 'deselect-all' })
            .onClick(() => {
            this._checkboxes.forEach((checkbox) => {
                checkbox.element.uncheck();
            });
            this._onCountSelectedChanged();
        });
        this._importFrom = new toolbar_item_1.ToolbarItemComponent({ iconSVG: icons_1.AppIcons.IMPORT, id: 'import' })
            .onClick(() => {
            const a = document.createElement('input');
            a.setAttribute('type', 'file');
            a.setAttribute('accept', '.txt');
            a.addEventListener('change', () => {
                const files = a.files;
                if ((files === null || files === void 0 ? void 0 : files.length) === 1) {
                    const file = files.item(0);
                    (0, error_util_1.ASSERT)(file !== null);
                    console_1.AppConsole.info((0, localiser_1.LOC)('assign.reading_palette', { file_name: file.name }));
                    file.text().then((text) => {
                        this._onReadPaletteFile(text);
                    });
                }
            });
            a.click();
        });
        this._exportTo = new toolbar_item_1.ToolbarItemComponent({ iconSVG: icons_1.AppIcons.EXPORT, id: 'export' })
            .onClick(() => {
            const textPalette = this._checkboxes.filter((x) => x.element.getValue())
                .map((x) => x.block)
                .join('\n');
            (0, file_util_1.download)(textPalette, 'block-palette.txt');
        });
    }
    _onCountSelectedChanged() {
        const countSelected = this.getValue().count();
        this._deselectAll.setEnabled(this.enabled && countSelected > 0);
        this._selectAll.setEnabled(this.enabled && countSelected < all_1.PALETTE_ALL_RELEASE.length);
    }
    _onReadPaletteFile(text) {
        const blockNames = text.split('\n');
        let countDeselected = 0;
        this._checkboxes.forEach((checkbox) => {
            if (checkbox.element.getValue()) {
                checkbox.element.uncheck();
                ++countDeselected;
            }
        });
        console_1.AppConsole.info((0, localiser_1.LOC)('assign.deselected_blocks', { count: countDeselected }));
        let countFound = 0;
        let countChecked = 0;
        blockNames.forEach((blockName) => {
            blockName = blockName.trim();
            if (blockName.length === 0) {
                return;
            }
            ++countFound;
            if (!util_1.AppUtil.Text.isNamespacedBlock(blockName)) {
                console_1.AppConsole.error((0, localiser_1.LOC)('assign.block_not_namespaced', { block_name: blockName }));
            }
            else {
                const checkboxIndex = this._checkboxes.findIndex((x) => x.block === blockName);
                if (checkboxIndex === -1) {
                    console_1.AppConsole.error((0, localiser_1.LOC)('assign.could_not_use_block', { block_name: blockName }));
                }
                else {
                    this._checkboxes[checkboxIndex].element.check();
                    ++countChecked;
                }
            }
        });
        console_1.AppConsole.info((0, localiser_1.LOC)('assign.found_blocks', { count: countFound }));
        console_1.AppConsole.info((0, localiser_1.LOC)('assign.selected_blocks', { count: countChecked }));
        this._onCountSelectedChanged();
    }
    _generateInnerHTML() {
        let checkboxesHTML = '';
        this._checkboxes.forEach((checkbox) => {
            checkboxesHTML += `<div class="col-container" id="${this._getId() + '-block-' + checkbox.block}">`;
            checkboxesHTML += checkbox.element._generateInnerHTML();
            checkboxesHTML += '</div>';
        });
        return `
            <div class="row-container" style="width: 100%; gap: 5px;">
                <input class="struct-prop" type="text" style="width: 100%; text-align: start;" placeholder="${(0, localiser_1.LOC)('assign.components.search')}" id="${this._getId() + '-search'}"></input>
                <div class="col-container header-cols" style="padding-top: 0px;">
                    <div class="col-container">
                        <div class="col-item">
                            ${this._importFrom.generateHTML()}
                        </div>
                        <div class="col-item">
                            ${this._exportTo.generateHTML()}
                        </div>
                    </div>
                    <div class="col-container">
                        <div class="col-item">
                            ${this._selectAll.generateHTML()}
                        </div>
                        <div class="col-item">
                            ${this._deselectAll.generateHTML()}
                        </div>
                    </div>
                </div>
                <div class="row-container" style="gap: 5px; border-radius: 5px; width: 100%; height: 200px; overflow-y: auto; overflow-x: hidden;" id="${this._getId() + '-list'}">
                    ${checkboxesHTML}
                </div>
            </div>
        `;
    }
    _onValueChanged() {
    }
    _onEnabledChanged() {
        super._onEnabledChanged();
        const searchElement = ui_util_1.UIUtil.getElementById(this._getId() + '-search');
        searchElement.disabled = !this.enabled;
        this._checkboxes.forEach((checkbox) => {
            checkbox.element.setEnabled(this.getEnabled());
        });
        this._selectAll.setEnabled(this.enabled);
        this._deselectAll.setEnabled(this.enabled);
        this._importFrom.setEnabled(this.enabled);
        this._exportTo.setEnabled(this.enabled);
        this._onCountSelectedChanged();
        this._updateStyles();
    }
    registerEvents() {
        const searchElement = ui_util_1.UIUtil.getElementById(this._getId() + '-search');
        searchElement.addEventListener('keyup', () => {
            this._onSearchBoxChanged(searchElement.value);
        });
        searchElement.addEventListener('mouseenter', () => {
            this._setHovered(true);
            this._updateStyles();
        });
        searchElement.addEventListener('mouseleave', () => {
            this._setHovered(false);
            this._updateStyles();
        });
        this._checkboxes.forEach((checkbox) => {
            checkbox.element.registerEvents();
            checkbox.element.addValueChangedListener(() => {
                const isTicked = checkbox.element.getValue();
                if (isTicked) {
                    this._palette.add([checkbox.block]);
                }
                else {
                    this._palette.remove(checkbox.block);
                }
                this._onCountSelectedChanged();
            });
        });
        this._selectAll.registerEvents();
        this._deselectAll.registerEvents();
        this._importFrom.registerEvents();
        this._exportTo.registerEvents();
    }
    finalise() {
        super.finalise();
        this._checkboxes.forEach((checkbox) => {
            checkbox.element.finalise();
        });
        this._selectAll.finalise();
        this._deselectAll.finalise();
        this._importFrom.finalise();
        this._exportTo.finalise();
        this._onCountSelectedChanged();
        this._updateStyles();
        //this._selectAll.finalise();
        //this._deselectAll.finalise();
        //this._importFrom.finalise();
        //this._exportTo.finalise();
    }
    _onSearchBoxChanged(search) {
        this._checkboxes.forEach((checkbox) => {
            const row = ui_util_1.UIUtil.getElementById(this._getId() + '-block-' + checkbox.block);
            if (checkbox.block.toLocaleLowerCase().includes(search.toLowerCase()) || checkbox.block.toLowerCase().replace(/_/g, ' ').includes(search.toLocaleLowerCase())) {
                row.style.display = '';
            }
            else {
                row.style.display = 'none';
            }
        });
    }
    _updateStyles() {
        ui_util_1.UIUtil.updateStyles(ui_util_1.UIUtil.getElementById(this._getId() + '-search'), {
            isActive: false,
            isEnabled: this.enabled,
            isHovered: this.hovered,
        });
    }
    refresh() {
        super.refresh();
        const element = ui_util_1.UIUtil.getElementById(this._getId() + '-search');
        element.placeholder = (0, localiser_1.LOC)('assign.components.search');
    }
}
exports.PaletteComponent = PaletteComponent;
