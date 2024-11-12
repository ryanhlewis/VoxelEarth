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
        raise RuntimeError(f"response not ok: {res.status_code}, {res.text}")
    data = res.json()
    if not data["status"] == "OK" or "results" not in data:
        raise RuntimeError(f"status not ok: {data['status']}, {data}")
    return data["results"][0]["elevation"]


import subprocess
import os
import hashlib

def calculate_sha256(file_path):
    """Calculate SHA-256 hash of a file's content."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()

def rotate_glb(input_file, output_file, position_output_file, origin_translation_file):
    command = [
        'node', 'scripts/rotateUtils.js', 
        input_file, output_file, position_output_file, origin_translation_file
    ]
    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Rotation failed: {result.stderr}")
        sys.exit(result.returncode)

    print(result.stdout)


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
    origin_translation_file = 'origin_translation.json'

    print("Downloading and rotating tiles...")
    for i, t in tqdm(enumerate(tiles), total=len(tiles)):
        input_path = outdir / f"{t.basename}.glb"

        with open(input_path, "wb") as f:
            f.write(t.data)

        # Rotate flat
        sha256_hash = calculate_sha256(input_path)
        old_file_path = outdir / f"{sha256_hash}_old.glb"
        rotated_file_path = outdir / f"{sha256_hash}.glb"
        position_output_file = outdir / f"{sha256_hash}_position.json"

        # Rename the original file with the SHA-256 hash and "_old"
        input_path.rename(old_file_path)

        # Rotate the GLB and save as the SHA-256 filename
        print(f"Rotating {t.basename} to {rotated_file_path.name}")
        rotate_glb(
            str(old_file_path), 
            str(rotated_file_path), 
            str(position_output_file), 
            str(origin_translation_file)
        )

        # Delete the old file after successful rotation
        if old_file_path.exists():
            old_file_path.unlink()
            print(f"Deleted {old_file_path.name}")