import { TFromWorkerMessage, TToWorkerMessage } from './worker_types';
export declare function doWork(message: TToWorkerMessage): Promise<TFromWorkerMessage>;
