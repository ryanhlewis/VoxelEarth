# Voxel Earth
Voxel Earth is a pipeline aimed at converting photogrammetry data into voxel-based landscapes, creating a detailed voxel representation of the Earth. This project leverages high-resolution 3D Tiles from various sources and transforms them into interactive, voxelized worlds, primarily for use in Minecraft and VR environments.

### Project Overview
Voxel Earth acts as both a proxy and pipeline to convert 3D Tiles into voxel representations. It is designed to handle large datasets efficiently, converting any Cesium 3D Tile into a voxelized format and serving it back for visualization. This process extends to any 3D Tiles, including open-source photogrammetry tilesets.

### Features
- **High-Resolution Conversion**: Converts Google’s 3D Tiles into Minecraft blocks, creating detailed voxel representations of real-world locations.
- **Multi-Resolution Viewing**: Users can adjust the voxel count to view landmarks at different levels of detail.
- **Interactive Visualization**: Compatible with Minecraft and online maps, allowing users to explore and interact with voxelized environments.
- **Scalability**: Efficiently handles large datasets, reducing the time and effort needed to create detailed virtual worlds.

### Usage

#### Map Viewer

Please install NodeJS and Yarn before running the pipeline.
NodeJS can be downloaded from [here](https://nodejs.org/en/download/). After installing, run the following command to install Yarn.
```bash
npm install --global yarn
```

To begin, clone the repository and follow the steps below to set up the pipeline. Voxel Earth supports both CPU and GPU voxelization methods, each with its own requirements.
```bash
git clone https://github.com/ryanhlewis/voxelearth.git
cd voxelearth
```
To see your browser render Voxel Earth, just run the following command:
```bash
cd ObjToSchematic
npm install
node server.js
   ```
You should see several workers (voxelizers) start up. This is the proxy server for tile requests. Now, we'll set up the visualizer. In another terminal, run the following commands:
```bash
cd tiles3d-demo
yarn install
yarn start
```
Now, you'll see the map load in- but every GLB model is voxelized! Adjust grid size or GPU/CPU in [server.js](ObjToSchematic/server.js). Note CPU works on all platforms, GPU only on NVIDIA + Linux (or WSL2), as we have only compiled the Linux binary.


#### Single Files, Custom Locations
There are also other demos available, such as custom GPU or CPU voxelization on single files or even custom locations. We've made a script to help you get started. 
```bash
cd ObjToSchematic
node voxelize.js myfile.glb cpu # For CPU voxelization
node voxelize.js myfile.glb # For GPU voxelization
```
This will save to myfile_voxel.glb.

For the custom location demo, we show how to load only the highest-resolution tiles around a custom location. Since this particular demo uses cuda_voxelizer, you'll need to run this on Linux/WSL2 with an NVIDIA GPU.
```bash
cd 3dtiles-dl-master
npm install
node server.js
```
Since this demo uses BlenderPy, you may need to install some additional dependencies if any errors occur in console. Use Python 3.10.6 for best compatibility with Blender.
```bash
pip install numpy tqdm bpy pillow
```

Note that you can use our scripts from this demo separately like:
```bash
# Save highest res tiles as GLB to a directory
python -m threaded_api -k ${apiKey} -c ${coords} -r ${radius} -o ${outputDir}

# Make a combined.glb of all the tiles in a directory
python combine_glb.py -- input_directory/ input_directory/combined.glb
```
Note coords are in the format "lon lat" with no string quotes, such as -122.4194 37.7749.

#### Minecraft
We also show how our custom Minecraft plugin can load in Google Earth into Minecraft on the fly. 
The plugin is available inside `minecraft-plugin` and can be installed by copying the jar file to your Minecraft server's `plugins` directory. 
```bash
cp minecraft-plugin/VoxelEarth.jar /path/to/minecraft/server/plugins/
```
*NOTE: This plugin is still in development and may not work as expected.
Do NOT use without making a backup of your server. Make an empty server to try it out!*

### Roadmap

Our overall goal is to make an interactive Earth accessible in Minecraft. Currently, we are working on the following features:

[ ✔ ] **GPU Voxelization**: Optimize the voxelization process using CUDA shaders for on-demand voxelization (credit to Forceflow's implementation)

[ ✔ ] **Texture Fixes**: Our current GPU voxelization gets textures mostly accurate, but is somewhat spotty with white/black pixels and needs to be revised.

[ ✔ ] **Rotation Fixes**: Convert 3D Tiles from ECEF to ENU to properly orient the object before voxelizing and have "flat voxels" instead of diagonal (credit to Google Earth team for this advice).

[ㅤ] **Minecraft Chunk Loading**: Map a player's location to the voxelized world, loading chunks as needed to create a seamless experience.

### Developing
**CPU Voxelization:**\
There's not really a huge need to develop for CPU voxelization, as it is mostly already worked out by Lucas Dower and his team with [ObjToSchematic](). If anything is wrong with this implementation, it's likely with our integration on their work.
1. **Install Dependencies**: First, set up ObjToSchematic by performing the following steps.
   ```bash
   cd ObjToSchematic
   npm install
   ```
2. **Run test voxelizer**: Use our single-file voxelizer to debug and test voxelization.
   ```bash
   node voxelize.js myfile.glb cpu
   ```
If there's any problems with the voxelization that need to be fixed, the following files are likely the culprits:

[**magic.js**](ObjToSchematic/magic.js): Aptly named, this is a node-fixing script for the 3D Tiles format that properly scales, rotates, and copies all original attributes from the 3D Tile to the voxelized GLB. GLB Extension issues (Draco, Unlit), rotation, and scaling issues will be found here.

[**convertToGLB.js**](ObjToSchematic/src/convertToGLB.js): This file is where we export from ObjToSchematic's voxel format into a GLB object by reconstructing each voxel. Texture or color issues and any voxelization issues will be found here.


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
To develop our Minecraft plugin, first we'll set up an example Spigot server and plugin.
```bash
# Install Java and Maven
sudo apt update
sudo apt install openjdk-11-jdk maven -y

# Create server
mkdir ~/spigot-server
cd ~/spigot-server
wget https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar
java -jar BuildTools.jar --rev 1.20.5
mkdir -p ~/spigot-server/plugins
java -Xms512M -Xmx1024M -jar spigot-1.20.5.jar nogui
echo "eula=true" > eula.txt
```

Finally, copy over the voxelization files. In future versions, this should be inside Java plugin, 
but for right now it's easier to develop via bindings to our Python and NodeJS code.
```bash
cd ~/voxelearth/minecraft-plugin/
cp -r ./server-folder-items/* ~/spigot-server/
chmod 777 ~/spigot-server/cuda_voxelizer
cd ~/spigot-server/scripts/
npm install
```

Now, to develop the plugin, you can edit the files in `~/voxelearth/minecraft-plugin/`, and keep rebuilding and copying the jar to the server:
```bash
cd ~/voxelearth/minecraft-plugin/
mvn clean package
cp target/myplugin-1.0-SNAPSHOT.jar ~/spigot-server/plugins/
```
and keep starting or restarting the server with another terminal:
```bash
cd ~/spigot-server
java -Xms512M -Xmx1024M -jar spigot-1.20.5.jar nogui
```

If there's any problems with the Minecraft plugin, the main file that should be edited is:
   
   [**VoxelChunkGenerator.java**](minecraft-plugin/src/main/java/com/example/VoxelChunkGenerator.jav): This is the main file that handles mapping the player's location to a latitude and longitude, then loading the voxelized GLB into the Minecraft world.
   

Currently, new tiles are populated when the server is booted and does not have a 'world' folder. If the "0,0" chunk is loaded, then you will see the console begin to download and convert tiles. Buggy servers will sometimes not load 0,0, if this is the case, delete the world folder and restart the server.

Inside your server with the Voxel Earth plugin, there are two commands so far:
```yml
  regenchunks:
    description: Regenerate chunks with new scale and offsets.
    usage: /regenchunks <scale> <offsetX> <offsetY> <offsetZ>
  loadjson:
    description: Load a JSON file and apply scaling and offset.
    usage: /loadjson <filename> <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>
```
RegenChunks will use the initial tileset from tiles0_0 folder and spawn in the tiles again. It does not fetch new tiles. That is in future work.

LoadJSON will use a relative JSON file location to the server directory and spawn it in. This is primarily for debugging.


### Included Libraries
This project includes modified versions of the following libraries:

1. **ObjToSchematic by Lucas Dower**
   - **Original Repository**: [ObjToSchematic](https://github.com/LucasDower/ObjToSchematic)
   - **Modifications**: Enhanced voxelization pipeline to ingest GLTF files via THREE.js, serves as the CPU-based voxelizer.

2. **cuda_voxelizer by ForceFlow**
   - **Original Repository**: [cuda_voxelizer](https://github.com/Forceflow/cuda_voxelizer) + [TriMesh2](https://github.com/Forceflow/TriMesh2)
   - **Modifications**: Added support for color and GLTF format, optimized CUDA shaders, serves as the GPU-based voxelizer.

3. **tiles3d-demo by CartoDB**
   - **Original Repository**: [tiles3d-demo](https://github.com/CartoDB/tiles3d-demo)
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

Special thanks to Lucas Dower, ForceFlow, Cesium, Google, and the CartoDB team for their incredible work and open-source contributions. Voxel Earth would not be possible without their efforts.