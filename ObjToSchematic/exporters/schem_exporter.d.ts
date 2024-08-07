import { BlockMesh } from '../block_mesh';
import { IExporter, TStructureExport } from './base_exporter';
export declare class SchemExporter extends IExporter {
    private static SCHEMA_VERSION;
    getFormatFilter(): {
        name: string;
        extension: string;
    };
    export(blockMesh: BlockMesh): TStructureExport;
    private static _getBufferIndex;
}
