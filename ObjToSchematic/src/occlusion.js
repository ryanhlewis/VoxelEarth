"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcclusionManager = void 0;
var config_1 = require("./config");
var error_util_1 = require("./util/error_util");
var vector_1 = require("./vector");
var OcclusionManager = /** @class */ (function () {
    function OcclusionManager() {
        this._occlusionsSetup = false;
        this._setupOcclusions();
        this._occlusions = new Array(6 * 4 * 4);
        this._localNeighbourhoodCache = Array(27);
    }
    Object.defineProperty(OcclusionManager, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    OcclusionManager.prototype.getBlankOcclusions = function () {
        return new Array(96).fill(1.0);
    };
    // Assume's buffer is of length 96
    OcclusionManager.prototype.getOcclusions = function (buffer, centre, voxelMesh) {
        // Cache local neighbours
        var neighbourData = voxelMesh.getNeighbours(centre);
        if (neighbourData === undefined) {
            // This voxel has no neighbours within a 1-block radius
            buffer.fill(0.0);
            return;
        }
        for (var i = 0; i < 27; ++i) {
            this._localNeighbourhoodCache[i] = (neighbourData & (1 << i)) > 0 ? 1 : 0;
        }
        // For each face
        for (var f = 0; f < 6; ++f) {
            for (var v = 0; v < 4; ++v) {
                var numNeighbours = 0;
                var occlusionValue = 1.0;
                for (var i = 0; i < 2; ++i) {
                    var neighbourIndex = this._occlusionNeighboursIndices[this._getOcclusionMapIndex(f, v, i)];
                    numNeighbours += this._localNeighbourhoodCache[neighbourIndex];
                }
                // If both edge blocks along this vertex exist,
                // assume corner exists (even if it doesnt)
                // (This is a stylistic choice)
                if (numNeighbours == 2 && config_1.AppConfig.Get.AMBIENT_OCCLUSION_OVERRIDE_CORNER) {
                    ++numNeighbours;
                }
                else {
                    var neighbourIndex = this._occlusionNeighboursIndices[this._getOcclusionMapIndex(f, v, 2)];
                    numNeighbours += this._localNeighbourhoodCache[neighbourIndex];
                }
                // Convert from occlusion denoting the occlusion factor to the
                // attenuation in light value: 0 -> 1.0, 1 -> 0.8, 2 -> 0.6, 3 -> 0.4
                occlusionValue = 1.0 - 0.2 * numNeighbours;
                var baseIndex = f * 16 + v;
                this._occlusions[baseIndex + 0] = occlusionValue;
                this._occlusions[baseIndex + 4] = occlusionValue;
                this._occlusions[baseIndex + 8] = occlusionValue;
                this._occlusions[baseIndex + 12] = occlusionValue;
            }
        }
        buffer.set(this._occlusions, 0);
        return;
    };
    OcclusionManager.getNeighbourIndex = function (neighbour) {
        return 9 * (neighbour.x + 1) + 3 * (neighbour.y + 1) + (neighbour.z + 1);
    };
    OcclusionManager.prototype._setupOcclusions = function () {
        (0, error_util_1.ASSERT)(!this._occlusionsSetup);
        // TODO: Find some for-loop to clean this up
        // [Edge, Edge, Corrner]
        var occlusionNeighbours = [
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
        for (var i = 0; i < 6; ++i) {
            for (var j = 0; j < 4; ++j) {
                for (var k = 0; k < 3; ++k) {
                    var index = this._getOcclusionMapIndex(i, j, k);
                    this._occlusionNeighboursIndices[index] = OcclusionManager.getNeighbourIndex(occlusionNeighbours[i][j][k]);
                }
            }
        }
        this._occlusionsSetup = true;
    };
    OcclusionManager.prototype._getOcclusionMapIndex = function (faceIndex, vertexIndex, offsetIndex) {
        return (12 * faceIndex) + (3 * vertexIndex) + offsetIndex;
    };
    return OcclusionManager;
}());
exports.OcclusionManager = OcclusionManager;
