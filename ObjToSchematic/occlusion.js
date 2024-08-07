"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcclusionManager = void 0;
const config_1 = require("./config");
const error_util_1 = require("./util/error_util");
const vector_1 = require("./vector");
class OcclusionManager {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._occlusionsSetup = false;
        this._setupOcclusions();
        this._occlusions = new Array(6 * 4 * 4);
        this._localNeighbourhoodCache = Array(27);
    }
    getBlankOcclusions() {
        return new Array(96).fill(1.0);
    }
    // Assume's buffer is of length 96
    getOcclusions(buffer, centre, voxelMesh) {
        // Cache local neighbours
        const neighbourData = voxelMesh.getNeighbours(centre);
        if (neighbourData === undefined) {
            // This voxel has no neighbours within a 1-block radius
            buffer.fill(0.0);
            return;
        }
        for (let i = 0; i < 27; ++i) {
            this._localNeighbourhoodCache[i] = (neighbourData & (1 << i)) > 0 ? 1 : 0;
        }
        // For each face
        for (let f = 0; f < 6; ++f) {
            for (let v = 0; v < 4; ++v) {
                let numNeighbours = 0;
                let occlusionValue = 1.0;
                for (let i = 0; i < 2; ++i) {
                    const neighbourIndex = this._occlusionNeighboursIndices[this._getOcclusionMapIndex(f, v, i)];
                    numNeighbours += this._localNeighbourhoodCache[neighbourIndex];
                }
                // If both edge blocks along this vertex exist,
                // assume corner exists (even if it doesnt)
                // (This is a stylistic choice)
                if (numNeighbours == 2 && config_1.AppConfig.Get.AMBIENT_OCCLUSION_OVERRIDE_CORNER) {
                    ++numNeighbours;
                }
                else {
                    const neighbourIndex = this._occlusionNeighboursIndices[this._getOcclusionMapIndex(f, v, 2)];
                    numNeighbours += this._localNeighbourhoodCache[neighbourIndex];
                }
                // Convert from occlusion denoting the occlusion factor to the
                // attenuation in light value: 0 -> 1.0, 1 -> 0.8, 2 -> 0.6, 3 -> 0.4
                occlusionValue = 1.0 - 0.2 * numNeighbours;
                const baseIndex = f * 16 + v;
                this._occlusions[baseIndex + 0] = occlusionValue;
                this._occlusions[baseIndex + 4] = occlusionValue;
                this._occlusions[baseIndex + 8] = occlusionValue;
                this._occlusions[baseIndex + 12] = occlusionValue;
            }
        }
        buffer.set(this._occlusions, 0);
        return;
    }
    static getNeighbourIndex(neighbour) {
        return 9 * (neighbour.x + 1) + 3 * (neighbour.y + 1) + (neighbour.z + 1);
    }
    _setupOcclusions() {
        (0, error_util_1.ASSERT)(!this._occlusionsSetup);
        // TODO: Find some for-loop to clean this up
        // [Edge, Edge, Corrner]
        const occlusionNeighbours = [
            [
                // +X
                [new vector_1.Vector3(1, 1, 0), new vector_1.Vector3(1, 0, -1), new vector_1.Vector3(1, 1, -1)],
                [new vector_1.Vector3(1, -1, 0), new vector_1.Vector3(1, 0, -1), new vector_1.Vector3(1, -1, -1)],
                [new vector_1.Vector3(1, 1, 0), new vector_1.Vector3(1, 0, 1), new vector_1.Vector3(1, 1, 1)],
                [new vector_1.Vector3(1, -1, 0), new vector_1.Vector3(1, 0, 1), new vector_1.Vector3(1, -1, 1)],
            ],
            [
                // -X
                [new vector_1.Vector3(-1, 1, 0), new vector_1.Vector3(-1, 0, 1), new vector_1.Vector3(-1, 1, 1)],
                [new vector_1.Vector3(-1, -1, 0), new vector_1.Vector3(-1, 0, 1), new vector_1.Vector3(-1, -1, 1)],
                [new vector_1.Vector3(-1, 1, 0), new vector_1.Vector3(-1, 0, -1), new vector_1.Vector3(-1, 1, -1)],
                [new vector_1.Vector3(-1, -1, 0), new vector_1.Vector3(-1, 0, -1), new vector_1.Vector3(-1, -1, -1)],
            ],
            [
                // +Y
                [new vector_1.Vector3(-1, 1, 0), new vector_1.Vector3(0, 1, 1), new vector_1.Vector3(-1, 1, 1)],
                [new vector_1.Vector3(-1, 1, 0), new vector_1.Vector3(0, 1, -1), new vector_1.Vector3(-1, 1, -1)],
                [new vector_1.Vector3(1, 1, 0), new vector_1.Vector3(0, 1, 1), new vector_1.Vector3(1, 1, 1)],
                [new vector_1.Vector3(1, 1, 0), new vector_1.Vector3(0, 1, -1), new vector_1.Vector3(1, 1, -1)],
            ],
            [
                // -Y
                [new vector_1.Vector3(-1, -1, 0), new vector_1.Vector3(0, -1, -1), new vector_1.Vector3(-1, -1, -1)],
                [new vector_1.Vector3(-1, -1, 0), new vector_1.Vector3(0, -1, 1), new vector_1.Vector3(-1, -1, 1)],
                [new vector_1.Vector3(1, -1, 0), new vector_1.Vector3(0, -1, -1), new vector_1.Vector3(1, -1, -1)],
                [new vector_1.Vector3(1, -1, 0), new vector_1.Vector3(0, -1, 1), new vector_1.Vector3(1, -1, 1)],
            ],
            [
                // + Z
                [new vector_1.Vector3(0, 1, 1), new vector_1.Vector3(1, 0, 1), new vector_1.Vector3(1, 1, 1)],
                [new vector_1.Vector3(0, -1, 1), new vector_1.Vector3(1, 0, 1), new vector_1.Vector3(1, -1, 1)],
                [new vector_1.Vector3(0, 1, 1), new vector_1.Vector3(-1, 0, 1), new vector_1.Vector3(-1, 1, 1)],
                [new vector_1.Vector3(0, -1, 1), new vector_1.Vector3(-1, 0, 1), new vector_1.Vector3(-1, -1, 1)],
            ],
            [
                // -Z
                [new vector_1.Vector3(0, 1, -1), new vector_1.Vector3(-1, 0, -1), new vector_1.Vector3(-1, 1, -1)],
                [new vector_1.Vector3(0, -1, -1), new vector_1.Vector3(-1, 0, -1), new vector_1.Vector3(-1, -1, -1)],
                [new vector_1.Vector3(0, 1, -1), new vector_1.Vector3(1, 0, -1), new vector_1.Vector3(1, 1, -1)],
                [new vector_1.Vector3(0, -1, -1), new vector_1.Vector3(1, 0, -1), new vector_1.Vector3(1, -1, -1)],
            ],
        ];
        this._occlusionNeighboursIndices = [];
        for (let i = 0; i < 6; ++i) {
            for (let j = 0; j < 4; ++j) {
                for (let k = 0; k < 3; ++k) {
                    const index = this._getOcclusionMapIndex(i, j, k);
                    this._occlusionNeighboursIndices[index] = OcclusionManager.getNeighbourIndex(occlusionNeighbours[i][j][k]);
                }
            }
        }
        this._occlusionsSetup = true;
    }
    _getOcclusionMapIndex(faceIndex, vertexIndex, offsetIndex) {
        return (12 * faceIndex) + (3 * vertexIndex) + offsetIndex;
    }
}
exports.OcclusionManager = OcclusionManager;
