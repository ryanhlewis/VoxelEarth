"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHeadless = void 0;
var status_1 = require("../src/status");
var log_util_1 = require("../src/util/log_util");
var worker_client_1 = require("../src/worker_client");
var convertToGLB_1 = require("../src/convertToGLB");
async function runHeadless(headlessConfig) {
    if (headlessConfig.debug.showLogs) {
        log_util_1.Logger.Get.enableLOGMAJOR();
    }
    if (headlessConfig.debug.showWarnings) {
        log_util_1.Logger.Get.enableLOGWARN();
    }
    if (headlessConfig.debug.showTimings) {
        log_util_1.Logger.Get.enableLOGTIME();
    }
    var worker = worker_client_1.WorkerClient.Get;
    // {
    //     (0, log_util_1.TIME_START)('[TIMER] Importer');
    //     (0, log_util_1.LOG_MAJOR)('\nImporting...');
    //     worker.import(headlessConfig.import);
    //     status_1.StatusHandler.Get.dump().clear();
    //     (0, log_util_1.TIME_END)('[TIMER] Importer');
    // }
    // {
    //     (0, log_util_1.TIME_START)('[TIMER] Voxeliser');
    //     (0, log_util_1.LOG_MAJOR)('\nVoxelising...');
    //     worker.voxelise(headlessConfig.voxelise);
    //     var voxels = worker.voxelise(headlessConfig.voxelise).voxels.getVoxels();
    //     status_1.StatusHandler.Get.dump().clear();
    //     (0, log_util_1.TIME_END)('[TIMER] Voxeliser');
    // }
    // (async () => {
        (0, log_util_1.TIME_START)('[TIMER] Importer');
        (0, log_util_1.LOG_MAJOR)('\nImporting...');
        await worker.import(headlessConfig.import);
        status_1.StatusHandler.Get.dump().clear();
        (0, log_util_1.TIME_END)('[TIMER] Importer');
      
        (0, log_util_1.TIME_START)('[TIMER] Voxeliser');
        (0, log_util_1.LOG_MAJOR)('\nVoxelising...');
        await worker.voxelise(headlessConfig.voxelise);
        var voxels = worker.voxelise(headlessConfig.voxelise).voxels.getVoxels();
        status_1.StatusHandler.Get.dump().clear();
        (0, log_util_1.TIME_END)('[TIMER] Voxeliser');
        // console.log('voxels');
        // console.log(voxels);
        //(0, convertToGLB_1.convertVoxelMeshToGLB)(this._loadedVoxelMesh.getVoxels());
        var newmesh = convertToGLB_1.convertVoxelMeshToGLB(voxels);
        console.log('newmesh');
        
        await newmesh 
        return newmesh;
    // })();
    // return;
    // return voxels;
    {
        (0, log_util_1.TIME_START)('[TIMER] Assigner');
        (0, log_util_1.LOG_MAJOR)('\nAssigning...');
        worker.assign(headlessConfig.assign);
        status_1.StatusHandler.Get.dump().clear();
        (0, log_util_1.TIME_END)('[TIMER] Assigner');
    }
    {
        (0, log_util_1.TIME_START)('[TIMER] Exporter');
        (0, log_util_1.LOG_MAJOR)('\nExporting...');
        /**
         * The OBJExporter is unique in that it uses the actual render buffer used by WebGL
         * to create its data, in headless mode this render buffer is not created so we must
         * generate it manually
         */
        {
            var result = void 0;
            do {
                result = worker.renderChunkedVoxelMesh({
                    enableAmbientOcclusion: headlessConfig.voxelise.enableAmbientOcclusion,
                    desiredHeight: headlessConfig.voxelise.size,
                });
            } while (result.moreVoxelsToBuffer);
        }
        worker.export(headlessConfig.export);
        status_1.StatusHandler.Get.dump().clear();
        (0, log_util_1.TIME_END)('[TIMER] Exporter');
    }
}
exports.runHeadless = runHeadless;
module.exports = {
    runHeadless: runHeadless,
};
