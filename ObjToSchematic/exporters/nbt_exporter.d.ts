import { BlockMesh } from '../block_mesh';
import { IExporter, TStructureRegion } from './base_exporter';
export declare class NBTExporter extends IExporter {
    getFormatFilter(): {
        name: string;
        extension: string;
    };
    private _processChunk;
    export(blockMesh: BlockMesh): {
        type: "multiple";
        extension: string;
        regions: TStructureRegion[];
    };
}
