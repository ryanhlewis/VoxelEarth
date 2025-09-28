#include "debug.h"
#include "util_io.h"

// For concurrency safety
#include <mutex>
#include <map>
#include <json.hpp>
#include <tiny_gltf.h>
#include <draco/compression/encode.h>
#include <draco/mesh/mesh.h>
#include <fstream>
#include <cassert>
#include <algorithm>
#include <cmath>
#include <cstring>
#include <iostream>

static std::mutex io_mutex;

size_t get_file_length(const std::string base_filename){
    std::lock_guard<std::mutex> lock(io_mutex);
    std::ifstream input(base_filename.c_str(), std::ios::ate | std::ios::binary);
    assert(input);
    size_t length = (size_t)input.tellg();
    input.close();
    return length;
}

void read_binary(void* data, const size_t length, const std::string base_filename){
    std::lock_guard<std::mutex> lock(io_mutex);
    std::ifstream input(base_filename.c_str(), std::ios::in | std::ios::binary);
    assert(input);
#ifndef SILENT
    fprintf(stdout, "[I/O] Reading %llu kb of binary data from file %s \n",
            (unsigned long long)(length / 1024ULL),
            base_filename.c_str());
    fflush(stdout);
#endif
    input.seekg(0, input.beg);
    input.read((char*) data, length);
    input.close();
    return;
}

// Helper function to write single vertex normal to OBJ file
static void write_vertex_normal(std::ofstream& output, const int3& v) {
    output << "vn " << v.x << " " << v.y << " " << v.z << std::endl;
}

// Helper function to write single vertex to OBJ file
static void write_vertex(std::ofstream& output, const int3& v) {
    output << "v " << v.x << " " << v.y << " " << v.z << std::endl;
}

// Helper function to write single face
static void write_face(std::ofstream& output, const int3& v) {
    output << "f " << v.x << " " << v.y << " " << v.z << std::endl;
}

// Helper function to write full cube (using relative vertex positions)
void write_cube(const int x, const int y, const int z, std::ofstream& output) {
	//	   2-------1
	//	  /|      /|
	//	 / |     / |
	//	7--|----8  |
	//	|  4----|--3
	//	| /     | /
	//	5-------6
    // Create vertices
	int3 v1 = make_int3(x+1, y+1, z + 1);
	int3 v2 = make_int3(x,   y+1, z + 1);
	int3 v3 = make_int3(x+1, y,   z + 1);
	int3 v4 = make_int3(x,   y,   z + 1);
	int3 v5 = make_int3(x,   y,   z);
	int3 v6 = make_int3(x+1, y,   z);
	int3 v7 = make_int3(x,   y+1, z);
	int3 v8 = make_int3(x+1, y+1, z);
	// write them in reverse order, so relative position is -i for v_i
	write_vertex(output, v8);
	write_vertex(output, v7);
	write_vertex(output, v6);
	write_vertex(output, v5);
	write_vertex(output, v4);
	write_vertex(output, v3);
	write_vertex(output, v2);
	write_vertex(output, v1);
	// create faces
	// back
	write_face(output, make_int3(-1, -3, -4));
	write_face(output, make_int3(-1, -4, -2));
	// bottom
	write_face(output, make_int3(-4, -3, -6));
	write_face(output, make_int3(-4, -6, -5));
	// right
	write_face(output, make_int3(-3, -1, -8));
	write_face(output, make_int3(-3, -8, -6));
	// top
	write_face(output, make_int3(-1, -2, -7));
	write_face(output, make_int3(-1, -7, -8));
	// left
	write_face(output, make_int3(-2, -4, -5));
	write_face(output, make_int3(-2, -5, -7));
	// front
	write_face(output, make_int3(-5, -6, -8));
	write_face(output, make_int3(-5, -8, -7));
}

