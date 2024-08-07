"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinearAllocator = void 0;
class LinearAllocator {
    constructor(getNewItem) {
        this._items = new Array();
        this._nextIndex = 0;
        this._max = 0;
        this._itemConstructor = getNewItem;
    }
    _add(item) {
        this._items[this._nextIndex] = item;
        ++this._nextIndex;
        this._max = Math.max(this._max, this._nextIndex);
    }
    reset() {
        this._nextIndex = 0;
    }
    get(index) {
        return this._items[index];
    }
    size() {
        return this._nextIndex;
    }
    place() {
        if (this._nextIndex >= this._max) {
            //console.log('Adding new item at index', this._nextIndex);
            const newItem = this._itemConstructor();
            this._add(newItem);
            return newItem;
        }
        else {
            ++this._nextIndex;
            //console.log('Returning item at index', this._nextIndex - 1);
            return this._items[this._nextIndex - 1];
        }
    }
    max() {
        return this._max;
    }
}
exports.LinearAllocator = LinearAllocator;
