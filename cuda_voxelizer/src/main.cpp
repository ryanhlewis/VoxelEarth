#if defined(WIN32) || defined(_WIN32) || defined(WIN64) || defined(_WIN64)
#define WINDOWS_LEAN_AND_MEAN
#endif

#include <cstdio>
#include <string>
#include <vector>
#include <algorithm>
#include <iostream>
#include <cassert>
#include <fstream>         

// TriMesh for model importing
#include "TriMesh.h"

// Utility
#include "util.h"
#include "util_io.h"
#include "util_cuda.h"
#include "timer.h"

// CPU voxelizer fallback
#include "cpu_voxelizer.h"

#include "debug.h"

// Forward declarations of our voxelize.cu kernels
void voxelize(const voxinfo& v,
              float* triangle_data,
              float* uv_data,
              unsigned int* vtable,
              uchar4* color_table,
              uchar4* texture_data,
              int texture_width,
              int texture_height,
              bool morton_code);

void voxelize_solid(const voxinfo& v,
                    float* triangle_data,
                    unsigned int* vtable,
                    bool morton_code);

// ---------------------------------------------------------------------------
// Program Config
// ---------------------------------------------------------------------------
enum class OutputFormat {
    output_binvox = 0,
    output_morton,
    output_obj_points,
    output_obj_cubes,
    output_vox,
    output_glb,
    output_json,
    output_vxch
};

static const char* OutputFormats[] = {
    "binvox file",
    "morton encoded blob",
    "obj file (pointcloud)",
    "obj file (cubes)",
    "magicavoxel file",
    "glb file",
    "indexed json",
    "indexed binary (.vxch)"
};

static std::vector<std::string> inputFiles;   // multiple -f or -filelist
static unsigned int gridsize = 256;
static OutputFormat outputformat = OutputFormat::output_glb; // default: .GLB
static bool forceCPU = false;
static bool solidVoxelization = false;
static std::string output_directory = "";

// A new flag for 3D Tiles bounding box
static bool tiles3D = false;

bool g_debug = false;  // Default: silent mode

// A convenient version string
static std::string version_number = "v0.6";

// ---------------------------------------------------------------------------
// Print usage info
// ---------------------------------------------------------------------------
static void printHeader() {
    PRINT_DEBUG("## CUDA VOXELIZER\n");
    PRINT_COUT("CUDA Voxelizer " << version_number << " by Jeroen Baert\n");
    PRINT_COUT("https://github.com/Forceflow/cuda_voxelizer\n");
}

static void printHelp() {
    std::cout << "\n## HELP\n"
              << "Program options:\n"
              << " -f <mesh file>      (can be repeated for multiple files)\n"
              << " -filelist <txt>     (alternative to -f: a text file with one GLB/OBJ/etc per line)\n"
              << " -s <grid size>      (default 256)\n"
              << " -o <output format>  (binvox, morton, obj, obj_points, vox, glb, json, vxch)\n"
              << " -cpu                (force CPU voxelization)\n"
              << " -solid              (enable solid/watertight voxelization)\n"
              << " -3dtiles            (use hard-coded bounding box for a tile)\n"
              << " -output <dir>       (output directory)\n"
              << " -h                  (help)\n";
}

static void printExample() {
    std::cout << "Example 1: ./cuda_voxelizer -f tile1.glb -f tile2.glb -s 512 -o json -output out\n";
    std::cout << "Example 2: ./cuda_voxelizer -filelist my_tiles.txt -s 512 -o vxch -output out\n";
}

