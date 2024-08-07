export declare class AppAnalytics {
    private _ready;
    private static _instance;
    static get Get(): AppAnalytics;
    private constructor();
    static Init(): void;
    static Event(id: string, attributes?: any): void;
}
