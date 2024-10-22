package com.example.voxelearth;

import org.bukkit.Material;
import java.awt.Color;

public class MaterialColor {
    private Material material;
    private Color color;

    public MaterialColor(Material material, Color color) {
        this.material = material;
        this.color = color;
    }

    public Material getMaterial() {
        return material;
    }

    public Color getColor() {
        return color;
    }
}