// ---------------------------------------------------------------------------
// Parse arguments
// ---------------------------------------------------------------------------
static void parseArgs(int argc, char* argv[]) {
    if(argc < 2) {
        printHelp();
        exit(EXIT_FAILURE);
    }
    for(int i = 1; i < argc; i++){
        std::string arg = argv[i];
        if(arg == "-f" && (i+1 < argc)) {
            inputFiles.push_back(argv[++i]);
        }
        else if(arg == "-filelist" && (i+1 < argc)) {
            std::string filelist_name = argv[++i];
            std::ifstream fin(filelist_name);
            if(!fin.is_open()){
                PRINT_CERR("[Err] Could not open filelist: " << filelist_name << "\n");
                exit(EXIT_FAILURE);
            }
            std::string line;
            const char* whitespace = " \t\r\n";
            while(std::getline(fin, line)){
                size_t start = line.find_first_not_of(whitespace);
                if(start == std::string::npos)
                    continue;
                size_t end = line.find_last_not_of(whitespace);
                std::string trimmed = line.substr(start, end - start + 1);
                if(!trimmed.empty()){
                    inputFiles.push_back(trimmed);
                }
            }
            fin.close();
        }
        else if(arg == "-s" && (i+1 < argc)) {
            gridsize = static_cast<unsigned int>(std::stoi(argv[++i]));
        }
        else if(arg == "-o" && (i+1 < argc)) {
            std::string fmt = argv[++i];
            std::transform(fmt.begin(), fmt.end(), fmt.begin(), ::tolower);
            if(fmt == "binvox")         outputformat = OutputFormat::output_binvox;
            else if(fmt == "morton")      outputformat = OutputFormat::output_morton;
            else if(fmt == "obj")         outputformat = OutputFormat::output_obj_cubes;
            else if(fmt == "obj_points")  outputformat = OutputFormat::output_obj_points;
            else if(fmt == "vox")         outputformat = OutputFormat::output_vox;
            else if(fmt == "glb")         outputformat = OutputFormat::output_glb;
            else if(fmt == "json")        outputformat = OutputFormat::output_json;
            else if(fmt == "vxch")        outputformat = OutputFormat::output_vxch;
            else {
                PRINT_CERR("[Err] Unknown output format: " << fmt << "\n");
                exit(EXIT_FAILURE);
            }
        }
        else if(arg == "-cpu") {
            forceCPU = true;
        }
        else if(arg == "-solid") {
            solidVoxelization = true;
        }
        else if(arg == "-3dtiles") {
            tiles3D = true;
        }
        else if(arg == "-output" && (i+1 < argc)) {
            output_directory = argv[++i];
        }
        else if(arg == "-h") {
            printHelp();
            exit(EXIT_SUCCESS);
        }
        else if(arg == "-debug") {
            g_debug = true;
        }
        else {
            PRINT_CERR("[Err] Unknown argument: " << arg << "\n");
            printHelp();
            exit(EXIT_FAILURE);
        }
    }
    if(inputFiles.empty()){
        PRINT_CERR("[Err] No input files specified (use -f file or -filelist txt)\n");
        printExample();
        exit(EXIT_FAILURE);
    }
}

// ---------------------------------------------------------------------------
// Helpers to copy mesh data into "CUDA-managed" memory (unified memory).
// ---------------------------------------------------------------------------
static float* meshToGPU_managed(const trimesh::TriMesh* mesh) {
    Timer t; t.start();
    size_t ntri = mesh->faces.size();
    size_t nfloats = ntri * 9; // 3 coords * 3 vertices
    float* d_tri = nullptr;
    cudaMallocManaged(&d_tri, nfloats * sizeof(float));
    for(size_t i = 0; i < ntri; i++){
        auto &f = mesh->faces[i];
        float3 v0 = trimesh_to_float3<trimesh::point>(mesh->vertices[f[0]]);
        float3 v1 = trimesh_to_float3<trimesh::point>(mesh->vertices[f[1]]);
        float3 v2 = trimesh_to_float3<trimesh::point>(mesh->vertices[f[2]]);
        size_t base = i * 9;
        d_tri[base + 0] = v0.x; d_tri[base + 1] = v0.y; d_tri[base + 2] = v0.z;
        d_tri[base + 3] = v1.x; d_tri[base + 4] = v1.y; d_tri[base + 5] = v1.z;
        d_tri[base + 6] = v2.x; d_tri[base + 7] = v2.y; d_tri[base + 8] = v2.z;
    }
    t.stop();
    PRINT_DEBUG("[Perf] Copied %zu triangles to GPU in %.1f ms\n", ntri, t.elapsed_time_milliseconds);
    return d_tri;
}

static float* uvsToGPU_managed(const trimesh::TriMesh* mesh) {
    Timer t; t.start();
    size_t ntri = mesh->faces.size();
    size_t nfloats = ntri * 6; // 2 UV coords * 3 vertices
    float* d_uv = nullptr;
    cudaMallocManaged(&d_uv, nfloats * sizeof(float));
    for(size_t i = 0; i < ntri; i++){
        auto &f = mesh->faces[i];
        trimesh::UV uv0 = mesh->uvs[f[0]];
        trimesh::UV uv1 = mesh->uvs[f[1]];
        trimesh::UV uv2 = mesh->uvs[f[2]];
        size_t base = i * 6;
        d_uv[base+0] = uv0.u;  d_uv[base+1] = uv0.v;
        d_uv[base+2] = uv1.u;  d_uv[base+3] = uv1.v;
        d_uv[base+4] = uv2.u;  d_uv[base+5] = uv2.v;
    }
    t.stop();
    PRINT_DEBUG("[Perf] Copied UVs for %zu triangles to GPU in %.1f ms\n", ntri, t.elapsed_time_milliseconds);
    return d_uv;
}

