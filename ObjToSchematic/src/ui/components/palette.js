"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaletteComponent = void 0;
var all_1 = require("../../../res/palettes/all");
var localiser_1 = require("../../localiser");
var palette_1 = require("../../palette");
var util_1 = require("../../util");
var error_util_1 = require("../../util/error_util");
var file_util_1 = require("../../util/file_util");
var ui_util_1 = require("../../util/ui_util");
var console_1 = require("../console");
var icons_1 = require("../icons");
var checkbox_1 = require("./checkbox");
var config_1 = require("./config");
var toolbar_item_1 = require("./toolbar_item");
var PaletteComponent = /** @class */ (function (_super) {
    __extends(PaletteComponent, _super);
    function PaletteComponent() {
        var _this = _super.call(this) || this;
        _this._palette = palette_1.Palette.create();
        _this._palette.add(all_1.PALETTE_ALL_RELEASE);
        _this._setValue(_this._palette);
        _this._checkboxes = [];
        all_1.PALETTE_ALL_RELEASE.forEach(function (block) {
            _this._checkboxes.push({
                block: block,
                element: new checkbox_1.CheckboxComponent()
                    .setDefaultValue(true)
                    .setUnlocalisedCheckedText(block)
                    .setUnlocalisedUncheckedText(block),
            });
        });
        _this._selectAll = new toolbar_item_1.ToolbarItemComponent({ iconSVG: icons_1.AppIcons.SELECT_ALL, id: 'select-all' })
            .onClick(function () {
            _this._checkboxes.forEach(function (checkbox) {
                checkbox.element.check();
            });
            _this._onCountSelectedChanged();
        });
        _this._deselectAll = new toolbar_item_1.ToolbarItemComponent({ iconSVG: icons_1.AppIcons.DESELECT_ALL, id: 'deselect-all' })
            .onClick(function () {
            _this._checkboxes.forEach(function (checkbox) {
                checkbox.element.uncheck();
            });
            _this._onCountSelectedChanged();
        });
        _this._importFrom = new toolbar_item_1.ToolbarItemComponent({ iconSVG: icons_1.AppIcons.IMPORT, id: 'import' })
            .onClick(function () {
            var a = document.createElement('input');
            a.setAttribute('type', 'file');
            a.setAttribute('accept', '.txt');
            a.addEventListener('change', function () {
                var files = a.files;
                if ((files === null || files === void 0 ? void 0 : files.length) === 1) {
                    var file = files.item(0);
                    (0, error_util_1.ASSERT)(file !== null);
                    console_1.AppConsole.info((0, localiser_1.LOC)('assign.reading_palette', { file_name: file.name }));
                    file.text().then(function (text) {
                        _this._onReadPaletteFile(text);
                    });
                }
            });
            a.click();
        });
        _this._exportTo = new toolbar_item_1.ToolbarItemComponent({ iconSVG: icons_1.AppIcons.EXPORT, id: 'export' })
            .onClick(function () {
            var textPalette = _this._checkboxes.filter(function (x) { return x.element.getValue(); })
                .map(function (x) { return x.block; })
                .join('\n');
            (0, file_util_1.download)(textPalette, 'block-palette.txt');
        });
        return _this;
    }
    PaletteComponent.prototype._onCountSelectedChanged = function () {
        var countSelected = this.getValue().count();
        this._deselectAll.setEnabled(this.enabled && countSelected > 0);
        this._selectAll.setEnabled(this.enabled && countSelected < all_1.PALETTE_ALL_RELEASE.length);
    };
    PaletteComponent.prototype._onReadPaletteFile = function (text) {
        var _this = this;
        var blockNames = text.split('\n');
        var countDeselected = 0;
        this._checkboxes.forEach(function (checkbox) {
            if (checkbox.element.getValue()) {
                checkbox.element.uncheck();
                ++countDeselected;
            }
        });
        console_1.AppConsole.info((0, localiser_1.LOC)('assign.deselected_blocks', { count: countDeselected }));
        var countFound = 0;
        var countChecked = 0;
        blockNames.forEach(function (blockName) {
            blockName = blockName.trim();
            if (blockName.length === 0) {
                return;
            }
            ++countFound;
            if (!util_1.AppUtil.Text.isNamespacedBlock(blockName)) {
                console_1.AppConsole.error((0, localiser_1.LOC)('assign.block_not_namespaced', { block_name: blockName }));
            }
            else {
                var checkboxIndex = _this._checkboxes.findIndex(function (x) { return x.block === blockName; });
                if (checkboxIndex === -1) {
                    console_1.AppConsole.error((0, localiser_1.LOC)('assign.could_not_use_block', { block_name: blockName }));
                }
                else {
                    _this._checkboxes[checkboxIndex].element.check();
                    ++countChecked;
                }
            }
        });
        console_1.AppConsole.info((0, localiser_1.LOC)('assign.found_blocks', { count: countFound }));
        console_1.AppConsole.info((0, localiser_1.LOC)('assign.selected_blocks', { count: countChecked }));
        this._onCountSelectedChanged();
    };
    PaletteComponent.prototype._generateInnerHTML = function () {
        var _this = this;
        var checkboxesHTML = '';
        this._checkboxes.forEach(function (checkbox) {
            checkboxesHTML += "<div class=\"col-container\" id=\"".concat(_this._getId() + '-block-' + checkbox.block, "\">");
            checkboxesHTML += checkbox.element._generateInnerHTML();
            checkboxesHTML += '</div>';
        });
        return "\n            <div class=\"row-container\" style=\"width: 100%; gap: 5px;\">\n                <input class=\"struct-prop\" type=\"text\" style=\"width: 100%; text-align: start;\" placeholder=\"".concat((0, localiser_1.LOC)('assign.components.search'), "\" id=\"").concat(this._getId() + '-search', "\"></input>\n                <div class=\"col-container header-cols\" style=\"padding-top: 0px;\">\n                    <div class=\"col-container\">\n                        <div class=\"col-item\">\n                            ").concat(this._importFrom.generateHTML(), "\n                        </div>\n                        <div class=\"col-item\">\n                            ").concat(this._exportTo.generateHTML(), "\n                        </div>\n                    </div>\n                    <div class=\"col-container\">\n                        <div class=\"col-item\">\n                            ").concat(this._selectAll.generateHTML(), "\n                        </div>\n                        <div class=\"col-item\">\n                            ").concat(this._deselectAll.generateHTML(), "\n                        </div>\n                    </div>\n                </div>\n                <div class=\"row-container\" style=\"gap: 5px; border-radius: 5px; width: 100%; height: 200px; overflow-y: auto; overflow-x: hidden;\" id=\"").concat(this._getId() + '-list', "\">\n                    ").concat(checkboxesHTML, "\n                </div>\n            </div>\n        ");
    };
    PaletteComponent.prototype._onValueChanged = function () {
    };
    PaletteComponent.prototype._onEnabledChanged = function () {
        var _this = this;
        _super.prototype._onEnabledChanged.call(this);
        var searchElement = ui_util_1.UIUtil.getElementById(this._getId() + '-search');
        searchElement.disabled = !this.enabled;
        this._checkboxes.forEach(function (checkbox) {
            checkbox.element.setEnabled(_this.getEnabled());
        });
        this._selectAll.setEnabled(this.enabled);
        this._deselectAll.setEnabled(this.enabled);
        this._importFrom.setEnabled(this.enabled);
        this._exportTo.setEnabled(this.enabled);
        this._onCountSelectedChanged();
        this._updateStyles();
    };
    PaletteComponent.prototype.registerEvents = function () {
        var _this = this;
        var searchElement = ui_util_1.UIUtil.getElementById(this._getId() + '-search');
        searchElement.addEventListener('keyup', function () {
            _this._onSearchBoxChanged(searchElement.value);
        });
        searchElement.addEventListener('mouseenter', function () {
            _this._setHovered(true);
            _this._updateStyles();
        });
        searchElement.addEventListener('mouseleave', function () {
            _this._setHovered(false);
            _this._updateStyles();
        });
        this._checkboxes.forEach(function (checkbox) {
            checkbox.element.registerEvents();
            checkbox.element.addValueChangedListener(function () {
                var isTicked = checkbox.element.getValue();
                if (isTicked) {
                    _this._palette.add([checkbox.block]);
                }
                else {
                    _this._palette.remove(checkbox.block);
                }
                _this._onCountSelectedChanged();
            });
        });
        this._selectAll.registerEvents();
        this._deselectAll.registerEvents();
        this._importFrom.registerEvents();
        this._exportTo.registerEvents();
    };
    PaletteComponent.prototype.finalise = function () {
        _super.prototype.finalise.call(this);
        this._checkboxes.forEach(function (checkbox) {
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
    };
    PaletteComponent.prototype._onSearchBoxChanged = function (search) {
        var _this = this;
        this._checkboxes.forEach(function (checkbox) {
            var row = ui_util_1.UIUtil.getElementById(_this._getId() + '-block-' + checkbox.block);
            if (checkbox.block.toLocaleLowerCase().includes(search.toLowerCase()) || checkbox.block.toLowerCase().replace(/_/g, ' ').includes(search.toLocaleLowerCase())) {
                row.style.display = '';
            }
            else {
                row.style.display = 'none';
            }
        });
    };
    PaletteComponent.prototype._updateStyles = function () {
        ui_util_1.UIUtil.updateStyles(ui_util_1.UIUtil.getElementById(this._getId() + '-search'), {
            isActive: false,
            isEnabled: this.enabled,
            isHovered: this.hovered,
        });
    };
    PaletteComponent.prototype.refresh = function () {
        _super.prototype.refresh.call(this);
        var element = ui_util_1.UIUtil.getElementById(this._getId() + '-search');
        element.placeholder = (0, localiser_1.LOC)('assign.components.search');
    };
    return PaletteComponent;
}(config_1.ConfigComponent));
exports.PaletteComponent = PaletteComponent;
//# sourceMappingURL=palette.js.map