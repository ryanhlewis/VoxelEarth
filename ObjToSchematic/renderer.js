"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Renderer = exports.MeshType = void 0;
const twgl = require("twgl.js");
const vanilla_png_1 = require("../res/atlases/vanilla.png");
const bounds_1 = require("./bounds");
const camera_1 = require("./camera");
const colour_1 = require("./colour");
const config_1 = require("./config");
const geometry_1 = require("./geometry");
const mesh_1 = require("./mesh");
const render_buffer_1 = require("./render_buffer");
const shaders_1 = require("./shaders");
const texture_1 = require("./texture");
const error_util_1 = require("./util/error_util");
const vector_1 = require("./vector");
const ui_util_1 = require("./util/ui_util");
/* eslint-disable */
var MeshType;
(function (MeshType) {
    MeshType[MeshType["None"] = 0] = "None";
    MeshType[MeshType["TriangleMesh"] = 1] = "TriangleMesh";
    MeshType[MeshType["VoxelMesh"] = 2] = "VoxelMesh";
    MeshType[MeshType["BlockMesh"] = 3] = "BlockMesh";
})(MeshType = exports.MeshType || (exports.MeshType = {}));
/* eslint-enable */
/* eslint-disable */
var EDebugBufferComponents;
(function (EDebugBufferComponents) {
    EDebugBufferComponents[EDebugBufferComponents["Wireframe"] = 0] = "Wireframe";
    EDebugBufferComponents[EDebugBufferComponents["Normals"] = 1] = "Normals";
    EDebugBufferComponents[EDebugBufferComponents["Bounds"] = 2] = "Bounds";
    EDebugBufferComponents[EDebugBufferComponents["Dev"] = 3] = "Dev";
})(EDebugBufferComponents || (EDebugBufferComponents = {}));
class Renderer {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._backgroundColour = { r: 0.125, g: 0.125, b: 0.125, a: 1.0 };
        this._atlasSize = 1.0;
        this._meshToUse = MeshType.None;
        this._voxelSize = 1.0;
        this._gridOffset = new vector_1.Vector3(0, 0, 0);
        this._sliceHeight = 0.0;
        this._redraw = true;
        this._lightingAvailable = false;
        this._allVoxelChunks = false;
        const webgl2Context = document.getElementById('canvas').getContext('webgl2', {
            alpha: false,
        });
        if (webgl2Context === null) {
            throw 'Could not get WebGL2';
        }
        this._gl = webgl2Context;
        twgl.addExtensionsToContext(this._gl);
        this._backgroundColour = config_1.AppConfig.Get.VIEWPORT_BACKGROUND_COLOUR;
        this._modelsAvailable = 0;
        this._materialBuffers = new Map();
        this._gridBuffers = { x: {}, y: {}, z: {} };
        this._gridEnabled = false;
        this._isGridComponentEnabled = {};
        this._axesEnabled = true;
        this._nightVisionEnabled = true;
        this._sliceViewEnabled = false;
        this._blockBounds = new bounds_1.Bounds(new vector_1.Vector3(0, 0, 0), new vector_1.Vector3(0, 0, 0));
        this._axisBuffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        this._axisBuffer.add(geometry_1.DebugGeometryTemplates.arrow(new vector_1.Vector3(0, 0, 0), new vector_1.Vector3(0.125, 0, 0), { r: 0.96, g: 0.21, b: 0.32, a: 1.0 }));
        this._axisBuffer.add(geometry_1.DebugGeometryTemplates.arrow(new vector_1.Vector3(0, 0, 0), new vector_1.Vector3(0, 0.125, 0), { r: 0.44, g: 0.64, b: 0.11, a: 1.0 }));
        this._axisBuffer.add(geometry_1.DebugGeometryTemplates.arrow(new vector_1.Vector3(0, 0, 0), new vector_1.Vector3(0, 0, 0.125), { r: 0.18, g: 0.52, b: 0.89, a: 1.0 }));
        const resizeObserver = new ResizeObserver(() => {
            this.forceRedraw();
        });
        resizeObserver.observe(ui_util_1.UIUtil.getElementById('canvas'));
        {
            this._axisHighlightBuffer = {
                x: {
                    enabled: false, buffer: new render_buffer_1.RenderBuffer([
                        { name: 'position', numComponents: 3 },
                        { name: 'colour', numComponents: 4 },
                    ])
                },
                y: {
                    enabled: false, buffer: new render_buffer_1.RenderBuffer([
                        { name: 'position', numComponents: 3 },
                        { name: 'colour', numComponents: 4 },
                    ])
                },
                z: {
                    enabled: false, buffer: new render_buffer_1.RenderBuffer([
                        { name: 'position', numComponents: 3 },
                        { name: 'colour', numComponents: 4 },
                    ])
                },
            };
            this._axisHighlightBuffer.x.buffer.add(geometry_1.DebugGeometryTemplates.line(new vector_1.Vector3(-10, 0, 0), new vector_1.Vector3(10, 0, 0), { r: 0.96, g: 0.21, b: 0.32, a: 1.0 }));
            this._axisHighlightBuffer.y.buffer.add(geometry_1.DebugGeometryTemplates.line(new vector_1.Vector3(0, -10, 0), new vector_1.Vector3(0, 10, 0), { r: 0.44, g: 0.64, b: 0.11, a: 1.0 }));
            this._axisHighlightBuffer.z.buffer.add(geometry_1.DebugGeometryTemplates.line(new vector_1.Vector3(0, 0, -10), new vector_1.Vector3(0, 0, 10), { r: 0.18, g: 0.52, b: 0.89, a: 1.0 }));
        }
    }
    update() {
        camera_1.ArcballCamera.Get.updateCamera();
    }
    forceRedraw() {
        this._redraw = true;
    }
    draw() {
        if (this._redraw || camera_1.ArcballCamera.Get.isUserRotating || camera_1.ArcballCamera.Get.isUserTranslating) {
            this._setupScene();
            switch (this._meshToUse) {
                case MeshType.TriangleMesh:
                    this._drawMesh();
                    break;
                case MeshType.VoxelMesh:
                    this._drawVoxelMesh();
                    break;
                case MeshType.BlockMesh:
                    this._drawBlockMesh();
                    break;
            }
            ;
            this._drawDebug();
            this._redraw = false;
        }
    }
    // /////////////////////////////////////////////////////////////////////////
    isSliceViewerEnabled() {
        return this._sliceViewEnabled && this._meshToUse === MeshType.BlockMesh;
    }
    toggleSliceViewerEnabled() {
        this._sliceViewEnabled = !this._sliceViewEnabled;
        this.forceRedraw();
    }
    canIncrementSliceHeight() {
        return this._blockBounds.max.y > this._sliceHeight;
    }
    canDecrementSliceHeight() {
        return this._blockBounds.min.y < this._sliceHeight;
    }
    incrementSliceHeight() {
        if (this.canIncrementSliceHeight()) {
            ++this._sliceHeight;
            this.forceRedraw();
        }
    }
    decrementSliceHeight() {
        if (this.canDecrementSliceHeight()) {
            --this._sliceHeight;
            this.forceRedraw();
        }
    }
    setLightingAvailable(isAvailable) {
        this._lightingAvailable = isAvailable;
        if (!isAvailable) {
            this._nightVisionEnabled = true;
        }
    }
    toggleIsGridEnabled() {
        this._gridEnabled = !this._gridEnabled;
        this.forceRedraw();
    }
    isGridEnabled() {
        return this._gridEnabled;
    }
    isAxesEnabled() {
        return this._axesEnabled;
    }
    toggleIsAxesEnabled() {
        this._axesEnabled = !this._axesEnabled;
        this.forceRedraw();
    }
    canToggleNightVision() {
        return this._lightingAvailable;
    }
    toggleIsNightVisionEnabled() {
        this._nightVisionEnabled = !this._nightVisionEnabled;
        if (!this._lightingAvailable) {
            this._nightVisionEnabled = true;
        }
        this.forceRedraw();
    }
    isNightVisionEnabled() {
        return this._nightVisionEnabled;
    }
    toggleIsWireframeEnabled() {
        const isEnabled = !this._isGridComponentEnabled[EDebugBufferComponents.Wireframe];
        this._isGridComponentEnabled[EDebugBufferComponents.Wireframe] = isEnabled;
        this.forceRedraw();
    }
    toggleIsNormalsEnabled() {
        const isEnabled = !this._isGridComponentEnabled[EDebugBufferComponents.Normals];
        this._isGridComponentEnabled[EDebugBufferComponents.Normals] = isEnabled;
        this.forceRedraw();
    }
    toggleIsDevDebugEnabled() {
        const isEnabled = !this._isGridComponentEnabled[EDebugBufferComponents.Dev];
        this._isGridComponentEnabled[EDebugBufferComponents.Dev] = isEnabled;
        this.forceRedraw();
    }
    clearMesh() {
        this._materialBuffers = new Map();
        this._modelsAvailable = 0;
        this.setModelToUse(MeshType.None);
    }
    _createInternalMaterial(material) {
        var _a;
        if (material.type === mesh_1.MaterialType.solid) {
            return {
                type: mesh_1.MaterialType.solid,
                colourArray: colour_1.RGBAUtil.toArray(material.colour),
            };
        }
        else {
            const blankTexture = twgl.createTexture(this._gl, {
                min: this._gl.NEAREST,
                mag: this._gl.NEAREST,
                src: [
                    255, 0, 255, 255,
                ],
            }, () => {
                this.forceRedraw();
            });
            let diffuseTexture = blankTexture;
            let alphaTexture = diffuseTexture;
            if (material.diffuse !== undefined && material.diffuse.raw !== '') {
                diffuseTexture = twgl.createTexture(this._gl, {
                    src: (_a = material.diffuse) === null || _a === void 0 ? void 0 : _a.raw,
                    min: material.interpolation === 'linear' ? this._gl.LINEAR : this._gl.NEAREST,
                    mag: material.interpolation === 'linear' ? this._gl.LINEAR : this._gl.NEAREST,
                    wrap: material.extension === 'clamp' ? this._gl.CLAMP_TO_EDGE : this._gl.REPEAT,
                }, () => {
                    this.forceRedraw();
                });
            }
            if (material.transparency.type === 'UseAlphaMap') {
                alphaTexture = blankTexture;
                if (material.transparency.alpha !== undefined && material.transparency.alpha.raw !== '') {
                    alphaTexture = twgl.createTexture(this._gl, {
                        src: material.transparency.alpha.raw,
                        min: material.interpolation === 'linear' ? this._gl.LINEAR : this._gl.NEAREST,
                        mag: material.interpolation === 'linear' ? this._gl.LINEAR : this._gl.NEAREST,
                        wrap: material.extension === 'clamp' ? this._gl.CLAMP_TO_EDGE : this._gl.REPEAT,
                    }, () => {
                        this.forceRedraw();
                    });
                }
            }
            const alphaValue = material.transparency.type === 'UseAlphaValue' ?
                material.transparency.alpha : 1.0;
            let alphaChannel = texture_1.EImageChannel.MAX;
            switch (material.transparency.type) {
                case 'UseAlphaValue':
                    alphaChannel = texture_1.EImageChannel.MAX;
                    break;
                case 'UseDiffuseMapAlphaChannel':
                    alphaChannel = texture_1.EImageChannel.A;
                    break;
                case 'UseAlphaMap':
                    alphaChannel = material.transparency.channel;
                    break;
            }
            return {
                type: mesh_1.MaterialType.textured,
                diffuseTexture: diffuseTexture,
                alphaTexture: alphaTexture,
                alphaValue: alphaValue,
                alphaChannel: alphaChannel,
            };
        }
    }
    recreateMaterialBuffer(materialName, material) {
        const oldBuffer = this._materialBuffers.get(materialName);
        (0, error_util_1.ASSERT)(oldBuffer !== undefined);
        const internalMaterial = this._createInternalMaterial(material);
        this._materialBuffers.set(materialName, {
            buffer: oldBuffer.buffer,
            material: internalMaterial,
            numElements: oldBuffer.numElements,
            materialName: materialName,
        });
    }
    useMesh(params) {
        this._materialBuffers = new Map();
        for (const { material, buffer, numElements, materialName } of params.buffers) {
            const internalMaterial = this._createInternalMaterial(material);
            this._materialBuffers.set(materialName, {
                buffer: twgl.createBufferInfoFromArrays(this._gl, buffer),
                material: internalMaterial,
                numElements: numElements,
                materialName: materialName,
            });
        }
        this._gridBuffers.x[MeshType.TriangleMesh] = geometry_1.DebugGeometryTemplates.gridX(params.dimensions);
        this._gridBuffers.y[MeshType.TriangleMesh] = geometry_1.DebugGeometryTemplates.gridY(params.dimensions);
        this._gridBuffers.z[MeshType.TriangleMesh] = geometry_1.DebugGeometryTemplates.gridZ(params.dimensions);
        this._modelsAvailable = 1;
        this.setModelToUse(MeshType.TriangleMesh);
    }
    useVoxelMeshChunk(params) {
        var _a;
        if (params.isFirstChunk) {
            this._voxelBuffer = [];
        }
        this._allVoxelChunks = !params.moreVoxelsToBuffer;
        (_a = this._voxelBuffer) === null || _a === void 0 ? void 0 : _a.push(twgl.createBufferInfoFromArrays(this._gl, params.buffer.buffer));
        this._voxelSize = params.voxelSize;
        if (params.isFirstChunk) {
            const voxelSize = this._voxelSize;
            const dimensions = new vector_1.Vector3(0, 0, 0);
            dimensions.setFrom(params.dimensions);
            this._gridOffset = new vector_1.Vector3(dimensions.x % 2 === 0 ? 0 : -0.5, dimensions.y % 2 === 0 ? 0 : -0.5, dimensions.z % 2 === 0 ? 0 : -0.5);
            dimensions.add(1);
            this._gridBuffers.x[MeshType.VoxelMesh] = geometry_1.DebugGeometryTemplates.gridX(vector_1.Vector3.mulScalar(dimensions, voxelSize), voxelSize);
            this._gridBuffers.y[MeshType.VoxelMesh] = geometry_1.DebugGeometryTemplates.gridY(vector_1.Vector3.mulScalar(dimensions, voxelSize), voxelSize);
            this._gridBuffers.z[MeshType.VoxelMesh] = geometry_1.DebugGeometryTemplates.gridZ(vector_1.Vector3.mulScalar(dimensions, voxelSize), voxelSize);
            this._modelsAvailable = 2;
            this.setModelToUse(MeshType.VoxelMesh);
        }
        this.forceRedraw();
    }
    /*
    public useVoxelMesh(params: RenderNextVoxelMeshChunkParams.Output) {
        this._voxelBuffer?.push(twgl.createBufferInfoFromArrays(this._gl, params.buffer.buffer));
        this._voxelSize = params.voxelSize;

        const voxelSize = this._voxelSize;
        const dimensions = new Vector3(0, 0, 0);
        dimensions.setFrom(params.dimensions);

        this._gridOffset = new Vector3(
            dimensions.x % 2 === 0 ? 0 : -0.5,
            dimensions.y % 2 === 0 ? 0 : -0.5,
            dimensions.z % 2 === 0 ? 0 : -0.5,
        );
        dimensions.add(1);

        this._gridBuffers.x[MeshType.VoxelMesh] = DebugGeometryTemplates.gridX(Vector3.mulScalar(dimensions, voxelSize), voxelSize);
        this._gridBuffers.y[MeshType.VoxelMesh] = DebugGeometryTemplates.gridY(Vector3.mulScalar(dimensions, voxelSize), voxelSize);
        this._gridBuffers.z[MeshType.VoxelMesh] = DebugGeometryTemplates.gridZ(Vector3.mulScalar(dimensions, voxelSize), voxelSize);

        this._modelsAvailable = 2;
        this.setModelToUse(MeshType.VoxelMesh);
    }
    */
    useBlockMeshChunk(params) {
        var _a;
        if (params.isFirstChunk) {
            this._blockBuffer = [];
            // re-create objects, due to serialization.
            const min = new vector_1.Vector3(0, 0, 0);
            const max = new vector_1.Vector3(0, 0, 0);
            min.setFrom(params.bounds['_min']);
            max.setFrom(params.bounds['_max']);
            this._blockBounds = new bounds_1.Bounds(min, max);
            this._sliceHeight = this._blockBounds.min.y;
        }
        (_a = this._blockBuffer) === null || _a === void 0 ? void 0 : _a.push(twgl.createBufferInfoFromArrays(this._gl, params.buffer.buffer));
        if (params.isFirstChunk) {
            this._atlasTexture = twgl.createTexture(this._gl, {
                src: vanilla_png_1.default,
                mag: this._gl.NEAREST,
            }, () => {
                this.forceRedraw();
            });
            this._atlasSize = params.atlasSize;
            this._gridBuffers.y[MeshType.BlockMesh] = this._gridBuffers.y[MeshType.VoxelMesh];
            this._modelsAvailable = 3;
            this.setModelToUse(MeshType.BlockMesh);
        }
        this.forceRedraw();
    }
    // /////////////////////////////////////////////////////////////////////////
    setAxisToHighlight(axis) {
        this.clearAxisToHighlight();
        this._axisHighlightBuffer[axis].enabled = true;
        this.forceRedraw();
    }
    clearAxisToHighlight() {
        this._axisHighlightBuffer.x.enabled = false;
        this._axisHighlightBuffer.y.enabled = false;
        this._axisHighlightBuffer.z.enabled = false;
        this.forceRedraw();
    }
    _drawDebug() {
        // Draw debug modes
        {
            //this._gl.disable(this._gl.DEPTH_TEST);
            const axes = ['x', 'y', 'z'];
            axes.forEach((axis) => {
                if (this._axisHighlightBuffer[axis].enabled) {
                    this._drawBuffer(this._gl.LINES, this._axisHighlightBuffer[axis].buffer.getWebGLBuffer(), shaders_1.ShaderManager.Get.debugProgram, {
                        u_worldViewProjection: camera_1.ArcballCamera.Get.getWorldViewProjection(),
                    });
                }
            });
            //this._gl.enable(this._gl.DEPTH_TEST);
        }
        // Draw grid
        if (this._gridEnabled) {
            if (camera_1.ArcballCamera.Get.isAlignedWithAxis('x') && !camera_1.ArcballCamera.Get.isAlignedWithAxis('y') && !camera_1.ArcballCamera.Get.isUserRotating) {
                const gridBuffer = this._gridBuffers.x[this._meshToUse];
                if (gridBuffer !== undefined) {
                    this._drawBuffer(this._gl.LINES, gridBuffer.getWebGLBuffer(), shaders_1.ShaderManager.Get.debugProgram, {
                        u_worldViewProjection: camera_1.ArcballCamera.Get.getWorldViewProjection(),
                    });
                }
            }
            else if (camera_1.ArcballCamera.Get.isAlignedWithAxis('z') && !camera_1.ArcballCamera.Get.isAlignedWithAxis('y') && !camera_1.ArcballCamera.Get.isUserRotating) {
                const gridBuffer = this._gridBuffers.z[this._meshToUse];
                if (gridBuffer !== undefined) {
                    this._drawBuffer(this._gl.LINES, gridBuffer.getWebGLBuffer(), shaders_1.ShaderManager.Get.debugProgram, {
                        u_worldViewProjection: camera_1.ArcballCamera.Get.getWorldViewProjection(),
                    });
                }
            }
            else {
                const gridBuffer = this._gridBuffers.y[this._meshToUse];
                if (gridBuffer !== undefined) {
                    this._drawBuffer(this._gl.LINES, gridBuffer.getWebGLBuffer(), shaders_1.ShaderManager.Get.debugProgram, {
                        u_worldViewProjection: camera_1.ArcballCamera.Get.getWorldViewProjection(),
                        u_worldOffset: [0, this._sliceViewEnabled ? this._sliceHeight * this._voxelSize : 0, 0],
                    });
                }
            }
        }
        // Draw axis
        if (this._axesEnabled) {
            this._gl.disable(this._gl.DEPTH_TEST);
            this._drawBuffer(this._gl.LINES, this._axisBuffer.getWebGLBuffer(), shaders_1.ShaderManager.Get.debugProgram, {
                u_worldViewProjection: camera_1.ArcballCamera.Get.getWorldViewProjection(),
            });
            this._gl.enable(this._gl.DEPTH_TEST);
        }
    }
    _drawMesh() {
        this._materialBuffers.forEach((materialBuffer, materialName) => {
            var _a;
            if (materialBuffer.material.type === mesh_1.MaterialType.textured) {
                this._drawMeshBuffer(materialBuffer.buffer, materialBuffer.numElements, shaders_1.ShaderManager.Get.textureTriProgram, {
                    u_lightWorldPos: camera_1.ArcballCamera.Get.getCameraPosition(-Math.PI / 4, 0.0).toArray(),
                    u_worldViewProjection: camera_1.ArcballCamera.Get.getWorldViewProjection(),
                    u_worldInverseTranspose: camera_1.ArcballCamera.Get.getWorldInverseTranspose(),
                    u_texture: materialBuffer.material.diffuseTexture,
                    u_alpha: (_a = materialBuffer.material.alphaTexture) !== null && _a !== void 0 ? _a : materialBuffer.material.diffuseTexture,
                    u_alphaChannel: materialBuffer.material.alphaChannel,
                    u_alphaFactor: materialBuffer.material.alphaValue,
                    u_cameraDir: camera_1.ArcballCamera.Get.getCameraDirection().toArray(),
                    u_fresnelExponent: config_1.AppConfig.Get.FRESNEL_EXPONENT,
                    u_fresnelMix: config_1.AppConfig.Get.FRESNEL_MIX,
                });
            }
            else {
                this._drawMeshBuffer(materialBuffer.buffer, materialBuffer.numElements, shaders_1.ShaderManager.Get.solidTriProgram, {
                    u_lightWorldPos: camera_1.ArcballCamera.Get.getCameraPosition(-Math.PI / 4, 0.0).toArray(),
                    u_worldViewProjection: camera_1.ArcballCamera.Get.getWorldViewProjection(),
                    u_worldInverseTranspose: camera_1.ArcballCamera.Get.getWorldInverseTranspose(),
                    u_fillColour: materialBuffer.material.colourArray,
                    u_cameraDir: camera_1.ArcballCamera.Get.getCameraDirection().toArray(),
                    u_fresnelExponent: config_1.AppConfig.Get.FRESNEL_EXPONENT,
                    u_fresnelMix: config_1.AppConfig.Get.FRESNEL_MIX,
                });
            }
        });
    }
    _drawVoxelMesh() {
        var _a;
        const shader = shaders_1.ShaderManager.Get.voxelProgram;
        const uniforms = {
            u_worldViewProjection: camera_1.ArcballCamera.Get.getWorldViewProjection(),
            u_voxelSize: this._voxelSize,
            u_gridOffset: this._gridOffset.toArray(),
            u_ambientOcclusion: this._allVoxelChunks,
        };
        (_a = this._voxelBuffer) === null || _a === void 0 ? void 0 : _a.forEach((buffer) => {
            this._gl.useProgram(shader.program);
            twgl.setBuffersAndAttributes(this._gl, shader, buffer);
            twgl.setUniforms(shader, uniforms);
            this._gl.drawElements(this._gl.TRIANGLES, buffer.numElements, this._gl.UNSIGNED_INT, 0);
        });
    }
    _drawBlockMesh() {
        var _a;
        this._gl.enable(this._gl.CULL_FACE);
        const shader = shaders_1.ShaderManager.Get.blockProgram;
        const uniforms = {
            u_worldViewProjection: camera_1.ArcballCamera.Get.getWorldViewProjection(),
            u_texture: this._atlasTexture,
            u_voxelSize: this._voxelSize,
            u_atlasSize: this._atlasSize,
            u_gridOffset: this._gridOffset.toArray(),
            u_nightVision: this.isNightVisionEnabled(),
            u_sliceHeight: this._sliceViewEnabled ? this._sliceHeight : Infinity,
        };
        (_a = this._blockBuffer) === null || _a === void 0 ? void 0 : _a.forEach((buffer) => {
            this._gl.useProgram(shader.program);
            twgl.setBuffersAndAttributes(this._gl, shader, buffer);
            twgl.setUniforms(shader, uniforms);
            this._gl.drawElements(this._gl.TRIANGLES, buffer.numElements, this._gl.UNSIGNED_INT, 0);
        });
        this._gl.disable(this._gl.CULL_FACE);
    }
    // /////////////////////////////////////////////////////////////////////////
    _drawMeshBuffer(register, numElements, shaderProgram, uniforms) {
        this._drawBuffer(this._gl.TRIANGLES, { buffer: register, numElements: numElements }, shaderProgram, uniforms);
    }
    setModelToUse(meshType) {
        const isModelAvailable = this._modelsAvailable >= meshType;
        if (isModelAvailable) {
            this._meshToUse = meshType;
        }
        this.forceRedraw();
    }
    _setupScene() {
        twgl.resizeCanvasToDisplaySize(this._gl.canvas);
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        camera_1.ArcballCamera.Get.setAspect(this._gl.canvas.width / this._gl.canvas.height);
        this._gl.blendFuncSeparate(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.enable(this._gl.BLEND);
        this._gl.clearColor(this._backgroundColour.r, this._backgroundColour.g, this._backgroundColour.b, 1.0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }
    _drawBuffer(drawMode, buffer, shader, uniforms) {
        this._gl.useProgram(shader.program);
        twgl.setBuffersAndAttributes(this._gl, shader, buffer.buffer);
        twgl.setUniforms(shader, uniforms);
        this._gl.drawElements(drawMode, buffer.numElements, this._gl.UNSIGNED_INT, 0);
    }
    getModelsAvailable() {
        return this._modelsAvailable;
    }
    getActiveMeshType() {
        return this._meshToUse;
    }
}
exports.Renderer = Renderer;