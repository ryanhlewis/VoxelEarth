# Voxel Earth

> Real places, in Minecraft.

 [![Join us on Discord](https://img.shields.io/discord/308323056592486420?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2")](https://discord.gg/8MK8J9EQGe)

Voxel Earth is a full pipeline for turning photogrammetry and 3D Tiles into block-based worlds.  
It streams Google Photorealistic 3D Tiles (and other sources) into Minecraft as voxelized chunks, so you can walk through real cities, mountains, and landmarks — block by block.

- 🌍 Stream real-world 3D Tiles into Minecraft
- 🧱 CPU voxelization, no GPU required on the server
- ⚡ Designed to work hand-in-hand with FastAsyncWorldEdit (FAWE)
- 🌐 Web client for browser-side experiments and previews
- 🧪 Separate CLIs for each pipeline stage (download → decode → voxelize)

---

## Links & Community

- **Website:** https://Voxel Earth.org  
- **Play server:** `play.Voxel Earth.org`  
- **Web client demo:** https://beta.Voxel Earth.org (browser viewer)  
- **Discord:** https://discord.gg/8MK8J9EQGe  
- **Monorepo (reference):** https://github.com/ryanhlewis/Voxel Earth  

---

## What is Voxel Earth and why should I use it?

Voxel Earth is a Minecraft + web ecosystem for exploring real-world geometry as voxels:

- **3D Tiles to blocks**  
  Fetches photogrammetry tiles (e.g. Google Photorealistic 3D Tiles), normalizes them, and converts them into Minecraft block palettes.

- **On-demand streaming**  
  Tiles are pulled and voxelized as players move around, so you can “walk into” a real city and watch it appear around you.

- **Flexible pipeline**  
  Each major step (download, Draco decode, voxelization) exists as a separate CLI tool and as embedded code in the plugin. You can test each stage locally before wiring everything together.

- **Server-friendly**  
  The Minecraft plugin is built as a single shaded JAR, with CPU voxelization and async integration with FAWE for high-throughput placement.

---

## Downloads

> **Note:** Links below are placeholders / targets; some may not exist yet.

- **Minecraft plugin (core Voxel Earth JAR)**  
  - GitHub Releases: https://github.com/ryanhlewis/Voxel Earth/releases (coming soon)  
  - Modrinth: https://modrinth.com/plugin/Voxel Earth (coming soon)  
  - SpigotMC: https://www.spigotmc.org/resources/Voxel Earth.00000/ (coming soon)  

- **Web client**  
  - GitHub: https://github.com/Voxel Earth/web-client  

- **Pipeline CLIs**  
  - 3D Tiles downloader: https://github.com/Voxel Earth/java-3dtiles-downloader  
  - Draco decoder: https://github.com/Voxel Earth/java-draco-decoder  
  - CPU voxelizer: https://github.com/Voxel Earth/java-cpu-voxelizer  

---

## Minecraft Plugin

### Requirements

- **Server:** Paper or Spigot **1.20.4+** (primary target is Paper 1.20.4)  
- **Java:** **Java 21+** (plugin compiled with `--release 21`)  
- **Plugins:**
  - Optional but highly recommended: **FastAsyncWorldEdit (FAWE)** matching your server version  
  - WorldEdit is detected when present, but not strictly required

### Version & FAWE Compatibility

Voxel Earth has two placement paths:

1. **BlockPlacer (no FAWE)** — a direct placement path that can work on **1.7–1.20.4** in code, using a single `BlockPlacer.java` binding.
2. **FAWE-powered placement** — uses FAWE’s async/world editing API for higher throughput on modern servers.

Current status of the public plugin builds:

- **Minecraft 1.20.4 (Paper/Spigot)**  
  - ✅ Actively tested and supported  
  - ✅ FAWE **optional** – if FAWE is not installed, Voxel Earth falls back to its internal BlockPlacer path  
  - ✅ Works as a single plugin JAR, no GPU required

- **Minecraft 1.20.x+ (e.g. 1.20.5+, 1.21, …)**  
  - ⚠ Expected to work, but **you should install a matching FAWE build** for your server version  
  - The core logic is version-agnostic, but we assume a FAWE jar is present to handle large edits efficiently

- **Minecraft 1.7–1.19.x**  
  - 🧪 The BlockPlacer path is designed to be compatible with 1.7–1.20.4, but **we are not currently shipping prebuilt jars below 1.20**  
  - Supporting older versions will require building a version-specific plugin from source / dedicated branches

If you’re running **1.20.4**, you can run Voxel Earth with or without FAWE installed.  
If you’re running **1.20+ but not 1.20.4**, plan to drop FAWE into your `plugins/` folder.

---

## Quick Start – Barebones Server Setup (1.20.4)

### Linux (Paper + FAWE + Voxel Earth)

```bash
# Create server folder
mkdir -p ~/paper-server
cd ~/paper-server

# Download Paper 1.20.4
wget https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/499/downloads/paper-1.20.4-499.jar -O paper.jar

# Plugins folder
mkdir -p plugins

# (Recommended) Install FAWE for 1.20.4
wget -O plugins/FastAsyncWorldEdit-Bukkit-2.12.3.jar \
  https://github.com/IntellectualSites/FastAsyncWorldEdit/releases/download/2.12.3/FastAsyncWorldEdit-Bukkit-2.12.3.jar

# Accept the EULA
echo "eula=true" > eula.txt

# Clone Voxel Earth repo (monorepo reference)
git clone https://github.com/ryanhlewis/Voxel Earth.git Voxel Earth

# Copy the Minecraft plugin server files (configs, default worlds, etc.)
cp -r Voxel Earth/minecraft-plugin/server-folder-items/* ./
````

Drop your **Voxel Earth.jar** (built from this repo) into `plugins/`, then start the server:

```bash
java -Xms2G -Xmx4G -jar paper.jar nogui
```

### Windows (PowerShell / CMD + Git Bash)

Use the same steps, or use the provided scripts in the `dynamicloader` / server tooling repos if you prefer a one-click setup. The plugin is cross-platform; just ensure Java 21 and Paper 1.20.4+.

---

## Commands

Voxel Earth’s plugin adds commands for geocoding, tile loading, and per-player preferences:

```yml
/visit <location>
  Teleport to a geocoded location (city, landmark, etc.) and stream tiles around it.

/visitradius <tiles>
  Configure how many tiles /visit loads around the target area.

/moveradius <tiles>
  Set how many tiles are loaded as the player moves.

/movethreshold <blocks>
  Movement distance (in blocks) required before triggering new loads.

/moveload <on|off|toggle|status>
  Enable/disable movement-based loading for yourself.

/visitother <player> <location>
  Teleport another player to a geocoded location and stream tiles.

/visitradiusother <player> <tiles>
/moveradiusother <player> <tiles>
/movethresholdother <player> <blocks>
  Admin variants that adjust settings and notify other players.

/createcustomworld <worldname>
  Creates a new world using the Voxel Earth chunk generator.

/regenchunks <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>
  Regenerate chunks with custom scaling and offsets for voxel imports.

/loadjson <filename> <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>
  Load a pre-voxelized JSON chunk set and apply transforms.

/voxelapikey <google-api-key>
  Store a Google API key for geocoding and tile access (per server).
```

Permissions are namespaced under `Voxel Earth.*` and default to `true` or `op` as appropriate (see `plugin.yml` for full details).

---

## Web Client

If you just want to experiment with tiles and voxelization **in your browser**, use the web client:

* **Repo:** [https://github.com/Voxel Earth/web-client](https://github.com/Voxel Earth/web-client)
* **Live demo:** [https://beta.Voxel Earth.org](https://beta.Voxel Earth.org)

The web client:

* Fetches Google Photorealistic 3D Tiles in the browser
* Normalizes/rotates them into a viewable frame
* Can hand off data to the Voxel Earth voxelization pipeline
* Is ideal for exploring regions, testing zoom/SSE parameters, and visually inspecting tilesets before you spin up a Minecraft server

---

## Architecture & Companion Repositories

Voxel Earth is intentionally split into small, testable pieces. Each stage of the pipeline can be developed and validated in isolation.

### 1. 3D Tiles Download – `java-3dtiles-downloader`

**Repo:** [https://github.com/Voxel Earth/java-3dtiles-downloader](https://github.com/Voxel Earth/java-3dtiles-downloader)

A fast, parallel Java CLI that:

* Pulls Google Photorealistic 3D Tiles (GLB leaves) in a spherical region
* Uses a Google Maps Platform API key
* Can be tuned via radius, parallelism, and elevation options

**Local testing:**

```bash
cd java-3dtiles-downloader
mvn -q -DskipTests clean package

java -jar target/tiles-downloader-cli-1.0.0-all.jar \
  --key YOUR_GOOGLE_API_KEY \
  --lat 37.7793 --lng -122.4193 --radius 250 \
  -o out --parallel 16 -v
```

Use this to validate tile queries and raw GLB downloads before they ever touch Minecraft.

---

### 2. Draco Decode – `java-draco-decoder`

**Repo:** [https://github.com/Voxel Earth/java-draco-decoder](https://github.com/Voxel Earth/java-draco-decoder)

Small CLI that decodes Draco-compressed GLB/GLTF into plain GLB 2.0 via LWJGL + Assimp.

**Local testing:**

```bash
cd java-draco-decoder
mvn -q -DskipTests clean package

java -jar target/draco-decoder-cli-1.0.0-all.jar \
  -f in.glb -o out -j 8 -v
```

This is the reference implementation for the **Draco decompression stage**. The Minecraft plugin mirrors this logic internally, so if something decodes here, it should decode inside Voxel Earth as well.

---

### 3. CPU Voxelization – `java-cpu-voxelizer`

**Repo:** [https://github.com/Voxel Earth/java-cpu-voxelizer](https://github.com/Voxel Earth/java-cpu-voxelizer)

CLI voxelizer that:

* Converts GLB meshes into JSON “block + xyzi” files
* Emits the same formats used by the in-plugin voxelization
* Supports 3D Tiles cube bounds and adjustable voxel grid sizes

**Local testing:**

```bash
cd java-cpu-voxelizer
mvn -q -DskipTests clean package

java -jar target/voxelizer-cli-1.0.0-all.jar \
  -f /path/to/tile.glb -s 128 -o out -3dtiles -v
```

Use this to:

* Iterate on voxelization performance and quality
* Compare CPU output vs any GPU pipeline you use
* Debug geometry issues without rebuilding the Minecraft plugin

Once you’re happy, you can port your changes into the plugin’s internal voxelizer classes and open a PR.

---

### 4. Minecraft Integration

Inside the Minecraft plugin:

* Player position is mapped to **latitude/longitude** and a tile region
* Tiles are:

  1. Downloaded (or retrieved from cache)
  2. Draco-decoded if necessary
  3. Voxelized via the CPU path
* Blocks are placed into the world using:

  * The built-in **BlockPlacer** path (1.20.4, and potentially 1.7–1.20.4)
  * Or **FAWE** for async large-scale edits on modern servers

Key class for world generation and streaming is typically:

* `VoxelChunkGenerator.java` (or equivalent) – handles mapping geo → chunks and orchestrating voxel data into Minecraft.

---

## Roadmap

High-level goals (✔ = done / implemented in some form):

* ✔ **CPU voxelization**
  Robust fallback path, used by default in the plugin and mirrored by the CLI voxelizer.

* ✔ **Rotation & coordinate fixes**
  Proper conversion from ECEF to a local ENU-like frame to keep voxels “flat” on terrain.

* ✔ **Dynamic chunk loading**
  Player movement drives which tiles/voxels are streamed in, giving a continuous exploration experience.

* ✔ **Web-based voxelization experiments**
  The web client ships with an in-browser voxelization path for quick visualization.

* ☐ **Version-specific plugin builds**
  Prebuilt artifacts targeting more server versions (e.g. 1.21+ variants, possible legacy builds).

* ☐ **VXCH / custom chunk formats**
  We have experimental work on VXCH chunk formats and binary packing for faster IO, to be integrated once it clearly outperforms the in-memory approach.

* ☐ **Voxel Mars & Voxel Moon**
  Support other common Cesium 3D Tiles, especially open-source or freely licensed ones.

---

## Developing the Minecraft Plugin

### Build

```bash
cd minecraft-plugin
mvn -Pdebug clean package
```

This typically produces a shaded JAR like:

```text
target/Voxel Earth.jar
```

Copy that into the server’s `plugins/` folder:

```bash
cp target/Voxel Earth.jar ~/paper-server/plugins/
```

Then (re)start your server:

```bash
cd ~/paper-server
java -Xms2G -Xmx4G -jar paper.jar nogui
```

While developing:

* Run the server in one terminal
* Rebuild + copy the JAR from another
* Use `/reload` or a plugin manager only if you understand the risks; full restarts are safest for debugging complex pipelines

---

## Included & Related Libraries

Voxel Earth derives ideas and/or code from several open-source projects:

1. **ObjToSchematic by Lucas Dower** *(historical, removed)*

   * Original: [https://github.com/LucasDower/ObjToSchematic](https://github.com/LucasDower/ObjToSchematic)
   * Previously used for OBJ/GLTF imports; superseded by our custom voxelization path.

2. **cuda_voxelizer by ForceFlow** *(historical, removed)*

   * Original: [https://github.com/Forceflow/cuda_voxelizer](https://github.com/Forceflow/cuda_voxelizer) and [https://github.com/Forceflow/TriMesh2](https://github.com/Forceflow/TriMesh2)
   * Used to experiment with GPU voxelization. Disk IO overhead made the end-to-end pipeline slower than a good CPU-only approach in this context.

3. **google-earth-as-gltf by Omar Shehata** *(web client)*

   * Original: [https://github.com/OmarShehata/google-earth-as-gltf](https://github.com/OmarShehata/google-earth-as-gltf)
   * Inspires and underpins the logic in our web client for fetching and normalizing tiles.

4. **3dtiles-dl by Lukas Lao Beyer** *(reimplemented in Java)*

   * Original: [https://github.com/lukaslaobeyer/3dtiles-dl](https://github.com/lukaslaobeyer/3dtiles-dl)
   * Influenced our Java downloader (`java-3dtiles-downloader`) for on-demand tileset retrieval.

5. **Cesium / loaders.gl / 3DTilesRendererJS**

   * Core ideas and tooling around 3D Tiles traversal, decoding, and visualization.

Each component keeps or adapts the original license where code is reused. Check the individual repositories for their LICENSE files.

---

## Acknowledgements & Data Usage

Voxel Earth uses **Google Photorealistic 3D Tiles** and other 3D Tiles sources.

* We treat the plugin as a **viewer / proxy**: tiles are fetched on demand, transformed into voxels, and streamed into memory for interactive exploration.
* When working with any tileset (Google or otherwise), **you are responsible for following the terms of service and licensing** for that data.
* In particular, do not modify the plugin to permanently archive or redistribute tiles when that violates the data provider’s rules.

Special thanks to:

* **Lucas Dower**, **ForceFlow**, **Omar Shehata**, **Cesium**, **Google**, **Lukas Lao Beyer**, and the broader open-source 3D Tiles community.
* Everyone experimenting with voxelization, photogrammetry, and Minecraft — your tools and ideas are what made Voxel Earth possible.

---

## Contributing

Contributions are very welcome!

Because Voxel Earth is split into multiple components, you can choose the layer that best fits your interests:

* **Minecraft plugin** – streaming logic, chunk generation, block palettes, FAWE integration
* **Download stage** – improvements to `java-3dtiles-downloader` (rate limiting, smarter tiling, new providers)
* **Draco decode** – performance and robustness improvements in `java-draco-decoder`
* **Voxelizer** – algorithmic work in `java-cpu-voxelizer` (better filling, meshes, performance)
* **Web client** – UX, rendering, and browser-side experiments in `web-client`

Typical workflow:

1. Fork the relevant repository (plugin or one of the CLIs).
2. Develop and test your changes locally using the CLI tools and/or a test server.
3. Open a pull request with:

   * A clear description of what you changed and why
   * Any performance regressions/benchmarks if applicable
   * Notes on how it affects Minecraft integration, if at all

Please follow the existing code style and ensure `mvn test` (where present) passes.

---

## License

Voxel Earth and its companion CLIs are released under the **MIT License**, unless otherwise noted in sub-projects.
See the `LICENSE` file in this repository for full terms.

“Minecraft” is a trademark of Mojang AB.
Voxel Earth is not affiliated with or endorsed by Mojang AB, Microsoft, or Google.
