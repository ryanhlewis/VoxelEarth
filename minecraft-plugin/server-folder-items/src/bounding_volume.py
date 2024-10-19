import numpy as np


class OrientedBoundingBox:
    def __init__(self, vertices):
        assert vertices.shape == (8, 3)
        self.vertices = vertices

    @staticmethod
    def from_tilespec(spec, eps=1e-2):
        assert "box" in spec
        center = np.array(spec["box"][:3])
        halfx = np.array(spec["box"][3:6])
        halfy = np.array(spec["box"][6:9])
        halfz = np.array(spec["box"][9:12])

        return OrientedBoundingBox(np.stack((
            center - halfx - halfy - halfz,
            center + halfx - halfy - halfz,
            center + halfx + halfy - halfz,
            center - halfx + halfy - halfz,
            center - halfx - halfy + halfz,
            center + halfx - halfy + halfz,
            center + halfx + halfy + halfz,
            center - halfx + halfy + halfz,
        )))


class Sphere:
    def __init__(self, center, r):
        self.center = np.array(center)
        self.r = r

    @staticmethod
    def from_obb(obb):
        return Sphere(
            0.5 * (obb.vertices[0] + obb.vertices[6]),
            0.5 * np.linalg.norm(obb.vertices[6] - obb.vertices[0])
        )

    def intersects(self, other):
        """Sphere intersection test. WARNING: If other is an OBB, then the OBB is first
        approximated using a sphere."""

        if isinstance(other, OrientedBoundingBox):
            return self.intersects(Sphere.from_obb(other))

        if not isinstance(other, Sphere):
            raise TypeError("unsupported type")

        return np.linalg.norm(other.center - self.center) < self.r + other.r
