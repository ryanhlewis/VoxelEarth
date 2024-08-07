import { FallableBehaviour } from './block_mesh';
import { Bounds } from './bounds';
import { TBlockMeshBufferDescription, TMeshBufferDescription, TVoxelMeshBufferDescription } from './buffer';
import { RGBAUtil } from './colour';
import { TStructureExport } from './exporters/base_exporter';
import { TExporters } from './exporters/exporters';
import { MaterialMap } from './mesh';
import { TMessage } from './ui/console';
import { ColourSpace } from './util';
import { AppError } from './util/error_util';
import { TAxis } from './util/type_util';
import { TDithering } from './util/type_util';
import { Vector3 } from './vector';
import { TVoxelOverlapRule } from './voxel_mesh';
import { TVoxelisers } from './voxelisers/voxelisers';
export declare namespace InitParams {
    type Input = {};
    type Output = {};
}
export declare namespace SettingsParams {
    type Input = {
        language: string;
    };
    type Output = {};
}
export declare namespace ImportParams {
    type Input = {
        file: File;
        rotation: Vector3;
    };
    type Output = {
        triangleCount: number;
        dimensions: Vector3;
        materials: MaterialMap;
    };
}
export declare namespace RenderMeshParams {
    type Input = {};
    type Output = {
        buffers: TMeshBufferDescription[];
        dimensions: Vector3;
    };
}
export declare namespace SetMaterialsParams {
    type Input = {
        materials: MaterialMap;
    };
    type Output = {
        materials: MaterialMap;
        materialsChanged: string[];
    };
}
export declare namespace VoxeliseParams {
    type Input = {
        constraintAxis: TAxis;
        voxeliser: TVoxelisers;
        size: number;
        useMultisampleColouring: boolean;
        enableAmbientOcclusion: boolean;
        voxelOverlapRule: TVoxelOverlapRule;
    };
    type Output = {};
}
export declare namespace RenderNextVoxelMeshChunkParams {
    type Input = {
        desiredHeight: number;
        enableAmbientOcclusion: boolean;
    };
    type Output = {
        buffer: TVoxelMeshBufferDescription;
        dimensions: Vector3;
        voxelSize: number;
        moreVoxelsToBuffer: boolean;
        isFirstChunk: boolean;
    };
}
export type TAtlasId = string;
export type TPaletteId = string;
export declare namespace AssignParams {
    type Input = {
        textureAtlas: TAtlasId;
        blockPalette: string[];
        dithering: TDithering;
        ditheringMagnitude: number;
        colourSpace: ColourSpace;
        fallable: FallableBehaviour;
        resolution: RGBAUtil.TColourAccuracy;
        calculateLighting: boolean;
        lightThreshold: number;
        contextualAveraging: boolean;
        errorWeight: number;
    };
    type Output = {};
}
export declare namespace RenderNextBlockMeshChunkParams {
    type Input = {
        textureAtlas: TAtlasId;
    };
    type Output = {
        buffer: TBlockMeshBufferDescription;
        bounds: Bounds;
        atlasTexturePath: string;
        atlasSize: number;
        moreBlocksToBuffer: boolean;
        isFirstChunk: boolean;
    };
}
export declare namespace ExportParams {
    type Input = {
        exporter: TExporters;
    };
    type Output = {
        files: TStructureExport;
    };
}
export type TaskParams = {
    type: 'Started';
    taskId: string;
} | {
    type: 'Progress';
    taskId: string;
    percentage: number;
} | {
    type: 'Finished';
    taskId: string;
};
export type TToWorkerMessage = {
    action: 'Init';
    params: InitParams.Input;
} | {
    action: 'Settings';
    params: SettingsParams.Input;
} | {
    action: 'Import';
    params: ImportParams.Input;
} | {
    action: 'SetMaterials';
    params: SetMaterialsParams.Input;
} | {
    action: 'RenderMesh';
    params: RenderMeshParams.Input;
} | {
    action: 'Voxelise';
    params: VoxeliseParams.Input;
} | {
    action: 'RenderNextVoxelMeshChunk';
    params: RenderNextVoxelMeshChunkParams.Input;
} | {
    action: 'Assign';
    params: AssignParams.Input;
} | {
    action: 'RenderNextBlockMeshChunk';
    params: RenderNextBlockMeshChunkParams.Input;
} | {
    action: 'Export';
    params: ExportParams.Input;
};
export type TFromWorkerMessage = {
    action: 'KnownError';
    error: AppError;
} | {
    action: 'UnknownError';
    error: Error;
} | {
    action: 'Progress';
    payload: TaskParams;
} | ({
    messages: TMessage[];
} & ({
    action: 'Init';
    result: InitParams.Output;
} | {
    action: 'Settings';
    result: SettingsParams.Output;
} | {
    action: 'Import';
    result: ImportParams.Output;
} | {
    action: 'SetMaterials';
    result: SetMaterialsParams.Output;
} | {
    action: 'RenderMesh';
    result: RenderMeshParams.Output;
} | {
    action: 'Voxelise';
    result: VoxeliseParams.Output;
} | {
    action: 'RenderNextVoxelMeshChunk';
    result: RenderNextVoxelMeshChunkParams.Output;
} | {
    action: 'Assign';
    result: AssignParams.Output;
} | {
    action: 'RenderNextBlockMeshChunk';
    result: RenderNextBlockMeshChunkParams.Output;
} | {
    action: 'Export';
    result: ExportParams.Output;
}));
