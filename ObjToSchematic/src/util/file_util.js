"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadAsZip = exports.download = void 0;
var jszip_1 = __importDefault(require("jszip"));
function download(content, filename) {
    var a = document.createElement('a'); // Create "a" element
    var blob = new Blob([content]); // Create a blob (file-like object)
    var url = URL.createObjectURL(blob); // Create an object URL from blob
    a.setAttribute('href', url); // Set "a" element link
    a.setAttribute('download', filename); // Set download filename
    a.click();
}
exports.download = download;
function downloadAsZip(zipFilename, files) {
    var zip = new jszip_1.default();
    files.forEach(function (file) {
        zip.file(file.filename, file.content);
    });
    zip.generateAsync({ type: "blob" }).then(function (content) {
        download(content, zipFilename);
    });
}
exports.downloadAsZip = downloadAsZip;
//# sourceMappingURL=file_util.js.map