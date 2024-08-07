"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mesh = exports.MaterialType = void 0;
var bounds_1 = require("./bounds");
var colour_1 = require("./colour");
// var localiser_1 = require("./localiser");
var math_1 = require("./math");
var status_1 = require("./status");
var texture_1 = require("./texture");
var triangle_1 = require("./triangle");
var util_1 = require("./util");
var error_util_1 = require("./util/error_util");
var log_util_1 = require("./util/log_util");
var vector_1 = require("./vector");
/* eslint-disable */
var MaterialType;
(function (MaterialType) {
    MaterialType[MaterialType["solid"] = 0] = "solid";
    MaterialType[MaterialType["textured"] = 1] = "textured";
})(MaterialType || (exports.MaterialType = MaterialType = {}));
var Mesh = /** @class */ (function () {
    function Mesh(vertices, normals, uvs, tris, materials) {
        this.id = (0, util_1.getRandomID)();
        this._vertices = vertices;
        this._normals = normals;
        this._uvs = uvs;
        this._tris = tris;
        this._materials = materials;
        this._loadedTextures = new Map();
    }
    // TODO: Always check
    Mesh.prototype.processMesh = function (pitch, roll, yaw) {
        this._checkMesh();
        this._checkMaterials();
        this._centreMesh();
        this._rotateMesh(pitch, roll, yaw);
        this._normaliseMesh();
        this._loadTextures();
    };
    Mesh.prototype._rotateMesh = function (pitch, roll, yaw) {
        var cosa = Math.cos(yaw * math_1.degreesToRadians);
        var sina = Math.sin(yaw * math_1.degreesToRadians);
        var cosb = Math.cos(pitch * math_1.degreesToRadians);
        var sinb = Math.sin(pitch * math_1.degreesToRadians);
        var cosc = Math.cos(roll * math_1.degreesToRadians);
        var sinc = Math.sin(roll * math_1.degreesToRadians);
        var Axx = cosa * cosb;
        var Axy = cosa * sinb * sinc - sina * cosc;
        var Axz = cosa * sinb * cosc + sina * sinc;
        var Ayx = sina * cosb;
        var Ayy = sina * sinb * sinc + cosa * cosc;
        var Ayz = sina * sinb * cosc - cosa * sinc;
        var Azx = -sinb;
        var Azy = cosb * sinc;
        var Azz = cosb * cosc;
        this._vertices.forEach(function (vertex) {
            var px = vertex.x;
            var py = vertex.y;
            var pz = vertex.z;
            vertex.x = Axx * px + Axy * py + Axz * pz;
            vertex.y = Ayx * px + Ayy * py + Ayz * pz;
            vertex.z = Azx * px + Azy * py + Azz * pz;
        });
    };
    Mesh.prototype.getBounds = function () {
        var bounds = bounds_1.Bounds.getInfiniteBounds();
        if (this._transform) {
            for (var _i = 0, _a = this._vertices; _i < _a.length; _i++) {
                var vertex = _a[_i];
                bounds.extendByPoint(this._transform(vertex));
            }
        }
        else {
            for (var _b = 0, _c = this._vertices; _b < _c.length; _b++) {
                var vertex = _c[_b];
                bounds.extendByPoint(vertex);
            }
        }
        return bounds;
    };
    Mesh.prototype.translateMesh = function (offset) {
        this._vertices.forEach(function (vertex) {
            vertex.add(offset);
        });
    };
    Mesh.prototype.scaleMesh = function (scaleFactor) {
        this._vertices.forEach(function (vertex) {
            vertex.mulScalar(scaleFactor);
        });
    };
    Mesh.prototype._checkMesh = function () {
        // TODO: Check indices exist
        if (this._vertices.length === 0) {
            // throw new error_util_1.AppError((0, localiser_1.LOC)('import.no_vertices_loaded'));
        }
        if (this._tris.length === 0) {
            // throw new error_util_1.AppError((0, localiser_1.LOC)('import.no_triangles_loaded'));
        }
        if (this._tris.length >= 100000) {
            // status_1.StatusHandler.warning((0, localiser_1.LOC)('import.too_many_triangles', { count: this._tris.length }));
        }
        // status_1.StatusHandler.info((0, localiser_1.LOC)('import.vertex_triangle_count', { vertex_count: this._vertices.length, triangle_count: this._tris.length }));
        // Give warning if normals are not defined
        var giveNormalsWarning = false;
        for (var triIndex = 0; triIndex < this.getTriangleCount(); ++triIndex) {
            var tri = this._tris[triIndex];
            if (tri.normalIndices) {
                var xWellDefined = tri.normalIndices.x < this._normals.length;
                var yWellDefined = tri.normalIndices.y < this._normals.length;
                var zWellDefined = tri.normalIndices.z < this._normals.length;
                if (!xWellDefined || !yWellDefined || !zWellDefined) {
                    giveNormalsWarning = true;
                    break;
                }
            }
            if (!tri.normalIndices) {
                giveNormalsWarning = true;
                break;
            }
        }
        if (giveNormalsWarning) {
            // status_1.StatusHandler.warning((0, localiser_1.LOC)('import.missing_normals'));
        }
        ;
    };
    Mesh.prototype._checkMaterials = function () {
        var _this = this;
        // Check used materials exist
        var usedMaterials = new Set();
        var missingMaterials = new Set();
        for (var _i = 0, _a = this._tris; _i < _a.length; _i++) {
            var tri = _a[_i];
            if (!this._materials.has(tri.material)) {
                // This triangle makes use of a material we don't have info about
                // Try infer details about this material and add it to our materials
                if (tri.texcoordIndices === undefined) {
                    // No texcoords are defined, therefore make a solid material
                    this._materials.set(tri.material, {
                        type: MaterialType.solid,
                        colour: colour_1.RGBAUtil.randomPretty(),
                        canBeTextured: false,
                        needsAttention: true,
                    });
                }
                else {
                    // Texcoords exist
                    this._materials.set(tri.material, {
                        type: MaterialType.solid,
                        colour: colour_1.RGBAUtil.randomPretty(),
                        canBeTextured: true,
                        needsAttention: true,
                    });
                }
                missingMaterials.add(tri.material);
            }
            usedMaterials.add(tri.material);
        }
        var materialsToRemove = new Set();
        this._materials.forEach(function (material, materialName) {
            if (!usedMaterials.has(materialName)) {
                (0, log_util_1.LOG_WARN)("'".concat(materialName, "' is not used by any triangles, removing..."));
                materialsToRemove.add(materialName);
            }
        });
        materialsToRemove.forEach(function (materialName) {
            _this._materials.delete(materialName);
        });
        if (missingMaterials.size > 0) {
            (0, log_util_1.LOG_WARN)('Triangles use these materials but they were not found', missingMaterials);
        }
        // Check texture paths are absolute and exist
        this._materials.forEach(function (material, materialName) {
            // TODO Unimplemented
            /*
            if (material.type === MaterialType.textured) {
                ASSERT(path.isAbsolute(material.path), 'Material texture path not absolute');
                if (!fs.existsSync(material.path)) {
                    LOG_WARN(`Could not find ${material.path} for material ${materialName}, changing to solid material`);
                    this._materials.set(materialName, {
                        type: MaterialType.solid,
                        colour: RGBAUtil.copy(RGBAColours.MAGENTA),
                        canBeTextured: true,
                        needsAttention: true,
                    });
                } else {
                    const parsedPath = path.parse(material.path);
                    if (parsedPath.ext === '.tga') {
                        material.path = TextureConverter.createPNGfromTGA(material.path);
                    }
                }
            }
            */
        });
        // Deduce default texture wrap mode for each material type
        var materialsWithUVsOutOfBounds = new Set();
        this._tris.forEach(function (tri, triIndex) {
            if (materialsWithUVsOutOfBounds.has(tri.material)) {
                // Already know this material has OOB UVs so skip
                return;
            }
            var uv = _this.getUVs(triIndex);
            var uvsOutOfBounds = (uv.uv0.u < 0.0) || (uv.uv0.u > 1.0) ||
                (uv.uv0.v < 0.0) || (uv.uv0.v > 1.0) ||
                (uv.uv1.u < 0.0) || (uv.uv1.u > 1.0) ||
                (uv.uv1.v < 0.0) || (uv.uv1.v > 1.0) ||
                (uv.uv2.u < 0.0) || (uv.uv2.u > 1.0) ||
                (uv.uv2.v < 0.0) || (uv.uv2.v > 1.0);
            if (uvsOutOfBounds) {
                materialsWithUVsOutOfBounds.add(tri.material);
            }
        });
        (0, log_util_1.LOG)("Materials with OOB UVs", JSON.stringify(materialsWithUVsOutOfBounds));
        this._materials.forEach(function (material, materialName) {
            if (material.type === MaterialType.textured) {
                material.extension = materialsWithUVsOutOfBounds.has(materialName) ?
                    'repeat' :
                    'clamp';
            }
        });
    };
    Mesh.prototype._centreMesh = function () {
        var centre = this.getBounds().getCentre();
        (0, error_util_1.ASSERT)(centre.isNumber(), 'Could not find centre of mesh');
        // Translate each triangle
        this.translateMesh(centre.negate());
    };
    Mesh.prototype._normaliseMesh = function () {
        var bounds = this.getBounds();
        var size = vector_1.Vector3.sub(bounds.max, bounds.min);
        var scaleFactor = Mesh.desiredHeight / size.y;
        if (isNaN(scaleFactor) || !isFinite(scaleFactor)) {
            // throw new error_util_1.AppError((0, localiser_1.LOC)('import.could_not_scale_mesh'));
        }
        else {
            this.scaleMesh(scaleFactor);
        }
    };
    Mesh.prototype._loadTextures = function () {
        var _this = this;
        this._loadedTextures.clear();
        this._materials.forEach(function (material, materialName) {
            if (material.type === MaterialType.textured && !_this._loadedTextures.has(materialName)) {
                _this._loadedTextures.set(materialName, new texture_1.Texture({ diffuse: material.diffuse, transparency: material.transparency }));
            }
        });
    };
    Mesh.prototype.getVertices = function (triIndex) {
        var tri = this._tris[triIndex];
        if (this._transform) {
            return {
                v0: this._transform(this._vertices[tri.positionIndices.x]),
                v1: this._transform(this._vertices[tri.positionIndices.y]),
                v2: this._transform(this._vertices[tri.positionIndices.z]),
            };
        }
        else {
            return {
                v0: this._vertices[tri.positionIndices.x],
                v1: this._vertices[tri.positionIndices.y],
                v2: this._vertices[tri.positionIndices.z],
            };
        }
    };
    Mesh.prototype.getUVs = function (triIndex) {
        var tri = this._tris[triIndex];
        if (tri.texcoordIndices) {
            return {
                uv0: this._uvs[tri.texcoordIndices.x] || new util_1.UV(0.0, 0.0),
                uv1: this._uvs[tri.texcoordIndices.y] || new util_1.UV(0.0, 0.0),
                uv2: this._uvs[tri.texcoordIndices.z] || new util_1.UV(0.0, 0.0),
            };
        }
        return {
            uv0: new util_1.UV(0.0, 0.0),
            uv1: new util_1.UV(0.0, 0.0),
            uv2: new util_1.UV(0.0, 0.0),
        };
    };
    Mesh.prototype.getNormals = function (triIndex) {
        var vertexData = this.getVertices(triIndex);
        var faceNormal = new triangle_1.Triangle(vertexData.v0, vertexData.v1, vertexData.v2).getNormal();
        var tri = this._tris[triIndex];
        if (tri.normalIndices) {
            return {
                v0: this._normals[tri.normalIndices.x] || faceNormal,
                v1: this._normals[tri.normalIndices.y] || faceNormal,
                v2: this._normals[tri.normalIndices.z] || faceNormal,
            };
        }
        return {
            v0: faceNormal,
            v1: faceNormal,
            v2: faceNormal,
        };
    };
    Mesh.prototype.getUVTriangle = function (triIndex) {
        var vertices = this.getVertices(triIndex);
        var normals = this.getNormals(triIndex);
        var texcoords = this.getUVs(triIndex);
        return new triangle_1.UVTriangle(vertices.v0, vertices.v1, vertices.v2, normals.v0, normals.v1, normals.v2, texcoords.uv0, texcoords.uv1, texcoords.uv2);
    };
    Mesh.prototype.getMaterialByTriangle = function (triIndex) {
        return this._tris[triIndex].material;
    };
    Mesh.prototype.getMaterialByName = function (materialName) {
        return this._materials.get(materialName);
    };
    Mesh.prototype.setMaterials = function (materialMap) {
        this._materials = materialMap;
        this._loadTextures();
    };
    Mesh.prototype.getMaterials = function () {
        return this._materials;
    };
    Mesh.prototype.sampleTextureMaterial = function (materialName, uv) {
        var material = this._materials.get(materialName);
        (0, error_util_1.ASSERT)(material !== undefined, "Sampling material that does not exist: ".concat(materialName));
        (0, error_util_1.ASSERT)(material.type === MaterialType.textured, 'Sampling texture material of non-texture material');
        var texture = this._loadedTextures.get(materialName);
        (0, error_util_1.ASSERT)(texture !== undefined, 'Sampling texture that is not loaded');
        return texture.getRGBA(uv, material.interpolation, material.extension);
    };
    Mesh.prototype.getTriangleCount = function () {
        return this._tris.length;
    };
    Mesh.prototype.setTransform = function (transform) {
        this._transform = transform;
    };
    Mesh.prototype.clearTransform = function () {
        this._transform = undefined;
    };
    Mesh.desiredHeight = 8.0;
    return Mesh;
}());
exports.Mesh = Mesh;
