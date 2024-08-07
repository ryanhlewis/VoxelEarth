"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImporterFactor = void 0;
const error_util_1 = require("../util/error_util");
const gltf_loader_1 = require("./gltf_loader");
const obj_importer_1 = require("./obj_importer");
class ImporterFactor {
    static GetImporter(importer) {
        switch (importer) {
            case 'obj':
                return new obj_importer_1.ObjImporter();
            case 'gltf':
                return new gltf_loader_1.GltfLoader();
            default:
                (0, error_util_1.ASSERT)(false);
        }
    }
}
exports.ImporterFactor = ImporterFactor;
