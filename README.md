# Voxel Earth
Voxel Earth is a pipeline aimed at converting photogrammetry data into block-based landscapes, creating a detailed voxel representation of the Earth. This project leverages 3D Tiles from various sources and transforms them into interactive, voxelized worlds, primarily for use in Minecraft.

### Project Overview
Voxel Earth acts as both a proxy and pipeline to convert 3D Tiles into voxel representations. It is designed to handle large datasets efficiently, converting any 3D Tile into a voxelized format and serving it back for visualization. This process extends to any 3D Tiles, including open-source photogrammetry tilesets.

### Features
- **High-Resolution Conversion**: Converts Google’s 3D Tiles into Minecraft blocks, creating detailed block representations of real-world locations.
- **Multi-Resolution Viewing**: Users can adjust the voxel count to view landmarks at different levels of detail.
- **Interactive Visualization**: Compatible with Minecraft and web, allowing users to explore and interact with voxelized environments.

### Usage

#### Map Viewer

Moved to [Web Client](https://github.com/voxelearth/web-client) repository.
This will voxelize and render 3D Tiles all in your browser.

#### Minecraft
We also show how our custom Minecraft plugin can load in Google Earth into Minecraft on the fly. The plugin should work on Windows, Linux, and Mac, and supports no GPU. Note that you should NOT run this plugin on an existing Minecraft world! It spawns in gigantic mega-structures. Use a fresh world / server!
To make it easier, we have made bash scripts that auto-setup new servers.

The fastest setup for Linux is:
```
git clone https://github.com/voxelearth/dynamicloader
cd dynamicloader
./setupsingle.sh
```
For Windows, download and use the same zipfile with a bash script.
```
git clone https://github.com/voxelearth/dynamicloader
cd dynamicloader
./setupsingle.bat
```

For those who prefer to do it barebones:

```bash
mkdir -p ~/paper-server
cd ~/paper-server
wget https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/499/downloads/paper-1.20.4-499.jar -O paper.jar
mkdir -p plugins
wget -O plugins/FastAsyncWorldEdit-Bukkit-2.12.3.jar https://github.com/IntellectualSites/FastAsyncWorldEdit/releases/download/2.12.3/FastAsyncWorldEdit-Bukkit-2.12.3.jar
echo "eula=true" > eula.txt
git clone https://github.com/ryanhlewis/VoxelEarth.git voxelearth
cp -r voxelearth/minecraft-plugin/server-folder-items/* ./
cd ..
```
Now, the server can run easily using:
```
java -Xms512M -Xmx1024M -jar paper.jar nogui
```

*NOTE: This plugin is still in development and may not work as expected.
Do NOT use without making a backup of your server. Make an empty server to try it out!*

Inside your server with the Voxel Earth plugin, there are five commands so far:
```yml
  visit:
    description: Teleport to a city or location using geocoding.
    usage: /visit <location>
  visitradius:
    description: Set how many tiles /visit loads around the target
    usage: /visitradius <tiles>
  moveradius:
    description: Set how many tiles movement-triggered loads will fetch
    usage: /moveradius <tiles>
  movethreshold:
    description: Set the movement distance threshold (in blocks) for triggering loads
    usage: /movethreshold <blocks>
  moveload:
    description: Toggle movement-based loading for yourself
    usage: /moveload <on|off|toggle|status>
```

### Roadmap

Our overall goal is to make an interactive Earth accessible in Minecraft. Currently, we are working on the following features:

[ ✔ ] **GPU Voxelization**: Optimize the voxelization process using CUDA shaders for on-demand voxelization (credit to Forceflow's implementation)

[ ✔ ] **Texture Fixes**: Our current GPU voxelization gets textures mostly accurate, but is somewhat spotty with white/black pixels and needs to be revised.

[ ✔ ] **Rotation Fixes**: Convert 3D Tiles from ECEF to ENU to properly orient the object before voxelizing and have "flat voxels" instead of diagonal (credit to Google Earth team for this advice).

[ ✔ ] **Minecraft Chunk Loading**: Map a player's location to the voxelized world, loading chunks as needed to create a seamless experience.

[ ✔‌ ] **CPU Voxelization**: We have an implementation in our [web-client](https://github.com/voxelearth/web-client), port it to work with the plugin.

[ ‌ ] **VXCH Patch**: We have an implementation in our [VXCH-patch](https://github.com/voxelearth/vxch-patch), which overhauls position files and indexed json into a Voxel Chunk (VXCH) binary format which is at least 5x faster and more disk efficient. Unclear if this is needed anymore with the In-Memory (no storage IO) patch.

[ ✔‌‌ ] **Collapse NodeJS dependency**: We have external reliance on NodeJS (Draco decompression + rotation). Porting these to be inside the Java would be better to allow the plugin to just be a single jarfile- but NodeJS is super fast for massively parallel downloading + Draco decompression + GLB rotation! Would need to benchmark!

### Developing
**CPU Voxelization:**\
Supported and works across the board. Used as a fallback when `cuda_voxelizer` is not present or does not work in the server directory.

To edit the CPU voxelizer, please test against our [CLI Jarfile](https://github.com/voxelearth/java-cpu-voxelizer) for much faster and easier development! After making your optimizations, feel free to drop your changes into the `JavaCpuVoxelizer.java` class in the plugin and open a pull request!

**GPU Voxelization:**\
Deprecated in favor of a single Jarfile plugin with no external dependencies. Benchmarks revealed that the time spent voxelizing in GPU was hindered by the large storage IO overhead of writing everything to disk twice to transfer to and from the Java plugin. GPU Voxelization should be reintroduced as Java-memory only in the future.

#### Minecraft
To help develop our Minecraft plugin,
```bash
# Create server
mkdir -p ~/paper-server
cd ~/paper-server
wget https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/499/downloads/paper-1.20.4-499.jar -O paper.jar
mkdir -p plugins
wget -O plugins/FastAsyncWorldEdit-Bukkit-2.12.3.jar https://github.com/IntellectualSites/FastAsyncWorldEdit/releases/download/2.12.3/FastAsyncWorldEdit-Bukkit-2.12.3.jar
echo "eula=true" > eula.txt
git clone https://github.com/ryanhlewis/VoxelEarth.git voxelearth
cp -r voxelearth/minecraft-plugin/server-folder-items/* ./
cd ..
```

Now, to develop the plugin, you can edit the files in `voxelearth/minecraft-plugin/`, and keep rebuilding and copying the jar to the server:
```bash
cd ~/voxelearth/minecraft-plugin/
mvn -Pdebug clean package
cp target/myplugin-1.0-SNAPSHOT.jar ~/paper-server/plugins/
```
and keep starting or restarting the server with another terminal:
```bash
cd ~/paper-server
java -Xms512M -Xmx1024M -jar paper.jar nogui
```

If there's any problems with the Minecraft plugin, the main file that should be edited is:
   
   [**VoxelChunkGenerator.java**](minecraft-plugin/src/main/java/com/example/VoxelChunkGenerator.jav): This is the main file that handles mapping the player's location to a latitude and longitude, then loading the voxelized GLB into the Minecraft world.
   
### Included Libraries
This project includes modified versions of the following libraries:

1. **ObjToSchematic by Lucas Dower** (deprecated, removed)
   - **Original Repository**: [ObjToSchematic](https://github.com/LucasDower/ObjToSchematic)
   - **Modifications**: Deprecated in favor of custom 2.5D Scan CPU voxelization. Originally enhanced voxelization pipeline to ingest GLTF files via THREE.js.

2. **cuda_voxelizer by ForceFlow** (deprecated, removed)
   - **Original Repository**: [cuda_voxelizer](https://github.com/Forceflow/cuda_voxelizer) + [TriMesh2](https://github.com/Forceflow/TriMesh2)
   - **Modifications**: Deprecated as the storage IO was too high. Should add back compiled Java link or binary in the future. Added support for color and GLTF format, optimized CUDA shaders, serves as the GPU-based voxelizer. Falls back to CPU if not present.

3. **google-earth-as-gltf by Omar Shehata** (for web-client)
   - **Original Repository**: [google-earth-as-gltf](https://github.com/OmarShehata/google-earth-as-gltf)
   - **Modifications**: Adapted for integration with voxelization pipeline via proxy, used for front-end visualization and navigation.

4. **3dtiles-dl by Lukas Lao Beyer** (Java implementation)
   - **Original Repository**: [3dtiles-dl](https://github.com/lukaslaobeyer/3dtiles-dl)
   - **Modifications**: Converted to Java. Added support for custom location downloads and GLB conversion, used for on-demand highest-resolution tileset retrieval.

All original library code is licensed under their respective licenses. See individual LICENSE files in each modified library directory for more details.

### Contributing
Contributions to Voxel Earth are welcome! Please fork the repository and submit a pull request. Ensure that your code follows the existing style and passes all tests.

### License
Voxel Earth is licensed under the MIT License. See the LICENSE file for more details.

### Acknowledgements
We use Google Photorealistic 3D Tiles under fair use and load data on-demand without downloading or caching outside of development. Note that if you use this plugin with any tileset you do not have the license to - you are expected to follow their TOS. Specifically, you should not alter the plugin to save tiles permanently, as it currently is set up as a temporary viewer.

Special thanks to Lucas Dower, ForceFlow, Cesium, Google, and Omar Shehata for their incredible work and open-source contributions. Voxel Earth would not be possible without their efforts.
