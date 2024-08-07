import { Mesh } from '../mesh';
export declare abstract class IImporter {
    abstract import(file: File): Promise<Mesh>;
}
