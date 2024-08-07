"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.headlessConfig = void 0;
var all_1 = require("../res/palettes/all");
var util_1 = require("../src/util");
var vector_1 = require("../src/vector");
exports.headlessConfig = {
    import: {
        // file: new File([], '/Users/lucasdower/ObjToSchematic/res/samples/skull.obj'),
        // file: '/Users/ryanhardesty/Documents/GitHub/MCG/ObjToSchematic-main/ObjToSchematic-main - Copy/res/samples/skull.obj',
        file: '/Users/ryanhardesty/Pictures/shiba.glb',
        rotation: new vector_1.Vector3(0, 0, 0),
    },
    voxelise: {
        constraintAxis: 'y',
        voxeliser: 'bvh-ray',
        size: 100,
        useMultisampleColouring: false,
        voxelOverlapRule: 'average',
        enableAmbientOcclusion: false, // Only want true if exporting to .obj
    },
    assign: {
        textureAtlas: 'vanilla',
        blockPalette: all_1.PALETTE_ALL_RELEASE,
        dithering: 'ordered',
        ditheringMagnitude: 32,
        colourSpace: util_1.ColourSpace.RGB,
        fallable: 'replace-falling',
        resolution: 32,
        calculateLighting: false,
        lightThreshold: 0,
        contextualAveraging: true,
        errorWeight: 0.0,
    },
    export: {
        exporter: 'litematic', // 'schematic' / 'litematic',
    },
    debug: {
        showLogs: true,
        showWarnings: true,
        showTimings: true,
    },
};
