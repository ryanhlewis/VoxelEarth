#include "util_io.h"


// #define TINYGLTF_IMPLEMENTATION
// #define STB_IMAGE_IMPLEMENTATION
// #define STB_IMAGE_WRITE_IMPLEMENTATION
#include <tiny_gltf.h>
#include <draco/compression/encode.h>
#include <draco/mesh/mesh.h>

#include <map>
#include <json.hpp> // For JSON serialization

using namespace std;

// helper function to get file length (in number of ASCII characters)
size_t get_file_length(const std::string base_filename){
	// open file at the end
	std::ifstream input(base_filename.c_str(), ios_base::ate | ios_base::binary);
	assert(input);
	size_t length = input.tellg();
	input.close();
	return length; // get file length
}

// read raw bytes from file
void read_binary(void* data, const size_t length, const std::string base_filename){
	// open file
	std::ifstream input(base_filename.c_str(), ios_base::in | ios_base::binary);
	assert(input);
#ifndef SILENT
	fprintf(stdout, "[I/O] Reading %llu kb of binary data from file %s \n", size_t(length / 1024.0f), base_filename.c_str()); fflush(stdout);
#endif
	input.seekg(0, input.beg);
	input.read((char*) data, 8);
	input.close();
	return;
}

// Helper function to write single vertex normal to OBJ file
static void write_vertex_normal(ofstream& output, const int3& v) {
	output << "vn " << v.x << " " << v.y << " " << v.z << endl;
}

// Helper function to write single vertex to OBJ file
static void write_vertex(ofstream& output, const int3& v) {
	output << "v " << v.x << " " << v.y << " " << v.z << endl;
}

// Helper function to write single vertex
static void write_face(ofstream& output, const int3& v) {
	output << "f " << v.x << " " << v.y << " " << v.z << endl;
}

