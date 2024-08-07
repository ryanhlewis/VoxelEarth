"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertVoxelMeshToGLB = void 0;
var THREE = require("three");
const gltf = require("gltf-js-utils");
const { exportGLTF, exportGLB } = require("gltf-js-utils");
const { glTFAssetFromTHREE } = require("./gltf-js-utils-three-local");
// import * as THREE from 'three';
//import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// var GLTFExporter_js_1 = require("three/examples/jsm/exporters/GLTFExporter.js");
// const GLTFExporter_js_1 = await import("three/examples/jsm/exporters/GLTFExporter.js");
//import("three/examples/jsm/exporters/GLTFExporter.js").then(GLTFExporter_js_1 => {
    // Your code that uses GLTFExporter_js_1

  
var util_1 = require("util");
function convertVoxelMeshToGLB(voxels) {
    return new Promise(async function (resolve, reject) {
        // Inside an async function
        const GLTFExporter = await import('three/examples/jsm/exporters/GLTFExporter.js');

        console.log('Converting to GLB...');
        const inverseRotation = { x: 0, y: 10, z: -40 };

        var voxelSize = 1; // You can adjust the size of the voxel
        // Initialize positions and colors arrays with proper typing
        var positions = [];
        var colors = [];
        // Process voxels
        voxels.forEach(function (voxel) {
            var position = voxel.position, colour = voxel.colour;
            var halfVoxelSize = voxelSize / 2;
            // Define vertices of the cube
            var vertices = [
                [-halfVoxelSize, -halfVoxelSize, -halfVoxelSize],
                [halfVoxelSize, -halfVoxelSize, -halfVoxelSize],
                [halfVoxelSize, halfVoxelSize, -halfVoxelSize],
                [-halfVoxelSize, halfVoxelSize, -halfVoxelSize],
                [-halfVoxelSize, -halfVoxelSize, halfVoxelSize],
                [halfVoxelSize, -halfVoxelSize, halfVoxelSize],
                [halfVoxelSize, halfVoxelSize, halfVoxelSize],
                [-halfVoxelSize, halfVoxelSize, halfVoxelSize],
            ];
            // Define the faces (triangles) of the cube using indices of vertices
            var faces = [
                // Front
                [0, 1, 2],
                [0, 2, 3],
                // Right
                [1, 5, 6],
                [1, 6, 2],
                // Back
                [5, 4, 7],
                [5, 7, 6],
                // Left
                [4, 0, 3],
                [4, 3, 7],
                // Top
                [3, 2, 6],
                [3, 6, 7],
                // Bottom
                [4, 5, 1],
                [4, 1, 0],
            ];
            // Add vertices and faces to the geometry
            // for (var _i = 0, faces_1 = faces; _i < faces_1.length; _i++) {
            //     var face = faces_1[_i];
            //     for (var _a = 0, face_1 = face; _a < face_1.length; _a++) {
            //         var vertexIdx = face_1[_a];
            //         var vertex = vertices[vertexIdx];
            //         positions.push(vertex[0] + position.x * voxelSize, vertex[1] + position.y * voxelSize, vertex[2] + position.z * voxelSize);
            //     }
            // }



            // Utility function to convert degrees to radians
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Function to apply inverse rotation to a point
function applyInverseRotation(x, y, z) {
    // Inverse rotation angles in degrees (specify your angles here)
    const pitch = 10; // Inverse of original -10
    const roll = 0; // No change needed if original rotation was 0
    const yaw = -40; // Inverse of original 40

    // Convert angles from degrees to radians
    const pitchRad = degreesToRadians(pitch);
    const rollRad = degreesToRadians(roll);
    const yawRad = degreesToRadians(yaw);

    // Rotation matrices around the Y (pitch), X (roll), and Z (yaw) axes
    const cosa = Math.cos(yawRad);
    const sina = Math.sin(yawRad);
    const cosb = Math.cos(pitchRad);
    const sinb = Math.sin(pitchRad);
    const cosc = Math.cos(rollRad);
    const sinc = Math.sin(rollRad);

    // Combined rotation matrix components
    const Axx = cosa*cosb;
    const Axy = cosa*sinb*sinc - sina*cosc;
    const Axz = cosa*sinb*cosc + sina*sinc;
    const Ayx = sina*cosb;
    const Ayy = sina*sinb*sinc + cosa*cosc;
    const Ayz = sina*sinb*cosc - cosa*sinc;
    const Azx = -sinb;
    const Azy = cosb*sinc;
    const Azz = cosb*cosc;

    // Apply rotation to the point
    const px = x;
    const py = y;
    const pz = z;
    x = Axx * px + Axy * py + Axz * pz;
    y = Ayx * px + Ayy * py + Ayz * pz;
    z = Azx * px + Azy * py + Azz * pz;

    return { x, y, z };
}

// Adjusted snippet with inverse rotation applied
// for (var _i = 0, faces_1 = faces; _i < faces_1.length; _i++) {
//     var face = faces_1[_i];
//     for (var j = face.length - 1; j >= 0; j--) {
//         var vertexIdx = face[j];
//         var vertex = vertices[vertexIdx];
//         // Apply inverse rotation to each vertex based on its position
//         var rotatedVertex = applyInverseRotation(
//             vertex[0] + position.x * voxelSize,
//             vertex[1] + position.y * voxelSize,
//             vertex[2] + position.z * voxelSize
//         );
//         // Push the rotated vertex positions
//         positions.push(rotatedVertex.x, rotatedVertex.y, rotatedVertex.z);
//     }
// }



            for (var _i = 0, faces_1 = faces; _i < faces_1.length; _i++) {
                var face = faces_1[_i];
                for (var j = face.length - 1; j >= 0; j--) {  // Notice the change here
                    var vertexIdx = face[j];
                    var vertex = vertices[vertexIdx];
                    positions.push(vertex[0] + position.x * voxelSize, vertex[1] + position.y * voxelSize, vertex[2] + position.z * voxelSize);
                }
            }            
            
            // Function to convert sRGB to Linear space
            function sRGBToLinear(c) {
                return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            }
            
            // Add colors for each vertex (assuming the color is constant for the entire cube)
            var color = new THREE.Color(colour.r, colour.g, colour.b);

            // Convert sRGB to Linear space
            color.r = sRGBToLinear(color.r);
            color.g = sRGBToLinear(color.g);
            color.b = sRGBToLinear(color.b);
            
            for (var i = 0; i < faces.length * 3; i++) {
                colors.push(color.r, color.g, color.b);
            }
        });
        // Create a three.js BufferGeometry
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        geometry.computeVertexNormals();

        // Create a mesh
        var material = new THREE.MeshBasicMaterial({ vertexColors: true });
        var mesh = new THREE.Mesh(geometry, material);
        
        
        // Create scene
        var scene = new THREE.Scene();
        scene.add(mesh);
        console.log('Done converting to GLB');
        // console.log(mesh);
        // Instantiate a exporter
        // import("three/examples/jsm/exporters/GLTFExporter.js").then(GLTFExporter_js_1 => {

        // translate const translation = new Vector3(3971704.0613928437, 4868680.6279535862, -1022930.8511660389);  // Replace with actual translation
        // translate obj in scnee


        const gltfFiles = await exportGLB(glTFAssetFromTHREE(scene));
        // save to file
        const fs = require('fs');
        fs.writeFileSync('model.glb', Buffer.from(gltfFiles));

        

        console.log(gltfFiles);

        resolve(gltfFiles);  // or resolve('model.glb');
        return

        console.log('Instantiating exporter...');
        console.log(GLTFExporter);
        const { JSDOM } = require('jsdom');
        const { window } = new JSDOM();
        global.FileReader = window.FileReader;

        var exporter = new GLTFExporter.GLTFExporter();  // Corrected this line

        // var exporter = GLTFExporter

        // Parse the input and generate the glTF output
        exporter.parse(scene, 
        // called when the gltf has been generated
        function (gltf) {
            console.log(gltf);
            // Convert gltf to JSON string
            var gltfJsonString = JSON.stringify(gltf);
            console.log(gltfJsonString);
            // Parse the JSON string to a JavaScript object
            var gltfObject = JSON.parse(gltfJsonString);
            // Convert the object to a JSON string
            var json_string = JSON.stringify(gltfObject);
            var json_bytes = new util_1.TextEncoder().encode(json_string);
            // Prepare the binary part (empty in this example, replace with actual binary data if needed)
            var binary_bytes = Buffer.from('');
            // Calculate the length of the binary data (4-byte aligned)
            var padding = (4 - (json_bytes.length % 4)) % 4;
            var header_length = json_bytes.length + padding;
            var buffer_length = header_length + binary_bytes.length;
            // Prepare the GLB header
            var header = Buffer.from('glTF');
            var version = Buffer.alloc(4);
            version.writeUInt32LE(2, 0); // GLTF version 2
            var header_length_data = Buffer.alloc(4);
            header_length_data.writeUInt32LE(header_length, 0);
            var content_length = Buffer.alloc(4);
            content_length.writeUInt32LE(buffer_length, 0);
            // Merge the header, JSON, and binary data
            var glb_data = Buffer.concat([header, version, header_length_data, json_bytes, Buffer.alloc(padding), binary_bytes]);
            // Save the GLB to a file
            // fs.writeFileSync('model.glb', glb_data);
            console.log('GLB file saved as model.glb');
        });
        }, 
        // called when there is an error in the generation
        function (error) {
            console.log('An error happened');
        });
    // });
}
exports.convertVoxelMeshToGLB = convertVoxelMeshToGLB;
