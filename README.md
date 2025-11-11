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
We also show how our custom Minecraft plugin can load in Google Earth into Minecraft on the fly. The plugin should work on Windows and Linux, but needs some weird setup since it uses Python and NodeJS. **(Linux / NVIDIA GPU Voxelizer is optional, but will make it faster.)** 

To make it easier, we have made bash scripts that handle Node/Python dependencies.

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

For those who prefer to do it barebones without a zipfile- install Ubuntu from the Microsoft Store and inside of it, paste:

```bash
# Install Java and Maven
sudo apt update
sudo apt install -y openjdk-11-jdk maven python3 python3-pip nodejs npm

# Create server
mkdir -p ~/paper-server
cd ~/paper-server
wget https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/499/downloads/paper-1.20.4-499.jar -O paper.jar
mkdir -p plugins
wget -O plugins/FastAsyncWorldEdit-Bukkit-2.12.3.jar https://github.com/IntellectualSites/FastAsyncWorldEdit/releases/download/2.12.3/FastAsyncWorldEdit-Bukkit-2.12.3.jar
echo "eula=true" > eula.txt
git clone https://github.com/ryanhlewis/VoxelEarth.git voxelearth
cp -r voxelearth/minecraft-plugin/server-folder-items/* ./
# Optional GPU voxelizer, if left out, plugin falls back to CPU
chmod 777 cuda_voxelizer
cd scripts
npm install
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

[ ‌ ] **VXCH Patch**: We have an implementation in our [VXCH-patch](https://github.com/voxelearth/vxch-patch), which overhauls position files and indexed json into a Voxel Chunk (VXCH) binary format which is at least 5x faster and more disk efficient. 


### Developing
**CPU Voxelization:**\
Supported and works across the board. Used as a fallback when `cuda_voxelizer` is not present or does not work in the server directory.

To edit the CPU voxelizer, please test against our [CLI Jarfile](https://github.com/voxelearth/java-cpu-voxelizer) for much faster and easier development! After making your optimizations, feel free to drop your changes into the `JavaCpuVoxelizer.java` class in the plugin and open a pull request!

**GPU Voxelization:**\
*(Currently Linux-only / WSL2)*\
For GPU voxelization, you'll need to install the CUDA toolkit and ensure your system has a NVIDIA GPU. We recommend [WSL2 copy-paste commands from NVIDIA](https://developer.nvidia.com/cuda-downloads?target_os=Linux&target_arch=x86_64&Distribution=WSL-Ubuntu&target_version=2.0&target_type=deb_local).

If you end up needing to setup NVIDIA drivers- make sure to run these commands after using theirs.
   ```bash
export PATH=/usr/local/cuda/bin:$PATH
export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH

