import { RGBA } from './colour';
import { UV } from './util';
import { TTexelExtension, TTexelInterpolation } from './util/type_util';
export declare enum TextureFormat {
    PNG = 0,
    JPEG = 1
}
export declare enum TextureFiltering {
    Linear = 0,
    Nearest = 1
}
export declare enum EImageChannel {
    R = 0,
    G = 1,
    B = 2,
    A = 3,
    MAX = 4
}
export type TImageFiletype = 'png' | 'jpg';
export type TImageRawWrap = {
    raw: string;
    filetype: TImageFiletype;
};
export type TTransparencyTypes = 'None' | 'UseDiffuseMapAlphaChannel' | 'UseAlphaValue' | 'UseAlphaMap';
export type TTransparencyOptions = {
    type: 'None';
} | {
    type: 'UseDiffuseMapAlphaChannel';
} | {
    type: 'UseAlphaValue';
    alpha: number;
} | {
    type: 'UseAlphaMap';
    alpha?: TImageRawWrap;
    channel: EImageChannel;
};
export declare class Texture {
    private _image?;
    private _alphaImage?;
    constructor(params: {
        diffuse?: TImageRawWrap;
        transparency: TTransparencyOptions;
    });
    private _readRawData;
    private _correctTexcoord;
    /**
     * UV can be in any range and is not limited to [0, 1]
     */
    getRGBA(inUV: UV, interpolation: TTexelInterpolation, extension: TTexelExtension): RGBA;
    /**
     * UV is assumed to be in [0, 1] range.
     */
    private _getLinearRGBA;
    /**
     * UV is assumed to be in [0, 1] range.
     */
    private _getNearestRGBA;
    private _sampleChannel;
    _useAlphaChannelValue?: boolean;
    _useAlphaChannel(): boolean;
    private static _sampleImage;
}
export declare class TextureConverter {
    static createPNGfromTGA(filepath: string): string;
}
