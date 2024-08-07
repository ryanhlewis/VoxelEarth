export interface IInterfaceItem {
    generateHTML: () => string;
    registerEvents: () => void;
    finalise: () => void;
}
/**
 * The base UI class from which user interactable DOM elements are built from.
 * Each `BaseComponent` can be enabled/disabled.
 */
export declare abstract class BaseComponent<T> implements IInterfaceItem {
    private _id;
    private _isEnabled;
    private _isHovered;
    private _obeyGroupEnables;
    constructor();
    /**
     * Get whether or not this UI element is interactable.
     * @deprecated Use the enabled() getter.
     */
    getEnabled(): boolean;
    /**
     * Alias of `getEnabled`
     */
    get enabled(): boolean;
    get disabled(): boolean;
    /**
     * Set whether or not this UI element is interactable.
     */
    setEnabled(isEnabled: boolean, isGroupEnable?: boolean): void;
    protected _setHovered(isHovered: boolean): void;
    get hovered(): boolean;
    /**
     * Sets whether or not this element should be enabled when the group
     * is it apart of becomes enabled. This is useful if an element should
     * only be enabled if another element has a particular value. If this is
     * false then there needs to be a some event added to manually enable this
     * element.
     */
    setShouldObeyGroupEnables(obey: boolean): this;
    /**
     * The actual HTML that represents this UI element. It is recommended to
     * give the outermost element that ID generated for this BaseComponent so
     * that `getElement()` returns all elements created here.
     */
    abstract generateHTML(): string;
    /**
     * A delegate that is called after the UI element has been added to the DOM.
     * Calls to `addEventListener` should be placed here.
     */
    abstract registerEvents(): void;
    finalise(): void;
    /**
     * Returns the actual DOM element that this BaseComponent refers to.
     * Calling this before the element is created (i.e. before `generateHTML`)
     * is called will throw an error.
     */
    protected _getElement(): T;
    /**
     * Each BaseComponent is assignd an ID that can be used a DOM element with.
     */
    protected _getId(): string;
    /**
     * A delegate that is called when the enabled status is changed.
     */
    protected abstract _onEnabledChanged(): void;
    /**
     * Called after _onEnabledChanged() and _onValueChanged()
     */
    protected _updateStyles(): void;
}
