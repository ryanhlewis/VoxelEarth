import { TLocalisedString } from '../localiser';
export declare class AppError extends Error {
    constructor(msg: TLocalisedString);
}
export declare function ASSERT(condition: any, errorMessage?: string): asserts condition;
