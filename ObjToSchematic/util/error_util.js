"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSERT = exports.AppError = void 0;
class AppError extends Error {
    constructor(msg) {
        super(msg);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
function ASSERT(condition, errorMessage = 'Assertion Failed') {
    if (!condition) {
        Error(errorMessage);
        throw Error(errorMessage);
    }
}
exports.ASSERT = ASSERT;
