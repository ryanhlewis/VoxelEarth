package com.example.voxelearth;

import org.bukkit.Material;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.generator.WorldInfo;
import org.bukkit.generator.ChunkGenerator.ChunkData;

import java.util.Random;

public class VoxelChunkGenerator extends ChunkGenerator {

    // We show a proof of concept for Voxel Earth 
    // by overriding chunk generation to show different colors of wool
    // based on the chunk's position in the world

    // Essentially, to continue from here, we take our work
    // with only fetching highest-res voxels, apply an arbitrary latlng
    // position to our player, fetch the voxels around that position,
    // and splice them into 16x16 chunks to be rendered in Minecraft

    // Current next step is making our GPU or CPU voxelizer export
    // to MC correctly, then grab that format and splice it here.

    @Override
    public void generateSurface(WorldInfo worldInfo, Random random, int chunkX, int chunkZ, ChunkData chunkData) {
        int startX = chunkX * 16;
        int startZ = chunkZ * 16;

        for (int x = 0; x < 16; x++) {
            for (int z = 0; z < 16; z++) {
                int worldX = startX + x;
                int worldZ = startZ + z;

                if (worldX >= -8 && worldX <= 8 && worldZ >= -8 && worldZ <= 8) {
                    chunkData.setBlock(x, 64, z, Material.WHITE_WOOL);
                } else if (worldX >= 9 && worldX <= 24 && worldZ >= -8 && worldZ <= 8) {
                    chunkData.setBlock(x, 64, z, Material.BLUE_WOOL);
                } else if (worldX >= -24 && worldX <= -9 && worldZ >= -8 && worldZ <= 8) {
                    chunkData.setBlock(x, 64, z, Material.RED_WOOL);
                } else if (worldX >= -8 && worldX <= 8 && worldZ >= 9 && worldZ <= 24) {
                    chunkData.setBlock(x, 64, z, Material.GREEN_WOOL);
                } else if (worldX >= -8 && worldX <= 8 && worldZ >= -24 && worldZ <= -9) {
                    chunkData.setBlock(x, 64, z, Material.YELLOW_WOOL);
                }
            }
        }
    }

    @Override
    public boolean shouldGenerateNoise() {
        return false;
    }

    @Override
    public boolean shouldGenerateSurface() {
        return true;
    }

    @Override
    public boolean shouldGenerateBedrock() {
        return false;
    }

    @Override
    public boolean shouldGenerateCaves() {
        return false;
    }

    @Override
    public boolean shouldGenerateDecorations() {
        return false;
    }

    @Override
    public boolean shouldGenerateMobs() {
        return false;
    }

    @Override
    public boolean shouldGenerateStructures() {
        return false;
    }
}
