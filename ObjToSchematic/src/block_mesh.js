"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockMesh = void 0;
var atlas_1 = require("./atlas");
var block_assigner_1 = require("./block_assigner");
var buffer_1 = require("./buffer");
var colour_1 = require("./colour");
var constants_1 = require("./constants");
var dither_1 = require("./dither");
var lighting_1 = require("./lighting");
var localiser_1 = require("./localiser");
var palette_1 = require("./palette");
var progress_1 = require("./progress");
var status_1 = require("./status");
var error_util_1 = require("./util/error_util");
var log_util_1 = require("./util/log_util");
var vector_1 = require("./vector");
var voxel_mesh_1 = require("./voxel_mesh");
var BlockMesh = /** @class */ (function () {
    function BlockMesh(voxelMesh) {
        /*
        private _buffer?: TBlockMeshBufferDescription;
        public getBuffer(): TBlockMeshBufferDescription {
            //ASSERT(this._renderParams, 'Called BlockMesh.getBuffer() without setting render params');
            if (this._buffer === undefined) {
                this._buffer = BufferGenerator.fromBlockMesh(this);
                //this._recreateBuffer = false;
            }
            return this._buffer;
        }
        */
        this._bufferChunks = [];
        this._blocksUsed = new Set();
        this._blocks = new Map();
        this._voxelMesh = voxelMesh;
        this._atlas = atlas_1.Atlas.getVanillaAtlas();
        this._lighting = new lighting_1.BlockMeshLighting(this);
    }
    BlockMesh.createFromVoxelMesh = function (voxelMesh, blockMeshParams) {
        var blockMesh = new BlockMesh(voxelMesh);
        blockMesh._assignBlocks(blockMeshParams);
        //blockMesh._calculateLighting(blockMeshParams.lightThreshold);
        if (blockMeshParams.calculateLighting) {
            blockMesh._lighting.init();
            blockMesh._lighting.addSunLightValues();
            blockMesh._lighting.addEmissiveBlocks();
            blockMesh._lighting.addLightToDarkness(blockMeshParams.lightThreshold);
            blockMesh._lighting.dumpInfo();
        }
        return blockMesh;
    };
    /**
     * Before we turn a voxel into a block we have the opportunity to alter the voxel's colour.
     * This is where the colour accuracy bands colours together and where dithering is calculated.
     */
    BlockMesh.prototype._getFinalVoxelColour = function (voxel, blockMeshParams) {
        var voxelColour = colour_1.RGBAUtil.copy(voxel.colour);
        var binnedColour = colour_1.RGBAUtil.bin(voxelColour, blockMeshParams.resolution);
        var ditheredColour = colour_1.RGBAUtil.copy255(binnedColour);
        switch (blockMeshParams.dithering) {
            case 'off': {
                break;
            }
            case 'random': {
                dither_1.Ditherer.ditherRandom(ditheredColour, blockMeshParams.ditheringMagnitude);
                break;
            }
            case 'ordered': {
                dither_1.Ditherer.ditherOrdered(ditheredColour, voxel.position, blockMeshParams.ditheringMagnitude);
                break;
            }
        }
        return ditheredColour;
    };
    BlockMesh.prototype._assignBlocks = function (blockMeshParams) {
        var atlas = atlas_1.Atlas.load(blockMeshParams.textureAtlas);
        (0, error_util_1.ASSERT)(atlas !== undefined, 'Could not load atlas');
        this._atlas = atlas;
        var palette = palette_1.Palette.create();
        palette.add(blockMeshParams.blockPalette);
        (0, error_util_1.ASSERT)(palette !== undefined, 'Could not load palette');
        var atlasPalette = new block_assigner_1.AtlasPalette(atlas, palette);
        var allBlockCollection = atlasPalette.createBlockCollection([]);
        var nonFallableBlockCollection = atlasPalette.createBlockCollection(Array.from(constants_1.AppRuntimeConstants.Get.FALLABLE_BLOCKS));
        var grassLikeBlocksBuffer = [];
        var countFalling = 0;
        var taskHandle = progress_1.ProgressManager.Get.start('Assigning');
        var voxels = this._voxelMesh.getVoxels();
        for (var voxelIndex = 0; voxelIndex < voxels.length; ++voxelIndex) {
            progress_1.ProgressManager.Get.progress(taskHandle, voxelIndex / voxels.length);
            // Convert the voxel into a block
            var voxel = voxels[voxelIndex];
            var voxelColour = this._getFinalVoxelColour(voxel, blockMeshParams);
            var faceVisibility = blockMeshParams.contextualAveraging ?
                this._voxelMesh.getFaceVisibility(voxel.position) :
                voxel_mesh_1.VoxelMesh.getFullFaceVisibility();
            var block = atlasPalette.getBlock(voxelColour, allBlockCollection, faceVisibility, blockMeshParams.errorWeight);
            // Check that this block meets the fallable behaviour, we may need
            // to choose a different block if the current one doesn't meet the requirements
            var isBlockFallable = constants_1.AppRuntimeConstants.Get.FALLABLE_BLOCKS.has(block.name);
            var isBlockSupported = this._voxelMesh.isVoxelAt(vector_1.Vector3.add(voxel.position, new vector_1.Vector3(0, -1, 0)));
            if (isBlockFallable && !isBlockSupported) {
                ++countFalling;
            }
            var shouldReplaceBlock = (blockMeshParams.fallable === 'replace-fallable' && isBlockFallable) ||
                (blockMeshParams.fallable === 'replace-falling' && isBlockFallable && !isBlockSupported);
            if (shouldReplaceBlock) {
                block = atlasPalette.getBlock(voxelColour, nonFallableBlockCollection, faceVisibility, blockMeshParams.errorWeight);
            }
            if (constants_1.AppRuntimeConstants.Get.GRASS_LIKE_BLOCKS.has(block.name)) {
                grassLikeBlocksBuffer.push({
                    hash: voxel.position.hash(),
                    voxelColour: voxelColour,
                    errWeight: blockMeshParams.errorWeight,
                    faceVisibility: faceVisibility,
                });
            }
            this._blocks.set(voxel.position.hash(), {
                voxel: voxel,
                blockInfo: block,
            });
            this._blocksUsed.add(block.name);
        }
        if (grassLikeBlocksBuffer.length > 0) {
            var nonGrassLikeBlockCollection = atlasPalette.createBlockCollection(Array.from(constants_1.AppRuntimeConstants.Get.GRASS_LIKE_BLOCKS));
            for (var index = 0; index < grassLikeBlocksBuffer.length; index++) {
                progress_1.ProgressManager.Get.progress(taskHandle, index / grassLikeBlocksBuffer.length);
                var examined = grassLikeBlocksBuffer[index];
                var examinedBlock = this._blocks.get(examined.hash);
                (0, error_util_1.ASSERT)(examinedBlock, 'Missing examined block');
                var topBlockPosition = vector_1.Vector3.add(examinedBlock.voxel.position, new vector_1.Vector3(0, 1, 0));
                var topBlock = this._blocks.get(topBlockPosition.hash());
                if (topBlock !== undefined) {
                    if (!constants_1.AppRuntimeConstants.Get.TRANSPARENT_BLOCKS.has(topBlock.blockInfo.name)) {
                        var block = atlasPalette.getBlock(examined.voxelColour, nonGrassLikeBlockCollection, examined.faceVisibility, examined.errWeight);
                        examinedBlock.blockInfo = block;
                        this._blocks.set(examined.hash, examinedBlock);
                        this._blocksUsed.add(block.name);
                    }
                }
            }
        }
        progress_1.ProgressManager.Get.end(taskHandle);
        if (blockMeshParams.fallable === 'do-nothing' && countFalling > 0) {
            status_1.StatusHandler.warning((0, localiser_1.LOC)('assign.falling_blocks', { count: countFalling }));
        }
    };
    // Face order: ['north', 'south', 'up', 'down', 'east', 'west']
    BlockMesh.prototype.getBlockLighting = function (position) {
        // TODO: Shouldn't only use sunlight value, take max of either
        return [
            this._lighting.getMaxLightLevel(new vector_1.Vector3(1, 0, 0).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(-1, 0, 0).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(0, 1, 0).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(0, -1, 0).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(0, 0, 1).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(0, 0, -1).add(position)),
        ];
    };
    BlockMesh.prototype.setEmissiveBlock = function (pos) {
        var _this = this;
        var voxel = this._voxelMesh.getVoxelAt(pos);
        (0, error_util_1.ASSERT)(voxel !== undefined, 'Missing voxel');
        var minError = Infinity;
        var bestBlock;
        constants_1.AppRuntimeConstants.Get.EMISSIVE_BLOCKS.forEach(function (emissiveBlockName) {
            var emissiveBlockData = _this._atlas.getBlocks().get(emissiveBlockName);
            if (emissiveBlockData) {
                var error = colour_1.RGBAUtil.squaredDistance(emissiveBlockData.colour, voxel.colour);
                if (error < minError) {
                    bestBlock = emissiveBlockData;
                }
            }
        });
        if (bestBlock !== undefined) {
            var blockIndex = 0; //this._voxelMesh.getVoxelIndex(pos);
            (0, error_util_1.ASSERT)(blockIndex !== undefined, 'Setting emissive block of block that doesn\'t exist');
            var block = this._blocks.get(pos.hash());
            (0, error_util_1.ASSERT)(block !== undefined);
            block.blockInfo = bestBlock;
            return true;
        }
        throw new error_util_1.AppError((0, localiser_1.LOC)('assign.block_palette_missing_light_blocks'));
    };
    BlockMesh.prototype.getBlockAt = function (pos) {
        return this._blocks.get(pos.hash());
    };
    BlockMesh.prototype.getBlocks = function () {
        return Array.from(this._blocks.values());
    };
    BlockMesh.prototype.getBlockPalette = function () {
        return Array.from(this._blocksUsed);
    };
    BlockMesh.prototype.getVoxelMesh = function () {
        (0, error_util_1.ASSERT)(this._voxelMesh !== undefined, 'Block mesh has no voxel mesh');
        return this._voxelMesh;
    };
    BlockMesh.prototype.getAtlas = function () {
        return this._atlas;
    };
    BlockMesh.prototype.isEmissiveBlock = function (block) {
        return constants_1.AppRuntimeConstants.Get.EMISSIVE_BLOCKS.has(block.blockInfo.name);
    };
    BlockMesh.prototype.isTransparentBlock = function (block) {
        return constants_1.AppRuntimeConstants.Get.TRANSPARENT_BLOCKS.has(block.blockInfo.name);
    };
    BlockMesh.prototype.getChunkedBuffer = function (chunkIndex) {
        if (this._bufferChunks[chunkIndex] === undefined) {
            (0, log_util_1.LOGF)("[BlockMesh]: getChunkedBuffer: ci: ".concat(chunkIndex, " not cached"));
            this._bufferChunks[chunkIndex] = buffer_1.ChunkedBufferGenerator.fromBlockMesh(this, chunkIndex);
        }
        else {
            (0, log_util_1.LOGF)("[BlockMesh]: getChunkedBuffer: ci: ".concat(chunkIndex, " not cached"));
        }
        return this._bufferChunks[chunkIndex];
    };
    BlockMesh.prototype.getAllChunkedBuffers = function () {
        return this._bufferChunks;
    };
    return BlockMesh;
}());
exports.BlockMesh = BlockMesh;
//# sourceMappingURL=block_mesh.js.map