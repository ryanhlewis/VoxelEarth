"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseComponent = void 0;
const util_1 = require("../../util");
const ui_util_1 = require("../../util/ui_util");
/**
 * The base UI class from which user interactable DOM elements are built from.
 * Each `BaseComponent` can be enabled/disabled.
 */
class BaseComponent {
    constructor() {
        this._id = (0, util_1.getRandomID)();
        this._isEnabled = true;
        this._isHovered = false;
        this._obeyGroupEnables = true;
    }
    /**
     * Get whether or not this UI element is interactable.
     * @deprecated Use the enabled() getter.
     */
    getEnabled() {
        return this._isEnabled;
    }
    /**
     * Alias of `getEnabled`
     */
    get enabled() {
        return this._isEnabled;
    }
    get disabled() {
        return !this._isEnabled;
    }
    /**
     * Set whether or not this UI element is interactable.
     */
    setEnabled(isEnabled, isGroupEnable = true) {
        if (isEnabled && isGroupEnable && !this._obeyGroupEnables) {
            return;
        }
        this._isEnabled = isEnabled;
        this._onEnabledChanged();
    }
    _setHovered(isHovered) {
        this._isHovered = isHovered;
    }
    get hovered() {
        return this._isHovered;
    }
    /**
     * Sets whether or not this element should be enabled when the group
     * is it apart of becomes enabled. This is useful if an element should
     * only be enabled if another element has a particular value. If this is
     * false then there needs to be a some event added to manually enable this
     * element.
     */
    setShouldObeyGroupEnables(obey) {
        this._obeyGroupEnables = obey;
        return this;
    }
    finalise() {
        this._onEnabledChanged();
        this._updateStyles();
    }
    /**
     * Returns the actual DOM element that this BaseComponent refers to.
     * Calling this before the element is created (i.e. before `generateHTML`)
     * is called will throw an error.
     */
    _getElement() {
        return ui_util_1.UIUtil.getElementById(this._id);
    }
    /**
     * Each BaseComponent is assignd an ID that can be used a DOM element with.
     */
    _getId() {
        return this._id;
    }
    /**
     * Called after _onEnabledChanged() and _onValueChanged()
     */
    _updateStyles() {
    }
}
exports.BaseComponent = BaseComponent;
