"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugGeometryTemplates = exports.GeometryTemplates = void 0;
var twgl = require("twgl.js");
var bounds_1 = require("./bounds");
var render_buffer_1 = require("./render_buffer");
var triangle_1 = require("./triangle");
var error_util_1 = require("./util/error_util");
var vector_1 = require("./vector");
var GeometryTemplates = /** @class */ (function () {
    function GeometryTemplates() {
    }
    GeometryTemplates.getTriangleBufferData = function (triangle) {
        var n = triangle.getNormal();
        return {
            custom: {
                position: [
                    triangle.v0.x, triangle.v0.y, triangle.v0.z,
                    triangle.v1.x, triangle.v1.y, triangle.v1.z,
                    triangle.v2.x, triangle.v2.y, triangle.v2.z,
                ],
                texcoord: [
                    triangle.uv0.u, triangle.uv0.v,
                    triangle.uv1.u, triangle.uv1.v,
                    triangle.uv2.u, triangle.uv2.v,
                ],
                normal: [
                    n.x, n.y, n.z,
                    n.x, n.y, n.z,
                    n.x, n.y, n.z,
                ],
            },
            indices: new Uint32Array([
                0, 1, 2,
            ]),
        };
    };
    GeometryTemplates.getBoxBufferData = function (centre) {
        var cube = {
            custom: {
                position: new Array(72),
                texcoord: new Array(48),
                normal: new Array(72),
            },
            indices: new Uint32Array(72),
        };
        cube.custom.position = Array.from(GeometryTemplates._default_cube.position);
        cube.custom.normal = Array.from(GeometryTemplates._default_cube.normal);
        cube.custom.texcoord = Array.from(GeometryTemplates._default_cube.texcoord);
        cube.indices = Uint32Array.from(GeometryTemplates._default_cube.indices);
        for (var i = 0; i < 72; i += 3) {
            cube.custom.position[i + 0] += centre.x;
            cube.custom.position[i + 1] += centre.y;
            cube.custom.position[i + 2] += centre.z;
        }
        return cube;
    };
    GeometryTemplates._default_cube = twgl.primitives.createCubeVertices(1.0);
    return GeometryTemplates;
}());
exports.GeometryTemplates = GeometryTemplates;
var DebugGeometryTemplates = /** @class */ (function () {
    function DebugGeometryTemplates() {
    }
    DebugGeometryTemplates.cross = function (centre, radius, colour) {
        return {
            indices: new Uint32Array([0, 1, 2, 3, 4, 5]),
            custom: {
                position: [
                    centre.x + radius, centre.y, centre.z,
                    centre.x - radius, centre.y, centre.z,
                    centre.x, centre.y + radius, centre.z,
                    centre.x, centre.y - radius, centre.z,
                    centre.x, centre.y, centre.z + radius,
                    centre.x, centre.y, centre.z - radius,
                ],
                colour: [
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                ],
            },
        };
    };
    DebugGeometryTemplates.line = function (start, end, colour) {
        return {
            indices: new Uint32Array([0, 1]),
            custom: {
                position: [
                    start.x, start.y, start.z,
                    end.x, end.y, end.z,
                ],
                colour: [
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                ],
            },
        };
    };
    DebugGeometryTemplates.cube = function (centre, size, colour) {
        var min = vector_1.Vector3.sub(centre, size / 2);
        var max = vector_1.Vector3.add(centre, size / 2);
        var bounds = new bounds_1.Bounds(min, max);
        return this.bounds(bounds, colour);
    };
    DebugGeometryTemplates.bounds = function (bounds, colour) {
        return {
            indices: new Uint32Array([
                0, 1,
                1, 2,
                2, 3,
                3, 0,
                4, 5,
                5, 6,
                6, 7,
                7, 4,
                0, 4,
                1, 5,
                2, 6,
                3, 7,
            ]),
            custom: {
                position: [
                    bounds.min.x, bounds.min.y, bounds.min.z,
                    bounds.max.x, bounds.min.y, bounds.min.z,
                    bounds.max.x, bounds.min.y, bounds.max.z,
                    bounds.min.x, bounds.min.y, bounds.max.z,
                    bounds.min.x, bounds.max.y, bounds.min.z,
                    bounds.max.x, bounds.max.y, bounds.min.z,
                    bounds.max.x, bounds.max.y, bounds.max.z,
                    bounds.min.x, bounds.max.y, bounds.max.z,
                ],
                colour: [
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                    colour.r, colour.g, colour.b, colour.a,
                ],
            },
        };
    };
    DebugGeometryTemplates.circle = function (centre, normal, radius, colour, steps) {
        if (steps === void 0) { steps = 8; }
        var indices = [];
        var positions = [];
        var colours = [];
        var circlePoints = DebugGeometryTemplates._generateCirclePoints(centre, normal, radius, steps);
        for (var i = 0; i < steps; ++i) {
            var point = circlePoints[i];
            positions.push(point.x, point.y, point.z);
            indices.push(i, (i + 1) % steps);
            colours.push(colour.r, colour.g, colour.b, colour.a);
        }
        return {
            indices: new Uint32Array(indices),
            custom: {
                position: positions,
                colour: colours,
            },
        };
    };
    DebugGeometryTemplates.cone = function (tipCentre, tipHeight, normal, radius, colour, quarterSteps) {
        var indices = [];
        var positions = [];
        var colours = [];
        var steps = quarterSteps * 4;
        var circleCentre = vector_1.Vector3.add(tipCentre, vector_1.Vector3.mulScalar(normal.copy().normalise(), -tipHeight));
        var circlePoints = DebugGeometryTemplates._generateCirclePoints(circleCentre, normal, radius, steps);
        // Add circle data
        for (var i = 0; i < steps; ++i) {
            var point = circlePoints[i];
            positions.push(point.x, point.y, point.z);
            indices.push(i, (i + 1) % steps);
            colours.push(colour.r, colour.g, colour.b, colour.a);
        }
        // Add cone tip
        positions.push(tipCentre.x, tipCentre.y, tipCentre.z);
        colours.push(colour.r, colour.g, colour.b, colour.a);
        var tipIndex = steps;
        // Add cone lines
        for (var i = 0; i < 4; ++i) {
            var coneIndex = i * quarterSteps;
            indices.push(tipIndex, coneIndex);
        }
        return {
            indices: new Uint32Array(indices),
            custom: {
                position: positions,
                colour: colours,
            },
        };
    };
    DebugGeometryTemplates.arrow = function (start, end, colour) {
        var line = DebugGeometryTemplates.line(start, end, colour);
        var lineLength = vector_1.Vector3.sub(end, start).magnitude();
        var coneHeight = 0.15 * lineLength;
        var coneRadius = 0.15 * coneHeight;
        var normal = vector_1.Vector3.sub(end, start).normalise();
        var cone = DebugGeometryTemplates.cone(end, coneHeight, normal, coneRadius, colour, 1);
        return (0, render_buffer_1.MergeAttributeData)(line, cone);
    };
    DebugGeometryTemplates.gridX = function (dimensions, spacing) {
        var buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, -dimensions.y / 2, -dimensions.z / 2), new vector_1.Vector3(0, -dimensions.y / 2, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, dimensions.y / 2, -dimensions.z / 2), new vector_1.Vector3(0, dimensions.y / 2, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, -dimensions.y / 2, -dimensions.z / 2), new vector_1.Vector3(0, dimensions.y / 2, -dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, -dimensions.y / 2, dimensions.z / 2), new vector_1.Vector3(0, dimensions.y / 2, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        if (spacing) {
            (0, error_util_1.ASSERT)(spacing > 0.0);
            for (var y = -dimensions.y / 2; y < dimensions.y / 2; y += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, y, -dimensions.z / 2), new vector_1.Vector3(0, y, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MINOR));
            }
            for (var z = -dimensions.z / 2; z < dimensions.z / 2; z += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, -dimensions.y / 2, z), new vector_1.Vector3(0, dimensions.y / 2, z), DebugGeometryTemplates.COLOUR_MINOR));
            }
        }
        return buffer;
    };
    DebugGeometryTemplates.gridY = function (dimensions, spacing) {
        var buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, 0, -dimensions.z / 2), new vector_1.Vector3(-dimensions.x / 2, 0, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(dimensions.x / 2, 0, -dimensions.z / 2), new vector_1.Vector3(dimensions.x / 2, 0, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, 0, -dimensions.z / 2), new vector_1.Vector3(dimensions.x / 2, 0, -dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, 0, dimensions.z / 2), new vector_1.Vector3(dimensions.x / 2, 0, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        if (spacing) {
            (0, error_util_1.ASSERT)(spacing > 0.0);
            for (var x = -dimensions.x / 2; x < dimensions.x / 2; x += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(x, 0, -dimensions.z / 2), new vector_1.Vector3(x, 0, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MINOR));
            }
            for (var z = -dimensions.z / 2; z < dimensions.z / 2; z += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, 0, z), new vector_1.Vector3(dimensions.x / 2, 0, z), DebugGeometryTemplates.COLOUR_MINOR));
            }
        }
        return buffer;
    };
    DebugGeometryTemplates.gridZ = function (dimensions, spacing) {
        var buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, -dimensions.y / 2, 0), new vector_1.Vector3(-dimensions.x / 2, dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(dimensions.x / 2, -dimensions.y / 2, 0), new vector_1.Vector3(dimensions.x / 2, dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, -dimensions.y / 2, 0), new vector_1.Vector3(dimensions.x / 2, -dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, dimensions.y / 2, 0), new vector_1.Vector3(dimensions.x / 2, dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MAJOR));
        if (spacing) {
            (0, error_util_1.ASSERT)(spacing > 0.0);
            for (var x = -dimensions.x / 2; x < dimensions.x / 2; x += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(x, -dimensions.y / 2, 0), new vector_1.Vector3(x, dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MINOR));
            }
            for (var y = -dimensions.y / 2; y < dimensions.y / 2; y += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, y, 0), new vector_1.Vector3(dimensions.x / 2, y, 0), DebugGeometryTemplates.COLOUR_MINOR));
            }
        }
        return buffer;
    };
    DebugGeometryTemplates.meshWireframe = function (mesh, colour) {
        var _a;
        var buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        var v0 = new vector_1.Vector3(0, 0, 0);
        var v1 = new vector_1.Vector3(0, 0, 0);
        var v2 = new vector_1.Vector3(0, 0, 0);
        for (var triIndex = 0; triIndex < mesh.getTriangleCount(); ++triIndex) {
            (_a = mesh.getVertices(triIndex), v0 = _a.v0, v1 = _a.v1, v2 = _a.v2);
            buffer.add(DebugGeometryTemplates.line(v0, v1, colour));
            buffer.add(DebugGeometryTemplates.line(v1, v2, colour));
            buffer.add(DebugGeometryTemplates.line(v2, v0, colour));
        }
        return buffer;
    };
    DebugGeometryTemplates.voxelMeshWireframe = function (voxelMesh, colour, voxelSize) {
        var buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        var dimensions = voxelMesh.getBounds().getDimensions();
        var gridOffset = new vector_1.Vector3(dimensions.x % 2 === 0 ? 0 : -0.5, dimensions.y % 2 === 0 ? 0 : -0.5, dimensions.z % 2 === 0 ? 0 : -0.5);
        for (var _i = 0, _a = voxelMesh.getVoxels(); _i < _a.length; _i++) {
            var voxel = _a[_i];
            buffer.add(DebugGeometryTemplates.cube(vector_1.Vector3.mulScalar(vector_1.Vector3.add(voxel.position, gridOffset), voxelSize), voxelSize, colour));
        }
        return buffer;
    };
    DebugGeometryTemplates.meshNormals = function (mesh, colour) {
        var buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        for (var triIndex = 0; triIndex < mesh.getTriangleCount(); ++triIndex) {
            var normalLength = 0.5;
            var vertices = mesh.getVertices(triIndex);
            var normals = mesh.getNormals(triIndex);
            var avgNormal = vector_1.Vector3.add(normals.v0, normals.v1).add(normals.v2).divScalar(3.0);
            var tri = new triangle_1.Triangle(vertices.v0, vertices.v1, vertices.v2);
            var start = tri.getCentre();
            var end = vector_1.Vector3.add(start, vector_1.Vector3.mulScalar(avgNormal, normalLength));
            buffer.add(DebugGeometryTemplates.arrow(start, end, colour));
        }
        return buffer;
    };
    DebugGeometryTemplates._generateCirclePoints = function (centre, normal, radius, steps) {
        normal = normal.copy().normalise();
        var c = [{ i: 0, v: normal.x }, { i: 1, v: normal.y }, { i: 2, v: normal.z }];
        {
            var comps = c.sort(function (a, b) {
                return b.v - a.v;
            }); // largest -> smallest
            comps[2].v = 0;
            var temp = comps[0].v;
            comps[0].v = comps[1].v;
            comps[1].v = temp;
            comps = c.sort(function (a, b) {
                return a.i - b.i;
            });
        }
        var aVec = new vector_1.Vector3(c[0].v, c[1].v, c[2].v);
        var bVec = vector_1.Vector3.cross(normal, aVec);
        aVec.normalise();
        bVec.normalise();
        var circlePoints = [];
        for (var i = 0; i < steps; ++i) {
            var t = i / steps * Math.PI * 2;
            var point = centre.copy()
                .add(vector_1.Vector3.mulScalar(aVec, radius * Math.cos(t)))
                .add(vector_1.Vector3.mulScalar(bVec, radius * Math.sin(t)));
            circlePoints.push(point);
        }
        return circlePoints;
    };
    DebugGeometryTemplates.COLOUR_MINOR = { r: 0.5, g: 0.5, b: 0.5, a: 0.3 };
    DebugGeometryTemplates.COLOUR_MAJOR = { r: 1.0, g: 1.0, b: 1.0, a: 0.3 };
    return DebugGeometryTemplates;
}());
exports.DebugGeometryTemplates = DebugGeometryTemplates;
