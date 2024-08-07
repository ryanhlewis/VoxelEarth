import { BaseComponent } from './base';
import { TLocalisedKey } from '../../localiser';
export type TToolbarBooleanProperty = 'enabled' | 'active';
export type TToolbarItemParams = {
    id: string;
    iconSVG: string;
};
export declare class ToolbarItemComponent extends BaseComponent<HTMLDivElement> {
    private _iconSVG;
    private _label;
    private _onClick?;
    private _isActive;
    private _grow;
    private _tooltipLocKey;
    constructor(params: TToolbarItemParams);
    setGrow(): this;
    updateTranslation(): void;
    setActive(isActive: boolean): void;
    setLabel(label: string): this;
    tick(): void;
    protected _onEnabledChanged(): void;
    private _isActiveDelegate?;
    isActive(delegate: () => boolean): this;
    private _isEnabledDelegate?;
    isEnabled(delegate: () => boolean): this;
    onClick(delegate: () => void): this;
    setTooltip(text: TLocalisedKey): this;
    generateHTML(): string;
    registerEvents(): void;
    finalise(): void;
    private _getSVGElement;
    protected _updateStyles(): void;
}
