// UV.h
#pragma once

namespace trimesh {
    class UV {
    public:
        float u;
        float v;

        UV() : u(0), v(0) {}
        UV(float u, float v) : u(u), v(v) {}
    };
}
