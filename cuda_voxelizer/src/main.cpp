#if defined(WIN32) || defined(_WIN32) || defined(WIN64) || defined(_WIN64)
#define WINDOWS_LEAN_AND_MEAN // Please, not too much windows shenanigans
#endif

// Standard libs
#include <string>
#include <cstdio>

// Trimesh for model importing
#include "TriMesh.h"
// Util
#include "util.h"
#include "util_io.h"
#include "util_cuda.h"
#include "timer.h"
// CPU voxelizer fallback
#include "cpu_voxelizer.h"

using namespace std;
string version_number = "v0.6";

// Forward declaration of CUDA functions
void voxelize(const voxinfo& v, float* triangle_data, float* uv_data, unsigned int* vtable, uchar4* color_table, uchar4* texture_data, int texture_width, int texture_height, bool morton_code);
void voxelize_solid(const voxinfo& v, float* triangle_data, unsigned int* vtable, bool morton_code);

// Output formats
enum class OutputFormat { output_binvox = 0, output_morton = 1, output_obj_points = 2, output_obj_cubes = 3, output_vox = 4, output_glb = 5, output_json=6 };
char *OutputFormats[] = { "binvox file", "morton encoded blob", "obj file (pointcloud)", "obj file (cubes)", "magicavoxel file", "glb file", "minecraft json"};

// Default options
string filename = "";
string filename_base = "";
OutputFormat outputformat = OutputFormat::output_glb;
unsigned int gridsize = 256;
bool forceCPU = false;
bool solidVoxelization = false;

void printHeader(){
	fprintf(stdout, "## CUDA VOXELIZER \n");
	cout << "CUDA Voxelizer " << version_number << " by Jeroen Baert" << endl; 
	cout << "https://github.com/Forceflow/cuda_voxelizer - mail (at) jeroen-baert (dot) be" << endl;
}

void printExample() {
	cout << "Example: cuda_voxelizer -f /home/jeroen/bunny.ply -s 512" << endl;
}

void printHelp(){
	fprintf(stdout, "\n## HELP  \n");
	cout << "Program options: " << endl << endl;
	cout << " -f <path to model file: .ply, .obj, .3ds> (required)" << endl;
	cout << " -s <voxelization grid size, power of 2: 8 -> 512, 1024, ... (default: 256)>" << endl;
	cout << " -o <output format: vox, binvox, obj, obj_points or morton (default: vox)>" << endl;
	cout << " -cpu : Force CPU-based voxelization (slow, but works if no compatible GPU can be found)" << endl;
	cout << " -solid : Force solid voxelization (experimental, needs watertight model)" << endl;
	cout << " -output <output directory> : Output directory for the generated files" << endl << endl;
	printExample();
	cout << endl;
}

// Convert colors float -> uchar
static unsigned char color2uchar(float p)
{
    return min(max(int(255.0f * p + 0.5f), 0), 255);
}

