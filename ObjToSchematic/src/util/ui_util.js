"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIUtil = void 0;
var error_util_1 = require("./error_util");
var UIUtil;
(function (UIUtil) {
    function getElementById(id) {
        var element = document.getElementById(id);
        (0, error_util_1.ASSERT)(element !== null, "Attempting to getElement of nonexistent element: ".concat(id));
        return element;
    }
    UIUtil.getElementById = getElementById;
    function clearStyles(element) {
        element.classList.remove('disabled');
        element.classList.remove('hover');
        element.classList.remove('active');
    }
    UIUtil.clearStyles = clearStyles;
    function updateStyles(element, style) {
        clearStyles(element);
        if (style.isActive) {
            element.classList.add('active');
        }
        if (!style.isEnabled) {
            element.classList.add('disabled');
        }
        if (style.isHovered && style.isEnabled) {
            element.classList.add('hover');
        }
    }
    UIUtil.updateStyles = updateStyles;
})(UIUtil = exports.UIUtil || (exports.UIUtil = {}));
//# sourceMappingURL=ui_util.js.map