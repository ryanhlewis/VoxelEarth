"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LOG_ERROR = exports.TIME_END = exports.TIME_START = exports.LOG_WARN = exports.LOG_MAJOR = exports.LOGF = exports.LOG = void 0;
/**
 * Logs to console and file if logging `LOG` is enabled.
 * This should be used for verbose logs.
 * @see LOG_MAJOR
 */
var LOG = function () {
    var data = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        data[_i] = arguments[_i];
    }
    if (Logger.Get.isLOGEnabled()) {
        // eslint-disable-next-line no-console
        console.log.apply(console, data);
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
var LOG_MAJOR = function () {
    var data = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        data[_i] = arguments[_i];
    }
    if (Logger.Get.isLOGMAJOREnabled()) {
        // eslint-disable-next-line no-console
        console.log.apply(console, data);
    }
};
exports.LOG_MAJOR = LOG_MAJOR;
/**
 * Logs a warning to the console and file if logging `LOG_WARN` is enabled.
 */
var LOG_WARN = function () {
    var data = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        data[_i] = arguments[_i];
    }
    if (Logger.Get.isLOGWARNEnabled()) {
        // eslint-disable-next-line no-console
        console.warn.apply(console, data);
    }
};
exports.LOG_WARN = LOG_WARN;
/**
 * Starts a timer.
 * @see `TIME_END` To stop the timer.
 * @param label The ID of this timer.
 */
var TIME_START = function (label) {
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
var TIME_END = function (label) {
    if (Logger.Get.isLOGTIMEEnabled()) {
        // eslint-disable-next-line no-console
        console.timeEnd(label);
    }
};
exports.TIME_END = TIME_END;
/**
 * Logs an error to the console and file, always.
 */
var LOG_ERROR = function () {
    var data = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        data[_i] = arguments[_i];
    }
    // eslint-disable-next-line no-console
    console.error.apply(console, data);
};
exports.LOG_ERROR = LOG_ERROR;
/**
 * Logger controls enable/disabling the logging functions above.
 */
var Logger = /** @class */ (function () {
    function Logger() {
        this._enabledLOG = false;
        this._enabledLOGMAJOR = false;
        this._enabledLOGWARN = false;
        this._enabledLOGTIME = false;
    }
    Object.defineProperty(Logger, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Allow `LOG` calls to be printed to the console and to the log file if setup.
     */
    Logger.prototype.enableLOG = function () {
        this._enabledLOG = true;
    };
    /**
     * Prevent `LOG` calls to be printed to the console and to the log file if setup.
     */
    Logger.prototype.disableLOG = function () {
        this._enabledLOG = false;
    };
    /**
     * Allow `LOG_MAJOR` calls to be printed to the console and to the log file if setup.
     */
    Logger.prototype.enableLOGMAJOR = function () {
        this._enabledLOGMAJOR = true;
    };
    /**
     * Prevent `LOG_MAJOR` calls to be printed to the console and to the log file if setup.
     */
    Logger.prototype.disableLOGMAJOR = function () {
        this._enabledLOGMAJOR = false;
    };
    /**
     * Allow `LOG_WARN` calls to be printed to the console and to the log file if setup.
     */
    Logger.prototype.enableLOGWARN = function () {
        this._enabledLOGWARN = true;
    };
    /**
     * Prevent `LOG_WARN` calls to be printed to the console and to the log file if setup.
     */
    Logger.prototype.disableLOGWARN = function () {
        this._enabledLOGWARN = false;
    };
    /**
     * Allow `TIME_START`/`TIME_END` calls to be printed to the console and to the log file if setup.
     */
    Logger.prototype.enableLOGTIME = function () {
        this._enabledLOGTIME = true;
    };
    /**
     * Prevent `TIME_START`/`TIME_END` calls to be printed to the console and to the log file if setup.
     */
    Logger.prototype.disableLOGTIME = function () {
        this._enabledLOGTIME = false;
    };
    /**
     * Prevent console log calls to logged to the log file if setup.
     */
    Logger.prototype.disableLogToFile = function () {
        this._enabledLogToFile = false;
    };
    /**
     * Whether or not `LOG` calls should be printed to the console and log file.
     */
    Logger.prototype.isLOGEnabled = function () {
        return this._enabledLOG;
    };
    /**
     * Whether or not `LOG_MAJOR` calls should be printed to the console and log file.
     */
    Logger.prototype.isLOGMAJOREnabled = function () {
        return this._enabledLOGMAJOR;
    };
    /**
     * Whether or not `LOG_WARN` calls should be printed to the console and log file.
     */
    Logger.prototype.isLOGWARNEnabled = function () {
        return this._enabledLOGWARN;
    };
    /**
     * Whether or not `TIME_START`/`TIME_END` calls should be printed to the console and log file.
     */
    Logger.prototype.isLOGTIMEEnabled = function () {
        return this._enabledLOGTIME;
    };
    return Logger;
}());
exports.Logger = Logger;
