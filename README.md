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


#### Minecraft
We also show how our custom Minecraft plugin can load in the world on the fly. 


### Roadmap

Our overall goal is to make an interactive Earth accessible in Minecraft. Currently, we are working on the following features:

[ ✔ ] **GPU Voxelization**: Optimize the voxelization process using CUDA shaders for on-demand voxelization (credit to Forceflow's implementation)

[ㅤ] **Texture Fixes**: Our current GPU voxelization gets textures mostly accurate, but is somewhat spotty with white/black pixels and needs to be revised.

[ㅤ] **Rotation Fixes**: Convert 3D Tiles from ECEF to ENU to properly orient the object before voxelizing and have "flat voxels" instead of diagonal (credit to Google Earth team for this advice).

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
1. **Install Dependencies**: First, create a [Google Draco](https://github.com/google/draco) build for compression:
   ```bash
   cd ~
   git clone https://github.com/google/draco.git
   cd draco
   mkdir build
   cd build
   cmake ..
   make
   ```
   
2. **Trimesh2**: First, we have to set up the primary dependency of cuda_voxelizer:
   ```bash
   cd trimesh2
   ./copyFiles.sh
   ```
   You may have to `sudo chmod +x copyFiles.sh`. It's just a script to automatically build and copy Trimesh2 files directly for cuda_voxelizer.

3. **cuda_voxelizer**: Finally, to set up our GPU voxelizer, follow these steps:
   ```bash
   cd cuda_voxelizer/build
   ./build.sh
   ```
   This will build the voxelizer and place it in the `cuda_voxelizer/build` directory. If you have any issues building, you may need to adjust the `build.sh` file to reference your correct CUDA architecture (60, 70, 80, 90, etc).

4. **Run test voxelizer**: Use the produced binary to debug and test voxelization.
   ```bash
   ./cuda_voxelizer -f myfile.glb -s 64 -o glb
   # Or, if you want to try out JSON for Minecraft
   ./cuda_voxelizer -f myfile.glb -s 64 -o json
   ```

If there's any problems with the voxelization that need to be fixed, the following files are likely the culprits:
   
   [**voxelize.cu**](cuda_voxelizer/src/voxelize.cu): This is the main CUDA shader file that handles the voxelization and color assignment process. It is passed variables from [**main.cpp**](cuda_voxelizer/src/main.cpp). Any issues with the voxelization or textures will be found here. "Segmentation faults" will always be found here. 
   
   [**util_io.cpp**](cuda_voxelizer/src/util_io.cpp): This is the export script for the voxelizer. Any issues with exporting the voxelized GLB will be found here as well as any future support for other formats like Minecraft JSON or Schematic.

   [**TriMesh_io.cc**](trimesh2/libsrc/TriMesh_io.cc): Our ad-hoc implementation of importing GLTF files and extracting their textures into the voxelizer. Any issues with the GLTF format or importing will be found here.

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

All original library code is licensed under their respective licenses. See individual LICENSE files in each modified library directory for more details.

### Contributing
Contributions to Voxel Earth are welcome! Please fork the repository and submit a pull request. Ensure that your code follows the existing style and passes all tests.

### License
Voxel Earth is licensed under the MIT License. See the LICENSE file for more details.

### Acknowledgements
We use Google Photorealistic 3D Tiles under fair use and load data on-demand without downloading or caching outside of development.

Special thanks to Lucas Dower, ForceFlow, Cesium, Google, and the CartoDB team for their incredible work and open-source contributions. Voxel Earth would not be possible without their efforts.