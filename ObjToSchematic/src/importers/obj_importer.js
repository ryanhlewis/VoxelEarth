"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjImporter = void 0;
// var progress_1 = require("../progress");
// var localiser_1 = require("../localiser");
var math_1 = require("../math");
var mesh_1 = require("../mesh");
var util_1 = require("../util");
var error_util_1 = require("../util/error_util");
var regex_util_1 = require("../util/regex_util");
var regex_util_2 = require("../util/regex_util");
var regex_util_3 = require("../util/regex_util");
var vector_1 = require("../vector");
var base_importer_1 = require("./base_importer");
var ObjImporter = /** @class */ (function (_super) {
    __extends(ObjImporter, _super);
    function ObjImporter() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._vertices = [];
        _this._normals = [];
        _this._uvs = [];
        _this._tris = [];
        _this._currentMaterialName = 'DEFAULT_UNASSIGNED';
        _this._objParsers = [
            {
                // e.g. 'usemtl my_material'
                regex: new regex_util_1.RegExpBuilder().add(/^usemtl/).add(/ /).add(regex_util_2.REGEX_NZ_ANY, 'name').toRegExp(),
                delegate: function (match) {
                    _this._currentMaterialName = match.name.trim();
                    (0, error_util_1.ASSERT)(_this._currentMaterialName, 'invalid material name');
                },
            },
            {
                // e.g. 'v 0.123 0.456 0.789'
                regex: new regex_util_1.RegExpBuilder()
                    .add(/^v/)
                    .addNonzeroWhitespace()
                    .add(regex_util_3.REGEX_NUMBER, 'x')
                    .addNonzeroWhitespace()
                    .add(regex_util_3.REGEX_NUMBER, 'y')
                    .addNonzeroWhitespace()
                    .add(regex_util_3.REGEX_NUMBER, 'z')
                    .toRegExp(),
                delegate: function (match) {
                    var x = parseFloat(match.x);
                    var y = parseFloat(match.y);
                    var z = parseFloat(match.z);
                    (0, math_1.checkNaN)(x, y, z);
                    _this._vertices.push(new vector_1.Vector3(x, y, z));
                },
            },
            {
                // e.g. 'vn 0.123 0.456 0.789'
                regex: new regex_util_1.RegExpBuilder()
                    .add(/^vn/)
                    .addNonzeroWhitespace()
                    .add(regex_util_3.REGEX_NUMBER, 'x')
                    .addNonzeroWhitespace()
                    .add(regex_util_3.REGEX_NUMBER, 'y')
                    .addNonzeroWhitespace()
                    .add(regex_util_3.REGEX_NUMBER, 'z')
                    .toRegExp(),
                delegate: function (match) {
                    var x = parseFloat(match.x);
                    var y = parseFloat(match.y);
                    var z = parseFloat(match.z);
                    (0, math_1.checkNaN)(x, y, z);
                    _this._normals.push(new vector_1.Vector3(x, y, z));
                },
            },
            {
                // e.g. 'vt 0.123 0.456'
                regex: new regex_util_1.RegExpBuilder()
                    .add(/^vt/)
                    .addNonzeroWhitespace()
                    .add(regex_util_3.REGEX_NUMBER, 'u')
                    .addNonzeroWhitespace()
                    .add(regex_util_3.REGEX_NUMBER, 'v')
                    .toRegExp(),
                delegate: function (match) {
                    var u = parseFloat(match.u);
                    var v = parseFloat(match.v);
                    (0, math_1.checkNaN)(u, v);
                    _this._uvs.push(new util_1.UV(u, v));
                },
            },
            {
                // e.g. 'f 1/2/3 ...' or 'f 1/2 ...' or 'f 1 ...'
                regex: new regex_util_1.RegExpBuilder()
                    .add(/^f/)
                    .addNonzeroWhitespace()
                    .add(/.*/, 'line')
                    .toRegExp(),
                delegate: function (match) {
                    var line = match.line.trim();
                    var vertices = line.split(' ').filter(function (x) {
                        return x.length !== 0;
                    });
                    if (vertices.length < 3) {
                        // this.addWarning('')
                        // throw new AppError('Face data should have at least 3 vertices');
                    }
                    var points = [];
                    for (var _i = 0, vertices_1 = vertices; _i < vertices_1.length; _i++) {
                        var vertex = vertices_1[_i];
                        var vertexData = vertex.split('/');
                        switch (vertexData.length) {
                            case 1: {
                                var index = parseInt(vertexData[0]);
                                points.push({
                                    positionIndex: index,
                                    texcoordIndex: index,
                                    normalIndex: index,
                                });
                                break;
                            }
                            case 2: {
                                var positionIndex = parseInt(vertexData[0]);
                                var texcoordIndex = parseInt(vertexData[1]);
                                points.push({
                                    positionIndex: positionIndex,
                                    texcoordIndex: texcoordIndex,
                                });
                                break;
                            }
                            case 3: {
                                var positionIndex = parseInt(vertexData[0]);
                                var texcoordIndex = parseInt(vertexData[1]);
                                var normalIndex = parseInt(vertexData[2]);
                                points.push({
                                    positionIndex: positionIndex,
                                    texcoordIndex: texcoordIndex,
                                    normalIndex: normalIndex,
                                });
                                break;
                            }
                            default:
                                // throw new error_util_1.AppError((0, localiser_1.LOC)('import.invalid_face_data', { count: vertexData.length }));
                        }
                    }
                    var pointBase = points[0];
                    for (var i = 1; i < points.length - 1; ++i) {
                        var pointA = points[i];
                        var pointB = points[i + 1];
                        var tri = {
                            positionIndices: {
                                x: pointBase.positionIndex - 1,
                                y: pointA.positionIndex - 1,
                                z: pointB.positionIndex - 1,
                            },
                            material: _this._currentMaterialName,
                        };
                        if (pointBase.normalIndex || pointA.normalIndex || pointB.normalIndex) {
                            (0, error_util_1.ASSERT)(pointBase.normalIndex && pointA.normalIndex && pointB.normalIndex);
                            tri.normalIndices = {
                                x: pointBase.normalIndex - 1,
                                y: pointA.normalIndex - 1,
                                z: pointB.normalIndex - 1,
                            };
                        }
                        if (pointBase.texcoordIndex || pointA.texcoordIndex || pointB.texcoordIndex) {
                            (0, error_util_1.ASSERT)(pointBase.texcoordIndex && pointA.texcoordIndex && pointB.texcoordIndex);
                            tri.texcoordIndices = {
                                x: pointBase.texcoordIndex - 1,
                                y: pointA.texcoordIndex - 1,
                                z: pointB.texcoordIndex - 1,
                            };
                        }
                        _this._tris.push(tri);
                    }
                },
            },
        ];
        return _this;
    }

    const fs = require('fs').promises;

    async function readTextFile(filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    return data;
    }


    ObjImporter.prototype.import = function (file) {
        var _this = this;
        // return file.text().then(function (fileSource) {
        return readTextFile(file)
            .then(fileSource => {
                console.log('fileSource');
                console.log(fileSource);
              // Do something with the text
            
            if (fileSource.includes('�')) {
                // throw new error_util_1.AppError((0, localiser_1.LOC)('import.invalid_encoding'));
            }
            fileSource.replace('\r', ''); // Convert Windows carriage return
            var fileLines = fileSource.split('\n');
            var numLines = fileLines.length;
            // var progressHandle = progress_1.ProgressManager.Get.start('VoxelMeshBuffer');
            fileLines.forEach(function (line, index) {
                _this.parseOBJLine(line);
                // progress_1.ProgressManager.Get.progress(progressHandle, index / numLines);
            });
            return new mesh_1.Mesh(_this._vertices, _this._normals, _this._uvs, _this._tris, new Map());
        });
    };
    ObjImporter.prototype.parseOBJLine = function (line) {
        var essentialTokens = ['usemtl ', 'v ', 'vt ', 'f ', 'vn '];
        for (var _i = 0, _a = this._objParsers; _i < _a.length; _i++) {
            var parser = _a[_i];
            var match = parser.regex.exec(line);
            if (match && match.groups) {
                try {
                    parser.delegate(match.groups);
                }
                catch (error) {
                    if (error instanceof error_util_1.AppError) {
                        // throw new error_util_1.AppError((0, localiser_1.LOC)('import.failed_to_parse_line', { line: line, error: error.message }));
                    }
                }
                return;
            }
        }
        var beginsWithEssentialToken = essentialTokens.some(function (token) {
            return line.startsWith(token);
        });
        if (beginsWithEssentialToken) {
            (0, error_util_1.ASSERT)(false, "Failed to parse essential token for <b>".concat(line, "</b>"));
        }
    };
    return ObjImporter;
}(base_importer_1.IImporter));
exports.ObjImporter = ObjImporter;