// METHOD 1: Helper function to transfer triangles to automatically managed CUDA memory ( > CUDA 7.x)
float* meshToGPU_managed(const trimesh::TriMesh *mesh) {
	Timer t; t.start();
	size_t n_floats = sizeof(float) * 9 * (mesh->faces.size());
	float* device_triangles = 0;
	fprintf(stdout, "[Mesh] Allocating %s of CUDA-managed UNIFIED memory for triangle data \n", (readableSize(n_floats)).c_str());
	checkCudaErrors(cudaMallocManaged((void**) &device_triangles, n_floats)); // managed memory
	fprintf(stdout, "[Mesh] Copy %llu triangles to CUDA-managed UNIFIED memory \n", (size_t)(mesh->faces.size()));
	for (size_t i = 0; i < mesh->faces.size(); i++) {
		float3 v0 = trimesh_to_float3<trimesh::point>(mesh->vertices[mesh->faces[i][0]]);
		float3 v1 = trimesh_to_float3<trimesh::point>(mesh->vertices[mesh->faces[i][1]]);
		float3 v2 = trimesh_to_float3<trimesh::point>(mesh->vertices[mesh->faces[i][2]]);
		size_t j = i * 9;
		// Memcpy assuming the floats are laid out next to eachother
		memcpy((device_triangles)+j, &v0.x, 3*sizeof(float)); 
		memcpy((device_triangles)+j+3, &v1.x, 3*sizeof(float));
		memcpy((device_triangles)+j+6, &v2.x, 3*sizeof(float));
	}
	t.stop();fprintf(stdout, "[Perf] Mesh transfer time to GPU: %.1f ms \n", t.elapsed_time_milliseconds);
	return device_triangles;
}
// Helper function to transfer colors to CUDA-managed memory
uint8_t* colorsToGPU_managed(const trimesh::TriMesh *mesh) {
    Timer t; t.start();
    size_t n_colors = sizeof(uint8_t) * 3 * (mesh->colors.size());
    uint8_t* device_colors = nullptr;
    fprintf(stdout, "[Colors] Allocating %s of CUDA-managed UNIFIED memory for color data\n", (readableSize(n_colors)).c_str());
    checkCudaErrors(cudaMallocManaged((void**)&device_colors, n_colors)); // managed memory
    fprintf(stdout, "[Colors] Copy %zu colors to CUDA-managed UNIFIED memory\n", mesh->colors.size());
    for (size_t i = 0; i < mesh->colors.size(); i++) {
        trimesh::Color color = mesh->colors[i];
        size_t j = i * 3;
        device_colors[j] = color2uchar(color[0]);
        device_colors[j + 1] = color2uchar(color[1]);
        device_colors[j + 2] = color2uchar(color[2]);
		// fprintf(stdout, "Color %zu: %u %u %u \n", i, device_colors[j], device_colors[j+1], device_colors[j+2]);
    }
	// print an example of the first color
	fprintf(stdout, "First color: %u %u %u \n", device_colors[0], device_colors[1], device_colors[2]);
    t.stop(); fprintf(stdout, "[Perf] Colors transfer time to GPU: %.1f ms\n", t.elapsed_time_milliseconds);
    return device_colors;
}


float* uvsToGPU_managed(const trimesh::TriMesh *mesh) {
    Timer t; t.start();
    size_t n_uvs = sizeof(float) * 6 * (mesh->faces.size()); // 6 floats per face (2 uvs per vertex * 3 vertices)
    float* device_uvs = 0;
    fprintf(stdout, "[UVs] Allocating %s of CUDA-managed UNIFIED memory for uv data \n", (readableSize(n_uvs)).c_str());
    checkCudaErrors(cudaMallocManaged((void**)&device_uvs, n_uvs)); // managed memory
    fprintf(stdout, "[UVs] Copy %llu uvs to CUDA-managed UNIFIED memory \n", (size_t)(mesh->faces.size()));
    for (size_t i = 0; i < mesh->faces.size(); i++) {
        trimesh::UV uv0 = mesh->uvs[mesh->faces[i][0]];
        trimesh::UV uv1 = mesh->uvs[mesh->faces[i][1]];
        trimesh::UV uv2 = mesh->uvs[mesh->faces[i][2]];
        size_t j = i * 6;
		memcpy((device_uvs) + j, &uv0.u, 2 * sizeof(float));
		memcpy((device_uvs) + j + 2, &uv1.u, 2 * sizeof(float));
		memcpy((device_uvs) + j + 4, &uv2.u, 2 * sizeof(float));
    }
    t.stop(); fprintf(stdout, "[Perf] UVs transfer time to GPU: %.1f ms\n", t.elapsed_time_milliseconds);
    return device_uvs;
}