// Write the voxel array as an OBJ full of cubes
void write_obj_cubes(const unsigned int* vtable, const voxinfo v_info, const std::string base_filename) {
	std::lock_guard<std::mutex> lock(io_mutex);

	std::string filename_output = base_filename
		+ std::string("_") + std::to_string(v_info.gridsize.x)
		+ std::string("_voxels.obj");
	std::ofstream output(filename_output.c_str(), std::ios::out);

#ifndef SILENT
	fprintf(stdout, "[I/O] Writing data in obj voxels format to file %s \n",
	        filename_output.c_str());
#endif

	assert(output);
	size_t voxels_seen = 0;
	size_t total_voxels = (size_t)v_info.gridsize.x
	                    * (size_t)v_info.gridsize.y
	                    * (size_t)v_info.gridsize.z;

	for (int x = 0; x < (int)v_info.gridsize.x; x++) {
		for (int y = 0; y < (int)v_info.gridsize.y; y++) {
			for (int z = 0; z < (int)v_info.gridsize.z; z++) {
				voxels_seen++;
				if (checkVoxel((size_t)x, (size_t)y, (size_t)z, v_info.gridsize, vtable)) {
					write_cube(x, y, z, output);
				}
			}
		}
	}
	output.close();

	// Optionally reorder / optimize the mesh with TriMesh2:
#ifndef SILENT
	fprintf(stdout, "[I/O] Reordering / Optimizing mesh with Trimesh2 \n");
#endif
	trimesh::TriMesh* temp_mesh = trimesh::TriMesh::read(filename_output.c_str());
	trimesh::reorder_verts(temp_mesh);
	temp_mesh->write(filename_output.c_str());
	if (temp_mesh) delete temp_mesh;
}

void write_obj_pointcloud(const unsigned int* vtable,
                          const voxinfo v_info,
                          const std::string base_filename) {
	std::lock_guard<std::mutex> lock(io_mutex);

	std::string filename_output = base_filename
		+ std::string("_") + std::to_string(v_info.gridsize.x)
		+ std::string("_pointcloud.obj");
	std::ofstream output(filename_output.c_str(), std::ios::out);

#ifndef SILENT
	fprintf(stdout, "[I/O] Writing data in obj point cloud format to %s \n",
	        filename_output.c_str());
#endif
	assert(output);

	for (int x = 0; x < (int)v_info.gridsize.x; x++) {
		for (int y = 0; y < (int)v_info.gridsize.y; y++) {
			for (int z = 0; z < (int)v_info.gridsize.z; z++) {
				if (checkVoxel((size_t)x, (size_t)y, (size_t)z, v_info.gridsize, vtable)) {
					// +0.5 to put vertex in the middle
					output << "v " << (x+0.5f) << " " << (y+0.5f) << " " << (z+0.5f) << std::endl;
				}
			}
		}
	}
	output.close();
}

void write_binary(void* data, size_t bytes, const std::string base_filename){
	std::lock_guard<std::mutex> lock(io_mutex);

	std::string filename_output = base_filename + ".bin";
#ifndef SILENT
	fprintf(stdout, "[I/O] Writing data in binary format to %s (%s) \n",
	        filename_output.c_str(), readableSize(bytes).c_str());
#endif
	std::ofstream output(filename_output.c_str(), std::ios::out | std::ios::binary);
	output.write((char*)data, bytes);
	output.close();
}

// Write data in .binvox format
void write_binvox(const unsigned int* vtable,
                  const voxinfo v_info,
                  const std::string base_filename){
	std::lock_guard<std::mutex> lock(io_mutex);

	std::string filename_output = base_filename + "_"
		+ std::to_string(v_info.gridsize.x) + ".binvox";
#ifndef SILENT
	fprintf(stdout, "[I/O] Writing data in binvox format to %s \n",
	        filename_output.c_str());
#endif
	std::ofstream output(filename_output.c_str(), std::ios::out | std::ios::binary);
	assert(output);

	// ASCII header
	output << "#binvox 1\n";
	output << "dim " << v_info.gridsize.x << " "
	                << v_info.gridsize.y << " "
	                << v_info.gridsize.z << "\n";
	output << "translate " << v_info.bbox.min.x << " "
	                     << v_info.bbox.min.y << " "
	                     << v_info.bbox.min.z << "\n";
	float scale_ = std::max(
	    std::max(v_info.bbox.max.x - v_info.bbox.min.x,
	             v_info.bbox.max.y - v_info.bbox.min.y),
	             v_info.bbox.max.z - v_info.bbox.min.z
	);
	output << "scale " << scale_ << "\n";
	output << "data\n";

	// BINARY Data (run-length encoding)
	char currentvalue, current_seen;
	bool first = true;
	for (int x = 0; x < (int)v_info.gridsize.x; x++){
		for (int z = 0; z < (int)v_info.gridsize.z; z++){
			for (int y = 0; y < (int)v_info.gridsize.y; y++){
				char nextvalue = (checkVoxel((size_t)x, (size_t)y, (size_t)z,
				                             v_info.gridsize, vtable)) ? 1 : 0;

				if (first){
					currentvalue = nextvalue;
					current_seen = 1;
					first = false;
				} else {
					if (nextvalue != currentvalue || current_seen == (char)255){
						output.write((char*)&current_seen, 1);
						output.write((char*)&currentvalue, 1);
						current_seen = 1;
						currentvalue = nextvalue;
					}
					else {
						current_seen++;
					}
				}
			}
		}
	}
	// final
	output.write((char*)&current_seen, 1);
	output.write((char*)&currentvalue, 1);
	output.close();
}

