import { BaseComponent } from './base';
export declare class HeaderComponent extends BaseComponent<HTMLDivElement> {
    private static _instance;
    static get Get(): HeaderComponent;
    private _githubButton;
    private _bugButton;
    private _discordButton;
    private _kofiButton;
    private constructor();
    protected _onEnabledChanged(): void;
    generateHTML(): string;
    refresh(): void;
    registerEvents(): void;
    finalise(): void;
}