uchar4* textureToGPU_managed(const trimesh::TriMesh *mesh) {
    Timer t; t.start();
    if (mesh->textures.empty()) {
        fprintf(stderr, "[Error] No textures found in the mesh.\n");
        return nullptr;
    }
    
    auto texture = mesh->textures.begin()->second;
    
    // Debug information for texture properties
    fprintf(stdout, "[Debug] Texture width: %d, height: %d, components: %d\n", texture.width, texture.height, texture.components);
    fprintf(stdout, "[Debug] Texture URI: %s\n", texture.uri.c_str());
    
    size_t n_texture_bytes = texture.imageData.size();
    size_t n_texture_elements = n_texture_bytes / 4; // As each texel is 4 bytes (RGBA)
    
    // Debug information for calculated sizes
    fprintf(stdout, "[Debug] n_texture_bytes: %zu\n", n_texture_bytes);
    fprintf(stdout, "[Debug] n_texture_elements: %zu\n", n_texture_elements);
    
    uchar4* device_texture = 0;
    fprintf(stdout, "[Texture] Allocating %s of CUDA-managed UNIFIED memory for texture data\n", (readableSize(n_texture_bytes)).c_str());
    
    cudaError_t err = cudaMallocManaged((void**)&device_texture, n_texture_elements * sizeof(uchar4));
    if (err != cudaSuccess) {
        fprintf(stderr, "[Error] cudaMallocManaged failed: %s\n", cudaGetErrorString(err));
        return nullptr;
    }
    
    // Debug information for device_texture
    fprintf(stdout, "[Debug] device_texture allocated at: %p\n", device_texture);
    
    for (size_t i = 0; i < n_texture_elements; ++i) {
        device_texture[i].x = texture.imageData[4 * i];
        device_texture[i].y = texture.imageData[4 * i + 1];
        device_texture[i].z = texture.imageData[4 * i + 2];
        device_texture[i].w = texture.imageData[4 * i + 3];
    }
    
    t.stop(); 
    fprintf(stdout, "[Perf] Texture transfer time to GPU: %.1f ms\n", t.elapsed_time_milliseconds);
    
    // Debug information after transfer
    fprintf(stdout, "[Debug] First texel: (%u, %u, %u, %u)\n", device_texture[0].x, device_texture[0].y, device_texture[0].z, device_texture[0].w);
    fprintf(stdout, "[Debug] Last texel: (%u, %u, %u, %u)\n", device_texture[n_texture_elements-1].x, device_texture[n_texture_elements-1].y, device_texture[n_texture_elements-1].z, device_texture[n_texture_elements-1].w);
    
    return device_texture;
}



// METHOD 2: Helper function to transfer triangles to old-style, self-managed CUDA memory ( < CUDA 7.x )
// Leaving this here for reference, the function above should be faster and better managed on all versions CUDA 7+
// 
//float* meshToGPU(const trimesh::TriMesh *mesh){
//	size_t n_floats = sizeof(float) * 9 * (mesh->faces.size());
//	float* pagelocktriangles;
//	fprintf(stdout, "Allocating %llu kb of page-locked HOST memory \n", (size_t)(n_floats / 1024.0f));
//	checkCudaErrors(cudaHostAlloc((void**)&pagelocktriangles, n_floats, cudaHostAllocDefault)); // pinned memory to easily copy from
//	fprintf(stdout, "Copy %llu triangles to page-locked HOST memory \n", (size_t)(mesh->faces.size()));
//	for (size_t i = 0; i < mesh->faces.size(); i++){
//		glm::vec3 v0 = trimesh_to_glm<trimesh::point>(mesh->vertices[mesh->faces[i][0]]);
//		glm::vec3 v1 = trimesh_to_glm<trimesh::point>(mesh->vertices[mesh->faces[i][1]]);
//		glm::vec3 v2 = trimesh_to_glm<trimesh::point>(mesh->vertices[mesh->faces[i][2]]);
//		size_t j = i * 9;
//		memcpy((pagelocktriangles)+j, glm::value_ptr(v0), sizeof(glm::vec3));
//		memcpy((pagelocktriangles)+j+3, glm::value_ptr(v1), sizeof(glm::vec3));
//		memcpy((pagelocktriangles)+j+6, glm::value_ptr(v2), sizeof(glm::vec3));
//	}
//	float* device_triangles;
//	fprintf(stdout, "Allocating %llu kb of DEVICE memory \n", (size_t)(n_floats / 1024.0f));
//	checkCudaErrors(cudaMalloc((void **) &device_triangles, n_floats));
//	fprintf(stdout, "Copy %llu triangles from page-locked HOST memory to DEVICE memory \n", (size_t)(mesh->faces.size()));
//	checkCudaErrors(cudaMemcpy((void *) device_triangles, (void*) pagelocktriangles, n_floats, cudaMemcpyDefault));
//	return device_triangles;
//}

string output_directory = ""; // custom output folder

