import { Mesh } from '../mesh';
import { IImporter } from './base_importer';
export declare class GltfLoader extends IImporter {
    import(file: File): Promise<Mesh>;
    private _handleGLTF;
}