source ~/.bashrc
nvcc --version
   ```
NVCC should print a version if installed correctly.

**Locating Files**: First, let's copy trimesh2 and cuda_voxelizer directly to home for our Makefiles direct reference.
```bash
cp -r ~/voxelearth/trimesh2/ ~
cp -r ~/voxelearth/cuda_voxelizer/ ~
```
And we'll also need to install some libraries for Trimesh2 to build correctly.
```bash
sudo apt install libgl-dev
sudo apt install libglu-dev
sudo apt install libxi-dev
```


1. **Google Draco**: First, create a [Google Draco](https://github.com/google/draco) build for compression:
   ```bash
   cd ~
   git clone https://github.com/google/draco.git
   cd draco
   mkdir build
   cd build
   cmake ..
   make

   cp -r ~/draco/src/draco ~/trimesh2/include/
   cp -r ~/draco/build/draco/* ~/trimesh2/include/draco/
   ```
   
2. **Trimesh2**: First, we have to set up the primary dependency of cuda_voxelizer:
   ```bash
   cd trimesh2
   chmod 777 copyFiles.sh
   ./copyFiles.sh
   ```
   This script will automatically build and copy Trimesh2 files directly for cuda_voxelizer.

3. **cuda_voxelizer**: Finally, to set up our GPU voxelizer, follow these steps:
   ```bash
   cd cuda_voxelizer
   chmod 777 build.sh
   ./build.sh
   ```
   This will build the voxelizer and place it in the `cuda_voxelizer/build` directory.
   You can run it via..
   ```bash 
   chmod 777 build/cuda_voxelizer
   ./build/cuda_voxelizer
   ```

4. **Run test voxelizer**: Use the produced binary to debug and test voxelization.
   ```bash
   ./build/cuda_voxelizer -f myfile.glb -s 64 -o glb
   # Or, if you want to try out JSON for Minecraft
   ./build/cuda_voxelizer -f myfile.glb -s 64 -o json
   ```
   Remember - if you copy the binary to another folder you may have to fix the permissions again via chmod 777.

If there's any problems with the voxelization that need to be fixed, the following files are likely the culprits:
   
   [**voxelize.cu**](cuda_voxelizer/src/voxelize.cu): This is the main CUDA shader file that handles the voxelization and color assignment process. It is passed variables from [**main.cpp**](cuda_voxelizer/src/main.cpp). Any issues with the voxelization or textures will be found here. "Segmentation faults" will always be found here. 
   
   [**util_io.cpp**](cuda_voxelizer/src/util_io.cpp): This is the export script for the voxelizer. Any issues with exporting the voxelized GLB will be found here as well as any future support for other formats like Minecraft JSON or Schematic.

   [**TriMesh_io.cc**](trimesh2/libsrc/TriMesh_io.cc): Our ad-hoc implementation of importing GLTF files and extracting their textures into the voxelizer. Any issues with the GLTF format or importing will be found here.

#### Minecraft
To develop or run our Minecraft plugin, note you MUST be in WSL2-Ubuntu, and run the following:
```bash
# Install Java and Maven
sudo apt update
sudo apt install -y openjdk-11-jdk maven python3 python3-pip nodejs npm

# Create server
mkdir -p ~/paper-server
cd ~/paper-server
wget https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/499/downloads/paper-1.20.4-499.jar -O paper.jar
mkdir -p plugins
wget -O plugins/FastAsyncWorldEdit-Bukkit-2.12.3.jar https://github.com/IntellectualSites/FastAsyncWorldEdit/releases/download/2.12.3/FastAsyncWorldEdit-Bukkit-2.12.3.jar
echo "eula=true" > eula.txt
git clone https://github.com/ryanhlewis/VoxelEarth.git voxelearth
cp -r voxelearth/minecraft-plugin/server-folder-items/* ./
chmod 777 cuda_voxelizer
cd scripts
npm install
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
   - **Modifications**: Enhanced voxelization pipeline to ingest GLTF files via THREE.js, serves as the CPU-based voxelizer.

2. **cuda_voxelizer by ForceFlow**
   - **Original Repository**: [cuda_voxelizer](https://github.com/Forceflow/cuda_voxelizer) + [TriMesh2](https://github.com/Forceflow/TriMesh2)
   - **Modifications**: Added support for color and GLTF format, optimized CUDA shaders, serves as the GPU-based voxelizer.

3. **google-earth-as-gltf by Omar Shehata**
   - **Original Repository**: [google-earth-as-gltf](https://github.com/OmarShehata/google-earth-as-gltf)
   - **Modifications**: Adapted for integration with voxelization pipeline via proxy, used for front-end visualization and navigation.

4. **3dtiles-dl by Lukas Lao Beyer**
   - **Original Repository**: [3dtiles-dl](https://github.com/lukaslaobeyer/3dtiles-dl)
   - **Modifications**: Added support for custom location downloads and GLB conversion, used for on-demand highest-resolution tileset retrieval.

All original library code is licensed under their respective licenses. See individual LICENSE files in each modified library directory for more details.

### Contributing
Contributions to Voxel Earth are welcome! Please fork the repository and submit a pull request. Ensure that your code follows the existing style and passes all tests.

### License
Voxel Earth is licensed under the MIT License. See the LICENSE file for more details.

### Acknowledgements
We use Google Photorealistic 3D Tiles under fair use and load data on-demand without downloading or caching outside of development.

Special thanks to Lucas Dower, ForceFlow, Cesium, Google, and Omar Shehata for their incredible work and open-source contributions. Voxel Earth would not be possible without their efforts.
