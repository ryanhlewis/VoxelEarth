#ifndef DEBUG_H
#define DEBUG_H

#include <cstdio>
#include <iostream>

// Declare the global debug flag (definition in one .cpp file)
extern bool g_debug;

// Macros for debug printing:
#define PRINT_DEBUG(fmt, ...) do { if (g_debug) std::printf(fmt, ##__VA_ARGS__); } while (0)
#define PRINT_ERR(fmt, ...)   do { if (g_debug) std::fprintf(stderr, fmt, ##__VA_ARGS__); } while (0)
#define PRINT_COUT(x)         do { if (g_debug) std::cout << x; } while (0)
#define PRINT_CERR(x)         do { if (g_debug) std::cerr << x; } while (0)

#endif // DEBUG_H
