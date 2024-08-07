"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoxelMesh = void 0;
const block_assigner_1 = require("./block_assigner");
const bounds_1 = require("./bounds");
const buffer_1 = require("./buffer");
const occlusion_1 = require("./occlusion");
const error_util_1 = require("./util/error_util");
const log_util_1 = require("./util/log_util");
const vector_1 = require("./vector");
class VoxelMesh {
    constructor(voxelMeshParams) {
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
    getVoxels() {
        return Array.from(this._voxels.values());
    }
    isVoxelAt(pos) {
        return this._voxels.has(pos.hash());
    }
    isOpaqueVoxelAt(pos) {
        const voxel = this.getVoxelAt(pos);
        if (voxel) {
            return voxel.colour.a == 1.0;
        }
        return false;
    }
    getVoxelAt(pos) {
        return this._voxels.get(pos.hash());
    }
    static getFullFaceVisibility() {
        return block_assigner_1.EFaceVisibility.Up | block_assigner_1.EFaceVisibility.Down | block_assigner_1.EFaceVisibility.North | block_assigner_1.EFaceVisibility.West | block_assigner_1.EFaceVisibility.East | block_assigner_1.EFaceVisibility.South;
    }
    getFaceVisibility(pos) {
        let visibility = 0;
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
    }
    addVoxel(inPos, colour) {
        if (colour.a === 0) {
            return;
        }
        const pos = inPos.copy().round();
        const voxel = this._voxels.get(pos.hash());
        if (voxel !== undefined) {
            if (this._voxelMeshParams.voxelOverlapRule === 'average') {
                voxel.colour.r = ((voxel.colour.r * voxel.collisions) + colour.r) / (voxel.collisions + 1);
                voxel.colour.g = ((voxel.colour.g * voxel.collisions) + colour.g) / (voxel.collisions + 1);
                voxel.colour.b = ((voxel.colour.b * voxel.collisions) + colour.b) / (voxel.collisions + 1);
                voxel.colour.a = ((voxel.colour.a * voxel.collisions) + colour.a) / (voxel.collisions + 1);
                ++voxel.collisions;
            }
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
    }
    getBounds() {
        return this._bounds;
    }
    getVoxelCount() {
        return this._voxels.size;
    }
    /**
     * Goes through each voxel and calculates what voxel neighbours it has.
     * This is used for ambient occlusion.
     * @note This does NOT check all 27 neighbours, i.e. it does not check voxels
     * directly up, down, north, south, east, west as they're not needed.
     */
    calculateNeighbours() {
        if (!this._voxelMeshParams.enableAmbientOcclusion) {
            return;
        }
        const pos = new vector_1.Vector3(0, 0, 0);
        this._voxels.forEach((voxel) => {
            voxel.neighbours = 0;
            VoxelMesh._Neighbours.forEach((neighbour) => {
                pos.setFrom(voxel.position);
                pos.add(neighbour.offset);
                if (this.isVoxelAt(pos)) {
                    voxel.neighbours |= (1 << neighbour.index);
                }
            });
        });
    }
    getNeighbours(pos) {
        var _a, _b;
        return (_b = (_a = this._voxels.get(pos.hash())) === null || _a === void 0 ? void 0 : _a.neighbours) !== null && _b !== void 0 ? _b : 0;
    }
    /*
     * Returns true if a voxel at position 'pos' has a neighbour with offset 'offset'
     * Offset must be a vector that exists within this._neighbours defined above
     */
    hasNeighbour(pos, offset) {
        return (this.getNeighbours(pos) & (1 << occlusion_1.OcclusionManager.getNeighbourIndex(offset))) > 0;
    }
    setRenderParams(params) {
        this._renderParams = params;
        this._recreateBuffer = true;
        this._bufferChunks = [];
    }
    getChunkedBuffer(chunkIndex) {
        (0, error_util_1.ASSERT)(this._renderParams, 'Called VoxelMesh.getChunkedBuffer() without setting render params');
        if (this._bufferChunks[chunkIndex] === undefined) {
            (0, log_util_1.LOGF)(`[VoxelMesh]: getChunkedBuffer: ci: ${chunkIndex} not cached`);
            this._bufferChunks[chunkIndex] = buffer_1.ChunkedBufferGenerator.fromVoxelMesh(this, this._renderParams, chunkIndex);
        }
        else {
            (0, log_util_1.LOGF)(`[VoxelMesh]: getChunkedBuffer: ci: ${chunkIndex} cached`);
        }
        return this._bufferChunks[chunkIndex];
    }
}
exports.VoxelMesh = VoxelMesh;
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
].map((neighbourOffset) => {
    const inverseOffset = neighbourOffset.copy().negate();
    return {
        offset: neighbourOffset,
        index: occlusion_1.OcclusionManager.getNeighbourIndex(neighbourOffset),
        inverseIndex: occlusion_1.OcclusionManager.getNeighbourIndex(inverseOffset),
    };
});
