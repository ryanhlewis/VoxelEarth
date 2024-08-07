import '../styles.css';
import { EAction } from './util';
export declare class AppContext {
    private static _instance;
    static get Get(): AppContext;
    private _workerController;
    private _lastAction?;
    minConstraint?: {
        x: number;
        z: number;
    };
    maxConstraint?: {
        x: number;
        z: number;
    };
    private _materialManager;
    private _loadedFilename;
    private constructor();
    static init(): Promise<void>;
    getLastAction(): EAction;
    private _import;
    private _materials;
    private _voxelise;
    private _assign;
    private _export;
    /**
     * Check if the result from the worker is an error message
     * if so, handle it and return true, otherwise false.
     */
    private _handleErrors;
    do(action: EAction): Promise<void>;
    private _addWorkerMessagesToConsole;
    private _executeAction;
    static draw(): void;
}
