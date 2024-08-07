"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugGeometryTemplates = exports.GeometryTemplates = void 0;
const twgl = require("twgl.js");
const bounds_1 = require("./bounds");
const render_buffer_1 = require("./render_buffer");
const triangle_1 = require("./triangle");
const error_util_1 = require("./util/error_util");
const vector_1 = require("./vector");
class GeometryTemplates {
    static getTriangleBufferData(triangle) {
        const n = triangle.getNormal();
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
    }
    static getBoxBufferData(centre) {
        const cube = {
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
        for (let i = 0; i < 72; i += 3) {
            cube.custom.position[i + 0] += centre.x;
            cube.custom.position[i + 1] += centre.y;
            cube.custom.position[i + 2] += centre.z;
        }
        return cube;
    }
}
exports.GeometryTemplates = GeometryTemplates;
GeometryTemplates._default_cube = twgl.primitives.createCubeVertices(1.0);
class DebugGeometryTemplates {
    static cross(centre, radius, colour) {
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
    }
    static line(start, end, colour) {
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
    }
    static cube(centre, size, colour) {
        const min = vector_1.Vector3.sub(centre, size / 2);
        const max = vector_1.Vector3.add(centre, size / 2);
        const bounds = new bounds_1.Bounds(min, max);
        return this.bounds(bounds, colour);
    }
    static bounds(bounds, colour) {
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
    }
    static circle(centre, normal, radius, colour, steps = 8) {
        const indices = [];
        const positions = [];
        const colours = [];
        const circlePoints = DebugGeometryTemplates._generateCirclePoints(centre, normal, radius, steps);
        for (let i = 0; i < steps; ++i) {
            const point = circlePoints[i];
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
    }
    static cone(tipCentre, tipHeight, normal, radius, colour, quarterSteps) {
        const indices = [];
        const positions = [];
        const colours = [];
        const steps = quarterSteps * 4;
        const circleCentre = vector_1.Vector3.add(tipCentre, vector_1.Vector3.mulScalar(normal.copy().normalise(), -tipHeight));
        const circlePoints = DebugGeometryTemplates._generateCirclePoints(circleCentre, normal, radius, steps);
        // Add circle data
        for (let i = 0; i < steps; ++i) {
            const point = circlePoints[i];
            positions.push(point.x, point.y, point.z);
            indices.push(i, (i + 1) % steps);
            colours.push(colour.r, colour.g, colour.b, colour.a);
        }
        // Add cone tip
        positions.push(tipCentre.x, tipCentre.y, tipCentre.z);
        colours.push(colour.r, colour.g, colour.b, colour.a);
        const tipIndex = steps;
        // Add cone lines
        for (let i = 0; i < 4; ++i) {
            const coneIndex = i * quarterSteps;
            indices.push(tipIndex, coneIndex);
        }
        return {
            indices: new Uint32Array(indices),
            custom: {
                position: positions,
                colour: colours,
            },
        };
    }
    static arrow(start, end, colour) {
        const line = DebugGeometryTemplates.line(start, end, colour);
        const lineLength = vector_1.Vector3.sub(end, start).magnitude();
        const coneHeight = 0.15 * lineLength;
        const coneRadius = 0.15 * coneHeight;
        const normal = vector_1.Vector3.sub(end, start).normalise();
        const cone = DebugGeometryTemplates.cone(end, coneHeight, normal, coneRadius, colour, 1);
        return (0, render_buffer_1.MergeAttributeData)(line, cone);
    }
    static gridX(dimensions, spacing) {
        const buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, -dimensions.y / 2, -dimensions.z / 2), new vector_1.Vector3(0, -dimensions.y / 2, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, dimensions.y / 2, -dimensions.z / 2), new vector_1.Vector3(0, dimensions.y / 2, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, -dimensions.y / 2, -dimensions.z / 2), new vector_1.Vector3(0, dimensions.y / 2, -dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, -dimensions.y / 2, dimensions.z / 2), new vector_1.Vector3(0, dimensions.y / 2, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        if (spacing) {
            (0, error_util_1.ASSERT)(spacing > 0.0);
            for (let y = -dimensions.y / 2; y < dimensions.y / 2; y += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, y, -dimensions.z / 2), new vector_1.Vector3(0, y, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MINOR));
            }
            for (let z = -dimensions.z / 2; z < dimensions.z / 2; z += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(0, -dimensions.y / 2, z), new vector_1.Vector3(0, dimensions.y / 2, z), DebugGeometryTemplates.COLOUR_MINOR));
            }
        }
        return buffer;
    }
    static gridY(dimensions, spacing) {
        const buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, 0, -dimensions.z / 2), new vector_1.Vector3(-dimensions.x / 2, 0, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(dimensions.x / 2, 0, -dimensions.z / 2), new vector_1.Vector3(dimensions.x / 2, 0, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, 0, -dimensions.z / 2), new vector_1.Vector3(dimensions.x / 2, 0, -dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, 0, dimensions.z / 2), new vector_1.Vector3(dimensions.x / 2, 0, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MAJOR));
        if (spacing) {
            (0, error_util_1.ASSERT)(spacing > 0.0);
            for (let x = -dimensions.x / 2; x < dimensions.x / 2; x += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(x, 0, -dimensions.z / 2), new vector_1.Vector3(x, 0, dimensions.z / 2), DebugGeometryTemplates.COLOUR_MINOR));
            }
            for (let z = -dimensions.z / 2; z < dimensions.z / 2; z += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, 0, z), new vector_1.Vector3(dimensions.x / 2, 0, z), DebugGeometryTemplates.COLOUR_MINOR));
            }
        }
        return buffer;
    }
    static gridZ(dimensions, spacing) {
        const buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, -dimensions.y / 2, 0), new vector_1.Vector3(-dimensions.x / 2, dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(dimensions.x / 2, -dimensions.y / 2, 0), new vector_1.Vector3(dimensions.x / 2, dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, -dimensions.y / 2, 0), new vector_1.Vector3(dimensions.x / 2, -dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MAJOR));
        buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, dimensions.y / 2, 0), new vector_1.Vector3(dimensions.x / 2, dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MAJOR));
        if (spacing) {
            (0, error_util_1.ASSERT)(spacing > 0.0);
            for (let x = -dimensions.x / 2; x < dimensions.x / 2; x += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(x, -dimensions.y / 2, 0), new vector_1.Vector3(x, dimensions.y / 2, 0), DebugGeometryTemplates.COLOUR_MINOR));
            }
            for (let y = -dimensions.y / 2; y < dimensions.y / 2; y += spacing) {
                buffer.add(DebugGeometryTemplates.line(new vector_1.Vector3(-dimensions.x / 2, y, 0), new vector_1.Vector3(dimensions.x / 2, y, 0), DebugGeometryTemplates.COLOUR_MINOR));
            }
        }
        return buffer;
    }
    static meshWireframe(mesh, colour) {
        const buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        let v0 = new vector_1.Vector3(0, 0, 0);
        let v1 = new vector_1.Vector3(0, 0, 0);
        let v2 = new vector_1.Vector3(0, 0, 0);
        for (let triIndex = 0; triIndex < mesh.getTriangleCount(); ++triIndex) {
            ({ v0, v1, v2 } = mesh.getVertices(triIndex));
            buffer.add(DebugGeometryTemplates.line(v0, v1, colour));
            buffer.add(DebugGeometryTemplates.line(v1, v2, colour));
            buffer.add(DebugGeometryTemplates.line(v2, v0, colour));
        }
        return buffer;
    }
    static voxelMeshWireframe(voxelMesh, colour, voxelSize) {
        const buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        const dimensions = voxelMesh.getBounds().getDimensions();
        const gridOffset = new vector_1.Vector3(dimensions.x % 2 === 0 ? 0 : -0.5, dimensions.y % 2 === 0 ? 0 : -0.5, dimensions.z % 2 === 0 ? 0 : -0.5);
        for (const voxel of voxelMesh.getVoxels()) {
            buffer.add(DebugGeometryTemplates.cube(vector_1.Vector3.mulScalar(vector_1.Vector3.add(voxel.position, gridOffset), voxelSize), voxelSize, colour));
        }
        return buffer;
    }
    static meshNormals(mesh, colour) {
        const buffer = new render_buffer_1.RenderBuffer([
            { name: 'position', numComponents: 3 },
            { name: 'colour', numComponents: 4 },
        ]);
        for (let triIndex = 0; triIndex < mesh.getTriangleCount(); ++triIndex) {
            const normalLength = 0.5;
            const vertices = mesh.getVertices(triIndex);
            const normals = mesh.getNormals(triIndex);
            const avgNormal = vector_1.Vector3.add(normals.v0, normals.v1).add(normals.v2).divScalar(3.0);
            const tri = new triangle_1.Triangle(vertices.v0, vertices.v1, vertices.v2);
            const start = tri.getCentre();
            const end = vector_1.Vector3.add(start, vector_1.Vector3.mulScalar(avgNormal, normalLength));
            buffer.add(DebugGeometryTemplates.arrow(start, end, colour));
        }
        return buffer;
    }
    static _generateCirclePoints(centre, normal, radius, steps) {
        normal = normal.copy().normalise();
        const c = [{ i: 0, v: normal.x }, { i: 1, v: normal.y }, { i: 2, v: normal.z }];
        {
            let comps = c.sort((a, b) => {
                return b.v - a.v;
            }); // largest -> smallest
            comps[2].v = 0;
            const temp = comps[0].v;
            comps[0].v = comps[1].v;
            comps[1].v = temp;
            comps = c.sort((a, b) => {
                return a.i - b.i;
            });
        }
        const aVec = new vector_1.Vector3(c[0].v, c[1].v, c[2].v);
        const bVec = vector_1.Vector3.cross(normal, aVec);
        aVec.normalise();
        bVec.normalise();
        const circlePoints = [];
        for (let i = 0; i < steps; ++i) {
            const t = i / steps * Math.PI * 2;
            const point = centre.copy()
                .add(vector_1.Vector3.mulScalar(aVec, radius * Math.cos(t)))
                .add(vector_1.Vector3.mulScalar(bVec, radius * Math.sin(t)));
            circlePoints.push(point);
        }
        return circlePoints;
    }
}
exports.DebugGeometryTemplates = DebugGeometryTemplates;
DebugGeometryTemplates.COLOUR_MINOR = { r: 0.5, g: 0.5, b: 0.5, a: 0.3 };
DebugGeometryTemplates.COLOUR_MAJOR = { r: 1.0, g: 1.0, b: 1.0, a: 0.3 };
