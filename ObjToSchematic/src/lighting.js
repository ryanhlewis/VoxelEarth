"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockMeshLighting = void 0;
var bounds_1 = require("./bounds");
var error_util_1 = require("./util/error_util");
var log_util_1 = require("./util/log_util");
var vector_1 = require("./vector");
/* eslint-disable */
var EFace;
(function (EFace) {
    EFace[EFace["Up"] = 0] = "Up";
    EFace[EFace["Down"] = 1] = "Down";
    EFace[EFace["North"] = 2] = "North";
    EFace[EFace["South"] = 3] = "South";
    EFace[EFace["East"] = 4] = "East";
    EFace[EFace["West"] = 5] = "West";
    EFace[EFace["None"] = 6] = "None";
})(EFace || (EFace = {}));
;
var BlockMeshLighting = /** @class */ (function () {
    function BlockMeshLighting(owner) {
        this._owner = owner;
        this._sunLightValues = new Map();
        this._blockLightValues = new Map();
        this._limits = new Map();
        this._bounds = new bounds_1.Bounds(new vector_1.Vector3(0, 0, 0), new vector_1.Vector3(0, 0, 0));
        this._updates = 0;
        this._skips = 0;
    }
    BlockMeshLighting.prototype.getLightLevel = function (vec) {
        var _a, _b;
        var hash = vec.hash();
        return {
            sunLightValue: (_a = this._sunLightValues.get(hash)) !== null && _a !== void 0 ? _a : 0,
            blockLightValue: (_b = this._blockLightValues.get(hash)) !== null && _b !== void 0 ? _b : 0,
        };
    };
    BlockMeshLighting.prototype.getMaxLightLevel = function (vec) {
        var light = this.getLightLevel(vec);
        //return light.blockLightValue;
        //return light.sunLightValue;
        return Math.max(light.blockLightValue, light.sunLightValue);
    };
    BlockMeshLighting.prototype.addLightToDarkness = function (threshold) {
        var _this = this;
        if (threshold === 0) {
            return;
        }
        var potentialBlocks = [];
        this._owner.getBlocks().forEach(function (block) {
            if (_this.getMaxLightLevel(block.voxel.position) < threshold) {
                potentialBlocks.push(block.voxel.position);
            }
        });
        while (potentialBlocks.length > 0) {
            var potentialBlockPos = potentialBlocks.pop();
            if (this.getMaxLightLevel(potentialBlockPos) < threshold) {
                var success = this._owner.setEmissiveBlock(potentialBlockPos);
                if (success) {
                    var newBlockLight = 14; // TODO: Not necessarily 14
                    this._blockLightValues.set(potentialBlockPos.hash(), newBlockLight);
                    var attenuated = {
                        sunLightValue: this.getLightLevel(potentialBlockPos).sunLightValue - 1,
                        blockLightValue: newBlockLight - 1,
                    };
                    var updates = [];
                    updates.push({ pos: new vector_1.Vector3(0, 1, 0).add(potentialBlockPos), sunLightValue: attenuated.sunLightValue, blockLightValue: attenuated.blockLightValue, from: EFace.Down });
                    updates.push({ pos: new vector_1.Vector3(0, -1, 0).add(potentialBlockPos), sunLightValue: attenuated.sunLightValue, blockLightValue: attenuated.blockLightValue, from: EFace.Up });
                    updates.push({ pos: new vector_1.Vector3(1, 0, 0).add(potentialBlockPos), sunLightValue: attenuated.sunLightValue, blockLightValue: attenuated.blockLightValue, from: EFace.South });
                    updates.push({ pos: new vector_1.Vector3(-1, 0, 0).add(potentialBlockPos), sunLightValue: attenuated.sunLightValue, blockLightValue: attenuated.blockLightValue, from: EFace.North });
                    updates.push({ pos: new vector_1.Vector3(0, 0, 1).add(potentialBlockPos), sunLightValue: attenuated.sunLightValue, blockLightValue: attenuated.blockLightValue, from: EFace.West });
                    updates.push({ pos: new vector_1.Vector3(0, 0, -1).add(potentialBlockPos), sunLightValue: attenuated.sunLightValue, blockLightValue: attenuated.blockLightValue, from: EFace.East });
                    //this._handleUpdates(updates, false, true);
                    this._handleBlockLightUpdates(updates);
                    (0, error_util_1.ASSERT)(updates.length === 0);
                }
            }
        }
    };
    BlockMeshLighting.prototype._calculateLimits = function () {
        var _this = this;
        this._bounds = this._owner.getVoxelMesh().getBounds();
        this._limits.clear();
        var updateLimit = function (pos) {
            var key = pos.copy();
            key.y = 0;
            var blockLimit = _this._limits.get(key.hash());
            if (blockLimit !== undefined) {
                blockLimit.maxY = Math.max(blockLimit.maxY, pos.y);
                blockLimit.minY = Math.min(blockLimit.minY, pos.y);
            }
            else {
                _this._limits.set(key.hash(), {
                    x: pos.x,
                    z: pos.z,
                    minY: pos.y,
                    maxY: pos.y,
                });
            }
        };
        this._owner.getBlocks().forEach(function (block) {
            updateLimit(block.voxel.position);
            updateLimit(new vector_1.Vector3(1, 0, 0).add(block.voxel.position));
            updateLimit(new vector_1.Vector3(-1, 0, 0).add(block.voxel.position));
            updateLimit(new vector_1.Vector3(0, 0, 1).add(block.voxel.position));
            updateLimit(new vector_1.Vector3(0, 0, -1).add(block.voxel.position));
        });
    };
    BlockMeshLighting.prototype.init = function () {
        this._calculateLimits();
    };
    BlockMeshLighting.prototype.addSunLightValues = function () {
        // Actually commit the light level changes.
        var updates = [];
        this._limits.forEach(function (limit, key) {
            updates.push({
                pos: new vector_1.Vector3(0, 1, 0).add(new vector_1.Vector3(limit.x, limit.maxY, limit.z)),
                sunLightValue: 15,
                blockLightValue: 0,
                from: EFace.None,
            });
        });
        this._handleSunLightUpdates(updates);
        (0, error_util_1.ASSERT)(updates.length === 0, 'Updates still remaining');
    };
    BlockMeshLighting.prototype.addEmissiveBlocks = function () {
        var _this = this;
        var updates = [];
        this._owner.getBlocks().forEach(function (block) {
            if (_this._owner.isEmissiveBlock(block)) {
                updates.push({
                    pos: block.voxel.position,
                    sunLightValue: 0,
                    blockLightValue: 14,
                    from: EFace.None,
                });
            }
        });
        this._handleBlockLightUpdates(updates);
        (0, error_util_1.ASSERT)(updates.length === 0, 'Updates still remaining');
    };
    /**
     * Goes through each block location in `updates` and sets the light value
     * to the maximum of its current value and its update value.
     *
     * @Note **Modifies `updates`**
     */
    /*
    private _handleUpdates(updates: TLightUpdate[], updateSunLight: boolean, updateBlockLight: boolean) {
        while (updates.length > 0) {
            this._updates += 1;
            const update = updates.pop()!;

            // Only update light values inside the bounds of the block mesh.
            // Values outside the bounds are assumed to have sunLightValue of 15
            // and blockLightValue of 0.
            if (updateSunLight && !updateBlockLight && update.sunLightValue < 0) {
                this._skips += 1;
                ASSERT(false, 'SKIP SUNLIGHT');
                continue;
            }
            if (updateBlockLight && !updateSunLight && update.blockLightValue < 0) {
                this._skips += 1;
                ASSERT(false, 'SKIP BLOCKLIGHT');
                continue;
            }
            if (!this._isPosValid(update.pos)) {
                this._skips += 1;
                continue;
            }
            const current = this.getLightLevel(update.pos);
            const toSet: TLightLevel = { sunLightValue: current.sunLightValue, blockLightValue: current.blockLightValue };

            const hash = update.pos.hash();

            // Update sunLight value
            if (updateSunLight && current.sunLightValue < update.sunLightValue) {
                toSet.sunLightValue = update.sunLightValue;
                this._sunLightValues.set(hash, toSet.sunLightValue);
            }

            // Update blockLight values
            if (updateBlockLight && current.blockLightValue < update.blockLightValue) {
                toSet.blockLightValue = update.blockLightValue;
                this._blockLightValues.set(hash, toSet.blockLightValue);
            }

            const blockHere = this._owner.getBlockAt(update.pos);
            const isBlockHere = blockHere !== undefined;

            const shouldPropagate = isBlockHere ?
                this._owner.isTransparentBlock(blockHere) :
                true;

            // Actually commit the light value changes and notify neighbours to
            // update their values.
            if (shouldPropagate) {
                const sunLightChanged = current.sunLightValue !== toSet.sunLightValue && toSet.sunLightValue > 0;
                const blockLightChanged = current.blockLightValue !== toSet.blockLightValue && toSet.blockLightValue > 0;
                if ((sunLightChanged || blockLightChanged)) {
                    const attenuated: TLightLevel = {
                        sunLightValue: toSet.sunLightValue - 1,
                        blockLightValue: toSet.blockLightValue - 1,
                    };
                    if (update.from !== EFace.Up) {
                        updates.push({
                            pos: new Vector3(0, 1, 0).add(update.pos),
                            sunLightValue: attenuated.sunLightValue,
                            blockLightValue: attenuated.blockLightValue,
                            from: EFace.Down,
                        });
                    }
                    if (update.from !== EFace.Down) {
                        updates.push({
                            pos: new Vector3(0, -1, 0).add(update.pos),
                            sunLightValue: toSet.sunLightValue === 15 ? 15 : toSet.sunLightValue - 1,
                            blockLightValue: toSet.blockLightValue - 1,
                            from: EFace.Up,
                        });
                    }
                    if (update.from !== EFace.North) {
                        updates.push({
                            pos: new Vector3(1, 0, 0).add(update.pos),
                            sunLightValue: attenuated.sunLightValue,
                            blockLightValue: attenuated.blockLightValue,
                            from: EFace.South,
                        });
                    }
                    if (update.from !== EFace.South) {
                        updates.push({
                            pos: new Vector3(-1, 0, 0).add(update.pos),
                            sunLightValue: attenuated.sunLightValue,
                            blockLightValue: attenuated.blockLightValue,
                            from: EFace.North,
                        });
                    }
                    if (update.from !== EFace.East) {
                        updates.push({
                            pos: new Vector3(0, 0, 1).add(update.pos),
                            sunLightValue: attenuated.sunLightValue,
                            blockLightValue: attenuated.blockLightValue,
                            from: EFace.West,
                        });
                    }
                    if (update.from !== EFace.West) {
                        updates.push({
                            pos: new Vector3(0, 0, -1).add(update.pos),
                            sunLightValue: attenuated.sunLightValue,
                            blockLightValue: attenuated.blockLightValue,
                            from: EFace.East,
                        });
                    }
                }
            }
        }
    }
    */
    BlockMeshLighting.prototype._handleBlockLightUpdates = function (updates) {
        while (updates.length > 0) {
            this._updates += 1;
            var update = updates.pop();
            if (!this._isPosValid(update.pos)) {
                this._skips += 1;
                continue;
            }
            var current = this.getLightLevel(update.pos);
            var toSet = current.blockLightValue;
            var hash = update.pos.hash();
            // Update blockLight values
            if (current.blockLightValue < update.blockLightValue) {
                toSet = update.blockLightValue;
                this._blockLightValues.set(hash, toSet);
            }
            var blockHere = this._owner.getBlockAt(update.pos);
            var isBlockHere = blockHere !== undefined;
            var shouldPropagate = isBlockHere ?
                this._owner.isTransparentBlock(blockHere) :
                true;
            // Actually commit the light value changes and notify neighbours to
            // update their values.
            if (shouldPropagate) {
                var blockLightChanged = current.blockLightValue !== toSet && toSet > 0;
                if (blockLightChanged) {
                    if (update.from !== EFace.Up) {
                        updates.push({
                            pos: new vector_1.Vector3(0, 1, 0).add(update.pos),
                            sunLightValue: current.sunLightValue,
                            blockLightValue: toSet - 1,
                            from: EFace.Down,
                        });
                    }
                    if (update.from !== EFace.Down) {
                        updates.push({
                            pos: new vector_1.Vector3(0, -1, 0).add(update.pos),
                            sunLightValue: current.sunLightValue,
                            blockLightValue: toSet - 1,
                            from: EFace.Up,
                        });
                    }
                    if (update.from !== EFace.North) {
                        updates.push({
                            pos: new vector_1.Vector3(1, 0, 0).add(update.pos),
                            sunLightValue: current.sunLightValue,
                            blockLightValue: toSet - 1,
                            from: EFace.South,
                        });
                    }
                    if (update.from !== EFace.South) {
                        updates.push({
                            pos: new vector_1.Vector3(-1, 0, 0).add(update.pos),
                            sunLightValue: current.sunLightValue,
                            blockLightValue: toSet - 1,
                            from: EFace.North,
                        });
                    }
                    if (update.from !== EFace.East) {
                        updates.push({
                            pos: new vector_1.Vector3(0, 0, 1).add(update.pos),
                            sunLightValue: current.sunLightValue,
                            blockLightValue: toSet - 1,
                            from: EFace.West,
                        });
                    }
                    if (update.from !== EFace.West) {
                        updates.push({
                            pos: new vector_1.Vector3(0, 0, -1).add(update.pos),
                            sunLightValue: current.sunLightValue,
                            blockLightValue: toSet - 1,
                            from: EFace.East,
                        });
                    }
                }
            }
        }
    };
    BlockMeshLighting.prototype._handleSunLightUpdates = function (updates) {
        while (updates.length > 0) {
            this._updates += 1;
            var update = updates.pop();
            if (!this._isPosValid(update.pos)) {
                this._skips += 1;
                continue;
            }
            var current = this.getLightLevel(update.pos);
            var toSet = current.sunLightValue;
            var hash = update.pos.hash();
            // Update sunLight value
            if (current.sunLightValue < update.sunLightValue) {
                toSet = update.sunLightValue;
                this._sunLightValues.set(hash, toSet);
            }
            var blockHere = this._owner.getBlockAt(update.pos);
            var isBlockHere = blockHere !== undefined;
            var shouldPropagate = isBlockHere ?
                this._owner.isTransparentBlock(blockHere) :
                true;
            // Actually commit the light value changes and notify neighbours to
            // update their values.
            if (shouldPropagate) {
                var sunLightChanged = current.sunLightValue !== toSet && toSet > 0;
                if ((sunLightChanged)) {
                    if (update.from !== EFace.Up) {
                        updates.push({
                            pos: new vector_1.Vector3(0, 1, 0).add(update.pos),
                            sunLightValue: toSet - 1,
                            blockLightValue: current.blockLightValue,
                            from: EFace.Down,
                        });
                    }
                    if (update.from !== EFace.Down) {
                        updates.push({
                            pos: new vector_1.Vector3(0, -1, 0).add(update.pos),
                            sunLightValue: toSet === 15 ? 15 : toSet - 1,
                            blockLightValue: current.blockLightValue,
                            from: EFace.Up,
                        });
                    }
                    if (update.from !== EFace.North) {
                        updates.push({
                            pos: new vector_1.Vector3(1, 0, 0).add(update.pos),
                            sunLightValue: toSet - 1,
                            blockLightValue: current.blockLightValue,
                            from: EFace.South,
                        });
                    }
                    if (update.from !== EFace.South) {
                        updates.push({
                            pos: new vector_1.Vector3(-1, 0, 0).add(update.pos),
                            sunLightValue: toSet - 1,
                            blockLightValue: current.blockLightValue,
                            from: EFace.North,
                        });
                    }
                    if (update.from !== EFace.East) {
                        updates.push({
                            pos: new vector_1.Vector3(0, 0, 1).add(update.pos),
                            sunLightValue: toSet - 1,
                            blockLightValue: current.blockLightValue,
                            from: EFace.West,
                        });
                    }
                    if (update.from !== EFace.West) {
                        updates.push({
                            pos: new vector_1.Vector3(0, 0, -1).add(update.pos),
                            sunLightValue: toSet - 1,
                            blockLightValue: current.blockLightValue,
                            from: EFace.East,
                        });
                    }
                }
            }
        }
    };
    BlockMeshLighting.prototype._isPosValid = function (vec) {
        var key = vec.copy();
        key.y = 0;
        var limit = this._limits.get(key.hash());
        if (limit !== undefined) {
            return vec.y >= this._bounds.min.y - 1 && vec.y <= limit.maxY + 1;
        }
        else {
            return false;
        }
    };
    BlockMeshLighting.prototype.dumpInfo = function () {
        (0, log_util_1.LOG)("Skipped ".concat(this._skips, " out of ").concat(this._updates, " (").concat((100 * this._skips / this._updates).toFixed(4), "%)"));
    };
    return BlockMeshLighting;
}());
exports.BlockMeshLighting = BlockMeshLighting;
//# sourceMappingURL=lighting.js.map