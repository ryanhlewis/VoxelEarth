/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = "gltf-js-utils";

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = "three";

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "glTFAssetFromTHREE": () => (/* binding */ glTFAssetFromTHREE)
/* harmony export */ });
module.exports = __webpack_exports__;

/* harmony import */ var gltf_js_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var gltf_js_utils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(gltf_js_utils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(three__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Creates a GLTF asset from a Three.js object/scene.
 * The GLTFAsset can be turned into a glTF file via `gltf-js-utils`.
 * @param obj Three.js object or scene.
 * @returns GLTFAsset equivalent.
 */
const GLTF = require('gltf-js-utils');

function glTFAssetFromTHREE(obj) {
    var asset = new GLTF.GLTFAsset();
    var scene = new GLTF.Scene();
    scene.name = obj.name;
    asset.addScene(scene);
    scene.addNode(NodeFromTHREE(obj));
    return asset;
}
function NodeFromTHREE(obj) {
    var node = new GLTF.Node();
    node.name = obj.name;
    if (isTHREEMesh(obj)) {
        node.mesh = MeshFromTHREE(obj);
    }
    else {
        node.setTranslation(obj.position.x, obj.position.y, obj.position.z);
        node.setRotationRadians(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        node.setScale(obj.scale.x, obj.scale.y, obj.scale.z);
        for (var _i = 0, _a = obj.children; _i < _a.length; _i++) {
            var child = _a[_i];
            node.addNode(NodeFromTHREE(child));
        }
    }
    return node;
}

function MeshFromTHREE(obj) {
    var mesh = new GLTF.Mesh();
    var threeGeometry = obj.geometry;

    if (threeGeometry.isBufferGeometry && threeGeometry.attributes.color) {
        var positions = threeGeometry.attributes.position.array;
        var vertexColors = threeGeometry.attributes.color.array;
        var normals = threeGeometry.attributes.normal.array;

        var materialIndex = 0;

        for (var i = 0; i < positions.length; i += 9) {
            var vertices = [];
            for (var j = 0; j < 3; j++) {
                var vertex = new GLTF.Vertex();
                vertex.x = positions[i + j * 3];
                vertex.y = positions[i + j * 3 + 1];
                vertex.z = positions[i + j * 3 + 2];

                // Normalize the normals
                var nx = normals[i + j * 3];
                var ny = normals[i + j * 3 + 1];
                var nz = normals[i + j * 3 + 2];
                var len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                vertex.normalX = nx / len;
                vertex.normalY = ny / len;
                vertex.normalZ = nz / len;

                // Vertex colors
                vertex.color = new GLTF.RGBAColor(
                    vertexColors[i], 
                    vertexColors[i + 1], 
                    vertexColors[i + 2]
                );
                vertex.color.a = 1.0;
                vertex.color.r = vertexColors[i];
                vertex.color.g = vertexColors[i + 1];
                vertex.color.b = vertexColors[i + 2];
                // console.log(vertex.color);

  
                vertices.push(vertex);
            }

            // flip a coin to decide if we want to add red or blue
            // var faceColor = Math.random() > 0.5 ? new GLTF.RGBColor(1, 0, 0) : new GLTF.RGBColor(0, 0, 1);

            // var faceColor = new GLTF.RGBColor(1, 0, 0);  // Red in [0, 1] range
            mesh.addFace(vertices[0], vertices[1], vertices[2], null, materialIndex);
        }

        var material = MaterialsFromTHREE(obj.material);
        material.vertexColorMode = GLTF.VertexColorMode.VertexColors;
        mesh.material = [material];  // Ensure it's an array

        // Check if pbrMetallicRoughness exists before setting its properties
        if (!material.pbrMetallicRoughness) {
            material.pbrMetallicRoughness = {};
        }

        // material.pbrMetallicRoughness.baseColorFactor = [1, 1, 0, 1];  // Red in [0, 1] range
        // material.pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];  // Neutral white in [0, 1] range

    } else {
        throw new Error("Invalid geometry or missing color attributes.");
    }
    return mesh;
}


const three = require('three');
// function MaterialFromTHREE(threeMaterial) {
//     var material = new GLTF.Material();
//     material.doubleSided = threeMaterial.side === three.DoubleSide;
    
//     // We'll only handle MeshBasicMaterial for simplicity
//     if (isTHREEMeshBasicMaterial(threeMaterial)) {
//         if (threeMaterial.vertexColors) {
//             console.log("Vertex colors enabled.");
//             material.vertexColorMode = GLTF.VertexColorMode.VertexColors;
//         } else {
//             console.log("Vertex colors disabled.");
//             material.vertexColorMode = GLTF.VertexColorMode.NoColors;
//             material.pbrMetallicRoughness.baseColorFactor = [
//                 threeMaterial.color.r,
//                 threeMaterial.color.g,
//                 threeMaterial.color.b,
//                 1
//             ];
//         }
//     } else {
//         throw new Error(threeMaterial.type + " is currently not supported.");
//     }

//     if (threeMaterial.vertexColors) {
//         material.vertexColorMode = GLTF.VertexColorMode.VertexColors;
//     }

//     return material;
// }


function MaterialsFromTHREE(threeMaterial) {
    var materials = [];
    if (!Array.isArray(threeMaterial)) {
        threeMaterial = [threeMaterial];
    }
    for (var _i = 0, threeMaterial_1 = threeMaterial; _i < threeMaterial_1.length; _i++) {
        var mat = threeMaterial_1[_i];
        materials.push(MaterialFromTHREE(mat));
    }
    return materials;
}
function MaterialFromTHREE(threeMaterial) {
    var material = new GLTF.Material();
    material.doubleSided = threeMaterial.side === three__WEBPACK_IMPORTED_MODULE_1__.DoubleSide;
    if (isTHREEMeshBasicMaterial(threeMaterial)) {
        material.pbrMetallicRoughness.metallicFactor = 0;
        material.pbrMetallicRoughness.roughnessFactor = 0;
        if (threeMaterial.transparent) {
            material.alphaMode = GLTF.AlphaMode.MASK;
            material.alphaCutoff = threeMaterial.alphaTest;
        }
        material.vertexColorMode = threeMaterial.vertexColors ? GLTF.VertexColorMode.VertexColors : GLTF.VertexColorMode.NoColors;
        if (threeMaterial.color && !threeMaterial.vertexColors) {
            material.pbrMetallicRoughness.baseColorFactor = [
                threeMaterial.color.r,
                threeMaterial.color.g,
                threeMaterial.color.b,
                1
            ];
        }
        if (threeMaterial.map) {
            var texture = new GLTF.Texture(threeMaterial.map.image);
            texture.wrapS = WrappingModeFromTHREE(threeMaterial.map.wrapS);
            texture.wrapT = WrappingModeFromTHREE(threeMaterial.map.wrapT);
            material.pbrMetallicRoughness.baseColorTexture = texture;
        }
    }
    else {
        throw new Error(threeMaterial.type + " is currently not supported.");
    }
    return material;
}
function VertexFromTHREE(threeGeometry, faceIndex, vertexIndex, vertexRelIndex) {
    var vertex = new GLTF.Vertex();
    var threeVertex = threeGeometry.vertices[vertexIndex];
    vertex.x = threeVertex.x;
    vertex.y = threeVertex.y;
    vertex.z = threeVertex.z;
    if (threeGeometry.faceVertexUvs[0] && threeGeometry.faceVertexUvs[0][faceIndex]
        && threeGeometry.faceVertexUvs[0][faceIndex][vertexRelIndex]) {
        vertex.u = threeGeometry.faceVertexUvs[0][faceIndex][vertexRelIndex].x;
        vertex.v = threeGeometry.faceVertexUvs[0][faceIndex][vertexRelIndex].y;
    }
    var threeFace = threeGeometry.faces[faceIndex];
    if (threeFace.vertexNormals[vertexRelIndex]) {
        vertex.normalX = threeFace.vertexNormals[vertexRelIndex].x;
        vertex.normalY = threeFace.vertexNormals[vertexRelIndex].y;
        vertex.normalZ = threeFace.vertexNormals[vertexRelIndex].z;
    }
    if (threeFace.vertexColors[vertexRelIndex]) {
        vertex.color = new GLTF.RGBColor();
        vertex.color.r = threeFace.vertexColors[vertexRelIndex].r;
        vertex.color.g = threeFace.vertexColors[vertexRelIndex].g;
        vertex.color.b = threeFace.vertexColors[vertexRelIndex].b;
    }
    return vertex;
}
function WrappingModeFromTHREE(mode) {
    switch (mode) {
        case three__WEBPACK_IMPORTED_MODULE_1__.RepeatWrapping:
            return GLTF.WrappingMode.REPEAT;
        case three__WEBPACK_IMPORTED_MODULE_1__.MirroredRepeatWrapping:
            return GLTF.WrappingMode.MIRRORED_REPEAT;
        case three__WEBPACK_IMPORTED_MODULE_1__.ClampToEdgeWrapping:
        default:
            return GLTF.WrappingMode.CLAMP_TO_EDGE;
    }
}
function isTHREEMesh(obj) {
    return obj.type === "Mesh";
}
function isTHREEGeometry(obj) {
    return obj.type === "Geometry";
}
function isTHREEMeshBasicMaterial(obj) {
    return obj.type === "MeshBasicMaterial";
}


})();

/******/ })()
;

