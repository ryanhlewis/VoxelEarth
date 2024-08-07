import { TTranslationMap } from '../../../loc/base';
import { DeepLeafKeys } from '../../localiser';
import { ConfigComponent } from './config';
export declare class PlaceholderComponent extends ConfigComponent<undefined, HTMLDivElement> {
    private placeholderLocKey?;
    private _placeholderlabel?;
    constructor();
    setPlaceholderText<P extends DeepLeafKeys<TTranslationMap>>(p: P): this;
    refresh(): void;
    generateHTML(): string;
    protected _generateInnerHTML(): string;
    registerEvents(): void;
}
