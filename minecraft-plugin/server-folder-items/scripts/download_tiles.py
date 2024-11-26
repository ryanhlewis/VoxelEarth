from src.tile_api import TileApi
from src.bounding_volume import Sphere
from src.wgs84 import cartesian_from_degrees

import argparse
from pathlib import Path
import sys

import requests
from tqdm import tqdm
import json


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

def rotate_glb(input_file, output_file, position_output_file, origin_translation=None):
    command = [
        'node', 'scripts/rotateUtils.js',
        input_file, output_file, position_output_file
    ]
    if origin_translation:
        command.append(json.dumps(origin_translation))

    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Rotation failed: {result.stderr}")
        sys.exit(result.returncode)

    # Parse origin_translation from the output
    origin_translation_output = None
    for line in result.stdout.splitlines():
        if line.startswith('ORIGIN_TRANSLATION'):
            origin_translation_str = line[len('ORIGIN_TRANSLATION'):].strip()
            origin_translation_output = json.loads(origin_translation_str)
            break

    return origin_translation_output



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
    parser.add_argument("--origin",
                        help="origin x y z coordinates",
                        type=float,
                        nargs=3,
                        required=False)

    args = parser.parse_args()
    if len(args.coords) != 2:
        print("Must provide two coordinates: -c <longitude> <latitude>")
        sys.exit(-1)

    print("Querying elevation...")
    elevation = _get_elevation(*args.coords, args.api_key)

    api = TileApi(key=args.api_key)
    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)

    print("Traversing tile hierarchy...")
    tiles = list(tqdm(api.get(Sphere(
        cartesian_from_degrees(*args.coords, elevation),
        args.radius
    ), output_dir=args.out)))
    
    origin_translation = args.origin  # This will be None if not provided
    downloaded_tiles = []  # Initialize the list to keep track of downloaded tiles

    print("Downloading and rotating tiles...")
    for i, tile in tqdm(enumerate(tiles), total=len(tiles)):
        rotated_file_path = outdir / f"{tile.hash}.glb"

        if rotated_file_path.exists():
            print(f"Rotated tile {rotated_file_path.name} already exists. Skipping.")
            downloaded_tiles.append(rotated_file_path.name)
            # print(f"DOWNLOADED_TILES:", json.dumps(downloaded_tiles))
            continue

        print(f"Downloading tile {tile.basename}")
        input_path = outdir / f"{tile.hash}_downloaded.glb"

        with open(input_path, "wb") as f:
            f.write(tile.data)

        position_output_file = outdir / f"{tile.hash}_position.json"
        print(f"Rotating {tile.basename} to {rotated_file_path.name}")

        # Pass origin_translation to rotate_glb
        origin_translation_output = rotate_glb(
            str(input_path),
            str(rotated_file_path),
            str(position_output_file),
            origin_translation
        )

        # Capture origin_translation from the first tile
        if origin_translation is None and origin_translation_output:
            origin_translation = origin_translation_output
            print(f"Captured origin_translation: {origin_translation}")

        if input_path.exists():
            input_path.unlink()
            print(f"Deleted {input_path.name}")

        # Add the rotated tile filename to the list
        downloaded_tiles.append(rotated_file_path.name)

    # At the very end, output the list with a unique marker
    print("DOWNLOADED_TILES:", json.dumps(downloaded_tiles))