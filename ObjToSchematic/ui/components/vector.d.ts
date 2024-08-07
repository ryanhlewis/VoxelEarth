import { TAxis } from '../../util/type_util';
import { Vector3 } from '../../vector';
import { ConfigComponent } from './config';
export declare class VectorComponent extends ConfigComponent<Vector3, HTMLDivElement> {
    private _mouseover;
    private _showY;
    private _onMouseEnterExit?;
    constructor();
    /**
     * Set whether or not the Y axis has a UI element
     */
    setShowY(showY: boolean): this;
    protected _generateInnerHTML(): string;
    private _getKeyId;
    private _getValueId;
    private _registerAxis;
    registerEvents(): void;
    setOnMouseEnterExit(delegate: (state: 'enter' | 'exit', component: TAxis) => void): this;
    private _updateValue;
    protected _updateStyles(): void;
    protected _onEnabledChanged(): void;
    protected _onValueChanged(): void;
}
