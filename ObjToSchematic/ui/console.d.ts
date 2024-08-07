import { TLocalisedString } from '../localiser';
export type TMessage = {
    text: TLocalisedString;
    type: 'success' | 'info' | 'warning' | 'error';
};
export declare class AppConsole {
    private static _instance;
    static get Get(): AppConsole;
    private _built;
    private _messages;
    private constructor();
    build(): void;
    addLast(): void;
    private _getMessageHTML;
    static add(message: TMessage): void;
    static success(message: TLocalisedString): void;
    static info(message: TLocalisedString): void;
    static warning(message: TLocalisedString): void;
    static error(message: TLocalisedString): void;
    private _scrollToBottom;
}