// Experimental MagicaVoxel file format output
void write_vox(const unsigned int* vtable,
               const uchar4* color_table,
               const voxinfo v_info,
               const std::string base_filename) {
    std::lock_guard<std::mutex> lock(io_mutex);

    std::string filename_output = base_filename + "_"
            + std::to_string(v_info.gridsize.x) + ".vox";

#ifndef SILENT
    fprintf(stdout, "[I/O] Writing data in vox format to %s\n", filename_output.c_str());
#endif

    vox::VoxWriter voxwriter;
    std::map<uint32_t, uint8_t> color_map;
    uint8_t current_color_index = 1; // Start from 1, as 0 is reserved

    size_t total_voxels = (size_t)v_info.gridsize.x
                        * (size_t)v_info.gridsize.y
                        * (size_t)v_info.gridsize.z;
    for (int x = 0; x < (int)v_info.gridsize.x; x++) {
        for (int y = 0; y < (int)v_info.gridsize.y; y++) {
            for (int z = 0; z < (int)v_info.gridsize.z; z++) {
                if (checkVoxel((size_t)x, (size_t)y, (size_t)z,
                               v_info.gridsize, vtable)) {
                    size_t idx = (size_t)x + (size_t)y * v_info.gridsize.x
                               + (size_t)z * (v_info.gridsize.x * v_info.gridsize.y);
                    uchar4 c = color_table[idx];

                    uint32_t packed_color = ((uint32_t)c.x << 24)
                                          | ((uint32_t)c.y << 16)
                                          | ((uint32_t)c.z << 8)
                                          | ((uint32_t)c.w);
                    if (color_map.find(packed_color) == color_map.end()) {
                        voxwriter.AddColor(c.x, c.y, c.z, c.w, current_color_index);
                        color_map[packed_color] = current_color_index;
                        current_color_index++;
                    }
                    uint8_t color_index = color_map[packed_color];

                    // MagicaVoxel coordinate flip
                    voxwriter.AddVoxel(x, -z + v_info.gridsize.z, y, color_index);
                }
            }
        }
    }
    voxwriter.SaveToFile(filename_output);
}

