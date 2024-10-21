#!/bin/bash

# Ensure the script exits on any command failure
set -e

# Set CUDA and Trimesh2 paths - adjust to your setup
export CUDA_ARCH=${CUDA_ARCH:-"60"}
export TRIMESH2_DIR=${TRIMESH2_DIR:-"$HOME/trimesh2"}

# Verify that Trimesh2 directories exist
if [ ! -d "$TRIMESH2_DIR/include" ]; then
    echo "Error: Trimesh2 include directory not found at $TRIMESH2_DIR/include"
    exit 1
fi

if [ ! -d "$TRIMESH2_DIR/lib.Linux64" ]; then
    echo "Error: Trimesh2 library directory not found at $TRIMESH2_DIR/lib.Linux64"
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p build
cd build

# Run CMake to configure the build
cmake -DTrimesh2_INCLUDE_DIR:PATH="$TRIMESH2_DIR/include" \
      -DTrimesh2_LINK_DIR:PATH="$TRIMESH2_DIR/lib.Linux64" \
      -DCMAKE_CUDA_COMPILER=$(which nvcc) \
      -DCMAKE_CUDA_ARCHITECTURES="$CUDA_ARCH" ..

# Build the project using all available cores
cmake --build . --parallel $(nproc)

# Set up LD_LIBRARY_PATH to include necessary libraries
export LD_LIBRARY_PATH="$TRIMESH2_DIR/lib.Linux64:/usr/local/cuda/lib64:$LD_LIBRARY_PATH"

# Final message indicating successful build
echo "cuda_voxelizer build completed successfully!"
