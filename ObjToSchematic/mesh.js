"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mesh = exports.MaterialType = void 0;
const bounds_1 = require("./bounds");
const colour_1 = require("./colour");
const localiser_1 = require("./localiser");
const math_1 = require("./math");
const status_1 = require("./status");
const texture_1 = require("./texture");
const triangle_1 = require("./triangle");
const util_1 = require("./util");
const error_util_1 = require("./util/error_util");
const log_util_1 = require("./util/log_util");
const vector_1 = require("./vector");
/* eslint-disable */
var MaterialType;
(function (MaterialType) {
    MaterialType[MaterialType["solid"] = 0] = "solid";
    MaterialType[MaterialType["textured"] = 1] = "textured";
})(MaterialType = exports.MaterialType || (exports.MaterialType = {}));
class Mesh {
    constructor(vertices, normals, uvs, tris, materials) {
        this.id = (0, util_1.getRandomID)();
        this._vertices = vertices;
        this._normals = normals;
        this._uvs = uvs;
        this._tris = tris;
        this._materials = materials;
        this._loadedTextures = new Map();
    }
    // TODO: Always check
    processMesh(pitch, roll, yaw) {
        this._checkMesh();
        this._checkMaterials();
        this._centreMesh();
        this._rotateMesh(pitch, roll, yaw);
        this._normaliseMesh();
        this._loadTextures();
    }
    _rotateMesh(pitch, roll, yaw) {
        const cosa = Math.cos(yaw * math_1.degreesToRadians);
        const sina = Math.sin(yaw * math_1.degreesToRadians);
        const cosb = Math.cos(pitch * math_1.degreesToRadians);
        const sinb = Math.sin(pitch * math_1.degreesToRadians);
        const cosc = Math.cos(roll * math_1.degreesToRadians);
        const sinc = Math.sin(roll * math_1.degreesToRadians);
        const Axx = cosa * cosb;
        const Axy = cosa * sinb * sinc - sina * cosc;
        const Axz = cosa * sinb * cosc + sina * sinc;
        const Ayx = sina * cosb;
        const Ayy = sina * sinb * sinc + cosa * cosc;
        const Ayz = sina * sinb * cosc - cosa * sinc;
        const Azx = -sinb;
        const Azy = cosb * sinc;
        const Azz = cosb * cosc;
        this._vertices.forEach((vertex) => {
            const px = vertex.x;
            const py = vertex.y;
            const pz = vertex.z;
            vertex.x = Axx * px + Axy * py + Axz * pz;
            vertex.y = Ayx * px + Ayy * py + Ayz * pz;
            vertex.z = Azx * px + Azy * py + Azz * pz;
        });
    }
    getBounds() {
        const bounds = bounds_1.Bounds.getInfiniteBounds();
        if (this._transform) {
            for (const vertex of this._vertices) {
                bounds.extendByPoint(this._transform(vertex));
            }
        }
        else {
            for (const vertex of this._vertices) {
                bounds.extendByPoint(vertex);
            }
        }
        return bounds;
    }
    translateMesh(offset) {
        this._vertices.forEach((vertex) => {
            vertex.add(offset);
        });
    }
    scaleMesh(scaleFactor) {
        this._vertices.forEach((vertex) => {
            vertex.mulScalar(scaleFactor);
        });
    }
    _checkMesh() {
        // TODO: Check indices exist
        if (this._vertices.length === 0) {
            throw new error_util_1.AppError((0, localiser_1.LOC)('import.no_vertices_loaded'));
        }
        if (this._tris.length === 0) {
            throw new error_util_1.AppError((0, localiser_1.LOC)('import.no_triangles_loaded'));
        }
        if (this._tris.length >= 100000) {
            status_1.StatusHandler.warning((0, localiser_1.LOC)('import.too_many_triangles', { count: this._tris.length }));
        }
        status_1.StatusHandler.info((0, localiser_1.LOC)('import.vertex_triangle_count', { vertex_count: this._vertices.length, triangle_count: this._tris.length }));
        // Give warning if normals are not defined
        let giveNormalsWarning = false;
        for (let triIndex = 0; triIndex < this.getTriangleCount(); ++triIndex) {
            const tri = this._tris[triIndex];
            if (tri.normalIndices) {
                const xWellDefined = tri.normalIndices.x < this._normals.length;
                const yWellDefined = tri.normalIndices.y < this._normals.length;
                const zWellDefined = tri.normalIndices.z < this._normals.length;
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
            status_1.StatusHandler.warning((0, localiser_1.LOC)('import.missing_normals'));
        }
        ;
    }
    _checkMaterials() {
        // Check used materials exist
        const usedMaterials = new Set();
        const missingMaterials = new Set();
        for (const tri of this._tris) {
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
        const materialsToRemove = new Set();
        this._materials.forEach((material, materialName) => {
            if (!usedMaterials.has(materialName)) {
                (0, log_util_1.LOG_WARN)(`'${materialName}' is not used by any triangles, removing...`);
                materialsToRemove.add(materialName);
            }
        });
        materialsToRemove.forEach((materialName) => {
            this._materials.delete(materialName);
        });
        if (missingMaterials.size > 0) {
            (0, log_util_1.LOG_WARN)('Triangles use these materials but they were not found', missingMaterials);
        }
        // Check texture paths are absolute and exist
        this._materials.forEach((material, materialName) => {
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
        const materialsWithUVsOutOfBounds = new Set();
        this._tris.forEach((tri, triIndex) => {
            if (materialsWithUVsOutOfBounds.has(tri.material)) {
                // Already know this material has OOB UVs so skip
                return;
            }
            const uv = this.getUVs(triIndex);
            const uvsOutOfBounds = (uv.uv0.u < 0.0) || (uv.uv0.u > 1.0) ||
                (uv.uv0.v < 0.0) || (uv.uv0.v > 1.0) ||
                (uv.uv1.u < 0.0) || (uv.uv1.u > 1.0) ||
                (uv.uv1.v < 0.0) || (uv.uv1.v > 1.0) ||
                (uv.uv2.u < 0.0) || (uv.uv2.u > 1.0) ||
                (uv.uv2.v < 0.0) || (uv.uv2.v > 1.0);
            if (uvsOutOfBounds) {
                materialsWithUVsOutOfBounds.add(tri.material);
            }
        });
        (0, log_util_1.LOG)(`Materials with OOB UVs`, JSON.stringify(materialsWithUVsOutOfBounds));
        this._materials.forEach((material, materialName) => {
            if (material.type === MaterialType.textured) {
                material.extension = materialsWithUVsOutOfBounds.has(materialName) ?
                    'repeat' :
                    'clamp';
            }
        });
    }
    _centreMesh() {
        const centre = this.getBounds().getCentre();
        (0, error_util_1.ASSERT)(centre.isNumber(), 'Could not find centre of mesh');
        // Translate each triangle
        this.translateMesh(centre.negate());
    }
    _normaliseMesh() {
        const bounds = this.getBounds();
        const size = vector_1.Vector3.sub(bounds.max, bounds.min);
        const scaleFactor = 1.0 / size.y;
        if (isNaN(scaleFactor) || !isFinite(scaleFactor)) {
            throw new error_util_1.AppError((0, localiser_1.LOC)('import.could_not_scale_mesh'));
        }
        else {
            this.scaleMesh(scaleFactor);
        }
    }
    _loadTextures() {
        this._loadedTextures.clear();
        this._materials.forEach((material, materialName) => {
            if (material.type === MaterialType.textured && !this._loadedTextures.has(materialName)) {
                this._loadedTextures.set(materialName, new texture_1.Texture({ diffuse: material.diffuse, transparency: material.transparency }));
            }
        });
    }
    getVertices(triIndex) {
        const tri = this._tris[triIndex];
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
    }
    getUVs(triIndex) {
        const tri = this._tris[triIndex];
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
    }
    getNormals(triIndex) {
        const vertexData = this.getVertices(triIndex);
        const faceNormal = new triangle_1.Triangle(vertexData.v0, vertexData.v1, vertexData.v2).getNormal();
        const tri = this._tris[triIndex];
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
    }
    getUVTriangle(triIndex) {
        const vertices = this.getVertices(triIndex);
        const normals = this.getNormals(triIndex);
        const texcoords = this.getUVs(triIndex);
        return new triangle_1.UVTriangle(vertices.v0, vertices.v1, vertices.v2, normals.v0, normals.v1, normals.v2, texcoords.uv0, texcoords.uv1, texcoords.uv2);
    }
    getMaterialByTriangle(triIndex) {
        return this._tris[triIndex].material;
    }
    getMaterialByName(materialName) {
        return this._materials.get(materialName);
    }
    setMaterials(materialMap) {
        this._materials = materialMap;
        this._loadTextures();
    }
    getMaterials() {
        return this._materials;
    }
    sampleTextureMaterial(materialName, uv) {
        const material = this._materials.get(materialName);
        (0, error_util_1.ASSERT)(material !== undefined, `Sampling material that does not exist: ${materialName}`);
        (0, error_util_1.ASSERT)(material.type === MaterialType.textured, 'Sampling texture material of non-texture material');
        const texture = this._loadedTextures.get(materialName);
        (0, error_util_1.ASSERT)(texture !== undefined, 'Sampling texture that is not loaded');
        return texture.getRGBA(uv, material.interpolation, material.extension);
    }
    getTriangleCount() {
        return this._tris.length;
    }
    setTransform(transform) {
        this._transform = transform;
    }
    clearTransform() {
        this._transform = undefined;
    }
}
exports.Mesh = Mesh;