void write_gltf(const unsigned int* vtable,
                const uchar4* color_table,
                const voxinfo v_info,
                const std::string base_filename) {
    std::lock_guard<std::mutex> lock(io_mutex);

    std::string filename_output = base_filename + "_"
                                + std::to_string(v_info.gridsize.x)
                                + ".glb";

#ifndef SILENT
    fprintf(stdout, "[I/O] Writing data in glb format to %s\n", filename_output.c_str());
#endif

    tinygltf::Model model;
    tinygltf::TinyGLTF gltf;

    std::vector<float> positions;
    std::vector<uint8_t> colors;
    std::vector<uint16_t> indices16;
    std::vector<uint32_t> indices32;

    bool use_uint32 = false;
    size_t estimated_vertices = (size_t)v_info.gridsize.x
                              * (size_t)v_info.gridsize.y
                              * (size_t)v_info.gridsize.z * 8ULL;
    if (estimated_vertices > 65535ULL) {
        use_uint32 = true;
    }

    uint32_t index = 0;
    const float voxel_size = 1.0f;

    // define unit-cube for each voxel
    static const float cube_verts[8][3] = {
        {0,0,0}, {1,0,0}, {1,1,0}, {0,1,0},
        {0,0,1}, {1,0,1}, {1,1,1}, {0,1,1}
    };
    static const uint16_t cube_idx[36] = {
        0,2,1, 0,3,2,
        1,6,5, 1,2,6,
        5,7,4, 5,6,7,
        4,3,0, 4,7,3,
        3,6,2, 3,7,6,
        4,1,5, 4,0,1
    };

    // gather data
    for (int x = 0; x < (int)v_info.gridsize.x; x++){
        for (int y = 0; y < (int)v_info.gridsize.y; y++){
            for (int z = 0; z < (int)v_info.gridsize.z; z++){
                if (checkVoxel((size_t)x, (size_t)y, (size_t)z, v_info.gridsize, vtable)){
                    size_t voxel_index = (size_t)x + (size_t)y*v_info.gridsize.x
                                       + (size_t)z*(v_info.gridsize.x*v_info.gridsize.y);
                    uchar4 c = color_table[voxel_index];
                    for (int v = 0; v < 8; v++){
                        positions.push_back(x + cube_verts[v][0] * voxel_size);
                        positions.push_back(y + cube_verts[v][1] * voxel_size);
                        positions.push_back(z + cube_verts[v][2] * voxel_size);

                        colors.push_back(c.x);
                        colors.push_back(c.y);
                        colors.push_back(c.z);
                        colors.push_back(255); // full alpha
                    }
                    for (int i = 0; i < 36; i++){
                        if (use_uint32){
                            indices32.push_back(index + cube_idx[i]);
                        } else {
                            indices16.push_back((uint16_t)(index + cube_idx[i]));
                        }
                    }
                    index += 8;
                }
            }
        }
    }

    // Create a single buffer with positions, colors, indices
    size_t posBytes = positions.size()*sizeof(float);
    size_t colBytes = colors.size()*sizeof(uint8_t);
    size_t idxBytes = 0;
    if (use_uint32){
        idxBytes = indices32.size()*sizeof(uint32_t);
    } else {
        idxBytes = indices16.size()*sizeof(uint16_t);
    }
    size_t totalBytes = posBytes + colBytes + idxBytes;

    tinygltf::Buffer buffer;
    buffer.data.resize(totalBytes);

    size_t offset = 0;
    memcpy(buffer.data.data() + offset, positions.data(), posBytes);
    offset += posBytes;
    memcpy(buffer.data.data() + offset, colors.data(), colBytes);
    offset += colBytes;
    if (use_uint32){
        memcpy(buffer.data.data() + offset, indices32.data(), idxBytes);
    } else {
        memcpy(buffer.data.data() + offset, indices16.data(), idxBytes);
    }
    model.buffers.push_back(buffer);

    // Create buffer views
    tinygltf::BufferView posView;
    posView.buffer = 0;
    posView.byteOffset = 0;
    posView.byteLength = posBytes;
    posView.target = TINYGLTF_TARGET_ARRAY_BUFFER;
    model.bufferViews.push_back(posView);

    tinygltf::BufferView colView;
    colView.buffer = 0;
    colView.byteOffset = posView.byteLength;
    colView.byteLength = colBytes;
    colView.target = TINYGLTF_TARGET_ARRAY_BUFFER;
    model.bufferViews.push_back(colView);

    tinygltf::BufferView idxView;
    idxView.buffer = 0;
    idxView.byteOffset = posView.byteLength + colView.byteLength;
    idxView.byteLength = idxBytes;
    idxView.target = TINYGLTF_TARGET_ELEMENT_ARRAY_BUFFER;
    model.bufferViews.push_back(idxView);

    // Accessors
    tinygltf::Accessor posAccessor;
    posAccessor.bufferView = 0;
    posAccessor.byteOffset = 0;
    posAccessor.componentType = TINYGLTF_COMPONENT_TYPE_FLOAT;
    posAccessor.count = positions.size()/3;
    posAccessor.type = TINYGLTF_TYPE_VEC3;
    // min/max
    if (!positions.empty()){
        posAccessor.minValues = {positions[0], positions[1], positions[2]};
        posAccessor.maxValues = {positions[0], positions[1], positions[2]};
        for (size_t i = 3; i < positions.size(); i += 3){
            posAccessor.minValues[0] = std::min(posAccessor.minValues[0], double(positions[i+0]));
            posAccessor.minValues[1] = std::min(posAccessor.minValues[1], double(positions[i+1]));
            posAccessor.minValues[2] = std::min(posAccessor.minValues[2], double(positions[i+2]));
            posAccessor.maxValues[0] = std::max(posAccessor.maxValues[0], double(positions[i+0]));
            posAccessor.maxValues[1] = std::max(posAccessor.maxValues[1], double(positions[i+1]));
            posAccessor.maxValues[2] = std::max(posAccessor.maxValues[2], double(positions[i+2]));
        }
    }
    model.accessors.push_back(posAccessor);

    tinygltf::Accessor colAccessor;
    colAccessor.bufferView = 1;
    colAccessor.byteOffset = 0;
    colAccessor.componentType = TINYGLTF_COMPONENT_TYPE_UNSIGNED_BYTE;
    colAccessor.count = colors.size()/4;
    colAccessor.type = TINYGLTF_TYPE_VEC4;
    colAccessor.normalized = true;
    model.accessors.push_back(colAccessor);

    tinygltf::Accessor idxAccessor;
    idxAccessor.bufferView = 2;
    idxAccessor.byteOffset = 0;
    if (use_uint32){
        idxAccessor.componentType = TINYGLTF_COMPONENT_TYPE_UNSIGNED_INT;
        idxAccessor.count = indices32.size();
    } else {
        idxAccessor.componentType = TINYGLTF_COMPONENT_TYPE_UNSIGNED_SHORT;
        idxAccessor.count = indices16.size();
    }
    idxAccessor.type = TINYGLTF_TYPE_SCALAR;
    model.accessors.push_back(idxAccessor);

    // Create a primitive
    tinygltf::Primitive prim;
    prim.attributes["POSITION"] = 0;
    prim.attributes["COLOR_0"] = 1;
    prim.indices = 2;
    prim.mode = TINYGLTF_MODE_TRIANGLES;

    // Create a mesh
    tinygltf::Mesh mesh;
    mesh.primitives.push_back(prim);
    model.meshes.push_back(mesh);

    // Create a node
    tinygltf::Node node;
    node.mesh = (int)(model.meshes.size()-1);
    model.nodes.push_back(node);

    // Create a scene
    tinygltf::Scene scene;
    scene.nodes.push_back((int)model.nodes.size()-1);
    model.scenes.push_back(scene);
    model.defaultScene = 0;

    gltf.WriteGltfSceneToFile(&model, filename_output, true, true, true, true);
}

