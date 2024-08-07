"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LOG_ERROR = exports.TIME_END = exports.TIME_START = exports.LOG_WARN = exports.LOG_MAJOR = exports.LOGF = exports.LOG = void 0;
/**
 * Logs to console and file if logging `LOG` is enabled.
 * This should be used for verbose logs.
 * @see LOG_MAJOR
 */
const LOG = (...data) => {
    if (Logger.Get.isLOGEnabled()) {
        // eslint-disable-next-line no-console
        console.log(...data);
    }
};
exports.LOG = LOG;
exports.LOGF = exports.LOG;
/**
 * Logs to console and file if logging `LOG_MAJOR` is enabled.
 * This is identical to `LOG` but can be enabled/disabled separately.
 * This should be used for important logs.
 * @see LOG
 */
const LOG_MAJOR = (...data) => {
    if (Logger.Get.isLOGMAJOREnabled()) {
        // eslint-disable-next-line no-console
        console.log(...data);
    }
};
exports.LOG_MAJOR = LOG_MAJOR;
/**
 * Logs a warning to the console and file if logging `LOG_WARN` is enabled.
 */
const LOG_WARN = (...data) => {
    if (Logger.Get.isLOGWARNEnabled()) {
        // eslint-disable-next-line no-console
        console.warn(...data);
    }
};
exports.LOG_WARN = LOG_WARN;
/**
 * Starts a timer.
 * @see `TIME_END` To stop the timer.
 * @param label The ID of this timer.
 */
const TIME_START = (label) => {
    if (Logger.Get.isLOGTIMEEnabled()) {
        // eslint-disable-next-line no-console
        console.time(label);
    }
};
exports.TIME_START = TIME_START;
/**
 * Stops a timer and prints the time elapsed. Not logged to file.
 * @see `TIME_START` To start the timer.
 * @param label The ID of this timer.
 */
const TIME_END = (label) => {
    if (Logger.Get.isLOGTIMEEnabled()) {
        // eslint-disable-next-line no-console
        console.timeEnd(label);
    }
};
exports.TIME_END = TIME_END;
/**
 * Logs an error to the console and file, always.
 */
const LOG_ERROR = (...data) => {
    // eslint-disable-next-line no-console
    console.error(...data);
};
exports.LOG_ERROR = LOG_ERROR;
/**
 * Logger controls enable/disabling the logging functions above.
 */
class Logger {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        this._enabledLOG = false;
        this._enabledLOGMAJOR = false;
        this._enabledLOGWARN = false;
        this._enabledLOGTIME = false;
    }
    /**
     * Allow `LOG` calls to be printed to the console and to the log file if setup.
     */
    enableLOG() {
        this._enabledLOG = true;
    }
    /**
     * Prevent `LOG` calls to be printed to the console and to the log file if setup.
     */
    disableLOG() {
        this._enabledLOG = false;
    }
    /**
     * Allow `LOG_MAJOR` calls to be printed to the console and to the log file if setup.
     */
    enableLOGMAJOR() {
        this._enabledLOGMAJOR = true;
    }
    /**
     * Prevent `LOG_MAJOR` calls to be printed to the console and to the log file if setup.
     */
    disableLOGMAJOR() {
        this._enabledLOGMAJOR = false;
    }
    /**
     * Allow `LOG_WARN` calls to be printed to the console and to the log file if setup.
     */
    enableLOGWARN() {
        this._enabledLOGWARN = true;
    }
    /**
     * Prevent `LOG_WARN` calls to be printed to the console and to the log file if setup.
     */
    disableLOGWARN() {
        this._enabledLOGWARN = false;
    }
    /**
     * Allow `TIME_START`/`TIME_END` calls to be printed to the console and to the log file if setup.
     */
    enableLOGTIME() {
        this._enabledLOGTIME = true;
    }
    /**
     * Prevent `TIME_START`/`TIME_END` calls to be printed to the console and to the log file if setup.
     */
    disableLOGTIME() {
        this._enabledLOGTIME = false;
    }
    /**
     * Prevent console log calls to logged to the log file if setup.
     */
    disableLogToFile() {
        this._enabledLogToFile = false;
    }
    /**
     * Whether or not `LOG` calls should be printed to the console and log file.
     */
    isLOGEnabled() {
        return this._enabledLOG;
    }
    /**
     * Whether or not `LOG_MAJOR` calls should be printed to the console and log file.
     */
    isLOGMAJOREnabled() {
        return this._enabledLOGMAJOR;
    }
    /**
     * Whether or not `LOG_WARN` calls should be printed to the console and log file.
     */
    isLOGWARNEnabled() {
        return this._enabledLOGWARN;
    }
    /**
     * Whether or not `TIME_START`/`TIME_END` calls should be printed to the console and log file.
     */
    isLOGTIMEEnabled() {
        return this._enabledLOGTIME;
    }
}
exports.Logger = Logger;
