package com.example.voxelearth;

import java.awt.Color;

public class ColorUtils {

    // Convert RGB to CIELAB
    public static double[] rgbToLab(Color color) {
        double[] xyz = rgbToXyz(color);
        return xyzToLab(xyz);
    }

    // Convert RGB to XYZ
    private static double[] rgbToXyz(Color color) {
        double r = pivotRgb(color.getRed() / 255.0);
        double g = pivotRgb(color.getGreen() / 255.0);
        double b = pivotRgb(color.getBlue() / 255.0);

        // Observer = 2°, Illuminant = D65
        double x = r * 0.4124 + g * 0.3576 + b * 0.1805;
        double y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        double z = r * 0.0193 + g * 0.1192 + b * 0.9505;

        return new double[]{x, y, z};
    }

    private static double pivotRgb(double n) {
        return (n > 0.04045) ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92;
    }

    // Convert XYZ to CIELAB
    private static double[] xyzToLab(double[] xyz) {
        // Reference White D65
        double refX = 95.047;
        double refY = 100.000;
        double refZ = 108.883;

        double x = pivotXyz(xyz[0] / refX);
        double y = pivotXyz(xyz[1] / refY);
        double z = pivotXyz(xyz[2] / refZ);

        double l = (116 * y) - 16;
        double a = 500 * (x - y);
        double b = 200 * (y - z);

        return new double[]{l, a, b};
    }

    private static double pivotXyz(double n) {
        return (n > 0.008856) ? Math.cbrt(n) : (7.787 * n) + (16.0 / 116.0);
    }

    // Calculate Delta E (CIEDE2000)
    public static double deltaE(double[] lab1, double[] lab2) {
        // Implementation based on the CIEDE2000 formula
        // Reference: https://en.wikipedia.org/wiki/Color_difference#CIEDE2000

        double L1 = lab1[0];
        double a1 = lab1[1];
        double b1 = lab1[2];
        double L2 = lab2[0];
        double a2 = lab2[1];
        double b2 = lab2[2];

        double avgLp = (L1 + L2) / 2.0;

        double C1 = Math.sqrt(a1 * a1 + b1 * b1);
        double C2 = Math.sqrt(a2 * a2 + b2 * b2);
        double avgC = (C1 + C2) / 2.0;

        double G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7.0) / (Math.pow(avgC, 7.0) + Math.pow(25.0, 7.0))));

        double a1p = (1 + G) * a1;
        double a2p = (1 + G) * a2;

        double C1p = Math.sqrt(a1p * a1p + b1 * b1);
        double C2p = Math.sqrt(a2p * a2p + b2 * b2);
        double avgCp = (C1p + C2p) / 2.0;

        double h1p = Math.atan2(b1, a1p);
        h1p = h1p >= 0 ? h1p : h1p + 2 * Math.PI;
        double h2p = Math.atan2(b2, a2p);
        h2p = h2p >= 0 ? h2p : h2p + 2 * Math.PI;

        double avgHp;
        if (Math.abs(h1p - h2p) > Math.PI) {
            avgHp = (h1p + h2p + 2 * Math.PI) / 2.0;
        } else {
            avgHp = (h1p + h2p) / 2.0;
        }

        double T = 1
                - 0.17 * Math.cos(avgHp - Math.toRadians(30))
                + 0.24 * Math.cos(2 * avgHp)
                + 0.32 * Math.cos(3 * avgHp + Math.toRadians(6))
                - 0.20 * Math.cos(4 * avgHp - Math.toRadians(63));

        double deltaHp;
        if (Math.abs(h2p - h1p) <= Math.PI) {
            deltaHp = h2p - h1p;
        } else if (h2p <= h1p) {
            deltaHp = h2p - h1p + 2 * Math.PI;
        } else {
            deltaHp = h2p - h1p - 2 * Math.PI;
        }

        double deltaLp = L2 - L1;
        double deltaCp = C2p - C1p;
        double deltaHpDeg = 2 * Math.sqrt(C1p * C2p) * Math.sin(deltaHp / 2.0);

        double SL = 1 + ((0.015 * Math.pow(avgLp - 50, 2)) / Math.sqrt(20 + Math.pow(avgLp - 50, 2)));
        double SC = 1 + 0.045 * avgCp;
        double SH = 1 + 0.015 * avgCp * T;

        double deltaTheta = Math.toRadians(30) * Math.exp(-Math.pow((avgHp - Math.toRadians(275)) / Math.toRadians(25), 2));
        double RC = 2 * Math.sqrt(Math.pow(avgCp, 7.0) / (Math.pow(avgCp, 7.0) + Math.pow(25.0, 7.0)));
        double RT = -RC * Math.sin(2 * deltaTheta);

        double deltaE = Math.sqrt(
                Math.pow(deltaLp / SL, 2) +
                Math.pow(deltaCp / SC, 2) +
                Math.pow(deltaHpDeg / SH, 2) +
                RT * (deltaCp / SC) * (deltaHpDeg / SH)
        );

        return deltaE;
    }
}