void write_indexed_json(const unsigned int* vtable,
                        const uchar4* color_table,
                        const voxinfo v_info,
                        const std::string base_filename){
    std::lock_guard<std::mutex> lock(io_mutex);

    std::string filename_output = base_filename + "_"
                                + std::to_string(v_info.gridsize.x)
                                + ".json";

#ifndef SILENT
    fprintf(stdout, "[I/O] Writing data in indexed JSON format to %s\n", filename_output.c_str());
#endif

    // Build color map
    std::map<std::string, uint16_t> color_map;
    uint16_t current_color_index = 1;
    nlohmann::json blocks_json;
    std::vector<std::vector<int>> blockArray;

   const float3 bmin = v_info.bbox.min;    // this is cubeBox.min
   const float3 unit = v_info.unit;        // voxel size in object units (you already use this on GPU)
   const int ox = (int)std::llround((-bmin.x) / unit.x);
   const int oy = (int)std::llround((-bmin.y) / unit.y);
   const int oz = (int)std::llround((-bmin.z) / unit.z);

    for (int x = 0; x < (int)v_info.gridsize.x; x++){
        for (int y = 0; y < (int)v_info.gridsize.y; y++){
            for (int z = 0; z < (int)v_info.gridsize.z; z++){
                if (checkVoxel((size_t)x, (size_t)y, (size_t)z, v_info.gridsize, vtable)){
                    size_t idx = (size_t)x + (size_t)y*v_info.gridsize.x
                               + (size_t)z*(v_info.gridsize.x*v_info.gridsize.y);
                    uchar4 c = color_table[idx];
                    std::string color_key = std::to_string(c.x)+","+
                                            std::to_string(c.y)+","+
                                            std::to_string(c.z);

                    if (color_map.find(color_key) == color_map.end()){
                        color_map[color_key] = current_color_index;
                        blocks_json[std::to_string(current_color_index)]
                            = {c.x, c.y, c.z};
                        current_color_index++;
                    }
                    uint16_t cindex = color_map[color_key];
                    // blockArray.push_back({x,y,z,(int)cindex});
                    blockArray.push_back({x - ox, y - oy, z - oz, (int)cindex});
                }
            }
        }
    }

    nlohmann::json j;
    j["blocks"] = blocks_json;
    j["xyzi"]   = blockArray;

    std::ofstream file(filename_output);
    if (!file.is_open()){
        fprintf(stderr, "[Error] Could not open %s for writing\n", filename_output.c_str());
        return;
    }
    file << j.dump();
    file.close();
}

