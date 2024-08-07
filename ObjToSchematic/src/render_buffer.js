"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderBuffer = exports.MergeAttributeData = void 0;
var twgl = require("twgl.js");
// var renderer_1 = require("./renderer");
var error_util_1 = require("./util/error_util");
function MergeAttributeData() {
    var data = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        data[_i] = arguments[_i];
    }
    if (data.length === 0) {
        return {
            indices: new Uint32Array(),
            custom: {},
        };
    }
    // Check custom attributes match
    var requiredAttributes = Object.keys(data[0].custom);
    var _loop_1 = function (i) {
        var customAttributes = Object.keys(data[i].custom);
        var isAllRequiredInCustom = requiredAttributes.every(function (attr) {
            return customAttributes.includes(attr);
        });
        var isAllCustomInRequired = customAttributes.every(function (attr) {
            return requiredAttributes.includes(attr);
        });
        (0, error_util_1.ASSERT)(isAllRequiredInCustom && isAllCustomInRequired, 'Attributes to merge do not match');
    };
    for (var i = 1; i < data.length; ++i) {
        _loop_1(i);
    }
    // Merge data
    var indices = Array.from(data[0].indices);
    var custom = data[0].custom;
    var _loop_2 = function (i) {
        var _a;
        var nextIndex = Math.max.apply(Math, indices) + 1;
        var d = data[i];
        var newIndices = d.indices.map(function (index) { return index + nextIndex; });
        indices.push.apply(indices, Array.from(newIndices));
        for (var _b = 0, requiredAttributes_1 = requiredAttributes; _b < requiredAttributes_1.length; _b++) {
            var attr = requiredAttributes_1[_b];
            var attrData = d.custom[attr];
            (_a = custom[attr]).push.apply(_a, attrData);
        }
    };
    for (var i = 1; i < data.length; ++i) {
        _loop_2(i);
    }
    return {
        indices: new Uint32Array(indices),
        custom: custom,
    };
}
exports.MergeAttributeData = MergeAttributeData;
var RenderBuffer = /** @class */ (function () {
    function RenderBuffer(attributes) {
        this._attributes = {};
        for (var _i = 0, attributes_1 = attributes; _i < attributes_1.length; _i++) {
            var attr = attributes_1[_i];
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
    RenderBuffer.prototype.add = function (data) {
        var _a, _b;
        var _this = this;
        var mappedIndicesToAdd = new Array(data.indices.length);
        var maxMapped = -1;
        data.indices.forEach(function (index, i) {
            var newIndex = index + _this._maxIndex;
            maxMapped = Math.max(maxMapped, newIndex);
            mappedIndicesToAdd[i] = newIndex;
        });
        (_a = this._buffer.indices.data).push.apply(_a, mappedIndicesToAdd);
        this._maxIndex = 1 + maxMapped;
        for (var attr in this._attributes) {
            (_b = this._buffer[attr].data).push.apply(_b, data.custom[attr]);
        }
        this._needsCompiling = true;
    };
    RenderBuffer.from = function (other) {
        var buffer = new RenderBuffer([]);
        buffer._buffer = other._buffer;
        buffer._attributes = other._attributes;
        buffer._maxIndex = other._maxIndex;
        buffer._compiled = other._compiled;
        buffer._needsCompiling = other._needsCompiling;
        return buffer;
    };
    RenderBuffer.prototype.attachNewAttribute = function (attribute, data) {
        (0, error_util_1.ASSERT)(this._buffer[attribute.name] === undefined, 'Attribute already exists in buffer');
        (0, error_util_1.ASSERT)(this._attributes[attribute.name] === undefined, 'Attribute already exists in attributes');
        var expectedDataLength = this._maxIndex * attribute.numComponents;
        (0, error_util_1.ASSERT)(data.length === expectedDataLength, "Data length expected to be ".concat(expectedDataLength, ", got ").concat(data.length));
        this._buffer[attribute.name] = {
            numComponents: attribute.numComponents,
            data: data,
        };
        this._attributes[attribute.name] = attribute;
        this._needsCompiling = true;
    };
    RenderBuffer.prototype.removeAttribute = function (attributeName) {
        delete this._buffer[attributeName];
        delete this._attributes[attributeName];
        this._needsCompiling = true;
    };
    RenderBuffer.prototype.getWebGLBuffer = function () {
        this._compile();
        (0, error_util_1.ASSERT)(this._WebGLBuffer !== undefined);
        return this._WebGLBuffer;
    };
    RenderBuffer.prototype._compile = function () {
        if (this._compiled && !this._needsCompiling) {
            return;
        }
        var newBuffer = {
            indices: { data: Uint32Array.from(this._buffer.indices.data), numComponents: this._buffer.indices.numComponents },
        };
        for (var key in this._buffer) {
            if (key !== 'indices') {
                newBuffer[key] = {
                    data: Float32Array.from(this._buffer[key].data),
                    numComponents: this._buffer[key].numComponents,
                };
            }
        }
        this._WebGLBuffer = {
            // buffer: twgl.createBufferInfoFromArrays(renderer_1.Renderer.Get._gl, newBuffer),
            numElements: this._buffer.indices.data.length,
        };
        this._compiled = true;
        this._needsCompiling = false;
    };
    RenderBuffer.prototype._getNewBuffer = function () {
        this._buffer = {
            indices: { numComponents: 1, data: [] },
        };
        for (var attr in this._attributes) {
            this._buffer[attr] = {
                numComponents: this._attributes[attr].numComponents,
                data: [],
            };
        }
    };
    RenderBuffer.prototype._checkDataMatchesAttributes = function (data) {
        if (!('indices' in data)) {
            throw Error('Given data does not have indices data');
        }
        var setsRequired = data.indices.reduce(function (a, v) { return Math.max(a, v); }) + 1;
        for (var attr in this._attributes) {
            if (!(attr in data)) {
                throw Error("Given data does not have ".concat(attr, " data"));
            }
            if (data.custom[attr].length % this._attributes[attr].numComponents != 0) {
                throw Error("Not enough/too much ".concat(attr, " data given"));
            }
            var numSets = data.custom[attr].length / this._attributes[attr].numComponents;
            if (numSets != setsRequired) {
                // throw `Number of indices does not match number of ${attr} components given`;
                throw Error("Expected ".concat(setsRequired * this._attributes[attr].numComponents, " values for ").concat(attr, ", got ").concat(data.custom[attr].length));
            }
        }
    };
    RenderBuffer.prototype.copy = function () {
        var copiedBuffer = new RenderBuffer([]);
        copiedBuffer._buffer = {
            indices: {
                numComponents: this._buffer.indices.numComponents,
                data: Array.from(this._buffer.indices.data),
            },
        };
        for (var key in this._buffer) {
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
    };
    return RenderBuffer;
}());
exports.RenderBuffer = RenderBuffer;
