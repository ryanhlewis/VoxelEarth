"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShaderManager = void 0;
var twgl = __importStar(require("twgl.js"));
var block_fragment_fs_1 = __importDefault(require("../res/shaders/block_fragment.fs"));
var block_vertex_vs_1 = __importDefault(require("../res/shaders/block_vertex.vs"));
var debug_fragment_fs_1 = __importDefault(require("../res/shaders/debug_fragment.fs"));
var debug_vertex_vs_1 = __importDefault(require("../res/shaders/debug_vertex.vs"));
var solid_tri_fragment_fs_1 = __importDefault(require("../res/shaders/solid_tri_fragment.fs"));
var solid_tri_vertex_vs_1 = __importDefault(require("../res/shaders/solid_tri_vertex.vs"));
var texture_tri_fragment_fs_1 = __importDefault(require("../res/shaders/texture_tri_fragment.fs"));
var texture_tri_vertex_vs_1 = __importDefault(require("../res/shaders/texture_tri_vertex.vs"));
var voxel_fragment_fs_1 = __importDefault(require("../res/shaders/voxel_fragment.fs"));
var voxel_vertex_vs_1 = __importDefault(require("../res/shaders/voxel_vertex.vs"));
var renderer_1 = require("./renderer");
var ShaderManager = /** @class */ (function () {
    function ShaderManager() {
        var gl = renderer_1.Renderer.Get._gl;
        this.textureTriProgram = twgl.createProgramInfo(gl, [texture_tri_vertex_vs_1.default, texture_tri_fragment_fs_1.default]);
        this.solidTriProgram = twgl.createProgramInfo(gl, [solid_tri_vertex_vs_1.default, solid_tri_fragment_fs_1.default]);
        this.voxelProgram = twgl.createProgramInfo(gl, [voxel_vertex_vs_1.default, voxel_fragment_fs_1.default]);
        this.blockProgram = twgl.createProgramInfo(gl, [block_vertex_vs_1.default, block_fragment_fs_1.default]);
        this.debugProgram = twgl.createProgramInfo(gl, [debug_vertex_vs_1.default, debug_fragment_fs_1.default]);
    }
    Object.defineProperty(ShaderManager, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    return ShaderManager;
}());
exports.ShaderManager = ShaderManager;
//# sourceMappingURL=shaders.js.map