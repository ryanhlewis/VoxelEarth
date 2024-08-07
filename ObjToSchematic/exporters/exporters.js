"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExporterFactory = void 0;
const indexed_json_exporter_1 = require("./indexed_json_exporter ");
const litematic_exporter_1 = require("./litematic_exporter");
const nbt_exporter_1 = require("./nbt_exporter");
const schem_exporter_1 = require("./schem_exporter");
const schematic_exporter_1 = require("./schematic_exporter");
const uncompressed_json_exporter_1 = require("./uncompressed_json_exporter");
class ExporterFactory {
    static GetExporter(voxeliser) {
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
    }
}
exports.ExporterFactory = ExporterFactory;