static void write_u32(std::ofstream &out, uint32_t value) {
    out.write(reinterpret_cast<const char*>(&value), sizeof(value));
}
static void write_u16(std::ofstream &out, uint16_t value) {
    out.write(reinterpret_cast<const char*>(&value), sizeof(value));
}
static void write_u8(std::ofstream &out, uint8_t value) {
    out.write(reinterpret_cast<const char*>(&value), sizeof(value));
}

static std::vector<char> compress_chunk_data(const char* inputData, int inputSize) {
    // same code from your snippet
    std::vector<char> output;
    int i = 0;
    while (i < inputSize) {
        if (i <= inputSize - 3 &&
            inputData[i] == inputData[i+1] &&
            inputData[i] == inputData[i+2]) {
            int runLength = 3;
            while (i+runLength < inputSize &&
                   inputData[i+runLength] == inputData[i] &&
                   runLength < 128) {
                runLength++;
            }
            char header = (char)(1-runLength);
            output.push_back(header);
            output.push_back(inputData[i]);
            i += runLength;
        } else {
            int literalStart = i;
            i++;
            while (i < inputSize) {
                if (i <= inputSize - 3 &&
                    inputData[i] == inputData[i+1] &&
                    inputData[i] == inputData[i+2]){
                    break;
                }
                if ((i - literalStart) >= 128) break;
                i++;
            }
            int literalCount = i - literalStart;
            char header = (char)(literalCount - 1);
            output.push_back(header);
            for (int k = literalStart; k < i; k++){
                output.push_back(inputData[k]);
            }
        }
    }
    return output;
}

