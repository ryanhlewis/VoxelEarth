# Voxel Earth
Voxel Earth is a pipeline aimed at converting photogrammetry data into voxel-based landscapes, creating a detailed voxel representation of the Earth. This project leverages high-resolution 3D Tiles from various sources and transforms them into interactive, voxelized worlds, primarily for use in Minecraft and VR environments.

### Project Overview
Voxel Earth acts as both a proxy and pipeline to convert 3D Tiles into voxel representations. It is designed to handle large datasets efficiently, converting any Cesium 3D Tile into a voxelized format and serving it back for visualization. This process extends to any 3D Tiles, including open-source photogrammetry tilesets.

### Features
- **High-Resolution Conversion**: Converts Google’s 3D Tiles into Minecraft blocks, creating detailed voxel representations of real-world locations.
- **Multi-Resolution Viewing**: Users can adjust the voxel count to view landmarks at different levels of detail.
- **Interactive Visualization**: Compatible with Minecraft and VR, allowing users to explore and interact with voxelized environments.
- **Scalability**: Efficiently handles large datasets, reducing the time and effort needed to create detailed virtual worlds.

### Usage
To begin, clone the repository and follow the steps below to set up the pipeline. Voxel Earth supports both CPU and GPU voxelization methods, each with its own requirements.
```bash
git clone https://github.com/ryanhlewis/voxelearth.git`
cd voxelearth
```
**CPU Voxelization:**\
We'll focus on CPU voxelization for now, as it's the most straightforward method to get started.
1. **Install Dependencies**: First, set up ObjToSchematic by performing the following steps.
   ```bash
   cd ObjToSchematic
   npm install
   cd ..
   cd tiles3d-demo
   npm install
   ```
...

**GPU Voxelization:**\
For GPU voxelization, you'll need to install the CUDA toolkit and ensure your system has a NVIDIA GPU.
1. **Install Dependencies**: First, set up cuda_voxelizer by performing the following steps.
   ```bash
   (cmake/make installation todo)
   ...
   cd cuda_voxelizer
   ...
   ```
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
This project stands on the shoulders of giants. Special thanks to Lucas Dower, ForceFlow, and the CartoDB team for their incredible work and open-source contributions. Voxel Earth would not be possible without their efforts.