// Parse the program parameters and set them as global variables
void parseProgramParameters(int argc, char* argv[]){
	if(argc<2){ // not enough arguments
		fprintf(stdout, "Not enough program parameters. \n \n");
		printHelp();
		exit(0);
	} 
	bool filegiven = false;
	for (int i = 1; i < argc; i++) {
		if (string(argv[i]) == "-f") {
			filename = argv[i + 1];
			filename_base = filename.substr(0, filename.find_last_of("."));
			filegiven = true;
			if (!file_exists(filename)) {fprintf(stdout, "[Err] File does not exist / cannot access: %s \n", filename.c_str());exit(1);}
			i++;
		}
		else if (string(argv[i]) == "-s") {
			gridsize = atoi(argv[i + 1]);
			i++;
		} else if (string(argv[i]) == "-h") {
			printHelp(); exit(0);
		} else if (string(argv[i]) == "-o") {
			string output = (argv[i + 1]);
			transform(output.begin(), output.end(), output.begin(), ::tolower); // to lowercase
			if (output == "binvox"){outputformat = OutputFormat::output_binvox;}
			else if (output == "morton"){outputformat = OutputFormat::output_morton;}
			else if (output == "obj"){outputformat = OutputFormat::output_obj_cubes;}
			else if (output == "obj_points") { outputformat = OutputFormat::output_obj_points; }
			else if (output == "vox") { outputformat = OutputFormat::output_vox; }
            else if (output == "glb") { outputformat = OutputFormat::output_glb; }
            else if (output == "json") { outputformat = OutputFormat::output_json; }
			else {fprintf(stdout, "[Err] Unrecognized output format: %s, valid options are binvox (default), morton, obj or obj_points \n", output.c_str());exit(1);}
		}
		else if (string(argv[i]) == "-cpu") {
			forceCPU = true;
		}
		else if (string(argv[i])=="-solid"){
			solidVoxelization = true;
		}
		else if (string(argv[i]) == "-output") {
			output_directory = argv[i + 1];
			// Check if the directory exists and is writable
			// if (!fs::is_directory(output_directory) || !fs::exists(output_directory)) {
			// 	std::cerr << "[Err] Output directory does not exist or is not writable: " << output_directory << std::endl;
			// 	exit(1);
			// }
			i++;
		}

	}
	if (!filegiven) {
		fprintf(stdout, "[Err] You didn't specify a file using -f (path). This is required. Exiting. \n");
		printExample(); exit(1);
	}
	fprintf(stdout, "[Info] Filename: %s \n", filename.c_str());
	fprintf(stdout, "[Info] Grid size: %i \n", gridsize);
	fprintf(stdout, "[Info] Output format: %s \n", OutputFormats[int(outputformat)]);
	fprintf(stdout, "[Info] Using CPU-based voxelization: %s (default: No)\n", forceCPU ? "Yes" : "No");
	fprintf(stdout, "[Info] Using Solid Voxelization: %s (default: No)\n", solidVoxelization ? "Yes" : "No");
}


