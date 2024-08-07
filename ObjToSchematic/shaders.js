"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShaderManager = void 0;
const twgl = require("twgl.js");
const block_fragment_fs_1 = require("../res/shaders/block_fragment.fs");
const block_vertex_vs_1 = require("../res/shaders/block_vertex.vs");
const debug_fragment_fs_1 = require("../res/shaders/debug_fragment.fs");
const debug_vertex_vs_1 = require("../res/shaders/debug_vertex.vs");
const solid_tri_fragment_fs_1 = require("../res/shaders/solid_tri_fragment.fs");
const solid_tri_vertex_vs_1 = require("../res/shaders/solid_tri_vertex.vs");
const texture_tri_fragment_fs_1 = require("../res/shaders/texture_tri_fragment.fs");
const texture_tri_vertex_vs_1 = require("../res/shaders/texture_tri_vertex.vs");
const voxel_fragment_fs_1 = require("../res/shaders/voxel_fragment.fs");
const voxel_vertex_vs_1 = require("../res/shaders/voxel_vertex.vs");
const renderer_1 = require("./renderer");
class ShaderManager {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        const gl = renderer_1.Renderer.Get._gl;
        this.textureTriProgram = twgl.createProgramInfo(gl, [texture_tri_vertex_vs_1.default, texture_tri_fragment_fs_1.default]);
        this.solidTriProgram = twgl.createProgramInfo(gl, [solid_tri_vertex_vs_1.default, solid_tri_fragment_fs_1.default]);
        this.voxelProgram = twgl.createProgramInfo(gl, [voxel_vertex_vs_1.default, voxel_fragment_fs_1.default]);
        this.blockProgram = twgl.createProgramInfo(gl, [block_vertex_vs_1.default, block_fragment_fs_1.default]);
        this.debugProgram = twgl.createProgramInfo(gl, [debug_vertex_vs_1.default, debug_fragment_fs_1.default]);
    }
}
exports.ShaderManager = ShaderManager;
