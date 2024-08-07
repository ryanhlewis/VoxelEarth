import { BlockMesh } from '../block_mesh';
import { IExporter, TStructureExport } from './base_exporter';
export declare class Litematic extends IExporter {
    getFormatFilter(): {
        name: string;
        extension: string;
    };
    export(blockMesh: BlockMesh): TStructureExport;
    /**
     * Create a mapping from block names to their respecitve index in the block state palette.
     */
    private _createBlockMapping;
    /**
     * Pack the blocks into a buffer that's the dimensions of the block mesh.
     */
    private _createBlockBuffer;
    private _createBlockStates;
    private _encodeBlockBuffer;
    private _createBlockStatePalette;
    private _convertToNBT;
}
