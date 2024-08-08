# Google Maps 3D Tiles Downloader

Download Google Maps 3D Tiles as glTF (these can, for example, be imported into Blender).

Usage:
```
usage: download_tiles.py [-h] -k API_KEY -c COORDS [COORDS ...] -r RADIUS -o OUT

options:
  -h, --help            show this help message and exit
  -k API_KEY, --api-key API_KEY
                        your Google Maps 3d Tiles API key
  -c COORDS [COORDS ...], --coords COORDS [COORDS ...]
                        longitude latitude [degrees]
  -r RADIUS, --radius RADIUS
                        radius around provided long/lat to fetch [m]
  -o OUT, --out OUT     output directory to place tiles in
```

Example:
```
python -m scripts.download_tiles -k <your_api_key> -71.069929 42.350148 -r 800 -o tiles
```
