import { IImporter } from './base_importer';
export type TImporters = 'obj' | 'gltf';
export declare class ImporterFactor {
    static GetImporter(importer: TImporters): IImporter;
}
