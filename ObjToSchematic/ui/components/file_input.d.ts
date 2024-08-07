import { ConfigComponent } from './config';
export declare class FileComponent extends ConfigComponent<File, HTMLDivElement> {
    private _loadedFilePath;
    constructor();
    protected _generateInnerHTML(): string;
    registerEvents(): void;
    protected _onValueChanged(): void;
    protected _onEnabledChanged(): void;
    protected _updateStyles(): void;
    refresh(): void;
}