static uchar4* textureToGPU_managed(const trimesh::TriMesh* mesh){
    if(mesh->textures.empty()){
        return nullptr;  // no texture
    }
    auto &tex = mesh->textures.begin()->second;
    if(tex.width < 1 || tex.height < 1 || tex.imageData.empty()){
        return nullptr;
    }
    Timer t; t.start();
    size_t n_elems = tex.imageData.size() / 4; // RGBA
    uchar4* d_tex = nullptr;
    cudaMallocManaged(&d_tex, n_elems * sizeof(uchar4));
    for(size_t i = 0; i < n_elems; i++){
        d_tex[i].x = tex.imageData[4*i + 0];
        d_tex[i].y = tex.imageData[4*i + 1];
        d_tex[i].z = tex.imageData[4*i + 2];
        d_tex[i].w = tex.imageData[4*i + 3];
    }
    t.stop();
    PRINT_DEBUG("[Perf] Copied texture to GPU in %.1f ms\n", t.elapsed_time_milliseconds);
    return d_tex;
}

// ---------------------------------------------------------------------------
// processSingleFile - the main steps for one mesh
// ---------------------------------------------------------------------------
static void processSingleFile(const std::string &file) {
    // Load the mesh with TriMesh
    PRINT_DEBUG("[Info] Loading mesh: %s\n", file.c_str());
    trimesh::TriMesh* mesh = trimesh::TriMesh::read(file.c_str());
    if(!mesh){
        PRINT_CERR("[Err] Could not load mesh " << file << "\n");
        return;
    }
    mesh->need_faces();
    mesh->need_bbox();

    // Some stats
    size_t ntri = mesh->faces.size();
    size_t nvert = mesh->vertices.size();
    PRINT_DEBUG("[Mesh] %s: Triangles=%zu, Vertices=%zu\n", file.c_str(), ntri, nvert);

    // -----------------------------------------------------------------------
    // BOUNDING BOX LOGIC
    // If "-3dtiles" was specified, we use the hard-coded tile bounding box.
    // Otherwise, we use the mesh's own bounding box.
    // -----------------------------------------------------------------------
    AABox<float3> voxelBox;
    {
        if (tiles3D) {
            // Hard-coded bounding box for 3DTiles
            float scale_factor = 1.3f;
            // float tile_x = 12.26f * scale_factor;
            // float tile_y = 36.45f * scale_factor;
            // float tile_z = 47.59f * scale_factor;
        const float tile_x = 46.0f * scale_factor;
        const float tile_y = 38.0f * scale_factor;
        const float tile_z = 24.0f * scale_factor;

        float3 bbmin = trimesh_to_float3<trimesh::point>(mesh->bbox.min);
        float3 bbmax = trimesh_to_float3<trimesh::point>(mesh->bbox.max);
        float3 c = make_float3(0.5f*(bbmin.x+bbmax.x),
                               0.5f*(bbmin.y+bbmax.y),
                               0.5f*(bbmin.z+bbmax.z));
        float3 half = make_float3(0.5f*tile_x, 0.5f*tile_y, 0.5f*tile_z);
        voxelBox = AABox<float3>(c - half, c + half);
        } else {
            // Normal bounding box around the mesh
            // mesh->bbox.min/max are trimesh::vec
            float3 bbmin = trimesh_to_float3<trimesh::point>(mesh->bbox.min);
            float3 bbmax = trimesh_to_float3<trimesh::point>(mesh->bbox.max);
            voxelBox = AABox<float3>(bbmin, bbmax);
            PRINT_DEBUG("[Info] Using mesh-based bounding box.\n");
        }
    }

    // Optionally expand the bounding box to a cube
    AABox<float3> cubeBox = createMeshBBCube<float3>(voxelBox);

    // Construct voxinfo
    voxinfo vinfo(cubeBox, make_uint3(gridsize, gridsize, gridsize), ntri);
    vinfo.print();

    // Allocate memory for vtable + color
    size_t voxel_count = (size_t)gridsize * gridsize * gridsize;
    size_t vtable_size = ((voxel_count + 31)/32) * 4; // in bytes
    size_t color_size  = voxel_count * sizeof(uchar4);

    unsigned int* vtable = nullptr;
    uchar4* color_table = nullptr;
    cudaMallocManaged(&vtable, vtable_size);
    cudaMallocManaged(&color_table, color_size);
    cudaMemset(vtable, 0, vtable_size);
    cudaMemset(color_table, 0, color_size);

    // Transfer data to GPU
    float* d_tri = meshToGPU_managed(mesh);
    float* d_uv  = nullptr;
    if(!mesh->uvs.empty()){
        d_uv = uvsToGPU_managed(mesh);
    } else {
        // fallback: allocate zero UV if the mesh does not have UVs
        size_t nf = ntri * 6;
        cudaMallocManaged(&d_uv, nf*sizeof(float));
        cudaMemset(d_uv, 0, nf*sizeof(float));
    }
    uchar4* d_tex = textureToGPU_managed(mesh);
    int texW = 0, texH = 0;
    if(!mesh->textures.empty()){
        auto &tex = mesh->textures.begin()->second;
        texW = tex.width;
        texH = tex.height;
    }

    // CPU fallback or GPU
    if(forceCPU){
        std::vector<unsigned int> tmpCPU( vtable_size/sizeof(unsigned int), 0 );
        if(!solidVoxelization){
            cpu_voxelizer::cpu_voxelize_mesh(vinfo, mesh, tmpCPU.data(), false);
        } else {
            cpu_voxelizer::cpu_voxelize_mesh_solid(vinfo, mesh, tmpCPU.data(), false);
        }
        cudaMemcpy(vtable, tmpCPU.data(), vtable_size, cudaMemcpyHostToDevice);
    } else {
        if(solidVoxelization){
            voxelize_solid(vinfo, d_tri, vtable, false);
        } else {
            voxelize(vinfo, d_tri, d_uv, vtable, color_table, d_tex, texW, texH, false);
        }
    }
    // Wait for the kernel to finish
    cudaDeviceSynchronize();

    // Copy data to host
    std::vector<unsigned int> hostVtable(vtable_size/sizeof(unsigned int));
    std::vector<uchar4>       hostColor(voxel_count);
    cudaMemcpy(hostVtable.data(), vtable, vtable_size, cudaMemcpyDeviceToHost);
    cudaMemcpy(hostColor.data(), color_table, color_size, cudaMemcpyDeviceToHost);

    // Write output
    std::string baseName = file;
    {
        size_t slashPos = baseName.find_last_of("/\\");
        if(slashPos != std::string::npos) {
            baseName = baseName.substr(slashPos+1);
        }
        // remove extension
        size_t dotPos = baseName.find_last_of(".");
        if(dotPos != std::string::npos) {
            baseName = baseName.substr(0, dotPos);
        }
        if(!output_directory.empty()){
            baseName = output_directory + "/" + baseName;
        }
    }

    switch(outputformat){
        case OutputFormat::output_morton:
            write_binary(hostVtable.data(), vtable_size, baseName);
            break;
        case OutputFormat::output_binvox:
            write_binvox(hostVtable.data(), vinfo, baseName);
            break;
        case OutputFormat::output_obj_points:
            write_obj_pointcloud(hostVtable.data(), vinfo, baseName);
            break;
        case OutputFormat::output_obj_cubes:
            write_obj_cubes(hostVtable.data(), vinfo, baseName);
            break;
        case OutputFormat::output_vox:
            write_vox(hostVtable.data(), hostColor.data(), vinfo, baseName);
            break;
        case OutputFormat::output_glb:
            write_gltf(hostVtable.data(), hostColor.data(), vinfo, baseName);
            break;
        case OutputFormat::output_json:
            write_indexed_json(hostVtable.data(), hostColor.data(), vinfo, baseName);
            break;
        case OutputFormat::output_vxch:
            write_indexed_binary(hostVtable.data(), hostColor.data(), vinfo, baseName);
            break;
    }
    PRINT_DEBUG("[Info] Wrote output for %s\n", file.c_str());

    // Cleanup
    cudaFree(vtable);
    cudaFree(color_table);
    cudaFree(d_tri);
    cudaFree(d_uv);
    if(d_tex) cudaFree(d_tex);
    delete mesh;
}

