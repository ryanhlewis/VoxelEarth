"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArcballCamera = void 0;
const twgl_js_1 = require("twgl.js");
const config_1 = require("./config");
const math_1 = require("./math");
const mouse_1 = require("./mouse");
const renderer_1 = require("./renderer");
const error_util_1 = require("./util/error_util");
const vector_1 = require("./vector");
class ArcballCamera {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this.isUserRotating = false;
        this.isUserTranslating = false;
        this.up = [0, 1, 0];
        this.eye = [0, 0, 0];
        this._azimuthRelief = 0.0;
        this._elevationRelief = 0.0;
        this._isAngleSnapped = false;
        this._angleSnap = true;
        this._gl = renderer_1.Renderer.Get._gl;
        this._isPerspective = true;
        this._fov = config_1.AppConfig.Get.CAMERA_FOV_DEGREES * math_1.degreesToRadians;
        this._zNear = 0.5;
        this._zFar = 100.0;
        this._aspect = this._gl.canvas.width / this._gl.canvas.height;
        this._distance = new math_1.SmoothVariable(config_1.AppConfig.Get.CAMERA_DEFAULT_DISTANCE_UNITS, config_1.AppConfig.Get.CAMERA_SMOOTHING);
        this._azimuth = new math_1.SmoothVariable(config_1.AppConfig.Get.CAMERA_DEFAULT_AZIMUTH_RADIANS, config_1.AppConfig.Get.CAMERA_SMOOTHING);
        this._elevation = new math_1.SmoothVariable(config_1.AppConfig.Get.CAMERA_DEFAULT_ELEVATION_RADIANS, config_1.AppConfig.Get.CAMERA_SMOOTHING);
        this._target = new math_1.SmoothVectorVariable(new vector_1.Vector3(0, 0, 0), config_1.AppConfig.Get.CAMERA_SMOOTHING);
        this._elevation.setClamp(0.001, Math.PI - 0.001);
        this._distance.setClamp(config_1.AppConfig.Get.CAMERA_MINIMUM_DISTANCE, 100.0);
    }
    init() {
        this.setCameraMode(this._isPerspective ? 'perspective' : 'orthographic');
        const canvas = document.getElementById('canvas');
        (0, error_util_1.ASSERT)(canvas !== null);
        canvas.addEventListener('mousedown', (e) => {
            this.onMouseDown(e);
        });
        document.addEventListener('mouseup', (e) => {
            this.onMouseUp(e);
        });
        canvas.addEventListener('wheel', (e) => {
            this.onWheelScroll(e);
        });
    }
    isPerspective() {
        return this._isPerspective;
    }
    isOrthographic() {
        return !this._isPerspective;
    }
    isAlignedWithAxis(axis) {
        const azimuth = Math.abs(this._azimuth.getTarget() % (Math.PI * 2));
        const elevation = this._elevation.getTarget();
        switch (axis) {
            case 'x':
                return math_1.AppMath.nearlyEqual(azimuth, math_1.AppMath.RADIANS_0) || math_1.AppMath.nearlyEqual(azimuth, math_1.AppMath.RADIANS_180);
            case 'y':
                return math_1.AppMath.nearlyEqual(elevation, math_1.AppMath.RADIANS_0, 0.002) || math_1.AppMath.nearlyEqual(elevation, math_1.AppMath.RADIANS_180, 0.002);
            case 'z':
                return math_1.AppMath.nearlyEqual(azimuth, math_1.AppMath.RADIANS_90) || math_1.AppMath.nearlyEqual(azimuth, math_1.AppMath.RADIANS_270);
        }
    }
    setCameraMode(mode) {
        this._isPerspective = mode === 'perspective';
        renderer_1.Renderer.Get.forceRedraw();
    }
    toggleAngleSnap() {
        this._angleSnap = !this._angleSnap;
        if (!this._angleSnap) {
            this._isAngleSnapped = false;
            this._azimuthRelief = 0.0;
            this._elevationRelief = 0.0;
        }
        renderer_1.Renderer.Get.forceRedraw();
    }
    isAngleSnapEnabled() {
        return this._angleSnap;
    }
    updateCamera() {
        this._aspect = this._gl.canvas.width / this._gl.canvas.height;
        const mouseDelta = mouse_1.MouseManager.Get.getMouseDelta();
        mouseDelta.dx *= config_1.AppConfig.Get.CAMERA_SENSITIVITY_ROTATION;
        mouseDelta.dy *= config_1.AppConfig.Get.CAMERA_SENSITIVITY_ROTATION;
        if (this.isUserRotating) {
            this._azimuth.addToTarget(mouseDelta.dx);
            this._elevation.addToTarget(mouseDelta.dy);
        }
        if (this.isUserTranslating) {
            const my = mouseDelta.dy;
            const mx = mouseDelta.dx;
            // Up-down
            const dy = -Math.cos(this._elevation.getTarget() - Math.PI / 2);
            const df = Math.sin(this._elevation.getTarget() - Math.PI / 2);
            this._target.addToTarget(new vector_1.Vector3(-Math.sin(this._azimuth.getTarget() - Math.PI / 2) * my * df, dy * my, Math.cos(this._azimuth.getTarget() - Math.PI / 2) * my * df));
            // Left-right
            const dx = Math.sin(this._azimuth.getTarget());
            const dz = -Math.cos(this._azimuth.getTarget());
            this._target.addToTarget(new vector_1.Vector3(dx * mx, 0.0, dz * mx));
        }
        const axisSnapRadius = (0, math_1.clamp)(config_1.AppConfig.Get.ANGLE_SNAP_RADIUS_DEGREES, 0.0, 90.0) * math_1.degreesToRadians;
        if (this._shouldSnapCameraAngle()) {
            let shouldSnapToAzimuth = false;
            let shouldSnapToElevation = false;
            let snapAngleAzimuth = 0.0;
            let snapAngleElevation = 0.0;
            const azimuth = this._azimuth.getTarget();
            const elevation = this._elevation.getTarget();
            const modAzimuth = Math.abs(azimuth % (90 * math_1.degreesToRadians));
            if (modAzimuth < axisSnapRadius || modAzimuth > (90 * math_1.degreesToRadians - axisSnapRadius)) {
                shouldSnapToAzimuth = true;
                snapAngleAzimuth = (0, math_1.roundToNearest)(azimuth, 90 * math_1.degreesToRadians);
            }
            const elevationSnapPoints = [0, 90, 180].map((x) => x * math_1.degreesToRadians);
            for (const elevationSnapPoint of elevationSnapPoints) {
                if (elevationSnapPoint - axisSnapRadius <= elevation && elevation <= elevationSnapPoint + axisSnapRadius) {
                    shouldSnapToElevation = true;
                    snapAngleElevation = elevationSnapPoint;
                    break;
                }
            }
            if (shouldSnapToAzimuth && shouldSnapToElevation) {
                this._azimuth.setTarget(snapAngleAzimuth);
                this._elevation.setTarget(snapAngleElevation);
                this._isAngleSnapped = true;
            }
        }
        /*
        if (this.isOrthographic()) {
            const azimuth0 = between(this._azimuth.getTarget(), 0.0 - axisSnapRadius, 0.0 + axisSnapRadius);
            const azimuth90 = between(this._azimuth.getTarget(), Math.PI/2 - axisSnapRadius, Math.PI/2 + axisSnapRadius);
            const azimuth180 = between(this._azimuth.getTarget(), Math.PI - axisSnapRadius, Math.PI + axisSnapRadius);
            const azimuth270 = between(this._azimuth.getTarget(), 3*Math.PI/2 - axisSnapRadius, 3*Math.PI/2 + axisSnapRadius);

            const elevationTop = between(this._elevation.getTarget(), 0.0 - axisSnapRadius, 0.0 + axisSnapRadius);
            const elevationMiddle = between(this._elevation.getTarget(), Math.PI/2 - axisSnapRadius, Math.PI/2 + axisSnapRadius);
            const elevationBottom = between(this._elevation.getTarget(), Math.PI - axisSnapRadius, Math.PI + axisSnapRadius);

            if (elevationMiddle) {
                if (azimuth0) {
                    this._azimuth.setTarget(0);
                    this._elevation.setTarget(Math.PI/2);
                    this._isAngleSnapped = true;
                } else if (azimuth90) {
                    this._azimuth.setTarget(90);
                    this._elevation.setTarget(Math.PI/2);
                    this._isAngleSnapped = true;
                } else if (azimuth180) {
                    this._azimuth.setTarget(180);
                    this._elevation.setTarget(Math.PI/2);
                    this._isAngleSnapped = true;
                } else if (azimuth270) {
                    this._azimuth.setTarget(270);
                    this._elevation.setTarget(Math.PI/2);
                    this._isAngleSnapped = true;
                }
            }
        }
        */
        if (this._isAngleSnapped && this.isUserRotating) {
            this._azimuthRelief += mouseDelta.dx;
            this._elevationRelief += mouseDelta.dy;
            if (!(0, math_1.between)(this._azimuthRelief, -axisSnapRadius, axisSnapRadius) || !(0, math_1.between)(this._elevationRelief, -axisSnapRadius, axisSnapRadius)) {
                this._azimuth.setTarget(this._azimuth.getTarget() + this._azimuthRelief * 2);
                this._elevation.setTarget(this._elevation.getTarget() + this._elevationRelief * 2);
                this._isAngleSnapped = false;
            }
        }
        if (!this._isAngleSnapped) {
            this._azimuthRelief = 0.0;
            this._elevationRelief = 0.0;
        }
        // Move camera towards target location
        this._distance.tick();
        this._azimuth.tick();
        this._elevation.tick();
        this._target.tick();
        const target = this._target.getActual().toArray();
        this.eye = [
            this._distance.getActual() * Math.cos(this._azimuth.getActual()) * -Math.sin(this._elevation.getActual()) + target[0],
            this._distance.getActual() * Math.cos(this._elevation.getActual()) + target[1],
            this._distance.getActual() * Math.sin(this._azimuth.getActual()) * -Math.sin(this._elevation.getActual()) + target[2],
        ];
    }
    _shouldSnapCameraAngle() {
        return this.isOrthographic() && this._angleSnap;
    }
    getCameraPosition(azimuthOffset, elevationOffset) {
        const azimuth = this._azimuth.getActual() + azimuthOffset;
        const elevation = this._elevation.getActual() + elevationOffset;
        return new vector_1.Vector3(this._distance.getActual() * Math.cos(azimuth) * -Math.sin(elevation), this._distance.getActual() * Math.cos(elevation), this._distance.getActual() * Math.sin(azimuth) * -Math.sin(elevation));
    }
    getCameraDirection() {
        return this.getCameraPosition(0.0, 0.0)
            .sub(this._target.getActual())
            .normalise();
    }
    onMouseDown(e) {
        if (e.buttons === 1) {
            this.isUserRotating = true;
        }
        else if (e.buttons === 2) {
            this.isUserTranslating = true;
        }
    }
    onMouseUp(e) {
        this.isUserRotating = false;
        this.isUserTranslating = false;
    }
    onWheelScroll(e) {
        this._distance.addToTarget(e.deltaY * config_1.AppConfig.Get.CAMERA_SENSITIVITY_ZOOM);
        renderer_1.Renderer.Get.forceRedraw();
    }
    getProjectionMatrix() {
        if (this._isPerspective) {
            return twgl_js_1.m4.perspective(this._fov, this._aspect, this._zNear, this._zFar);
        }
        else {
            const zoom = this._distance.getActual() / 3.6;
            return twgl_js_1.m4.ortho(-zoom * this._aspect, zoom * this._aspect, -zoom, zoom, -1000, 1000);
        }
    }
    getCameraMatrix() {
        return twgl_js_1.m4.lookAt(this.eye, this._target.getActual().toArray(), this.up);
    }
    getViewMatrix() {
        return twgl_js_1.m4.inverse(this.getCameraMatrix());
    }
    getViewProjection() {
        return twgl_js_1.m4.multiply(this.getProjectionMatrix(), this.getViewMatrix());
    }
    getWorldMatrix() {
        return twgl_js_1.m4.identity();
    }
    getWorldViewProjection() {
        return twgl_js_1.m4.multiply(this.getViewProjection(), this.getWorldMatrix());
    }
    getWorldInverseTranspose() {
        return twgl_js_1.m4.transpose(twgl_js_1.m4.inverse(this.getWorldMatrix()));
    }
    getInverseWorldViewProjection() {
        return twgl_js_1.m4.inverse(this.getWorldViewProjection());
    }
    onZoomOut() {
        this._distance.addToTarget(1);
        renderer_1.Renderer.Get.forceRedraw();
    }
    onZoomIn() {
        this._distance.addToTarget(-1);
        renderer_1.Renderer.Get.forceRedraw();
    }
    reset() {
        this._target.setTarget(new vector_1.Vector3(0, 0, 0));
        this._distance.setTarget(config_1.AppConfig.Get.CAMERA_DEFAULT_DISTANCE_UNITS);
        this._azimuth.setTarget(config_1.AppConfig.Get.CAMERA_DEFAULT_AZIMUTH_RADIANS);
        this._elevation.setTarget(config_1.AppConfig.Get.CAMERA_DEFAULT_ELEVATION_RADIANS);
        while (this._azimuth.getActual() < config_1.AppConfig.Get.CAMERA_DEFAULT_AZIMUTH_RADIANS - Math.PI) {
            this._azimuth.setActual(this._azimuth.getActual() + Math.PI * 2);
        }
        while (this._azimuth.getActual() > config_1.AppConfig.Get.CAMERA_DEFAULT_ELEVATION_RADIANS + Math.PI) {
            this._azimuth.setActual(this._azimuth.getActual() - Math.PI * 2);
        }
        renderer_1.Renderer.Get.forceRedraw();
    }
    getAspect() {
        return this._aspect;
    }
    setAspect(aspect) {
        this._aspect = aspect;
    }
}
exports.ArcballCamera = ArcballCamera;
module.exports.ArcballCamera = ArcballCamera;