int main(int argc, char* argv[]) {
    // PRINT PROGRAM INFO
    Timer t; t.start();
    printHeader();

    // PARSE PROGRAM PARAMETERS
    fprintf(stdout, "\n## PROGRAM PARAMETERS \n");
    parseProgramParameters(argc, argv);
    fflush(stdout);
    trimesh::TriMesh::set_verbose(false);

    // READ THE MESH
    fprintf(stdout, "\n## READ MESH \n");
#ifdef _DEBUG
    trimesh::TriMesh::set_verbose(true);
#endif
    fprintf(stdout, "[I/O] Reading mesh from %s \n", filename.c_str());
    trimesh::TriMesh* themesh = trimesh::TriMesh::read(filename.c_str());
    themesh->need_faces();
    fprintf(stdout, "[Mesh] Number of triangles: %zu \n", themesh->faces.size());
    fprintf(stdout, "[Mesh] Number of vertices: %zu \n", themesh->vertices.size());
    fprintf(stdout, "[Mesh] Computing bbox \n");
    themesh->need_bbox();

    // colorbynormals(themesh);
	// colorbyconfidences(themesh, 0.5f);
	themesh->print_debug_info();

    // COMPUTE BOUNDING BOX AND VOXELISATION PARAMETERS
    fprintf(stdout, "\n## VOXELISATION SETUP \n");

    // Make tile slightly smaller than bounds (to avoid clipping)
    float scale_factor = 1.3f;

    // Define fixed tile size (same for all tiles)
    float tile_size_x = 12.26f * scale_factor;
    float tile_size_y = 36.45f * scale_factor;
    float tile_size_z = 47.59f * scale_factor;
    // float tile_size_x = 47.59f;
    // float tile_size_y = 47.59f;
    // float tile_size_z = 47.59f;

    // Get the node translation
    float3 node_translation = make_float3(
        themesh->node_translation[0],
        themesh->node_translation[1],
        themesh->node_translation[2]
    );

    // Print node translation for debugging
    std::cerr << "Node Translation: (" 
            << node_translation.x << ", "
            << node_translation.y << ", "
            << node_translation.z << ")" << std::endl;

    // Compute the fixed tile bounding box around the node translation
    float3 tile_bbox_min = node_translation - 
        make_float3(tile_size_x / 2.0f, tile_size_y / 2.0f, tile_size_z / 2.0f);
    float3 tile_bbox_max = node_translation + 
        make_float3(tile_size_x / 2.0f, tile_size_y / 2.0f, tile_size_z / 2.0f);

    // Print tile bounding box for debugging
    std::cerr << "Fixed Tile BBox Min: (" 
            << tile_bbox_min.x << ", " << tile_bbox_min.y << ", " << tile_bbox_min.z << ")" << std::endl;
    std::cerr << "Fixed Tile BBox Max: (" 
            << tile_bbox_max.x << ", " << tile_bbox_max.y << ", " << tile_bbox_max.z << ")" << std::endl;

    // Translate the mesh to align with the tile's position
    // for (auto& vertex : themesh->vertices) {
    //     vertex.x += node_translation.x;
    //     vertex.y += node_translation.y;
    //     vertex.z += node_translation.z;
    // }

    // Create a consistent voxel bounding box (fixed size, same for all tiles)
    AABox<float3> voxel_bbox(tile_bbox_min, tile_bbox_max);

    // Debug: Output voxel bounding box dimensions
    std::cerr << "Voxel BBox Min: (" 
            << voxel_bbox.min.x << ", " 
            << voxel_bbox.min.y << ", " 
            << voxel_bbox.min.z << ")" << std::endl;

    std::cerr << "Voxel BBox Max: (" 
            << voxel_bbox.max.x << ", " 
            << voxel_bbox.max.y << ", " 
            << voxel_bbox.max.z << ")" << std::endl;
        
    // Create a cube-shaped bounding box
    AABox<float3> bbox_mesh_cubed = createMeshBBCube<float3>(voxel_bbox);

    // AABox<float3> bbox_mesh_cubed = createMeshBBCube<float3>(AABox<float3>(trimesh_to_float3(themesh->bbox.min), trimesh_to_float3(themesh->bbox.max)));
    voxinfo voxelization_info(bbox_mesh_cubed, make_uint3(gridsize, gridsize, gridsize), themesh->faces.size());
    voxelization_info.print();
    unsigned int* vtable = 0;
    uchar4* color_table = 0;

    size_t voxel_count = static_cast<size_t>(ceil(static_cast<size_t>(voxelization_info.gridsize.x) * static_cast<size_t>(voxelization_info.gridsize.y) * static_cast<size_t>(voxelization_info.gridsize.z) / 32.0f) * 4);
size_t color_data_size = static_cast<size_t>(
    voxelization_info.gridsize.x * voxelization_info.gridsize.y * voxelization_info.gridsize.z);
    size_t vtable_size = voxel_count;

    fprintf(stdout, "[Voxel Grid] Creating a voxel grid of size %d x %d x %d \n", voxelization_info.gridsize.x, voxelization_info.gridsize.y, voxelization_info.gridsize.z);
    fprintf(stdout, "[Voxel Grid] Voxel Count: %zu \n", voxel_count);
    fprintf(stdout, "[Voxel Grid] Color Data Size: %zu \n", color_data_size);
    fprintf(stdout, "[Voxel Grid] VTable Size: %zu \n", vtable_size);
    fprintf(stdout, "[Voxel Grid] Indexable Range of VTable: 0 to %zu\n", vtable_size - 1);

    checkCudaErrors(cudaMallocManaged((void**)&vtable, vtable_size));
    checkCudaErrors(cudaMallocManaged((void**)&color_table, color_data_size * sizeof(uchar4)));


    bool cuda_ok = false;
    if (!forceCPU) {
        fprintf(stdout, "\n## CUDA INIT \n");
        cuda_ok = initCuda();
        if (!cuda_ok) fprintf(stdout, "[Info] CUDA GPU not found\n");
    }

	float* device_triangles;
    float* device_uvs;
    uchar4* device_texture;

    if (cuda_ok && !forceCPU) {
        fprintf(stdout, "\n## TRIANGLES TO GPU TRANSFER \n");

        device_triangles = meshToGPU_managed(themesh);
        device_uvs = uvsToGPU_managed(themesh);
        device_texture = textureToGPU_managed(themesh);

        int texture_width = themesh->textures.begin()->second.width;
        int texture_height = themesh->textures.begin()->second.height;

        fprintf(stdout, "[Voxel Grid] Allocating %s of CUDA-managed UNIFIED memory for Voxel Grid\n", readableSize(vtable_size).c_str());
        checkCudaErrors(cudaMallocManaged((void**)&vtable, vtable_size));
        checkCudaErrors(cudaMallocManaged((void**)&color_table, color_data_size * sizeof(uchar4)));


        fprintf(stdout, "\n## GPU VOXELISATION \n");
        if (solidVoxelization) {
            voxelize_solid(voxelization_info, device_triangles, vtable, (outputformat == OutputFormat::output_morton));
        }
        else {
            voxelize(voxelization_info, device_triangles, device_uvs, vtable, color_table, device_texture, texture_width, texture_height, (outputformat == OutputFormat::output_morton));
        }
    } else {
        fprintf(stdout, "\n## CPU VOXELISATION \n");
        if (!forceCPU) { fprintf(stdout, "[Info] No suitable CUDA GPU was found: Falling back to CPU voxelization\n"); }
        else { fprintf(stdout, "[Info] Doing CPU voxelization (forced using command-line switch -cpu)\n"); }
        vtable = (unsigned int*)calloc(1, vtable_size);
        if (!solidVoxelization) {
            cpu_voxelizer::cpu_voxelize_mesh(voxelization_info, themesh, vtable, (outputformat == OutputFormat::output_morton));
        }
        else {
            cpu_voxelizer::cpu_voxelize_mesh_solid(voxelization_info, themesh, vtable, (outputformat == OutputFormat::output_morton));
        }
    }

    fprintf(stdout, "\n## FILE OUTPUT \n");
    if (outputformat == OutputFormat::output_morton) {
        write_binary(vtable, vtable_size, filename);
    }
    else if (outputformat == OutputFormat::output_binvox) {
        write_binvox(vtable, voxelization_info, filename);
    }
    else if (outputformat == OutputFormat::output_obj_points) {
        write_obj_pointcloud(vtable, voxelization_info, filename);
    }
    else if (outputformat == OutputFormat::output_obj_cubes) {
        write_obj_cubes(vtable, voxelization_info, filename);
    }
    else if (outputformat == OutputFormat::output_vox) {
        // write_vox(vtable, voxelization_info, filename);
		write_vox(vtable, color_table, voxelization_info, filename);
		// print output directory
    }
    else if (outputformat == OutputFormat::output_glb) {
		// // Stip off any directories at the start of the filename
		size_t last_slash = filename.find_last_of("/");
		if (last_slash != string::npos) {
			filename_base = filename.substr(last_slash + 1);
		}
		// Strip off any file extensions
		size_t last_dot = filename_base.find_last_of(".");
		if (last_dot != string::npos) {
			filename_base = filename_base.substr(0, last_dot);
		}

		printf("Output directory: %s\n", output_directory.c_str());
		if (output_directory != "") {
			filename = output_directory + "/" + filename_base;
		}
		printf("Output filename: %s\n", filename.c_str());
		write_gltf(vtable, color_table, voxelization_info, filename);
		// // write_gltf_with_draco(vtable, color_table, voxelization_info, filename);
    }
    else if (outputformat == OutputFormat::output_json) {
        
        // write_sponge_schematic(vtable, voxelization_info, filename.c_str());
        // write_indexed_json(vtable, color_table, voxelization_info, filename);

        write_indexed_json(vtable, color_table, voxelization_info, filename);
    }
    else {
        fprintf(stdout, "[Err] Unrecognized output format: %i \n", int(outputformat));
    }

    fprintf(stdout, "\n## STATS \n");
    t.stop(); fprintf(stdout, "[Perf] Total runtime: %.1f ms \n", t.elapsed_time_milliseconds);

	// CLEANUP
	// if (vtable) { free(vtable); }
	// if (cuda_ok && !forceCPU) {
	// 	if (device_triangles) { checkCudaErrors(cudaFree(device_triangles)); }
	// 	if (device_colors) { checkCudaErrors(cudaFree(device_colors)); }
	// }
	// if (themesh) { delete themesh; }
}
