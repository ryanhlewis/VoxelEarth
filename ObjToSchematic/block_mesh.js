"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockMesh = void 0;
const atlas_1 = require("./atlas");
const block_assigner_1 = require("./block_assigner");
const buffer_1 = require("./buffer");
const colour_1 = require("./colour");
const constants_1 = require("./constants");
const dither_1 = require("./dither");
const lighting_1 = require("./lighting");
const localiser_1 = require("./localiser");
const palette_1 = require("./palette");
const progress_1 = require("./progress");
const status_1 = require("./status");
const error_util_1 = require("./util/error_util");
const log_util_1 = require("./util/log_util");
const vector_1 = require("./vector");
const voxel_mesh_1 = require("./voxel_mesh");
class BlockMesh {
    static createFromVoxelMesh(voxelMesh, blockMeshParams) {
        const blockMesh = new BlockMesh(voxelMesh);
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
    }
    constructor(voxelMesh) {
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
    /**
     * Before we turn a voxel into a block we have the opportunity to alter the voxel's colour.
     * This is where the colour accuracy bands colours together and where dithering is calculated.
     */
    _getFinalVoxelColour(voxel, blockMeshParams) {
        const voxelColour = colour_1.RGBAUtil.copy(voxel.colour);
        const binnedColour = colour_1.RGBAUtil.bin(voxelColour, blockMeshParams.resolution);
        const ditheredColour = colour_1.RGBAUtil.copy255(binnedColour);
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
    }
    _assignBlocks(blockMeshParams) {
        const atlas = atlas_1.Atlas.load(blockMeshParams.textureAtlas);
        (0, error_util_1.ASSERT)(atlas !== undefined, 'Could not load atlas');
        this._atlas = atlas;
        const palette = palette_1.Palette.create();
        palette.add(blockMeshParams.blockPalette);
        (0, error_util_1.ASSERT)(palette !== undefined, 'Could not load palette');
        const atlasPalette = new block_assigner_1.AtlasPalette(atlas, palette);
        const allBlockCollection = atlasPalette.createBlockCollection([]);
        const nonFallableBlockCollection = atlasPalette.createBlockCollection(Array.from(constants_1.AppRuntimeConstants.Get.FALLABLE_BLOCKS));
        const grassLikeBlocksBuffer = [];
        let countFalling = 0;
        const taskHandle = progress_1.ProgressManager.Get.start('Assigning');
        const voxels = this._voxelMesh.getVoxels();
        for (let voxelIndex = 0; voxelIndex < voxels.length; ++voxelIndex) {
            progress_1.ProgressManager.Get.progress(taskHandle, voxelIndex / voxels.length);
            // Convert the voxel into a block
            const voxel = voxels[voxelIndex];
            const voxelColour = this._getFinalVoxelColour(voxel, blockMeshParams);
            const faceVisibility = blockMeshParams.contextualAveraging ?
                this._voxelMesh.getFaceVisibility(voxel.position) :
                voxel_mesh_1.VoxelMesh.getFullFaceVisibility();
            let block = atlasPalette.getBlock(voxelColour, allBlockCollection, faceVisibility, blockMeshParams.errorWeight);
            // Check that this block meets the fallable behaviour, we may need
            // to choose a different block if the current one doesn't meet the requirements
            const isBlockFallable = constants_1.AppRuntimeConstants.Get.FALLABLE_BLOCKS.has(block.name);
            const isBlockSupported = this._voxelMesh.isVoxelAt(vector_1.Vector3.add(voxel.position, new vector_1.Vector3(0, -1, 0)));
            if (isBlockFallable && !isBlockSupported) {
                ++countFalling;
            }
            const shouldReplaceBlock = (blockMeshParams.fallable === 'replace-fallable' && isBlockFallable) ||
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
            const nonGrassLikeBlockCollection = atlasPalette.createBlockCollection(Array.from(constants_1.AppRuntimeConstants.Get.GRASS_LIKE_BLOCKS));
            for (let index = 0; index < grassLikeBlocksBuffer.length; index++) {
                progress_1.ProgressManager.Get.progress(taskHandle, index / grassLikeBlocksBuffer.length);
                const examined = grassLikeBlocksBuffer[index];
                const examinedBlock = this._blocks.get(examined.hash);
                (0, error_util_1.ASSERT)(examinedBlock, 'Missing examined block');
                const topBlockPosition = vector_1.Vector3.add(examinedBlock.voxel.position, new vector_1.Vector3(0, 1, 0));
                const topBlock = this._blocks.get(topBlockPosition.hash());
                if (topBlock !== undefined) {
                    if (!constants_1.AppRuntimeConstants.Get.TRANSPARENT_BLOCKS.has(topBlock.blockInfo.name)) {
                        const block = atlasPalette.getBlock(examined.voxelColour, nonGrassLikeBlockCollection, examined.faceVisibility, examined.errWeight);
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
    }
    // Face order: ['north', 'south', 'up', 'down', 'east', 'west']
    getBlockLighting(position) {
        // TODO: Shouldn't only use sunlight value, take max of either
        return [
            this._lighting.getMaxLightLevel(new vector_1.Vector3(1, 0, 0).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(-1, 0, 0).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(0, 1, 0).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(0, -1, 0).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(0, 0, 1).add(position)),
            this._lighting.getMaxLightLevel(new vector_1.Vector3(0, 0, -1).add(position)),
        ];
    }
    setEmissiveBlock(pos) {
        const voxel = this._voxelMesh.getVoxelAt(pos);
        (0, error_util_1.ASSERT)(voxel !== undefined, 'Missing voxel');
        const minError = Infinity;
        let bestBlock;
        constants_1.AppRuntimeConstants.Get.EMISSIVE_BLOCKS.forEach((emissiveBlockName) => {
            const emissiveBlockData = this._atlas.getBlocks().get(emissiveBlockName);
            if (emissiveBlockData) {
                const error = colour_1.RGBAUtil.squaredDistance(emissiveBlockData.colour, voxel.colour);
                if (error < minError) {
                    bestBlock = emissiveBlockData;
                }
            }
        });
        if (bestBlock !== undefined) {
            const blockIndex = 0; //this._voxelMesh.getVoxelIndex(pos);
            (0, error_util_1.ASSERT)(blockIndex !== undefined, 'Setting emissive block of block that doesn\'t exist');
            const block = this._blocks.get(pos.hash());
            (0, error_util_1.ASSERT)(block !== undefined);
            block.blockInfo = bestBlock;
            return true;
        }
        throw new error_util_1.AppError((0, localiser_1.LOC)('assign.block_palette_missing_light_blocks'));
    }
    getBlockAt(pos) {
        return this._blocks.get(pos.hash());
    }
    getBlocks() {
        return Array.from(this._blocks.values());
    }
    getBlockPalette() {
        return Array.from(this._blocksUsed);
    }
    getVoxelMesh() {
        (0, error_util_1.ASSERT)(this._voxelMesh !== undefined, 'Block mesh has no voxel mesh');
        return this._voxelMesh;
    }
    getAtlas() {
        return this._atlas;
    }
    isEmissiveBlock(block) {
        return constants_1.AppRuntimeConstants.Get.EMISSIVE_BLOCKS.has(block.blockInfo.name);
    }
    isTransparentBlock(block) {
        return constants_1.AppRuntimeConstants.Get.TRANSPARENT_BLOCKS.has(block.blockInfo.name);
    }
    getChunkedBuffer(chunkIndex) {
        if (this._bufferChunks[chunkIndex] === undefined) {
            (0, log_util_1.LOGF)(`[BlockMesh]: getChunkedBuffer: ci: ${chunkIndex} not cached`);
            this._bufferChunks[chunkIndex] = buffer_1.ChunkedBufferGenerator.fromBlockMesh(this, chunkIndex);
        }
        else {
            (0, log_util_1.LOGF)(`[BlockMesh]: getChunkedBuffer: ci: ${chunkIndex} not cached`);
        }
        return this._bufferChunks[chunkIndex];
    }
    getAllChunkedBuffers() {
        return this._bufferChunks;
    }
}
exports.BlockMesh = BlockMesh;
