// Material.h
#pragma once
#include <string>

namespace trimesh {

enum MaterialType {
    SOLID,
    TEXTURED
};

class Material {
public:
    MaterialType type;
    std::string name;
    std::string textureFile;
    float color[3];

    // Default constructor
    Material() : type(SOLID), name(""), textureFile(""), color{1.0f, 1.0f, 1.0f} {}

    Material(MaterialType t, const std::string &n, const std::string &tf, float r, float g, float b)
        : type(t), name(n), textureFile(tf) {
        color[0] = r;
        color[1] = g;
        color[2] = b;
    }
};

} // namespace trimesh