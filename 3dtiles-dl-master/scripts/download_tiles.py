from src.tile_api import TileApi
from src.bounding_volume import Sphere
from src.wgs84 import cartesian_from_degrees

import argparse
from pathlib import Path
import sys

import requests
from tqdm import tqdm


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


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-k", "--api-key",
                        help="your Google Maps 3d Tiles API key",
                        required=True)
    parser.add_argument("-c", "--coords",
                        help="longitude latitude [degrees]",
                        type=float,
                        nargs='+',
                        required=True)
    parser.add_argument("-r", "--radius",
                        help="radius around provided long/lat to fetch [m]",
                        type=float, required=True)
    parser.add_argument("-o", "--out",
                        help="output directory to place tiles in",
                        required=True)

    args = parser.parse_args()
    if len(args.coords) != 2:
        print("Must provide two coordinates: -c <longitude> <latitude>")
        sys.exit(-1)

    print("Querying elevation...")
    elevation = _get_elevation(*args.coords, args.api_key)

    api = TileApi(key=args.api_key)
    print("Traversing tile hierarchy...")
    tiles = list(tqdm(api.get(Sphere(
        cartesian_from_degrees(*args.coords, elevation),
        args.radius
    ))))

    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    print("Downloading tiles...")
    for i, t in tqdm(enumerate(tiles), total=len(tiles)):
        with open(outdir / Path(f"{t.basename}.glb"), "wb") as f:
            f.write(t.data)