// Helper function to write full cube (using relative vertex positions in the OBJ file - support for this should be widespread by now)
void write_cube(const int x, const int y, const int z, ofstream& output) {
	//	   2-------1
	//	  /|      /|
	//	 / |     / |
	//	7--|----8  |
	//	|  4----|--3
	//	| /     | /
	//	5-------6
    // Create vertices
	int3 v1 = make_int3(x+1, y+1, z + 1);
	int3 v2 = make_int3(x, y+1, z + 1);
	int3 v3 = make_int3(x+1, y, z + 1);
	int3 v4 = make_int3(x, y, z + 1);
	int3 v5 = make_int3(x, y, z);
	int3 v6 = make_int3(x+1, y, z);
	int3 v7 = make_int3(x, y+1, z);
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

void write_obj_cubes(const unsigned int* vtable, const voxinfo v_info, const std::string base_filename) {
	string filename_output = base_filename + string("_") + to_string(v_info.gridsize.x) + string("_voxels.obj");
	ofstream output(filename_output.c_str(), ios::out);

#ifndef SILENT
	fprintf(stdout, "[I/O] Writing data in obj voxels format to file %s \n", filename_output.c_str());
	// Write stats
	size_t voxels_seen = 0;
	const size_t write_stats_25 = (size_t(v_info.gridsize.x) * size_t(v_info.gridsize.y) * size_t(v_info.gridsize.z)) / 4.0f;
	fprintf(stdout, "[I/O] Writing to file: 0%%...");
#endif
	

	// Write vertex normals once
	//write_vertex_normal(output, glm::ivec3(0, 0, -1)); // forward = 1
	//write_vertex_normal(output, glm::ivec3(0, 0, 1)); // backward = 2
	//write_vertex_normal(output, glm::ivec3(-1, 0, 0)); // left = 3
	//write_vertex_normal(output, glm::ivec3(1, 0, 0)); // right = 4
	//write_vertex_normal(output, glm::ivec3(0, -1, 0)); // bottom = 5
	//write_vertex_normal(output, glm::ivec3(0, 1, 0)); // top = 6
	//size_t voxels_written = 0;

	assert(output);
	for (size_t x = 0; x < v_info.gridsize.x; x++) {
		for (size_t y = 0; y < v_info.gridsize.y; y++) {
			for (size_t z = 0; z < v_info.gridsize.z; z++) {
#ifndef SILENT
				voxels_seen++;
				if (voxels_seen == write_stats_25) {fprintf(stdout, "25%%...");}
				else if (voxels_seen == write_stats_25 * size_t(2)) {fprintf(stdout, "50%%...");}
				else if (voxels_seen == write_stats_25 * size_t(3)) {fprintf(stdout, "75%%...");}
#endif
				if (checkVoxel(x, y, z, v_info.gridsize, vtable)) {
					//voxels_written += 1;
					write_cube(static_cast<int>(x), static_cast<int>(y), static_cast<int>(z), output);
				}
			}
		}
	}
#ifndef SILENT
	fprintf(stdout, "100%% \n");
#endif
	// std::cout << "written " << voxels_written << std::endl;

#ifndef SILENT
	fprintf(stdout, "[I/O] Reordering / Optimizing mesh with Trimesh2 \n");
#endif
	// Load the file using TriMesh2
	trimesh::TriMesh* temp_mesh = trimesh::TriMesh::read(filename_output.c_str());	
	trimesh::reorder_verts(temp_mesh);
	//trimesh::faceflip(temp_mesh);
	//trimesh::edgeflip(temp_mesh);
	//temp_mesh->clear_normals();
	//temp_mesh->need_normals();
#ifndef SILENT
	fprintf(stdout, "[I/O] Writing final mesh to file %s \n", filename_output.c_str());
#endif
	temp_mesh->write(filename_output.c_str());

	output.close();
}

void write_obj_pointcloud(const unsigned int* vtable, const voxinfo v_info, const std::string base_filename) {
	string filename_output = base_filename + string("_") + to_string(v_info.gridsize.x) + string("_pointcloud.obj");
	ofstream output(filename_output.c_str(), ios::out);

#ifndef SILENT
	fprintf(stdout, "[I/O] Writing data in obj point cloud format to %s \n", filename_output.c_str());
	size_t voxels_seen = 0;
	const size_t write_stats_25 = (size_t(v_info.gridsize.x) * size_t(v_info.gridsize.y) * size_t(v_info.gridsize.z)) / 4.0f;
	fprintf(stdout, "[I/O] Writing to file: 0%%...");
#endif

	// write stats
	size_t voxels_written = 0;

	assert(output);
	for (size_t x = 0; x < v_info.gridsize.x; x++) {
		for (size_t y = 0; y < v_info.gridsize.y; y++) {
			for (size_t z = 0; z < v_info.gridsize.z; z++) {
#ifndef SILENT
				voxels_seen++;
				if (voxels_seen == write_stats_25) { fprintf(stdout, "25%%...");}
				else if (voxels_seen == write_stats_25 * size_t(2)) { fprintf(stdout, "50%%...");}
				else if (voxels_seen == write_stats_25 * size_t(3)) {fprintf(stdout, "75%%...");}
#endif
				if (checkVoxel(x, y, z, v_info.gridsize, vtable)) {
					voxels_written += 1;
					output << "v " << (x+0.5) << " " << (y + 0.5) << " " << (z + 0.5) << endl; // +0.5 to put vertex in the middle of the voxel
				}
			}
		}
	}
#ifndef SILENT
	fprintf(stdout, "100%% \n");
#endif
	// std::cout << "written " << voxels_written << std::endl;
	output.close();
}

void write_binary(void* data, size_t bytes, const std::string base_filename){
	string filename_output = base_filename + string(".bin");
#ifndef SILENT
	fprintf(stdout, "[I/O] Writing data in binary format to %s (%s) \n", filename_output.c_str(), readableSize(bytes).c_str());
#endif
	ofstream output(filename_output.c_str(), ios_base::out | ios_base::binary);
	output.write((char*)data, bytes);
	output.close();
}

void write_binvox(const unsigned int* vtable, const voxinfo v_info, const std::string base_filename){
	// Open file
	string filename_output = base_filename + string("_") + to_string(v_info.gridsize.x) + string(".binvox");
#ifndef SILENT
	fprintf(stdout, "[I/O] Writing data in binvox format to %s \n", filename_output.c_str());
#endif
	ofstream output(filename_output.c_str(), ios::out | ios::binary);
	assert(output);
	// Write ASCII header
	output << "#binvox 1" << endl;
	output << "dim " << v_info.gridsize.x << " " << v_info.gridsize.y << " " << v_info.gridsize.z << "" << endl;
	output << "translate " << v_info.bbox.min.x << " " << v_info.bbox.min.y << " " << v_info.bbox.min.z << endl;
	output << "scale " << max(max(v_info.bbox.max.x - v_info.bbox.min.x, v_info.bbox.max.y - v_info.bbox.min.y), 
		v_info.bbox.max.z - v_info.bbox.min.z) << endl;
	output << "data" << endl;

	// Write BINARY Data (and compress it a bit using run-length encoding)
	char currentvalue, current_seen;
	for (size_t x = 0; x < v_info.gridsize.x; x++){
		for (size_t z = 0; z < v_info.gridsize.z; z++){
			for (size_t y = 0; y < v_info.gridsize.y; y++){
				if (x == 0 && y == 0 && z == 0){ // special case: first voxel
					currentvalue = checkVoxel(0, 0, 0, v_info.gridsize, vtable);
					output.write((char*)&currentvalue, 1);
					current_seen = 1;
					continue;
				}
				char nextvalue = checkVoxel(x, y, z, v_info.gridsize, vtable);
				if (nextvalue != currentvalue || current_seen == (char) 255){
					output.write((char*)&current_seen, 1);
					current_seen = 1;
					currentvalue = nextvalue;
					output.write((char*)&currentvalue, 1);
				}
				else {
					current_seen++;
				}
			}
		}
	}

	// Write rest
	output.write((char*)&current_seen, 1);
	output.close();
}

// Experimental MagicaVoxel file format output
// Experimental MagicaVoxel file format output
void write_vox(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename) {
    std::string filename_output = base_filename + "_" + std::to_string(v_info.gridsize.x) + ".vox";
    vox::VoxWriter voxwriter;
    
    // Initialize color index mapping
    std::map<uint32_t, uint8_t> color_map;
    uint8_t current_color_index = 1; // Start from 1 because 0 is reserved

#ifndef SILENT
    fprintf(stdout, "[I/O] Writing data in vox format to %s \n", filename_output.c_str());

    // Write stats
    size_t voxels_seen = 0;
    const size_t write_stats_25 = (size_t(v_info.gridsize.x) * size_t(v_info.gridsize.y) * size_t(v_info.gridsize.z)) / 4.0f;
    fprintf(stdout, "[I/O] Writing to file: 0%%...");
    size_t voxels_written = 0;
#endif

    for (size_t x = 0; x < v_info.gridsize.x; x++) {
        for (size_t y = 0; y < v_info.gridsize.y; y++) {
            for (size_t z = 0; z < v_info.gridsize.z; z++) {
#ifndef SILENT
                // Progress stats
                voxels_seen++;
                if (voxels_seen == write_stats_25) { fprintf(stdout, "25%%..."); }
                else if (voxels_seen == write_stats_25 * size_t(2)) { fprintf(stdout, "50%%..."); }
                else if (voxels_seen == write_stats_25 * size_t(3)) { fprintf(stdout, "75%%..."); }
#endif
                if (checkVoxel(x, y, z, v_info.gridsize, vtable)) {
                    size_t voxel_index = x + (y * v_info.gridsize.x) + (z * v_info.gridsize.x * v_info.gridsize.y);
                    uchar4 color = color_table[voxel_index];

                    // Pack color into a single uint32_t
                    uint32_t packed_color = (color.x << 24) | (color.y << 16) | (color.z << 8) | color.w;

                    // Check if color already has an index
                    if (color_map.find(packed_color) == color_map.end()) {
                        // New color, assign a new index
                        voxwriter.AddColor(color.x, color.y, color.z, color.w, current_color_index);
                        color_map[packed_color] = current_color_index;
                        current_color_index++;
                    }

                    uint8_t color_index = color_map[packed_color];

                    // Add voxel with color index
                    voxwriter.AddVoxel(x, -z + v_info.gridsize.z, y, color_index);
                }
            }
        }
    }
#ifndef SILENT
    fprintf(stdout, "100%% \n");
#endif
    voxwriter.SaveToFile(filename_output);
}



void write_gltf(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename) {
    std::string filename_output = base_filename + "_" + std::to_string(v_info.gridsize.x) + ".glb";
    tinygltf::Model model;
    tinygltf::TinyGLTF gltf;

    std::vector<float> positions;
    std::vector<uint8_t> colors;
    std::vector<uint16_t> indices16;
    std::vector<uint32_t> indices32;

    bool use_uint32 = false;
    size_t estimated_vertices = v_info.gridsize.x * v_info.gridsize.y * v_info.gridsize.z * 8;
    if (estimated_vertices > 65535) {
        use_uint32 = true;
    }

    uint32_t index = 0;
    const float voxel_size = 1.0f; // Define a consistent voxel size

    // Define the vertex positions for a unit cube
    const float cube_vertices[8][3] = {
        {0, 0, 0}, {1, 0, 0}, {1, 1, 0}, {0, 1, 0},
        {0, 0, 1}, {1, 0, 1}, {1, 1, 1}, {0, 1, 1}
    };

    // Define the indices for the 12 triangles of a cube (2 triangles per face)
    const uint16_t cube_indices[36] = {
        0, 2, 1, 0, 3, 2, // Front face
        1, 6, 5, 1, 2, 6, // Right face
        5, 7, 4, 5, 6, 7, // Back face
        4, 3, 0, 4, 7, 3, // Left face
        3, 6, 2, 3, 7, 6, // Top face
        4, 1, 5, 4, 0, 1  // Bottom face
    };



    for (size_t x = 0; x < v_info.gridsize.x; x++) {
        for (size_t y = 0; y < v_info.gridsize.y; y++) {
            for (size_t z = 0; z < v_info.gridsize.z; z++) {
                if (checkVoxel(x, y, z, v_info.gridsize, vtable)) {
                    size_t voxel_index = x + (y * v_info.gridsize.x) + (z * v_info.gridsize.x * v_info.gridsize.y);
                    uchar4 color = color_table[voxel_index];

                    for (int v = 0; v < 8; ++v) {
                        positions.push_back(static_cast<float>(x) + cube_vertices[v][0] * voxel_size);
                        positions.push_back(static_cast<float>(y) + cube_vertices[v][1] * voxel_size);
                        positions.push_back(static_cast<float>(z) + cube_vertices[v][2] * voxel_size);

                        colors.push_back(color.x);
                        colors.push_back(color.y);
                        colors.push_back(color.z);
                        colors.push_back(255);  // Ensure full opacity
                    }

                    for (int i = 0; i < 36; ++i) {
                        if (use_uint32) {
                            indices32.push_back(index + cube_indices[i]);
                        } else {
                            indices16.push_back(index + cube_indices[i]);
                        }
                    }
                    index += 8;
                }
            }
        }
    }

    // Create a buffer
    size_t buffer_size = positions.size() * sizeof(float) + colors.size() * sizeof(uint8_t);
    if (use_uint32) {
        buffer_size += indices32.size() * sizeof(uint32_t);
    } else {
        buffer_size += indices16.size() * sizeof(uint16_t);
    }

    tinygltf::Buffer buffer;
    buffer.data.resize(buffer_size);

    size_t offset = 0;
    memcpy(buffer.data.data() + offset, positions.data(), positions.size() * sizeof(float));
    offset += positions.size() * sizeof(float);
    memcpy(buffer.data.data() + offset, colors.data(), colors.size() * sizeof(uint8_t));
    offset += colors.size() * sizeof(uint8_t);
    if (use_uint32) {
        memcpy(buffer.data.data() + offset, indices32.data(), indices32.size() * sizeof(uint32_t));
    } else {
        memcpy(buffer.data.data() + offset, indices16.data(), indices16.size() * sizeof(uint16_t));
    }

    model.buffers.push_back(buffer);

    // Create buffer views
    tinygltf::BufferView posBufferView;
    posBufferView.buffer = 0;
    posBufferView.byteOffset = 0;
    posBufferView.byteLength = positions.size() * sizeof(float);
    posBufferView.target = TINYGLTF_TARGET_ARRAY_BUFFER;
    model.bufferViews.push_back(posBufferView);

    tinygltf::BufferView colorBufferView;
    colorBufferView.buffer = 0;
    colorBufferView.byteOffset = posBufferView.byteLength;
    colorBufferView.byteLength = colors.size() * sizeof(uint8_t);
    colorBufferView.target = TINYGLTF_TARGET_ARRAY_BUFFER;
    model.bufferViews.push_back(colorBufferView);

    tinygltf::BufferView indexBufferView;
    indexBufferView.buffer = 0;
    indexBufferView.byteOffset = posBufferView.byteLength + colorBufferView.byteLength;
    if (use_uint32) {
        indexBufferView.byteLength = indices32.size() * sizeof(uint32_t);
        indexBufferView.target = TINYGLTF_TARGET_ELEMENT_ARRAY_BUFFER;
        model.bufferViews.push_back(indexBufferView);
    } else {
        indexBufferView.byteLength = indices16.size() * sizeof(uint16_t);
        indexBufferView.target = TINYGLTF_TARGET_ELEMENT_ARRAY_BUFFER;
        model.bufferViews.push_back(indexBufferView);
    }

    // Create accessors
    tinygltf::Accessor posAccessor;
    posAccessor.bufferView = 0;
    posAccessor.byteOffset = 0;
    posAccessor.componentType = TINYGLTF_COMPONENT_TYPE_FLOAT;
    posAccessor.count = positions.size() / 3;
    posAccessor.type = TINYGLTF_TYPE_VEC3;

	posAccessor.minValues = {positions[0], positions[1], positions[2]};
	posAccessor.maxValues = {positions[0], positions[1], positions[2]};
	for (size_t i = 3; i < positions.size(); i += 3) {
		if (positions[i] < posAccessor.minValues[0]) posAccessor.minValues[0] = positions[i];
		if (positions[i + 1] < posAccessor.minValues[1]) posAccessor.minValues[1] = positions[i + 1];
		if (positions[i + 2] < posAccessor.minValues[2]) posAccessor.minValues[2] = positions[i + 2];
		if (positions[i] > posAccessor.maxValues[0]) posAccessor.maxValues[0] = positions[i];
		if (positions[i + 1] > posAccessor.maxValues[1]) posAccessor.maxValues[1] = positions[i + 1];
		if (positions[i + 2] > posAccessor.maxValues[2]) posAccessor.maxValues[2] = positions[i + 2];
	}

    model.accessors.push_back(posAccessor);

    tinygltf::Accessor colorAccessor;
    colorAccessor.bufferView = 1;
    colorAccessor.byteOffset = 0;
    colorAccessor.componentType = TINYGLTF_COMPONENT_TYPE_UNSIGNED_BYTE;
    colorAccessor.count = colors.size() / 4;
    colorAccessor.type = TINYGLTF_TYPE_VEC4;
    colorAccessor.normalized = true;
    model.accessors.push_back(colorAccessor);

    tinygltf::Accessor indexAccessor;
    indexAccessor.bufferView = 2;
    indexAccessor.byteOffset = 0;
    if (use_uint32) {
        indexAccessor.componentType = TINYGLTF_COMPONENT_TYPE_UNSIGNED_INT;
        indexAccessor.count = indices32.size();
    } else {
        indexAccessor.componentType = TINYGLTF_COMPONENT_TYPE_UNSIGNED_SHORT;
        indexAccessor.count = indices16.size();
    }
    indexAccessor.type = TINYGLTF_TYPE_SCALAR;
    model.accessors.push_back(indexAccessor);

    // Create a primitive
    tinygltf::Primitive primitive;
    primitive.attributes["POSITION"] = 0;
    primitive.attributes["COLOR_0"] = 1;
    primitive.indices = 2;
    primitive.mode = TINYGLTF_MODE_TRIANGLES;

    // Create a mesh
    tinygltf::Mesh mesh;
    mesh.primitives.push_back(primitive);

    // Create a node
    tinygltf::Node node;
    node.mesh = model.meshes.size();
    model.nodes.push_back(node);

    // Add mesh to model
    model.meshes.push_back(mesh);

    // Create a scene
    tinygltf::Scene scene;
    scene.nodes.push_back(0);

    // Add scene to model
    model.scenes.push_back(scene);
    model.defaultScene = 0;

    // Save the model to a file
    gltf.WriteGltfSceneToFile(&model, filename_output, true, true, true, true);
}


// Assuming `write_gltf` is defined as provided

void write_gltf_with_draco(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename) {

}

void write_gltf_pointcloud(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename) {
    std::string filename_output = base_filename + "_" + std::to_string(v_info.gridsize.x) + ".glb";
    tinygltf::Model model;
    tinygltf::TinyGLTF gltf;

    std::vector<float> positions;
    std::vector<uint8_t> colors;
    std::vector<uint16_t> indices;

    uint16_t index = 0;

    for (size_t x = 0; x < v_info.gridsize.x; x++) {
        for (size_t y = 0; y < v_info.gridsize.y; y++) {
            for (size_t z = 0; z < v_info.gridsize.z; z++) {
                if (checkVoxel(x, y, z, v_info.gridsize, vtable)) {
                    size_t voxel_index = x + (y * v_info.gridsize.x) + (z * v_info.gridsize.x * v_info.gridsize.y);
                    uchar4 color = color_table[voxel_index];

                    positions.push_back(static_cast<float>(x));
                    positions.push_back(static_cast<float>(y));
                    positions.push_back(static_cast<float>(z));

                    colors.push_back(color.x);
                    colors.push_back(color.y);
                    colors.push_back(color.z);
                    colors.push_back(color.w);

                    indices.push_back(index++);
                }
            }
        }
    }

    // Create a buffer
    tinygltf::Buffer buffer;
    buffer.data.resize(positions.size() * sizeof(float) + colors.size() * sizeof(uint8_t) + indices.size() * sizeof(uint16_t));

    size_t offset = 0;
    memcpy(buffer.data.data() + offset, positions.data(), positions.size() * sizeof(float));
    offset += positions.size() * sizeof(float);
    memcpy(buffer.data.data() + offset, colors.data(), colors.size() * sizeof(uint8_t));
    offset += colors.size() * sizeof(uint8_t);
    memcpy(buffer.data.data() + offset, indices.data(), indices.size() * sizeof(uint16_t));

    model.buffers.push_back(buffer);

    // Create buffer views
    tinygltf::BufferView posBufferView;
    posBufferView.buffer = 0;
    posBufferView.byteOffset = 0;
    posBufferView.byteLength = positions.size() * sizeof(float);
    posBufferView.target = TINYGLTF_TARGET_ARRAY_BUFFER;
    model.bufferViews.push_back(posBufferView);

    tinygltf::BufferView colorBufferView;
    colorBufferView.buffer = 0;
    colorBufferView.byteOffset = posBufferView.byteLength;
    colorBufferView.byteLength = colors.size() * sizeof(uint8_t);
    colorBufferView.target = TINYGLTF_TARGET_ARRAY_BUFFER;
    model.bufferViews.push_back(colorBufferView);

    tinygltf::BufferView indexBufferView;
    indexBufferView.buffer = 0;
    indexBufferView.byteOffset = posBufferView.byteLength + colorBufferView.byteLength;
    indexBufferView.byteLength = indices.size() * sizeof(uint16_t);
    indexBufferView.target = TINYGLTF_TARGET_ELEMENT_ARRAY_BUFFER;
    model.bufferViews.push_back(indexBufferView);

    // Create accessors
    tinygltf::Accessor posAccessor;
    posAccessor.bufferView = 0;
    posAccessor.byteOffset = 0;
    posAccessor.componentType = TINYGLTF_COMPONENT_TYPE_FLOAT;
    posAccessor.count = positions.size() / 3;
    posAccessor.type = TINYGLTF_TYPE_VEC3;
    model.accessors.push_back(posAccessor);

    tinygltf::Accessor colorAccessor;
    colorAccessor.bufferView = 1;
    colorAccessor.byteOffset = 0;
    colorAccessor.componentType = TINYGLTF_COMPONENT_TYPE_UNSIGNED_BYTE;
    colorAccessor.count = colors.size() / 4;
    colorAccessor.type = TINYGLTF_TYPE_VEC4;
    colorAccessor.normalized = true;
    model.accessors.push_back(colorAccessor);

    tinygltf::Accessor indexAccessor;
    indexAccessor.bufferView = 2;
    indexAccessor.byteOffset = 0;
    indexAccessor.componentType = TINYGLTF_COMPONENT_TYPE_UNSIGNED_SHORT;
    indexAccessor.count = indices.size();
    indexAccessor.type = TINYGLTF_TYPE_SCALAR;
    model.accessors.push_back(indexAccessor);

    // Create a primitive
    tinygltf::Primitive primitive;
    primitive.attributes["POSITION"] = 0;
    primitive.attributes["COLOR_0"] = 1;
    primitive.indices = 2;
    primitive.mode = TINYGLTF_MODE_POINTS;

    // Create a mesh
    tinygltf::Mesh mesh;
    mesh.primitives.push_back(primitive);

    // Create a node
    tinygltf::Node node;
    node.mesh = model.meshes.size();
    model.nodes.push_back(node);

    // Add mesh to model
    model.meshes.push_back(mesh);

    // Create a scene
    tinygltf::Scene scene;
    scene.nodes.push_back(model.nodes.size() - 1);

    // Add scene to model
    model.scenes.push_back(scene);
    model.defaultScene = model.scenes.size() - 1;

    // Save the model to a file
    gltf.WriteGltfSceneToFile(&model, filename_output, true, true, true, true);
}

void write_indexed_json(const unsigned int* vtable, const uchar4* color_table, const voxinfo v_info, const std::string base_filename) {
    std::string filename_output = base_filename + "_" + std::to_string(v_info.gridsize.x) + ".json";
    
    std::map<uint32_t, uint8_t> color_map;
    uint8_t current_color_index = 1;
    
    std::vector<std::vector<int>> blockArray;
    std::map<uint8_t, std::vector<int>> indexedBlocks;
    
    for (size_t x = 0; x < v_info.gridsize.x; x++) {
        for (size_t y = 0; y < v_info.gridsize.y; y++) {
            for (size_t z = 0; z < v_info.gridsize.z; z++) {
                if (checkVoxel(x, y, z, v_info.gridsize, vtable)) {
                    size_t voxel_index = x + (y * v_info.gridsize.x) + (z * v_info.gridsize.x * v_info.gridsize.y);
                    uchar4 color = color_table[voxel_index];
                    
                    uint32_t packed_color = (color.x << 24) | (color.y << 16) | (color.z << 8) | color.w;
                    
                    if (color_map.find(packed_color) == color_map.end()) {
                        color_map[packed_color] = current_color_index;
                        current_color_index++;
                    }
                    
                    uint8_t color_index = color_map[packed_color];
                    blockArray.push_back({static_cast<int>(x), static_cast<int>(y), static_cast<int>(z), color_index});
                    indexedBlocks[color_index] = {static_cast<int>(color.x), static_cast<int>(color.y), static_cast<int>(color.z), static_cast<int>(color.w)};
                }
            }
        }
    }
    
    // Serialize to JSON with no extra spaces
    nlohmann::json json_output;
    json_output["blocks"] = indexedBlocks;
    json_output["xyzi"] = blockArray;
    
    std::ofstream file(filename_output);
    file << json_output.dump();
    file.close();
    
    fprintf(stdout, "[I/O] Written indexed JSON to %s\n", filename_output.c_str());
}
