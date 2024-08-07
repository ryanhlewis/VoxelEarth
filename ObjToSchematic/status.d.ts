import { TLocalisedString } from './localiser';
import { TMessage } from './ui/console';
/**
 * `StatusHandler` is used to track success, info, warning, and error messages.
 * There are separate singletons for the Client and Worker so when the Worker
 * has completed a Job it needs to send its status messages to the Client
 * along with its payload so that the messages can be displayed in the console.
 */
export declare class StatusHandler {
    /** Singleton accessor */
    private static _instance;
    static get Get(): StatusHandler;
    private _messages;
    private constructor();
    clear(): void;
    static success(message: TLocalisedString): void;
    static info(message: TLocalisedString): void;
    static warning(message: TLocalisedString): void;
    static error(message: TLocalisedString): void;
    static getAll(): TMessage[];
    dump(): this;
}
