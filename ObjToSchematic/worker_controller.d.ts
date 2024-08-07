import { TFromWorkerMessage, TToWorkerMessage } from './worker_types';
export type TWorkerJob = {
    id: string;
    payload: TToWorkerMessage;
    callback?: (payload: TFromWorkerMessage) => void;
};
export declare class WorkerController {
    private _worker?;
    private _jobQueue;
    private _jobPending;
    private _jobStartTime;
    private _timerOn;
    constructor();
    execute(payload: TToWorkerMessage): Promise<TFromWorkerMessage>;
    addJob(newJob: TWorkerJob): boolean;
    isBusy(): boolean;
    private _onWorkerMessage;
    private _tryStartNextJob;
}
