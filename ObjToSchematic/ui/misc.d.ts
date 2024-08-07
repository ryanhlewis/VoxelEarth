export declare class HTMLBuilder {
    private _html;
    constructor();
    add(html: string): this;
    toString(): string;
    placeInto(elementId: string): void;
}
export declare namespace MiscComponents {
    function createGroupHeader(label: string): string;
}
