"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoxelMesh = void 0;
var block_assigner_1 = require("./block_assigner");
var bounds_1 = require("./bounds");
var buffer_1 = require("./buffer");
var occlusion_1 = require("./occlusion");
var error_util_1 = require("./util/error_util");
var log_util_1 = require("./util/log_util");
var vector_1 = require("./vector");
var VoxelMesh = /** @class */ (function () {
    function VoxelMesh(voxelMeshParams) {
        /*
        private _buffer?: TVoxelMeshBufferDescription;
        public getBuffer(): TVoxelMeshBufferDescription {
            ASSERT(this._renderParams, 'Called VoxelMesh.getBuffer() without setting render params');
            if (this._buffer === undefined || this._recreateBuffer) {
                this._buffer = BufferGenerator.fromVoxelMesh(this, this._renderParams);
                this._recreateBuffer = false;
            }
            return this._buffer;
        }
        */
        this._bufferChunks = [];
        this._voxels = new Map();
        this._bounds = bounds_1.Bounds.getInfiniteBounds();
        this._voxelMeshParams = voxelMeshParams;
        this._recreateBuffer = true;
    }
    VoxelMesh.prototype.getVoxels = function () {
        return Array.from(this._voxels.values());
    };
    VoxelMesh.prototype.isVoxelAt = function (pos) {
        return this._voxels.has(pos.hash());
    };
    VoxelMesh.prototype.isOpaqueVoxelAt = function (pos) {
        var voxel = this.getVoxelAt(pos);
        if (voxel) {
            return voxel.colour.a == 1.0;
        }
        return false;
    };
    VoxelMesh.prototype.getVoxelAt = function (pos) {
        return this._voxels.get(pos.hash());
    };
    VoxelMesh.getFullFaceVisibility = function () {
        return block_assigner_1.EFaceVisibility.Up | block_assigner_1.EFaceVisibility.Down | block_assigner_1.EFaceVisibility.North | block_assigner_1.EFaceVisibility.West | block_assigner_1.EFaceVisibility.East | block_assigner_1.EFaceVisibility.South;
    };
    VoxelMesh.prototype.getFaceVisibility = function (pos) {
        var visibility = 0;
        if (!this.isOpaqueVoxelAt(vector_1.Vector3.add(pos, new vector_1.Vector3(0, 1, 0)))) {
            visibility += block_assigner_1.EFaceVisibility.Up;
        }
        if (!this.isOpaqueVoxelAt(vector_1.Vector3.add(pos, new vector_1.Vector3(0, -1, 0)))) {
            visibility += block_assigner_1.EFaceVisibility.Down;
        }
        if (!this.isOpaqueVoxelAt(vector_1.Vector3.add(pos, new vector_1.Vector3(1, 0, 0)))) {
            visibility += block_assigner_1.EFaceVisibility.North;
        }
        if (!this.isOpaqueVoxelAt(vector_1.Vector3.add(pos, new vector_1.Vector3(-1, 0, 0)))) {
            visibility += block_assigner_1.EFaceVisibility.South;
        }
        if (!this.isOpaqueVoxelAt(vector_1.Vector3.add(pos, new vector_1.Vector3(0, 0, 1)))) {
            visibility += block_assigner_1.EFaceVisibility.East;
        }
        if (!this.isOpaqueVoxelAt(vector_1.Vector3.add(pos, new vector_1.Vector3(0, 0, -1)))) {
            visibility += block_assigner_1.EFaceVisibility.West;
        }
        return visibility;
    };
    VoxelMesh.prototype.addVoxel = function (inPos, colour) {
        if (colour.a === 0) {
            return;
        }
        var pos = inPos.copy().round();
        var voxel = this._voxels.get(pos.hash());
        if (voxel !== undefined) {
            voxel.colour.r = ((voxel.colour.r * voxel.collisions) + colour.r) / (voxel.collisions + 1);
            voxel.colour.g = ((voxel.colour.g * voxel.collisions) + colour.g) / (voxel.collisions + 1);
            voxel.colour.b = ((voxel.colour.b * voxel.collisions) + colour.b) / (voxel.collisions + 1);
            voxel.colour.a = ((voxel.colour.a * voxel.collisions) + colour.a) / (voxel.collisions + 1);
            ++voxel.collisions;
        }
        else {
            this._voxels.set(pos.hash(), {
                position: pos,
                colour: colour,
                collisions: 1,
                neighbours: 0,
            });
            this._bounds.extendByPoint(pos);
        }
    };
    VoxelMesh.prototype.getBounds = function () {
        return this._bounds;
    };
    VoxelMesh.prototype.getVoxelCount = function () {
        return this._voxels.size;
    };
    /**
     * Goes through each voxel and calculates what voxel neighbours it has.
     * This is used for ambient occlusion.
     * @note This does NOT check all 27 neighbours, i.e. it does not check voxels
     * directly up, down, north, south, east, west as they're not needed.
     */
    VoxelMesh.prototype.calculateNeighbours = function () {
        var _this = this;
        if (!this._voxelMeshParams.enableAmbientOcclusion) {
            return;
        }
        var pos = new vector_1.Vector3(0, 0, 0);
        this._voxels.forEach(function (voxel) {
            voxel.neighbours = 0;
            VoxelMesh._Neighbours.forEach(function (neighbour) {
                pos.setFrom(voxel.position);
                pos.add(neighbour.offset);
                if (_this.isVoxelAt(pos)) {
                    voxel.neighbours |= (1 << neighbour.index);
                }
            });
        });
    };
    VoxelMesh.prototype.getNeighbours = function (pos) {
        var _a, _b;
        return (_b = (_a = this._voxels.get(pos.hash())) === null || _a === void 0 ? void 0 : _a.neighbours) !== null && _b !== void 0 ? _b : 0;
    };
    /*
     * Returns true if a voxel at position 'pos' has a neighbour with offset 'offset'
     * Offset must be a vector that exists within this._neighbours defined above
     */
    VoxelMesh.prototype.hasNeighbour = function (pos, offset) {
        return (this.getNeighbours(pos) & (1 << occlusion_1.OcclusionManager.getNeighbourIndex(offset))) > 0;
    };
    VoxelMesh.prototype.setRenderParams = function (params) {
        this._renderParams = params;
        this._recreateBuffer = true;
        this._bufferChunks = [];
    };
    VoxelMesh.prototype.getChunkedBuffer = function (chunkIndex) {
        (0, error_util_1.ASSERT)(this._renderParams, 'Called VoxelMesh.getChunkedBuffer() without setting render params');
        if (this._bufferChunks[chunkIndex] === undefined) {
            (0, log_util_1.LOGF)("[VoxelMesh]: getChunkedBuffer: ci: ".concat(chunkIndex, " not cached"));
            this._bufferChunks[chunkIndex] = buffer_1.ChunkedBufferGenerator.fromVoxelMesh(this, this._renderParams, chunkIndex);
        }
        else {
            (0, log_util_1.LOGF)("[VoxelMesh]: getChunkedBuffer: ci: ".concat(chunkIndex, " cached"));
        }
        return this._bufferChunks[chunkIndex];
    };
    VoxelMesh._Neighbours = [
        new vector_1.Vector3(1, 1, -1),
        new vector_1.Vector3(0, 1, -1),
        new vector_1.Vector3(-1, 1, -1),
        new vector_1.Vector3(1, 0, -1),
        new vector_1.Vector3(-1, 0, -1),
        new vector_1.Vector3(1, -1, -1),
        new vector_1.Vector3(0, -1, -1),
        new vector_1.Vector3(-1, -1, -1),
        new vector_1.Vector3(1, 1, 0),
        new vector_1.Vector3(-1, 1, 0),
        new vector_1.Vector3(1, -1, 0),
        new vector_1.Vector3(-1, -1, 0),
        new vector_1.Vector3(1, 1, 1),
        new vector_1.Vector3(0, 1, 1),
        new vector_1.Vector3(-1, 1, 1),
        new vector_1.Vector3(1, 0, 1),
        new vector_1.Vector3(-1, 0, 1),
        new vector_1.Vector3(1, -1, 1),
        new vector_1.Vector3(0, -1, 1),
        new vector_1.Vector3(-1, -1, 1),
    ].map(function (neighbourOffset) {
        var inverseOffset = neighbourOffset.copy().negate();
        return {
            offset: neighbourOffset,
            index: occlusion_1.OcclusionManager.getNeighbourIndex(neighbourOffset),
            inverseIndex: occlusion_1.OcclusionManager.getNeighbourIndex(inverseOffset),
        };
    });
    return VoxelMesh;
}());
exports.VoxelMesh = VoxelMesh;
