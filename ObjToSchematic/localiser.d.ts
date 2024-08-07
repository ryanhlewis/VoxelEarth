import { TTranslationMap } from '../loc/base';
import { TBrand } from './util/type_util';
export type DeepKeys<T> = T extends object ? {
    [K in keyof T]-?: `${K & string}` | Concat<K & string, DeepKeys<T[K]>>;
}[keyof T] : '';
export type DeepLeafKeys<T> = T extends object ? {
    [K in keyof T]-?: Concat<K & string, DeepKeys<T[K]>>;
}[keyof T] : '';
export type Concat<K extends string, P extends string> = `${K}${'' extends P ? '' : '.'}${P}`;
export type TLocalisedString = TBrand<string, 'loc'>;
export type TLocalisedKey = DeepLeafKeys<TTranslationMap>;
export declare class Localiser {
    private static _instance;
    static get Get(): Localiser;
    init(): Promise<void>;
    changeLanguage(languageKey: string): Promise<void>;
    translate(p: DeepLeafKeys<TTranslationMap>, options?: any): TLocalisedString;
    getCurrentLanguage(): string;
}
export declare const LOC: (p: DeepLeafKeys<TTranslationMap>, options?: any) => TLocalisedString;
