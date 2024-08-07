"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = void 0;
var log_util_1 = require("./util/log_util");
var AppConfig = /** @class */ (function () {
    function AppConfig() {
        this.MAJOR_VERSION = 0;
        this.MINOR_VERSION = 8;
        this.HOTFIX_VERSION = 8;
        this.VERSION_TYPE = 'r'; // dev, alpha, or release build
        this.MINECRAFT_VERSION = '1.19.4';
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
        this.CAMERA_DEFAULT_DISTANCE_UNITS = 18.0;
        this.CAMERA_DEFAULT_AZIMUTH_RADIANS = -1.0;
        this.CAMERA_DEFAULT_ELEVATION_RADIANS = 1.3;
        this.CAMERA_SENSITIVITY_ROTATION = 0.005;
        this.CAMERA_SENSITIVITY_ZOOM = 0.005;
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
    Object.defineProperty(AppConfig, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    AppConfig.prototype.dumpConfig = function () {
        (0, log_util_1.LOG)(this);
    };
    AppConfig.prototype.getVersionString = function () {
        return "v".concat(this.MAJOR_VERSION, ".").concat(this.MINOR_VERSION, ".").concat(this.HOTFIX_VERSION).concat(this.VERSION_TYPE);
    };
    return AppConfig;
}());
exports.AppConfig = AppConfig;
