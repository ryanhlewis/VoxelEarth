import { RGBA } from '../../colour';
import { ConfigComponent } from './config';
export declare class ColourComponent extends ConfigComponent<RGBA, HTMLInputElement> {
    constructor(colour: RGBA);
    protected _generateInnerHTML(): string;
    registerEvents(): void;
    protected _onEnabledChanged(): void;
}
