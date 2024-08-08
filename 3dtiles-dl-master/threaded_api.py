from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, parse_qs
import base64
import numpy as np
import requests
from tqdm import tqdm
import argparse
from pathlib import Path
import sys


def _get_elevation(lon, lat, key):
    res = requests.get(
        f"https://maps.googleapis.com/maps/api/elevation/json",
        params={
            "locations": f"{lat},{lon}",
            "key": key
        }
    )
    if not res.ok:
        raise RuntimeError(f"response not ok: {response.status_code}, {response.text}")
    data = res.json()
    if not data["status"] == "OK" or "results" not in data:
        raise RuntimeError(f"status not ok: {data['status']}, {data}")
    return data["results"][0]["elevation"]

class Tile:
    def __init__(self, uri=None, data=None, download_thunk=None):
        self.uri = uri
        self._data = data
        self.basename = uri.rsplit('/', 1)[-1][:-4]
        self.name = base64.decodebytes(f"{self.basename}==".encode()).decode("utf-8")
        self._download = download_thunk

    def __repr__(self):
        is_downloaded = "pending" if self._data is None else "downloaded"
        return f"<Tile:{self.name}:{is_downloaded}>"

    def download(self):
        if not self._data:
            self._data = self._download().content

    @property
    def data(self):
        self.download()
        return self._data

class TileApi:
    def __init__(self, key, api="https://tile.googleapis.com"):
        self.key = key
        self.api = api
        self.session = None

    def get(self, target_volume, uri="/v1/3dtiles/root.json"):
        fetcher = lambda: requests.get(
            f"{self.api}{uri}",
            params={"key": self.key, "session": self.session},
        )

        if uri.endswith(".glb"):
            yield Tile(uri=uri, download_thunk=fetcher)
            return

        response = fetcher()

        if not response.ok:
            raise RuntimeError(f"response not ok: {response.status_code}, {response.text}")

        content_type = response.headers.get("content-type")
        if content_type != "application/json":
            raise RuntimeError(f"expected JSON response but got {content_type}")

        data = response.json()

        for content in _parse(data["root"], target_volume):
            if "uri" in content:
                uri = urlparse(content["uri"])
                self.session = parse_qs(uri.query).get("session", [self.session])[0]
                yield from self.get(target_volume, uri.path)
            else:
                raise RuntimeError(f"unsupported content: {content}")

def _parse(root, target_volume):
    assert "contents" not in root, "contents array not supported"

    if "children" in root:
        for child in root["children"]:
            bv = OrientedBoundingBox.from_tilespec(child["boundingVolume"])
            if target_volume.intersects(bv):
                yield from _parse(child, target_volume)
    elif "content" in root:
        yield root["content"]

def download_tiles_concurrently(tiles, outdir):
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(tile.download): tile for tile in tiles}
        for future in tqdm(as_completed(futures), total=len(futures)):
            tile = futures[future]
            try:
                future.result()
                with open(outdir / Path(f"{tile.basename}.glb"), "wb") as f:
                    f.write(tile.data)
            except Exception as e:
                print(f"Error downloading {tile.uri}: {e}")

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
        if isinstance(other, OrientedBoundingBox):
            return self.intersects(Sphere.from_obb(other))

        if not isinstance(other, Sphere):
            raise TypeError("unsupported type")

        return np.linalg.norm(other.center - self.center) < self.r + other.r

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

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-k", "--api-key", help="your Google Maps 3d Tiles API key", required=True)
    parser.add_argument("-c", "--coords", help="longitude latitude [degrees]", type=float, nargs='+', required=True)
    parser.add_argument("-r", "--radius", help="radius around provided long/lat to fetch [m]", type=float, required=True)
    parser.add_argument("-o", "--out", help="output directory to place tiles in", required=True)

    args = parser.parse_args()
    if len(args.coords) != 2:
        print("Must provide two coordinates: -c <longitude> <latitude>")
        sys.exit(-1)

    print("Querying elevation...")
    elevation = _get_elevation(*args.coords, args.api_key)

    api = TileApi(key=args.api_key)
    print("Traversing tile hierarchy...")
    tiles = list(tqdm(api.get(Sphere(cartesian_from_degrees(*args.coords, elevation), args.radius))))

    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    print("Downloading tiles...")
    download_tiles_concurrently(tiles, outdir)
