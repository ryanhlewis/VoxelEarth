import { TBrand } from './util/type_util';
export type RGBA = {
    r: number;
    g: number;
    b: number;
    a: number;
};
export type RGBA_255 = TBrand<RGBA, '255'>;
export declare namespace RGBAUtil {
    function toString(a: RGBA): string;
    function randomPretty(): RGBA;
    function random(): RGBA;
    function toHexString(a: RGBA): string;
    function fromHexString(str: string): {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    function toUint8String(a: RGBA): string;
    function toRGBA255(c: RGBA): RGBA_255;
    function fromRGBA255(c: RGBA_255): RGBA;
    function add(a: RGBA, b: RGBA): void;
    function lerp(a: RGBA, b: RGBA, alpha: number): {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    /**
     * Note this is a very naive approach to averaging a colour
     */
    function average(...colours: RGBA[]): {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    function squaredDistance(a: RGBA, b: RGBA): number;
    function copy(a: RGBA): RGBA;
    function copy255(a: RGBA_255): RGBA_255;
    function toArray(a: RGBA): number[];
    function bin(col: RGBA, resolution: TColourAccuracy): RGBA_255;
    /**
     * Encodes a colour as a single number.
     * Note this will bin colours together.
     * @param col The colour to hash.
     * @param resolution An uint8, the larger the more accurate the hash.
     */
    function hash(col: RGBA, resolution: TColourAccuracy): number;
    function hash255(col: RGBA_255): number;
    type TColourAccuracy = number;
}
export declare namespace RGBAColours {
    const RED: RGBA;
    const GREEN: RGBA;
    const BLUE: RGBA;
    const YELLOW: RGBA;
    const CYAN: RGBA;
    const MAGENTA: RGBA;
    const WHITE: RGBA;
    const BLACK: RGBA;
}
