"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseComponent = void 0;
var util_1 = require("../../util");
var ui_util_1 = require("../../util/ui_util");
/**
 * The base UI class from which user interactable DOM elements are built from.
 * Each `BaseComponent` can be enabled/disabled.
 */
var BaseComponent = /** @class */ (function () {
    function BaseComponent() {
        this._id = (0, util_1.getRandomID)();
        this._isEnabled = true;
        this._isHovered = false;
        this._obeyGroupEnables = true;
    }
    /**
     * Get whether or not this UI element is interactable.
     * @deprecated Use the enabled() getter.
     */
    BaseComponent.prototype.getEnabled = function () {
        return this._isEnabled;
    };
    Object.defineProperty(BaseComponent.prototype, "enabled", {
        /**
         * Alias of `getEnabled`
         */
        get: function () {
            return this._isEnabled;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BaseComponent.prototype, "disabled", {
        get: function () {
            return !this._isEnabled;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Set whether or not this UI element is interactable.
     */
    BaseComponent.prototype.setEnabled = function (isEnabled, isGroupEnable) {
        if (isGroupEnable === void 0) { isGroupEnable = true; }
        if (isEnabled && isGroupEnable && !this._obeyGroupEnables) {
            return;
        }
        this._isEnabled = isEnabled;
        this._onEnabledChanged();
    };
    BaseComponent.prototype._setHovered = function (isHovered) {
        this._isHovered = isHovered;
    };
    Object.defineProperty(BaseComponent.prototype, "hovered", {
        get: function () {
            return this._isHovered;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Sets whether or not this element should be enabled when the group
     * is it apart of becomes enabled. This is useful if an element should
     * only be enabled if another element has a particular value. If this is
     * false then there needs to be a some event added to manually enable this
     * element.
     */
    BaseComponent.prototype.setShouldObeyGroupEnables = function (obey) {
        this._obeyGroupEnables = obey;
        return this;
    };
    BaseComponent.prototype.finalise = function () {
        this._onEnabledChanged();
        this._updateStyles();
    };
    /**
     * Returns the actual DOM element that this BaseComponent refers to.
     * Calling this before the element is created (i.e. before `generateHTML`)
     * is called will throw an error.
     */
    BaseComponent.prototype._getElement = function () {
        return ui_util_1.UIUtil.getElementById(this._id);
    };
    /**
     * Each BaseComponent is assignd an ID that can be used a DOM element with.
     */
    BaseComponent.prototype._getId = function () {
        return this._id;
    };
    /**
     * Called after _onEnabledChanged() and _onValueChanged()
     */
    BaseComponent.prototype._updateStyles = function () {
    };
    return BaseComponent;
}());
exports.BaseComponent = BaseComponent;
//# sourceMappingURL=base.js.map