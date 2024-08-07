/**
 * Logs to console and file if logging `LOG` is enabled.
 * This should be used for verbose logs.
 * @see LOG_MAJOR
 */
export declare const LOG: (...data: any[]) => void;
export declare const LOGF: (...data: any[]) => void;
/**
 * Logs to console and file if logging `LOG_MAJOR` is enabled.
 * This is identical to `LOG` but can be enabled/disabled separately.
 * This should be used for important logs.
 * @see LOG
 */
export declare const LOG_MAJOR: (...data: any[]) => void;
/**
 * Logs a warning to the console and file if logging `LOG_WARN` is enabled.
 */
export declare const LOG_WARN: (...data: any[]) => void;
/**
 * Starts a timer.
 * @see `TIME_END` To stop the timer.
 * @param label The ID of this timer.
 */
export declare const TIME_START: (label: string) => void;
/**
 * Stops a timer and prints the time elapsed. Not logged to file.
 * @see `TIME_START` To start the timer.
 * @param label The ID of this timer.
 */
export declare const TIME_END: (label: string) => void;
/**
 * Logs an error to the console and file, always.
 */
export declare const LOG_ERROR: (...data: any[]) => void;
/**
 * Logger controls enable/disabling the logging functions above.
 */
export declare class Logger {
    private static _instance;
    static get Get(): Logger;
    private _enabledLOG;
    private _enabledLOGMAJOR;
    private _enabledLOGWARN;
    private _enabledLOGTIME;
    private _enabledLogToFile?;
    private constructor();
    /**
     * Allow `LOG` calls to be printed to the console and to the log file if setup.
     */
    enableLOG(): void;
    /**
     * Prevent `LOG` calls to be printed to the console and to the log file if setup.
     */
    disableLOG(): void;
    /**
     * Allow `LOG_MAJOR` calls to be printed to the console and to the log file if setup.
     */
    enableLOGMAJOR(): void;
    /**
     * Prevent `LOG_MAJOR` calls to be printed to the console and to the log file if setup.
     */
    disableLOGMAJOR(): void;
    /**
     * Allow `LOG_WARN` calls to be printed to the console and to the log file if setup.
     */
    enableLOGWARN(): void;
    /**
     * Prevent `LOG_WARN` calls to be printed to the console and to the log file if setup.
     */
    disableLOGWARN(): void;
    /**
     * Allow `TIME_START`/`TIME_END` calls to be printed to the console and to the log file if setup.
     */
    enableLOGTIME(): void;
    /**
     * Prevent `TIME_START`/`TIME_END` calls to be printed to the console and to the log file if setup.
     */
    disableLOGTIME(): void;
    /**
     * Prevent console log calls to logged to the log file if setup.
     */
    disableLogToFile(): void;
    /**
     * Whether or not `LOG` calls should be printed to the console and log file.
     */
    isLOGEnabled(): boolean;
    /**
     * Whether or not `LOG_MAJOR` calls should be printed to the console and log file.
     */
    isLOGMAJOREnabled(): boolean;
    /**
     * Whether or not `LOG_WARN` calls should be printed to the console and log file.
     */
    isLOGWARNEnabled(): boolean;
    /**
     * Whether or not `TIME_START`/`TIME_END` calls should be printed to the console and log file.
     */
    isLOGTIMEEnabled(): boolean;
}
