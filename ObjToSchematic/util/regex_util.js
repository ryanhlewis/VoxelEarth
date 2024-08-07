"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegExpBuilder = exports.buildRegex = exports.regexOptional = exports.regexCapture = exports.REGEX_NZ_ANY = exports.REGEX_NUMBER = exports.REGEX_NZ_WS = void 0;
/** Regex for non-zero whitespace */
exports.REGEX_NZ_WS = /[ \t]+/;
/** Regex for number */
exports.REGEX_NUMBER = /[0-9eE+\.\-]+/;
exports.REGEX_NZ_ANY = /.+/;
function regexCapture(identifier, regex) {
    return new RegExp(`(?<${identifier}>${regex.source}`);
}
exports.regexCapture = regexCapture;
function regexOptional(regex) {
    return new RegExp(`(${regex})?`);
}
exports.regexOptional = regexOptional;
function buildRegex(...args) {
    return new RegExp(args.map((r) => {
        if (r instanceof RegExp) {
            return r.source;
        }
        return r;
    }).join(''));
}
exports.buildRegex = buildRegex;
class RegExpBuilder {
    constructor() {
        this._components = [];
    }
    add(item, capture, optional = false) {
        let regex;
        if (item instanceof RegExp) {
            regex = item.source;
        }
        else {
            regex = item;
        }
        if (capture) {
            regex = `(?<${capture}>${regex})`;
        }
        if (optional) {
            regex = `(${regex})?`;
        }
        this._components.push(regex);
        return this;
    }
    addMany(items, optional = false) {
        let toAdd = '';
        for (const item of items) {
            if (item instanceof RegExp) {
                toAdd += item.source;
            }
            else {
                toAdd += item;
            }
        }
        this._components.push(optional ? `(${toAdd})?` : toAdd);
        return this;
    }
    addNonzeroWhitespace() {
        this.add(exports.REGEX_NZ_WS);
        return this;
    }
    toRegExp() {
        return new RegExp(this._components.join(''));
    }
}
exports.RegExpBuilder = RegExpBuilder;
