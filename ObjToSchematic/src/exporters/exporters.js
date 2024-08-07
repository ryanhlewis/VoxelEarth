"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExporterFactory = void 0;
var indexed_json_exporter_1 = require("./indexed_json_exporter ");
var litematic_exporter_1 = require("./litematic_exporter");
var nbt_exporter_1 = require("./nbt_exporter");
var schem_exporter_1 = require("./schem_exporter");
var schematic_exporter_1 = require("./schematic_exporter");
var uncompressed_json_exporter_1 = require("./uncompressed_json_exporter");
var ExporterFactory = /** @class */ (function () {
    function ExporterFactory() {
    }
    ExporterFactory.GetExporter = function (voxeliser) {
        switch (voxeliser) {
            case 'schematic':
                return new schematic_exporter_1.Schematic();
            case 'litematic':
                return new litematic_exporter_1.Litematic();
            case 'schem':
                return new schem_exporter_1.SchemExporter();
            case 'nbt':
                return new nbt_exporter_1.NBTExporter();
            case 'uncompressed_json':
                return new uncompressed_json_exporter_1.UncompressedJSONExporter();
            case 'indexed_json':
                return new indexed_json_exporter_1.IndexedJSONExporter();
        }
    };
    return ExporterFactory;
}());
exports.ExporterFactory = ExporterFactory;
//# sourceMappingURL=exporters.js.map