// The chunk-based (VXCH) writer from your snippet
void write_indexed_binary(const unsigned int* vtable,
                          const uchar4* color_table,
                          const voxinfo v_info,
                          const std::string base_filename){
    std::lock_guard<std::mutex> lock(io_mutex);

    // same code as your "write_indexed_binary" snippet
    // building color palette, chunking, compressing, etc.
    // ...
    // For clarity, we replicate it *exactly*:
    // --------------------------------------------------
    // (BEGIN your original code)
    // (We do not repeat it verbatim here in the assistant's explanation,
    //  but in your final file, copy your entire chunk-based function.)
    // --------------------------------------------------

    // Full code from your snippet is inserted below:

    // ---------------------------
    // 1) Build a color palette
    // ---------------------------
    std::map<std::string, uint16_t> color_map;
    uint16_t current_color_index = 1;
    std::vector<uchar4> indexToColor;

    size_t totalVoxelCount = (size_t)v_info.gridsize.x
                           * (size_t)v_info.gridsize.y
                           * (size_t)v_info.gridsize.z;
    for (size_t idx = 0; idx < totalVoxelCount; idx++){
        size_t int_location = idx / 32;
        unsigned bit_pos = 31 - (idx % 32);
        bool filled = ((vtable[int_location] >> bit_pos) & 1u) != 0;
        if (!filled) continue;

        uchar4 c = color_table[idx];
        char buf[32];
        snprintf(buf, sizeof(buf), "%d,%d,%d,%d", c.x, c.y, c.z, c.w);
        std::string color_key(buf);

        auto it = color_map.find(color_key);
        if (it == color_map.end()){
            color_map[color_key] = current_color_index++;
        }
    }

    uint32_t colorCount = (uint32_t)color_map.size();
    indexToColor.resize(colorCount+1); // index 0 unused
    for (auto &kv : color_map){
        const std::string &key = kv.first;
        uint16_t idx_ = kv.second;
        int r,g,b,a;
        sscanf(key.c_str(), "%d,%d,%d,%d", &r,&g,&b,&a);
        indexToColor[idx_] = make_uchar4((uint8_t)r,(uint8_t)g,(uint8_t)b,(uint8_t)a);
    }

    // chunk stuff
    uint16_t CHUNK_SIZE = 32;
    uint16_t sizeX = (uint16_t)v_info.gridsize.x;
    uint16_t sizeY = (uint16_t)v_info.gridsize.y;
    uint16_t sizeZ = (uint16_t)v_info.gridsize.z;

    auto divup = [](uint16_t v, uint16_t d){
        return (uint16_t)((v + d - 1)/d);
    };

    uint16_t chunkCountX = divup(sizeX, CHUNK_SIZE);
    uint16_t chunkCountY = divup(sizeY, CHUNK_SIZE);
    uint16_t chunkCountZ = divup(sizeZ, CHUNK_SIZE);

    uint32_t totalChunks = (uint32_t)chunkCountX * chunkCountY * chunkCountZ;

    std::string filename_output = base_filename + "_"
                                + std::to_string(sizeX) + ".vxch";
    std::ofstream out(filename_output, std::ios::binary);
    if (!out.is_open()){
        std::cerr << "[Error] Could not open " << filename_output << " for writing.\n";
        return;
    }

    // Write header
    out.write("VXCH", 4);
    write_u32(out, 1); // version

    write_u16(out, CHUNK_SIZE);
    write_u16(out, sizeX);
    write_u16(out, sizeY);
    write_u16(out, sizeZ);
    write_u16(out, chunkCountX);
    write_u16(out, chunkCountY);
    write_u16(out, chunkCountZ);

    write_u32(out, colorCount);
    for (uint32_t i = 1; i <= colorCount; i++){
        uchar4 c = indexToColor[i];
        write_u8(out, c.x);
        write_u8(out, c.y);
        write_u8(out, c.z);
        write_u8(out, c.w);
    }

    struct ChunkRecord {
        uint64_t offset;
        uint32_t compressedSize;
        uint32_t uncompressedSize;
        uint16_t chunkType;
        uint16_t reserved;
    };

    std::vector<ChunkRecord> chunkTable(totalChunks);
    std::streampos chunkTablePos = out.tellp();
    size_t chunkTableBytes = totalChunks*sizeof(ChunkRecord);
    {
        std::vector<char> dummy(chunkTableBytes, 0);
        out.write(dummy.data(), dummy.size());
    }

    auto getVoxel = [&](uint32_t gx, uint32_t gy, uint32_t gz)-> uint16_t {
        size_t linearIdx = gx + gy*sizeX + gz*(sizeX*sizeY);
        size_t int_location = linearIdx/32;
        unsigned bit_pos = 31 - (linearIdx%32);
        bool filled = ((vtable[int_location] >> bit_pos) & 1u)!=0;
        if(!filled) return 0;
        uchar4 c = color_table[linearIdx];
        char buf[32];
        snprintf(buf, sizeof(buf), "%d,%d,%d,%d", c.x,c.y,c.z,c.w);
        std::string color_key(buf);
        auto it= color_map.find(color_key);
        if(it==color_map.end()) return 0;
        return it->second;
    };

    uint32_t chunkIndex=0;
    for(uint16_t cz=0; cz<chunkCountZ; cz++){
        for(uint16_t cy=0; cy<chunkCountY; cy++){
            for(uint16_t cx=0; cx<chunkCountX; cx++){
                ChunkRecord &rec = chunkTable[chunkIndex];
                rec.offset=0; rec.compressedSize=0; rec.uncompressedSize=0;
                rec.chunkType=0; rec.reserved=0;

                uint32_t x0 = cx*CHUNK_SIZE;
                uint32_t y0 = cy*CHUNK_SIZE;
                uint32_t z0 = cz*CHUNK_SIZE;
                uint32_t xCount = std::min<uint32_t>(CHUNK_SIZE, sizeX - x0);
                uint32_t yCount = std::min<uint32_t>(CHUNK_SIZE, sizeY - y0);
                uint32_t zCount = std::min<uint32_t>(CHUNK_SIZE, sizeZ - z0);

                if(xCount==0||yCount==0||zCount==0){
                    chunkIndex++;
                    continue;
                }

                size_t voxelsInChunk = (size_t)xCount*yCount*zCount;
                bool anyVoxel=false; bool allSame=true;
                uint16_t firstNonZeroIndex=0;

                std::vector<uint16_t> localColors(voxelsInChunk,0);
                for(uint32_t zz=0; zz<zCount; zz++){
                    for(uint32_t yy=0; yy<yCount; yy++){
                        for(uint32_t xx=0; xx<xCount; xx++){
                            size_t loc = xx + yy*xCount + zz*(xCount*yCount);
                            uint16_t ci = getVoxel(x0+xx, y0+yy, z0+zz);
                            localColors[loc]=ci;
                            if(ci!=0){
                                if(!anyVoxel){
                                    anyVoxel=true; firstNonZeroIndex=ci;
                                } else {
                                    if(ci!=firstNonZeroIndex) allSame=false;
                                }
                            }
                        }
                    }
                }
                if(!anyVoxel){
                    rec.chunkType=0;
                    chunkIndex++;
                    continue;
                }
                if(allSame){
                    rec.chunkType=1;
                } else {
                    rec.chunkType=2;
                }

                std::vector<char> uncompressed;
                if(rec.chunkType==1){
                    uncompressed.resize(2);
                    memcpy(uncompressed.data(), &firstNonZeroIndex,2);
                } else {
                    size_t totalCells = xCount*yCount*zCount;
                    size_t bitmaskBytes = (totalCells+7)/8;
                    size_t occupiedCount=0;
                    for(size_t i=0; i<totalCells; i++){
                        if(localColors[i]!=0) occupiedCount++;
                    }
                    uncompressed.resize(bitmaskBytes + occupiedCount*2,0);
                    uint8_t *bitmask = reinterpret_cast<uint8_t*>(uncompressed.data());
                    for(size_t i=0; i<totalCells; i++){
                        if(localColors[i]!=0){
                            size_t bytePos = i/8;
                            size_t bitPos = i%8;
                            bitmask[bytePos] |= (1<<bitPos);
                        }
                    }
                    char *colorData = uncompressed.data()+bitmaskBytes;
                    size_t colorPos=0;
                    for(size_t i=0; i<totalCells; i++){
                        if(localColors[i]!=0){
                            uint16_t ci= localColors[i];
                            memcpy(colorData+colorPos, &ci,2);
                            colorPos+=2;
                        }
                    }
                }
                std::vector<char> compressed = compress_chunk_data(
                    uncompressed.data(), (int)uncompressed.size());

                rec.uncompressedSize = (uint32_t)uncompressed.size();
                rec.compressedSize   = (uint32_t)compressed.size();
                std::streampos here = out.tellp();
                rec.offset=(uint64_t)here;
                if(!compressed.empty()){
                    out.write(compressed.data(), compressed.size());
                }
                chunkIndex++;
            }
        }
    }

    std::streampos endPos = out.tellp();
    out.seekp(chunkTablePos);
    for(auto &rec : chunkTable){
        out.write(reinterpret_cast<const char*>(&rec.offset), sizeof(uint64_t));
        write_u32(out, rec.compressedSize);
        write_u32(out, rec.uncompressedSize);
        write_u16(out, rec.chunkType);
        write_u16(out, rec.reserved);
    }
    out.seekp(endPos);
    out.close();

#ifndef SILENT
PRINT_DEBUG("[I/O] Wrote chunked voxel file: %s\n", filename_output.c_str());
PRINT_DEBUG("      Dimensions= (%d x %d x %d)\n", sizeX, sizeY, sizeZ);
PRINT_DEBUG("      Chunks= (%d x %d x %d) => %d\n", chunkCountX, chunkCountY, chunkCountZ, totalChunks);
PRINT_DEBUG("      Unique colors= %d\n", colorCount);
#endif
}

