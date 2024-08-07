"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinearAllocator = void 0;
var LinearAllocator = /** @class */ (function () {
    function LinearAllocator(getNewItem) {
        this._items = new Array();
        this._nextIndex = 0;
        this._max = 0;
        this._itemConstructor = getNewItem;
    }
    LinearAllocator.prototype._add = function (item) {
        this._items[this._nextIndex] = item;
        ++this._nextIndex;
        this._max = Math.max(this._max, this._nextIndex);
    };
    LinearAllocator.prototype.reset = function () {
        this._nextIndex = 0;
    };
    LinearAllocator.prototype.get = function (index) {
        return this._items[index];
    };
    LinearAllocator.prototype.size = function () {
        return this._nextIndex;
    };
    LinearAllocator.prototype.place = function () {
        if (this._nextIndex >= this._max) {
            //console.log('Adding new item at index', this._nextIndex);
            var newItem = this._itemConstructor();
            this._add(newItem);
            return newItem;
        }
        else {
            ++this._nextIndex;
            //console.log('Returning item at index', this._nextIndex - 1);
            return this._items[this._nextIndex - 1];
        }
    };
    LinearAllocator.prototype.max = function () {
        return this._max;
    };
    return LinearAllocator;
}());
exports.LinearAllocator = LinearAllocator;
