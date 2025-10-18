package com.example.voxelearth;

import java.io.InputStream;
import java.util.Properties;

/** Simple build/runtime switch for debug logging. */
public final class Debug {
    private static final boolean FLAG;
    static {
        boolean f = false;
        try (InputStream in = Debug.class.getResourceAsStream("/voxelearth.properties")) {
            if (in != null) {
                Properties p = new Properties();
                p.load(in);
                f = Boolean.parseBoolean(p.getProperty("debug", "false"));
            }
        } catch (Exception ignored) {}
        // Optional runtime override: -Dvoxelearth.debug=true
        String sys = System.getProperty("voxelearth.debug");
        if (sys != null) {
            f = Boolean.parseBoolean(sys);
        }
        FLAG = f;
    }

    public static boolean isDebug() { return FLAG; }
    private Debug() {}
}
