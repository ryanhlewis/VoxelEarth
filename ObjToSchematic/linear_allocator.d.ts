export declare class LinearAllocator<T> {
    private _items;
    private _nextIndex;
    private _max;
    private _itemConstructor;
    constructor(getNewItem: () => T);
    private _add;
    reset(): void;
    get(index: number): T | undefined;
    size(): number;
    place(): T;
    max(): number;
}
