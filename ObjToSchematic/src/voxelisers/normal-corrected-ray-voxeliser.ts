import { Bounds } from '../bounds';
import { Mesh } from '../mesh';
import { ProgressManager } from '../progress';
import { Axes, Ray, rayIntersectTriangle } from '../ray';
import { UVTriangle } from '../triangle';
import { ASSERT } from '../util/error_util';
import { Vector3 } from '../vector';
import { VoxelMesh } from '../voxel_mesh';
import { VoxeliseParams } from '../worker_types';
import { IVoxeliser } from './base-voxeliser';

/**
 * This voxeliser works by projecting rays onto each triangle
 * on each of the principle angles and testing for intersections
 */
export class NormalCorrectedRayVoxeliser extends IVoxeliser {
    private _mesh?: Mesh;
    private _voxelMesh?: VoxelMesh;
    private _voxeliseParams?: VoxeliseParams.Input;
    private _size!: Vector3;
    private _offset!: Vector3;

    protected override _voxelise(mesh: Mesh, voxeliseParams: VoxeliseParams.Input): VoxelMesh {
        this._mesh = mesh;
        this._voxelMesh = new VoxelMesh(voxeliseParams);
        this._voxeliseParams = voxeliseParams;

        const meshDimensions = mesh.getBounds().getDimensions();
        let scale: number;
        switch (voxeliseParams.constraintAxis) {
            case 'x':
                scale = voxeliseParams.size / meshDimensions.x;
                break;
            case 'y':
                scale = voxeliseParams.size / meshDimensions.y;
                break;
            case 'z':
                scale = voxeliseParams.size / meshDimensions.z;
                break;
        }

        mesh.setTransform((vertex: Vector3) => {
            return vertex.copy().mulScalar(scale);
        });

        const bounds = mesh.getBounds();
        this._size = Vector3.sub(bounds.max.copy().ceil(), bounds.min.copy().floor());
        this._offset = new Vector3(
            this._size.x % 2 === 0 ? 0.5 : 0.0,
            this._size.y % 2 === 0 ? 0.5 : 0.0,
            this._size.z % 2 === 0 ? 0.5 : 0.0,
        );

        const numTris = mesh.getTriangleCount();

        const taskHandle = ProgressManager.Get.start('Voxelising');
        for (let triIndex = 0; triIndex < numTris; ++triIndex) {
            ProgressManager.Get.progress(taskHandle, triIndex / numTris);
            const uvTriangle = mesh.getUVTriangle(triIndex);
            const normals = mesh.getNormals(triIndex);
            const material = mesh.getMaterialByTriangle(triIndex);
            this._voxeliseTri(uvTriangle, material, normals);
        }
        ProgressManager.Get.end(taskHandle);

        mesh.clearTransform();

        return this._voxelMesh;
    }

    private _voxeliseTri(triangle: UVTriangle, materialName: string, normals: { v0: Vector3, v1: Vector3, v2: Vector3 }) {
        const rayList = this._generateRays(triangle.v0, triangle.v1, triangle.v2,
            this._offset,
        );

        ASSERT(this._mesh !== undefined);
        ASSERT(this._voxeliseParams !== undefined);
        ASSERT(this._voxelMesh !== undefined);

        for (const ray of rayList) {
            const intersection = rayIntersectTriangle(ray, triangle.v0, triangle.v1, triangle.v2);
            if (intersection) {
                // Move transition away from normal
                const norm = normals.v0.normalise();
                intersection.sub(Vector3.mulScalar(norm, 0.5));
                // Correct size parity
                intersection.add(this._offset);

                let voxelPosition: Vector3;
                switch (ray.axis) {
                    case Axes.x:
                        voxelPosition = new Vector3(Math.round(intersection.x), intersection.y, intersection.z);
                        break;
                    case Axes.y:
                        voxelPosition = new Vector3(intersection.x, Math.round(intersection.y), intersection.z);
                        break;
                    case Axes.z:
                        voxelPosition = new Vector3(intersection.x, intersection.y, Math.round(intersection.z));
                        break;
                }

                const voxelColour = this._getVoxelColour(
                    this._mesh,
                    triangle,
                    materialName,
                    voxelPosition,
                    this._voxeliseParams.useMultisampleColouring,
                );

                this._voxelMesh.addVoxel(voxelPosition, voxelColour);
            }
        };
    }

    private _generateRays(v0: Vector3, v1: Vector3, v2: Vector3, offset: Vector3): Array<Ray> {
        const bounds: Bounds = new Bounds(
            new Vector3(
                Math.ceil(Math.min(v0.x, v1.x, v2.x)),
                Math.ceil(Math.min(v0.y, v1.y, v2.y)),
                Math.ceil(Math.min(v0.z, v1.z, v2.z)),
            ),
            new Vector3(
                Math.floor(Math.max(v0.x, v1.x, v2.x)),
                Math.floor(Math.max(v0.y, v1.y, v2.y)),
                Math.floor(Math.max(v0.z, v1.z, v2.z)),
            ),
        );

        const rayList: Array<Ray> = [];
        this._traverseX(rayList, bounds, offset);
        this._traverseY(rayList, bounds, offset);
        this._traverseZ(rayList, bounds, offset);
        return rayList;
    }

    private _traverseX(rayList: Array<Ray>, bounds: Bounds, offset: Vector3) {
        for (let y = bounds.min.y - offset.y; y <= bounds.max.y + offset.y; ++y) {
            for (let z = bounds.min.z - offset.z; z <= bounds.max.z + offset.z; ++z) {
                rayList.push({
                    origin: new Vector3(bounds.min.x - 1, y, z),
                    axis: Axes.x,
                });
            }
        }
    }

    private _traverseY(rayList: Array<Ray>, bounds: Bounds, offset: Vector3) {
        for (let x = bounds.min.x - offset.x; x <= bounds.max.x + offset.x; ++x) {
            for (let z = bounds.min.z - offset.z; z <= bounds.max.z + offset.z; ++z) {
                rayList.push({
                    origin: new Vector3(x, bounds.min.y - 1, z),
                    axis: Axes.y,
                });
            }
        }
    }

    private _traverseZ(rayList: Array<Ray>, bounds: Bounds, offset: Vector3) {
        for (let x = bounds.min.x - offset.x; x <= bounds.max.x + offset.x; ++x) {
            for (let y = bounds.min.y - offset.y; y <= bounds.max.y + offset.y; ++y) {
                rayList.push({
                    origin: new Vector3(x, y, bounds.min.z - 1),
                    axis: Axes.z,
                });
            }
        }
    }
}
