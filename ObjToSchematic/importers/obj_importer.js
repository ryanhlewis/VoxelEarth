"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjImporter = void 0;
const progress_1 = require("../progress");
const localiser_1 = require("../localiser");
const math_1 = require("../math");
const mesh_1 = require("../mesh");
const util_1 = require("../util");
const error_util_1 = require("../util/error_util");
const regex_util_1 = require("../util/regex_util");
const regex_util_2 = require("../util/regex_util");
const regex_util_3 = require("../util/regex_util");
const vector_1 = require("../vector");
const base_importer_1 = require("./base_importer");
class ObjImporter extends base_importer_1.IImporter {
    constructor() {
        super(...arguments);
        this._vertices = [];
        this._normals = [];
        this._uvs = [];
        this._tris = [];
        this._currentMaterialName = 'DEFAULT_UNASSIGNED';
        this._objParsers = [
            {
                // e.g. 'usemtl my_material'
                regex: new regex_util_1.RegExpBuilder().add(/^usemtl/).add(/ /).add(regex_util_2.REGEX_NZ_ANY, 'name').toRegExp(),
                delegate: (match) => {
                    this._currentMaterialName = match.name.trim();
                    (0, error_util_1.ASSERT)(this._currentMaterialName, 'invalid material name');
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
                delegate: (match) => {
                    const x = parseFloat(match.x);
                    const y = parseFloat(match.y);
                    const z = parseFloat(match.z);
                    (0, math_1.checkNaN)(x, y, z);
                    this._vertices.push(new vector_1.Vector3(x, y, z));
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
                delegate: (match) => {
                    const x = parseFloat(match.x);
                    const y = parseFloat(match.y);
                    const z = parseFloat(match.z);
                    (0, math_1.checkNaN)(x, y, z);
                    this._normals.push(new vector_1.Vector3(x, y, z));
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
                delegate: (match) => {
                    const u = parseFloat(match.u);
                    const v = parseFloat(match.v);
                    (0, math_1.checkNaN)(u, v);
                    this._uvs.push(new util_1.UV(u, v));
                },
            },
            {
                // e.g. 'f 1/2/3 ...' or 'f 1/2 ...' or 'f 1 ...'
                regex: new regex_util_1.RegExpBuilder()
                    .add(/^f/)
                    .addNonzeroWhitespace()
                    .add(/.*/, 'line')
                    .toRegExp(),
                delegate: (match) => {
                    const line = match.line.trim();
                    const vertices = line.split(' ').filter((x) => {
                        return x.length !== 0;
                    });
                    if (vertices.length < 3) {
                        // this.addWarning('')
                        // throw new AppError('Face data should have at least 3 vertices');
                    }
                    const points = [];
                    for (const vertex of vertices) {
                        const vertexData = vertex.split('/');
                        switch (vertexData.length) {
                            case 1: {
                                const index = parseInt(vertexData[0]);
                                points.push({
                                    positionIndex: index,
                                    texcoordIndex: index,
                                    normalIndex: index,
                                });
                                break;
                            }
                            case 2: {
                                const positionIndex = parseInt(vertexData[0]);
                                const texcoordIndex = parseInt(vertexData[1]);
                                points.push({
                                    positionIndex: positionIndex,
                                    texcoordIndex: texcoordIndex,
                                });
                                break;
                            }
                            case 3: {
                                const positionIndex = parseInt(vertexData[0]);
                                const texcoordIndex = parseInt(vertexData[1]);
                                const normalIndex = parseInt(vertexData[2]);
                                points.push({
                                    positionIndex: positionIndex,
                                    texcoordIndex: texcoordIndex,
                                    normalIndex: normalIndex,
                                });
                                break;
                            }
                            default:
                                throw new error_util_1.AppError((0, localiser_1.LOC)('import.invalid_face_data', { count: vertexData.length }));
                        }
                    }
                    const pointBase = points[0];
                    for (let i = 1; i < points.length - 1; ++i) {
                        const pointA = points[i];
                        const pointB = points[i + 1];
                        const tri = {
                            positionIndices: {
                                x: pointBase.positionIndex - 1,
                                y: pointA.positionIndex - 1,
                                z: pointB.positionIndex - 1,
                            },
                            material: this._currentMaterialName,
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
                        this._tris.push(tri);
                    }
                },
            },
        ];
    }
    import(file) {
        return file.text().then((fileSource) => {
            if (fileSource.includes('�')) {
                throw new error_util_1.AppError((0, localiser_1.LOC)('import.invalid_encoding'));
            }
            fileSource.replace('\r', ''); // Convert Windows carriage return
            const fileLines = fileSource.split('\n');
            const numLines = fileLines.length;
            const progressHandle = progress_1.ProgressManager.Get.start('VoxelMeshBuffer');
            fileLines.forEach((line, index) => {
                this.parseOBJLine(line);
                progress_1.ProgressManager.Get.progress(progressHandle, index / numLines);
            });
            return new mesh_1.Mesh(this._vertices, this._normals, this._uvs, this._tris, new Map());
        });
    }
    parseOBJLine(line) {
        const essentialTokens = ['usemtl ', 'v ', 'vt ', 'f ', 'vn '];
        for (const parser of this._objParsers) {
            const match = parser.regex.exec(line);
            if (match && match.groups) {
                try {
                    parser.delegate(match.groups);
                }
                catch (error) {
                    if (error instanceof error_util_1.AppError) {
                        throw new error_util_1.AppError((0, localiser_1.LOC)('import.failed_to_parse_line', { line: line, error: error.message }));
                    }
                }
                return;
            }
        }
        const beginsWithEssentialToken = essentialTokens.some((token) => {
            return line.startsWith(token);
        });
        if (beginsWithEssentialToken) {
            (0, error_util_1.ASSERT)(false, `Failed to parse essential token for <b>${line}</b>`);
        }
    }
}
exports.ObjImporter = ObjImporter;
