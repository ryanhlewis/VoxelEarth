export declare namespace AppConstants {
    const FACES_PER_VOXEL = 6;
    const VERTICES_PER_FACE = 4;
    const INDICES_PER_VOXEL = 24;
    const COMPONENT_PER_SIZE_OFFSET: number;
    namespace ComponentSize {
        const LIGHTING = 1;
        const TEXCOORD = 2;
        const POSITION = 3;
        const COLOUR = 4;
        const NORMAL = 3;
        const INDICES = 3;
        const OCCLUSION = 4;
    }
    namespace VoxelMeshBufferComponentOffsets {
        const LIGHTING: number;
        const TEXCOORD: number;
        const POSITION: number;
        const COLOUR: number;
        const NORMAL: number;
        const INDICES = 36;
        const OCCLUSION: number;
    }
    const DATA_VERSION = 3105;
}
export declare class AppRuntimeConstants {
    private static _instance;
    static get Get(): AppRuntimeConstants;
    readonly FALLABLE_BLOCKS: Set<string>;
    readonly TRANSPARENT_BLOCKS: Set<string>;
    readonly GRASS_LIKE_BLOCKS: Set<string>;
    readonly EMISSIVE_BLOCKS: Set<string>;
    private constructor();
}
