import { IExporter } from './base_exporter';
export type TExporters = 'schematic' | 'litematic' | 'schem' | 'nbt' | 'uncompressed_json' | 'indexed_json';
export declare class ExporterFactory {
    static GetExporter(voxeliser: TExporters): IExporter;
}
