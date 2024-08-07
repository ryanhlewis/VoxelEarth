"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureConverter = exports.Texture = exports.EImageChannel = exports.TextureFiltering = exports.TextureFormat = void 0;
const jpeg = require("jpeg-js");
const pngjs_1 = require("pngjs");
const colour_1 = require("./colour");
const config_1 = require("./config");
const math_1 = require("./math");
const util_1 = require("./util");
const error_util_1 = require("./util/error_util");
const log_util_1 = require("./util/log_util");
/* eslint-disable */
var TextureFormat;
(function (TextureFormat) {
    TextureFormat[TextureFormat["PNG"] = 0] = "PNG";
    TextureFormat[TextureFormat["JPEG"] = 1] = "JPEG";
})(TextureFormat = exports.TextureFormat || (exports.TextureFormat = {}));
/* eslint-enable */
/* eslint-disable */
var TextureFiltering;
(function (TextureFiltering) {
    TextureFiltering[TextureFiltering["Linear"] = 0] = "Linear";
    TextureFiltering[TextureFiltering["Nearest"] = 1] = "Nearest";
})(TextureFiltering = exports.TextureFiltering || (exports.TextureFiltering = {}));
/* eslint-disable */
var EImageChannel;
(function (EImageChannel) {
    EImageChannel[EImageChannel["R"] = 0] = "R";
    EImageChannel[EImageChannel["G"] = 1] = "G";
    EImageChannel[EImageChannel["B"] = 2] = "B";
    EImageChannel[EImageChannel["A"] = 3] = "A";
    EImageChannel[EImageChannel["MAX"] = 4] = "MAX";
})(EImageChannel = exports.EImageChannel || (exports.EImageChannel = {}));
class Texture {
    constructor(params) {
        this._image = this._readRawData(params.diffuse);
        this._alphaImage = params.transparency.type === 'UseAlphaMap' ?
            this._readRawData(params.transparency.alpha) :
            this._image;
    }
    _readRawData(params) {
        if ((params === null || params === void 0 ? void 0 : params.filetype) === 'png') {
            const png = params.raw.split(',')[1];
            if (png !== undefined) {
                return pngjs_1.PNG.sync.read(Buffer.from(png, 'base64'));
            }
        }
        if ((params === null || params === void 0 ? void 0 : params.filetype) === 'jpg') {
            const jpg = params.raw.split(',')[1];
            if (jpg !== undefined) {
                return jpeg.decode(Buffer.from(jpg, 'base64'), {
                    maxMemoryUsageInMB: config_1.AppConfig.Get.MAXIMUM_IMAGE_MEM_ALLOC,
                    formatAsRGBA: true,
                });
            }
        }
    }
    _correctTexcoord(a) {
        if (Number.isInteger(a)) {
            return a > 0.5 ? 1.0 : 0.0;
        }
        const frac = Math.abs(a) - Math.floor(Math.abs(a));
        return a < 0.0 ? 1.0 - frac : frac;
    }
    /**
     * UV can be in any range and is not limited to [0, 1]
     */
    getRGBA(inUV, interpolation, extension) {
        const uv = new util_1.UV(0.0, 0.0);
        if (extension === 'clamp') {
            uv.u = (0, math_1.clamp)(inUV.u, 0.0, 1.0);
            uv.v = (0, math_1.clamp)(inUV.v, 0.0, 1.0);
        }
        else {
            uv.u = this._correctTexcoord(inUV.u);
            uv.v = this._correctTexcoord(inUV.v);
        }
        (0, error_util_1.ASSERT)(uv.u >= 0.0 && uv.u <= 1.0, 'Texcoord UV.u OOB');
        (0, error_util_1.ASSERT)(uv.v >= 0.0 && uv.v <= 1.0, 'Texcoord UV.v OOB');
        uv.v = 1.0 - uv.v;
        const diffuse = this._image === undefined ? colour_1.RGBAColours.MAGENTA : ((interpolation === 'nearest') ?
            this._getNearestRGBA(this._image, uv) :
            this._getLinearRGBA(this._image, uv));
        const alpha = this._alphaImage === undefined ? colour_1.RGBAColours.MAGENTA : ((interpolation === 'nearest') ?
            this._getNearestRGBA(this._alphaImage, uv) :
            this._getLinearRGBA(this._alphaImage, uv));
        return {
            r: diffuse.r,
            g: diffuse.g,
            b: diffuse.b,
            a: alpha.a,
        };
    }
    /**
     * UV is assumed to be in [0, 1] range.
     */
    _getLinearRGBA(image, uv) {
        const x = uv.u * image.width;
        const y = uv.v * image.height;
        const xLeft = Math.floor(x);
        const xRight = xLeft + 1;
        const yUp = Math.floor(y);
        const yDown = yUp + 1;
        const u = x - xLeft;
        const v = y - yUp;
        if (!(u >= 0.0 && u <= 1.0 && v >= 0.0 && v <= 1.0)) {
            return colour_1.RGBAColours.MAGENTA;
        }
        const A = Texture._sampleImage(xLeft, yUp, this._image);
        const B = Texture._sampleImage(xRight, yUp, this._image);
        const AB = colour_1.RGBAUtil.lerp(A, B, u);
        const C = Texture._sampleImage(xLeft, yDown, this._image);
        const D = Texture._sampleImage(xRight, yDown, this._image);
        const CD = colour_1.RGBAUtil.lerp(C, D, u);
        return colour_1.RGBAUtil.lerp(AB, CD, v);
    }
    /**
     * UV is assumed to be in [0, 1] range.
     */
    _getNearestRGBA(image, uv) {
        const diffuseX = Math.floor(uv.u * image.width);
        const diffuseY = Math.floor(uv.v * image.height);
        return Texture._sampleImage(diffuseX, diffuseY, image);
    }
    _sampleChannel(colour, channel) {
        switch (channel) {
            case EImageChannel.R: return colour.r;
            case EImageChannel.G: return colour.g;
            case EImageChannel.B: return colour.b;
            case EImageChannel.A: return colour.a;
        }
    }
    _useAlphaChannel() {
        (0, error_util_1.ASSERT)(this._alphaImage !== undefined);
        if (this._useAlphaChannelValue !== undefined) {
            return this._useAlphaChannelValue;
        }
        for (let i = 0; i < this._alphaImage.width; ++i) {
            for (let j = 0; j < this._alphaImage.height; ++j) {
                const value = Texture._sampleImage(i, j, this._alphaImage);
                if (value.a != 1.0) {
                    (0, log_util_1.LOG)(`Using alpha channel`);
                    this._useAlphaChannelValue = true;
                    return true;
                }
            }
        }
        (0, log_util_1.LOG)(`Using red channel`);
        this._useAlphaChannelValue = false;
        return false;
    }
    static _sampleImage(x, y, image) {
        if (image === undefined) {
            return colour_1.RGBAColours.MAGENTA;
        }
        x = (0, math_1.clamp)(x, 0, image.width - 1);
        y = (0, math_1.clamp)(y, 0, image.height - 1);
        const index = 4 * (image.width * y + x);
        const rgba = image.data.slice(index, index + 4);
        return {
            r: rgba[0] / 255,
            g: rgba[1] / 255,
            b: rgba[2] / 255,
            a: rgba[3] / 255,
        };
    }
}
exports.Texture = Texture;
class TextureConverter {
    static createPNGfromTGA(filepath) {
        // TODO Unimplemented;
        return '';
        /*
        ASSERT(fs.existsSync(filepath), '.tga does not exist');
        const parsed = path.parse(filepath);
        ASSERT(parsed.ext === '.tga');
        const data = fs.readFileSync(filepath);
        const tga = new TGA(data);
        const png = new PNG({
            width: tga.width,
            height: tga.height,
        });
        png.data = tga.pixels;
        FileUtil.mkdirIfNotExist(AppPaths.Get.gen);
        const buffer = PNG.sync.write(png);
        const newTexturePath = path.join(AppPaths.Get.gen, parsed.name + '.gen.png');
        LOGF(`Creating new generated texture of '${filepath}' at '${newTexturePath}'`);
        fs.writeFileSync(newTexturePath, buffer);
        return newTexturePath;
        */
    }
}
exports.TextureConverter = TextureConverter;
