export declare namespace PathUtil {
    function join(...paths: string[]): any;
}
export declare class AppPaths {
    private static _instance;
    static get Get(): AppPaths;
    private _base;
    private constructor();
    setBaseDir(dir: string): void;
    get base(): string;
    get resources(): any;
    get tools(): any;
    get tests(): any;
    get testData(): any;
    get atlases(): any;
    get palettes(): any;
    get static(): any;
    get shaders(): any;
    get logs(): any;
    /**
     * The `gen` directory stores any data generated at runtime.
     * This can safely be deleted when the program is not running and will
     * be empted upon each startup.
     */
    get gen(): any;
}
