import { Palette } from '../../palette';
import { ConfigComponent } from './config';
export declare class PaletteComponent extends ConfigComponent<Palette, HTMLDivElement> {
    private _checkboxes;
    private _palette;
    private _selectAll;
    private _deselectAll;
    private _importFrom;
    private _exportTo;
    constructor();
    private _onCountSelectedChanged;
    private _onReadPaletteFile;
    protected _generateInnerHTML(): string;
    protected _onValueChanged(): void;
    protected _onEnabledChanged(): void;
    registerEvents(): void;
    finalise(): void;
    private _onSearchBoxChanged;
    protected _updateStyles(): void;
    refresh(): void;
}
