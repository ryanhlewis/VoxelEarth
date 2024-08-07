/** Regex for non-zero whitespace */
export declare const REGEX_NZ_WS: RegExp;
/** Regex for number */
export declare const REGEX_NUMBER: RegExp;
export declare const REGEX_NZ_ANY: RegExp;
export declare function regexCapture(identifier: string, regex: RegExp): RegExp;
export declare function regexOptional(regex: RegExp): RegExp;
export declare function buildRegex(...args: (string | RegExp)[]): RegExp;
export declare class RegExpBuilder {
    private _components;
    constructor();
    add(item: string | RegExp, capture?: string, optional?: boolean): RegExpBuilder;
    addMany(items: (string | RegExp)[], optional?: boolean): RegExpBuilder;
    addNonzeroWhitespace(): RegExpBuilder;
    toRegExp(): RegExp;
}
