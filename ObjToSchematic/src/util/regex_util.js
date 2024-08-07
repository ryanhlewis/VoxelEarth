"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegExpBuilder = exports.buildRegex = exports.regexOptional = exports.regexCapture = exports.REGEX_NZ_ANY = exports.REGEX_NUMBER = exports.REGEX_NZ_WS = void 0;
/** Regex for non-zero whitespace */
exports.REGEX_NZ_WS = /[ \t]+/;
/** Regex for number */
exports.REGEX_NUMBER = /[0-9eE+\.\-]+/;
exports.REGEX_NZ_ANY = /.+/;
function regexCapture(identifier, regex) {
    return new RegExp("(?<".concat(identifier, ">").concat(regex.source));
}
exports.regexCapture = regexCapture;
function regexOptional(regex) {
    return new RegExp("(".concat(regex, ")?"));
}
exports.regexOptional = regexOptional;
function buildRegex() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return new RegExp(args.map(function (r) {
        if (r instanceof RegExp) {
            return r.source;
        }
        return r;
    }).join(''));
}
exports.buildRegex = buildRegex;
var RegExpBuilder = /** @class */ (function () {
    function RegExpBuilder() {
        this._components = [];
    }
    RegExpBuilder.prototype.add = function (item, capture, optional) {
        if (optional === void 0) { optional = false; }
        var regex;
        if (item instanceof RegExp) {
            regex = item.source;
        }
        else {
            regex = item;
        }
        if (capture) {
            regex = "(?<".concat(capture, ">").concat(regex, ")");
        }
        if (optional) {
            regex = "(".concat(regex, ")?");
        }
        this._components.push(regex);
        return this;
    };
    RegExpBuilder.prototype.addMany = function (items, optional) {
        if (optional === void 0) { optional = false; }
        var toAdd = '';
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            if (item instanceof RegExp) {
                toAdd += item.source;
            }
            else {
                toAdd += item;
            }
        }
        this._components.push(optional ? "(".concat(toAdd, ")?") : toAdd);
        return this;
    };
    RegExpBuilder.prototype.addNonzeroWhitespace = function () {
        this.add(exports.REGEX_NZ_WS);
        return this;
    };
    RegExpBuilder.prototype.toRegExp = function () {
        return new RegExp(this._components.join(''));
    };
    return RegExpBuilder;
}());
exports.RegExpBuilder = RegExpBuilder;
