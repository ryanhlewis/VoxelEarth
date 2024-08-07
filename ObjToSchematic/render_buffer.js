"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderBuffer = exports.MergeAttributeData = void 0;
const twgl = require("twgl.js");
const renderer_1 = require("./renderer");
const error_util_1 = require("./util/error_util");
function MergeAttributeData(...data) {
    if (data.length === 0) {
        return {
            indices: new Uint32Array(),
            custom: {},
        };
    }
    // Check custom attributes match
    const requiredAttributes = Object.keys(data[0].custom);
    for (let i = 1; i < data.length; ++i) {
        const customAttributes = Object.keys(data[i].custom);
        const isAllRequiredInCustom = requiredAttributes.every((attr) => {
            return customAttributes.includes(attr);
        });
        const isAllCustomInRequired = customAttributes.every((attr) => {
            return requiredAttributes.includes(attr);
        });
        (0, error_util_1.ASSERT)(isAllRequiredInCustom && isAllCustomInRequired, 'Attributes to merge do not match');
    }
    // Merge data
    const indices = Array.from(data[0].indices);
    const custom = data[0].custom;
    for (let i = 1; i < data.length; ++i) {
        const nextIndex = Math.max(...indices) + 1;
        const d = data[i];
        const newIndices = d.indices.map((index) => index + nextIndex);
        indices.push(...Array.from(newIndices));
        for (const attr of requiredAttributes) {
            const attrData = d.custom[attr];
            custom[attr].push(...attrData);
        }
    }
    return {
        indices: new Uint32Array(indices),
        custom: custom,
    };
}
exports.MergeAttributeData = MergeAttributeData;
class RenderBuffer {
    constructor(attributes) {
        this._attributes = {};
        for (const attr of attributes) {
            this._attributes[attr.name] = {
                name: attr.name,
                numComponents: attr.numComponents,
            };
        }
        this._needsCompiling = false;
        this._compiled = false;
        this._maxIndex = 0;
        this._getNewBuffer();
    }
    add(data) {
        const mappedIndicesToAdd = new Array(data.indices.length);
        let maxMapped = -1;
        data.indices.forEach((index, i) => {
            const newIndex = index + this._maxIndex;
            maxMapped = Math.max(maxMapped, newIndex);
            mappedIndicesToAdd[i] = newIndex;
        });
        this._buffer.indices.data.push(...mappedIndicesToAdd);
        this._maxIndex = 1 + maxMapped;
        for (const attr in this._attributes) {
            this._buffer[attr].data.push(...data.custom[attr]);
        }
        this._needsCompiling = true;
    }
    static from(other) {
        const buffer = new RenderBuffer([]);
        buffer._buffer = other._buffer;
        buffer._attributes = other._attributes;
        buffer._maxIndex = other._maxIndex;
        buffer._compiled = other._compiled;
        buffer._needsCompiling = other._needsCompiling;
        return buffer;
    }
    attachNewAttribute(attribute, data) {
        (0, error_util_1.ASSERT)(this._buffer[attribute.name] === undefined, 'Attribute already exists in buffer');
        (0, error_util_1.ASSERT)(this._attributes[attribute.name] === undefined, 'Attribute already exists in attributes');
        const expectedDataLength = this._maxIndex * attribute.numComponents;
        (0, error_util_1.ASSERT)(data.length === expectedDataLength, `Data length expected to be ${expectedDataLength}, got ${data.length}`);
        this._buffer[attribute.name] = {
            numComponents: attribute.numComponents,
            data: data,
        };
        this._attributes[attribute.name] = attribute;
        this._needsCompiling = true;
    }
    removeAttribute(attributeName) {
        delete this._buffer[attributeName];
        delete this._attributes[attributeName];
        this._needsCompiling = true;
    }
    getWebGLBuffer() {
        this._compile();
        (0, error_util_1.ASSERT)(this._WebGLBuffer !== undefined);
        return this._WebGLBuffer;
    }
    _compile() {
        if (this._compiled && !this._needsCompiling) {
            return;
        }
        const newBuffer = {
            indices: { data: Uint32Array.from(this._buffer.indices.data), numComponents: this._buffer.indices.numComponents },
        };
        for (const key in this._buffer) {
            if (key !== 'indices') {
                newBuffer[key] = {
                    data: Float32Array.from(this._buffer[key].data),
                    numComponents: this._buffer[key].numComponents,
                };
            }
        }
        this._WebGLBuffer = {
            buffer: twgl.createBufferInfoFromArrays(renderer_1.Renderer.Get._gl, newBuffer),
            numElements: this._buffer.indices.data.length,
        };
        this._compiled = true;
        this._needsCompiling = false;
    }
    _getNewBuffer() {
        this._buffer = {
            indices: { numComponents: 1, data: [] },
        };
        for (const attr in this._attributes) {
            this._buffer[attr] = {
                numComponents: this._attributes[attr].numComponents,
                data: [],
            };
        }
    }
    _checkDataMatchesAttributes(data) {
        if (!('indices' in data)) {
            throw Error('Given data does not have indices data');
        }
        const setsRequired = data.indices.reduce((a, v) => Math.max(a, v)) + 1;
        for (const attr in this._attributes) {
            if (!(attr in data)) {
                throw Error(`Given data does not have ${attr} data`);
            }
            if (data.custom[attr].length % this._attributes[attr].numComponents != 0) {
                throw Error(`Not enough/too much ${attr} data given`);
            }
            const numSets = data.custom[attr].length / this._attributes[attr].numComponents;
            if (numSets != setsRequired) {
                // throw `Number of indices does not match number of ${attr} components given`;
                throw Error(`Expected ${setsRequired * this._attributes[attr].numComponents} values for ${attr}, got ${data.custom[attr].length}`);
            }
        }
    }
    copy() {
        const copiedBuffer = new RenderBuffer([]);
        copiedBuffer._buffer = {
            indices: {
                numComponents: this._buffer.indices.numComponents,
                data: Array.from(this._buffer.indices.data),
            },
        };
        for (const key in this._buffer) {
            if (key !== 'indices') {
                copiedBuffer._buffer[key] = {
                    numComponents: this._buffer[key].numComponents,
                    data: Array.from(this._buffer[key].data),
                };
            }
        }
        copiedBuffer._attributes = JSON.parse(JSON.stringify(this._attributes));
        copiedBuffer._maxIndex = this._maxIndex;
        copiedBuffer._compiled = false;
        copiedBuffer._needsCompiling = true;
        return copiedBuffer;
    }
}
exports.RenderBuffer = RenderBuffer;
