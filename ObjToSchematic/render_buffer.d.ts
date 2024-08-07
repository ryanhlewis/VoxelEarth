import * as twgl from 'twgl.js';
export interface Attribute {
    name: string;
    numComponents: number;
}
export interface AttributeData {
    indices: Uint32Array;
    custom: {
        [name: string]: Array<number>;
    };
}
export declare function MergeAttributeData(...data: AttributeData[]): AttributeData;
export declare class RenderBuffer {
    private _WebGLBuffer?;
    private _buffer;
    private _attributes;
    private _maxIndex;
    private _compiled;
    private _needsCompiling;
    constructor(attributes: Array<Attribute>);
    add(data: AttributeData): void;
    static from(other: RenderBuffer): RenderBuffer;
    attachNewAttribute(attribute: Attribute, data: Array<number>): void;
    removeAttribute(attributeName: string): void;
    getWebGLBuffer(): {
        buffer: twgl.BufferInfo;
        numElements: number;
    };
    private _compile;
    private _getNewBuffer;
    private _checkDataMatchesAttributes;
    copy(): RenderBuffer;
}
