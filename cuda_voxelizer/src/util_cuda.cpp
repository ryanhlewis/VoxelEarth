#include "debug.h"
#include "util_cuda.h"

// Check if CUDA requirements are met
bool initCuda(){

	int device_count = 0;
	// Check if CUDA runtime calls work at all
	cudaError t = cudaGetDeviceCount(&device_count);
	if (t != cudaSuccess) {
		PRINT_ERR("[CUDA] First call to CUDA Runtime API failed. Are the drivers installed? \n");
		return false;
	}

	// Is there a CUDA device at all?
	checkCudaErrors(cudaGetDeviceCount(&device_count));
	if(device_count < 1){
		PRINT_ERR("[CUDA] No CUDA devices found. Make sure CUDA device is powered, connected and available. \n \n");
		PRINT_ERR("[CUDA] On laptops: disable powersave/battery mode. \n");
		PRINT_ERR("[CUDA] Exiting... \n");
		return false;
	}

	PRINT_ERR("[CUDA] CUDA device(s) found, picking best one \n");
	PRINT_DEBUG("[CUDA] ");
	// We have at least 1 CUDA device, so now select the fastest (method from Nvidia helper library)
	int device = findCudaDevice(0, 0);

	// Print available device memory
	cudaDeviceProp properties;
	checkCudaErrors(cudaGetDeviceProperties(&properties,device));
	PRINT_DEBUG("[CUDA] Best device: %s \n", properties.name);
	size_t free, total;
	checkCudaErrors(cudaMemGetInfo(&free, &total));
	PRINT_DEBUG("[CUDA] Available device memory: %llu of %llu MB \n", (free >> 20), (total >> 20));

	// Check compute capability
	if (properties.major < 2){
		PRINT_ERR("[CUDA] Your cuda device has compute capability %i.%i. We need at least 2.0 for atomic operations. \n", properties.major, properties.minor);
		return false;
	}
	return true;
}