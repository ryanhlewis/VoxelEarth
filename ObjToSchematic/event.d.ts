import { AppContext } from './app_context';
export declare enum EAppEvent {
    onTaskStart = 0,
    onTaskProgress = 1,
    onTaskEnd = 2,
    onComboBoxChanged = 3,
    onLanguageChanged = 4
}
export declare class EventManager {
    private _eventsToListeners;
    private _appContext?;
    private static _instance;
    static get Get(): EventManager;
    private constructor();
    bindToContext(context: AppContext): void;
    init(): void;
    add(event: EAppEvent, delegate: (...args: any[]) => void): void;
    broadcast(event: EAppEvent, ...payload: any): void;
}