// ---------------------------------------------------------------------------
// main()
// ---------------------------------------------------------------------------
int main(int argc, char* argv[]){
    printHeader();
    parseArgs(argc, argv);

    PRINT_DEBUG("[Info] Processing %zu file(s)\n", inputFiles.size());
    PRINT_DEBUG("[Info] Grid size=%u\n", gridsize);
    PRINT_DEBUG("[Info] Output format=%s\n", OutputFormats[(int)outputformat]);
    PRINT_DEBUG("[Info] CPU forced? %s\n", (forceCPU?"Yes":"No"));
    PRINT_DEBUG("[Info] Solid voxelization? %s\n", (solidVoxelization?"Yes":"No"));
    if(!output_directory.empty()){
        PRINT_DEBUG("[Info] Output directory=%s\n", output_directory.c_str());
    }
    if(tiles3D){
        PRINT_DEBUG("[Info] 3D Tiles bounding box mode is ENABLED\n");
    }

    // If not CPU, init CUDA
    if(!forceCPU){
        bool ok = initCuda();
        if(!ok){
            PRINT_CERR("[Warn] No suitable CUDA GPU found. Falling back to CPU.\n");
            forceCPU = true;
        }
    }

    // Process each file in a simple for-loop
    for(const auto &f : inputFiles){
        processSingleFile(f);
    }

    PRINT_DEBUG("[All Done] Processed %zu files.\n", inputFiles.size());
    return 0;
}
