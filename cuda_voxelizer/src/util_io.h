#pragma once
#include <cuda_runtime.h>

#include <string>
#include <iostream>
#include <fstream>
#include <assert.h>
#include "util.h"
#include "TriMesh_algo.h"
#include "util.h"
#include "libs/magicavoxel_file_writer/VoxWriter.h"

size_t get_file_length(const std::string base_filename);
void read_binary(void* data, const size_t length, const std::string base_filename);
void write_binary(void* data, const size_t bytes, const std::string base_filename);
void write_binvox(const unsigned int* vtable, const voxinfo v_info, const std::string base_filename);
void write_obj_pointcloud(const unsigned int* vtable, const voxinfo v_info, const std::string base_filename);
void write_obj_cubes(const unsigned int* vtable, const voxinfo v_info, const std::string base_filename);
// void write_vox(const unsigned int* vtable, const voxinfo v_info, const std::string base_filename);
void write_vox(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename);
void write_gltf(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename);
void write_gltf_with_draco(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename);
void write_gltf_pointcloud(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename);
void write_indexed_json(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename);
