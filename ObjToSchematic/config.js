"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = void 0;
const log_util_1 = require("./util/log_util");
class AppConfig {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this.MAJOR_VERSION = 0;
        this.MINOR_VERSION = 8;
        this.HOTFIX_VERSION = 9;
        this.VERSION_TYPE = 'r'; // dev, alpha, or release build
        this.MINECRAFT_VERSION = '1.20.1';
        this.LOCALE = 'en-GB';
        this.VOXEL_BUFFER_CHUNK_SIZE = 50000;
        this.AMBIENT_OCCLUSION_OVERRIDE_CORNER = true;
        this.USE_WORKER_THREAD = true;
        this.MULTISAMPLE_COUNT = 16;
        this.ALPHA_BIAS = 1.0;
        this.ANGLE_SNAP_RADIUS_DEGREES = 10.0;
        this.RENDER_TRIANGLE_THRESHOLD = 1000000;
        this.MAXIMUM_IMAGE_MEM_ALLOC = 2048;
        this.CAMERA_FOV_DEGREES = 30.0;
        this.CAMERA_MINIMUM_DISTANCE = 0.125;
        this.CAMERA_DEFAULT_DISTANCE_UNITS = 4.0;
        this.CAMERA_DEFAULT_AZIMUTH_RADIANS = -1.0;
        this.CAMERA_DEFAULT_ELEVATION_RADIANS = 1.3;
        this.CAMERA_SENSITIVITY_ROTATION = 0.005;
        this.CAMERA_SENSITIVITY_ZOOM = 0.0025;
        this.CONSTRAINT_MINIMUM_HEIGHT = 3;
        this.CONSTRAINT_MAXIMUM_HEIGHT = 380;
        this.SMOOTHNESS_MAX = 3.0;
        this.CAMERA_SMOOTHING = 1.0;
        this.VIEWPORT_BACKGROUND_COLOUR = {
            r: 0.125,
            g: 0.125,
            b: 0.125,
            a: 1.0,
        };
        this.FRESNEL_EXPONENT = 3.0;
        this.FRESNEL_MIX = 0.3;
        this.RELEASE_MODE = this.VERSION_TYPE === 'r';
    }
    dumpConfig() {
        (0, log_util_1.LOG)(this);
    }
    getVersionString() {
        return `v${this.MAJOR_VERSION}.${this.MINOR_VERSION}.${this.HOTFIX_VERSION}${this.VERSION_TYPE}`;
    }
}
exports.AppConfig = AppConfig;
