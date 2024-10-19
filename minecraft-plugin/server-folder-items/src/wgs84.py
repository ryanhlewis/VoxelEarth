import numpy as np

# Conversions taken from:
# https://github.com/CesiumGS/cesium/blob/1.110/packages/engine/Source/Core/Cartesian3.js

def cartesian_from_radians(lon, lat, height=0.):
    WGS84_RADII_SQUARED = np.array([
        6378137.0,
        6378137.0,
        6356752.3142451793,
    ])**2
    cos_lat = np.cos(lat)
    N = np.array([
        cos_lat * np.cos(lon),
        cos_lat * np.sin(lon),
        np.sin(lat),
    ])
    N /= np.linalg.norm(N)
    K = WGS84_RADII_SQUARED * N
    gamma = np.sqrt(N.dot(K))
    K /= gamma
    N *= height

    return K + N

def cartesian_from_degrees(lon, lat, height=0.):
    return cartesian_from_radians(np.deg2rad(lon), np.deg2rad(lat), height)
