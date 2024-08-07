import { Mesh } from '../mesh';
import { IImporter } from './base_importer';
export declare class ObjImporter extends IImporter {
    private _vertices;
    private _normals;
    private _uvs;
    private _tris;
    private _currentMaterialName;
    private _objParsers;
    import(file: File): Promise<Mesh>;
    parseOBJLine(line: string): void;
}
