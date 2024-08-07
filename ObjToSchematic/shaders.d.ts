import * as twgl from 'twgl.js';
export declare class ShaderManager {
    readonly textureTriProgram: twgl.ProgramInfo;
    readonly solidTriProgram: twgl.ProgramInfo;
    readonly voxelProgram: twgl.ProgramInfo;
    readonly blockProgram: twgl.ProgramInfo;
    readonly debugProgram: twgl.ProgramInfo;
    private static _instance;
    static get Get(): ShaderManager;
    private constructor();
}
