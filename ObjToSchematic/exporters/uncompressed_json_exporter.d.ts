import { BlockMesh } from '../block_mesh';
import { IExporter, TStructureExport } from './base_exporter';
export declare class UncompressedJSONExporter extends IExporter {
    getFormatFilter(): {
        name: string;
        extension: string;
    };
    export(blockMesh: BlockMesh): TStructureExport;
}
