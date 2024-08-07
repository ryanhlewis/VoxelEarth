"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImporterFactor = void 0;
var error_util_1 = require("../util/error_util");
var gltf_loader_1 = require("./gltf_loader");
var obj_importer_1 = require("./obj_importer");
var ImporterFactor = /** @class */ (function () {
    function ImporterFactor() {
    }
    ImporterFactor.GetImporter = function (importer) {
        switch (importer) {
            case 'obj':
                return new obj_importer_1.ObjImporter();
            case 'gltf':
                return new gltf_loader_1.GltfLoader();
            default:
                (0, error_util_1.ASSERT)(false);
        }
    };
    return ImporterFactor;
}());
exports.ImporterFactor = ImporterFactor;
