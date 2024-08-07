export type TTaskID = 'Importing' | 'MeshBuffer' | 'Voxelising' | 'VoxelMeshBuffer' | 'Assigning' | 'BlockMeshBuffer' | 'Exporting';
export type TTaskHandle = {
    nextPercentage: number;
    id: TTaskID;
};
export declare class ProgressManager {
    private static _instance;
    static get Get(): ProgressManager;
    private _tasks;
    private constructor();
    /**
     * Start tracking the progress of a task.
     * @param taskId The id of the task (created here).
     */
    start(taskId: TTaskID): TTaskHandle;
    /**
     * Announce progress has been made on a task.
     * @param taskId The id of the task (created in `start`).
     * @param percentage A number between 0.0 and 1.0, inclusive.
     */
    progress(tracker: TTaskHandle, percentage: number): void;
    /**
     * Announce a task has completed.
     * @param taskId The id of the task (created in `start`).
     */
    end(tracker: TTaskHandle): void;
    clear(): void;
}
