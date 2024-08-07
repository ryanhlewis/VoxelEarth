"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadAsZip = exports.download = void 0;
const jszip_1 = require("jszip");
function download(content, filename) {
    const a = document.createElement('a'); // Create "a" element
    const blob = new Blob([content]); // Create a blob (file-like object)
    const url = URL.createObjectURL(blob); // Create an object URL from blob
    a.setAttribute('href', url); // Set "a" element link
    a.setAttribute('download', filename); // Set download filename
    a.click();
}
exports.download = download;
function downloadAsZip(zipFilename, files) {
    const zip = new jszip_1.default();
    files.forEach((file) => {
        zip.file(file.filename, file.content);
    });
    zip.generateAsync({ type: "blob" }).then(function (content) {
        download(content, zipFilename);
    });
}
exports.downloadAsZip = downloadAsZip;
