package com.example.voxelearth;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.arguments.DoubleArgumentType;
import com.mojang.brigadier.arguments.IntegerArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.builder.LiteralArgumentBuilder;
import com.mojang.brigadier.builder.RequiredArgumentBuilder;
import org.bukkit.Bukkit;
import org.bukkit.command.CommandSender;
import org.bukkit.command.PluginCommand;
import org.bukkit.plugin.java.JavaPlugin;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Locale;
import java.util.logging.Logger;

import static com.mojang.brigadier.arguments.DoubleArgumentType.doubleArg;
import static com.mojang.brigadier.arguments.IntegerArgumentType.getInteger;
import static com.mojang.brigadier.arguments.IntegerArgumentType.integer;
import static com.mojang.brigadier.arguments.StringArgumentType.getString;
import static com.mojang.brigadier.arguments.StringArgumentType.greedyString;
import static com.mojang.brigadier.builder.LiteralArgumentBuilder.literal;
import static com.mojang.brigadier.builder.RequiredArgumentBuilder.argument;

/**
 * Paper 1.20.4 – inject Brigadier nodes directly into vanilla dispatcher.
 * No NMS or Paper event imports; robust reflection with multiple fallbacks.
 */
@SuppressWarnings({"rawtypes","unchecked"})
public final class BrigadierMapper {

    private final JavaPlugin plugin;
    private final Logger log;

    public BrigadierMapper(JavaPlugin plugin) {
        this.plugin = plugin;
        this.log = plugin.getLogger();
    }

    /** Call from onEnable(). Will retry once after 1s if dispatcher not ready at first. */
    public void registerAll() {
        if (tryRegisterNow()) return;
        // Retry once a bit later (server finishes bootstrapping commands very early, but just in case)
        Bukkit.getScheduler().runTaskLater(plugin, this::tryRegisterNow, 20L);
    }

    private boolean tryRegisterNow() {
        CommandDispatcher<Object> dispatcher = getVanillaDispatcher();
        if (dispatcher == null) {
            log.warning("[VoxelEarth] Could not obtain vanilla Brigadier dispatcher. Are you on Paper 1.20.4?");
            return false;
        }

        // ===== /visit <location...>
        dispatcher.register(
            lit("visit")
              .then(arg("location", greedyString())
                .executes(ctx -> {
                    CommandSender s = resolveSender(ctx.getSource());
                    dispatchBukkit(s, "visit", getString(ctx, "location"));
                    return 1;
                }))
              .executes(ctx -> { resolveSender(ctx.getSource()).sendMessage("Usage: /visit <location>"); return 0; })
        );

        dispatcher.register(
            lit("visitother")
              .then(arg("player", StringArgumentType.string())
              .then(arg("location", greedyString())
                .executes(ctx -> {
                    CommandSender s = resolveSender(ctx.getSource());
                    // Route straight into your Bukkit executor:
                    dispatchBukkit(s, "visitother", getString(ctx, "player"), getString(ctx, "location"));
                    return 1;
                })))
        );

        // ===== /visitradius <tiles:int>
        dispatcher.register(
            lit("visitradius")
              .then(arg("tiles", integer(1, 2048))
                .executes(ctx -> { dispatchBukkit(resolveSender(ctx.getSource()), "visitradius", String.valueOf(getInteger(ctx,"tiles"))); return 1; }))
        );

        // ===== /moveradius <tiles:int>
        dispatcher.register(
            lit("moveradius")
              .then(arg("tiles", integer(1, 2048))
                .executes(ctx -> { dispatchBukkit(resolveSender(ctx.getSource()), "moveradius", String.valueOf(getInteger(ctx,"tiles"))); return 1; }))
        );

        // ===== /movethreshold <blocks:double>
        dispatcher.register(
            lit("movethreshold")
              .then(arg("blocks", doubleArg(0.0))
                .executes(ctx -> { dispatchBukkit(resolveSender(ctx.getSource()), "movethreshold", String.valueOf(DoubleArgumentType.getDouble(ctx,"blocks"))); return 1; }))
        );

        // ===== /moveload [on|off|toggle|status]
        dispatcher.register(
            lit("moveload")
              .then(lit("on").executes(ctx -> { dispatchBukkit(resolveSender(ctx.getSource()), "moveload","on"); return 1; }))
              .then(lit("off").executes(ctx -> { dispatchBukkit(resolveSender(ctx.getSource()), "moveload","off"); return 1; }))
              .then(lit("toggle").executes(ctx -> { dispatchBukkit(resolveSender(ctx.getSource()), "moveload","toggle"); return 1; }))
              .then(lit("status").executes(ctx -> { dispatchBukkit(resolveSender(ctx.getSource()), "moveload","status"); return 1; }))
              .executes(ctx -> { dispatchBukkit(resolveSender(ctx.getSource()), "moveload"); return 1; })
        );

        // ===== /createcustomworld <worldname>
        dispatcher.register(
            lit("createcustomworld")
              .then(arg("worldname", StringArgumentType.string())
                .executes(ctx -> { dispatchBukkit(resolveSender(ctx.getSource()), "createcustomworld", getString(ctx,"worldname")); return 1; }))
        );

        // ===== /loadjson <filename> <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>
        dispatcher.register(
            lit("loadjson")
              .then(arg("filename", StringArgumentType.string())
              .then(arg("scaleX",  doubleArg())
              .then(arg("scaleY",  doubleArg())
              .then(arg("scaleZ",  doubleArg())
              .then(arg("offsetX", doubleArg())
              .then(arg("offsetY", doubleArg())
              .then(arg("offsetZ", doubleArg())
                .executes(ctx -> {
                    CommandSender s = resolveSender(ctx.getSource());
                    dispatchBukkit(s, "loadjson",
                      getString(ctx,"filename"),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"scaleX")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"scaleY")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"scaleZ")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"offsetX")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"offsetY")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"offsetZ"))
                    );
                    return 1;
                }))))))))
        );

        // ===== /regenchunks <scaleX> <scaleY> <scaleZ> <offsetX> <offsetY> <offsetZ>
        dispatcher.register(
            lit("regenchunks")
              .then(arg("scaleX",  doubleArg())
              .then(arg("scaleY",  doubleArg())
              .then(arg("scaleZ",  doubleArg())
              .then(arg("offsetX", doubleArg())
              .then(arg("offsetY", doubleArg())
              .then(arg("offsetZ", doubleArg())
                .executes(ctx -> {
                    CommandSender s = resolveSender(ctx.getSource());
                    dispatchBukkit(s, "regenchunks",
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"scaleX")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"scaleY")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"scaleZ")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"offsetX")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"offsetY")),
                      String.valueOf(DoubleArgumentType.getDouble(ctx,"offsetZ"))
                    );
                    return 1;
                })))))))
        );

        log.info("[VoxelEarth] Brigadier nodes injected into vanilla dispatcher.");
        return true;
    }

    // -------------------- Dispatcher resolution (robust) --------------------

    private CommandDispatcher<Object> getVanillaDispatcher() {
        try {
            Object craftServer = Bukkit.getServer(); // CraftServer
            Method mGetServer = findAnyMethod(craftServer.getClass(), "getServer");
            Object nmsServer = mGetServer.invoke(craftServer); // DedicatedServer

            // 1) Prefer dedicatedServer.getVanillaCommandDispatcher() if present
            Object holder = invokeIfPresent(nmsServer, "getVanillaCommandDispatcher");
            if (holder == null) {
                // 2) dedicatedServer.getCommands()
                holder = invokeIfPresent(nmsServer, "getCommands");
            }
            if (holder == null) {
                // 3) common fields on DedicatedServer
                holder = getFieldIfPresent(nmsServer, "vanillaCommandDispatcher");
                if (holder == null) holder = getFieldIfPresent(nmsServer, "commandDispatcher");
                if (holder == null) holder = getFieldIfPresent(nmsServer, "commands");
            }
            if (holder == null) {
                // 4) scan all fields and pick the first that either is a Brigadier dispatcher
                //    or has one as a field
                for (Field f : nmsServer.getClass().getDeclaredFields()) {
                    f.setAccessible(true);
                    Object v = f.get(nmsServer);
                    if (v == null) continue;
                    CommandDispatcher<Object> d = extractDispatcher(v);
                    if (d != null) return d;
                }
                return null;
            }

            // Extract the actual Brigadier dispatcher from whatever we got
            return extractDispatcher(holder);

        } catch (Throwable t) {
            log.warning("[VoxelEarth] Failed to reflect vanilla dispatcher: " + t);
            return null;
        }
    }

    /** Returns the Brigadier dispatcher if the object is or holds one; otherwise null. */
    private CommandDispatcher<Object> extractDispatcher(Object obj) throws Exception {
        if (obj == null) return null;

        // a) It's already a Brigadier dispatcher?
        if (obj.getClass().getName().equals("com.mojang.brigadier.CommandDispatcher")) {
            return (CommandDispatcher<Object>) obj;
        }

        // b) It has a getDispatcher() that returns Brigadier?
        Method m = findMethodOrNull(obj.getClass(), "getDispatcher");
        if (m != null) {
            m.setAccessible(true);
            Object d = m.invoke(obj);
            if (d != null && d.getClass().getName().equals("com.mojang.brigadier.CommandDispatcher")) {
                return (CommandDispatcher<Object>) d;
            }
        }

        // c) It has a field named 'dispatcher' of Brigadier type?
        Field f = findFieldOrNull(obj.getClass(), "dispatcher");
        if (f != null) {
            f.setAccessible(true);
            Object d = f.get(obj);
            if (d != null && d.getClass().getName().equals("com.mojang.brigadier.CommandDispatcher")) {
                return (CommandDispatcher<Object>) d;
            }
        }

        // d) Scan any field whose type is Brigadier's CommandDispatcher
        for (Field any : obj.getClass().getDeclaredFields()) {
            if (any.getType().getName().equals("com.mojang.brigadier.CommandDispatcher")) {
                any.setAccessible(true);
                Object d = any.get(obj);
                if (d != null) return (CommandDispatcher<Object>) d;
            }
        }

        return null;
    }

    private Object invokeIfPresent(Object target, String method) {
        Method m = findMethodOrNull(target.getClass(), method);
        if (m == null) return null;
        try { m.setAccessible(true); return m.invoke(target); }
        catch (Throwable ignored) { return null; }
    }

    private Object getFieldIfPresent(Object target, String field) {
        Field f = findFieldOrNull(target.getClass(), field);
        if (f == null) return null;
        try { f.setAccessible(true); return f.get(target); }
        catch (Throwable ignored) { return null; }
    }

    private static Method findMethodOrNull(Class<?> c, String name, Class<?>... params) {
        try { return c.getMethod(name, params); } catch (NoSuchMethodException e) { return null; }
    }
    private static Method findAnyMethod(Class<?> c, String name, Class<?>... params) throws NoSuchMethodException {
        try { return c.getMethod(name, params); } catch (NoSuchMethodException ignored) {}
        Method m = c.getDeclaredMethod(name, params);
        m.setAccessible(true);
        return m;
    }
    private static Field findFieldOrNull(Class<?> c, String name) {
        try { return c.getField(name); } catch (NoSuchFieldException e1) {
            try { return c.getDeclaredField(name); } catch (NoSuchFieldException e2) { return null; }
        }
    }

    // -------------------- Helpers --------------------

    /** Resolve Bukkit CommandSender from Brigadier source (no NMS imports). */
    private CommandSender resolveSender(Object css) {
        try {
            Method getBukkitSender = css.getClass().getMethod("getBukkitSender");
            Object sender = getBukkitSender.invoke(css);
            if (sender instanceof CommandSender cs) return cs;
        } catch (Throwable ignored) { }
        try {
            Method getEntity = css.getClass().getMethod("getEntity"); // -> ServerPlayer?
            Object nmsEntity = getEntity.invoke(css);
            if (nmsEntity != null) {
                Method getBukkitEntity = nmsEntity.getClass().getMethod("getBukkitEntity");
                Object bukkit = getBukkitEntity.invoke(nmsEntity);
                if (bukkit instanceof CommandSender cs) return cs;
            }
        } catch (Throwable ignored) { }
        return Bukkit.getConsoleSender();
    }

    /** Dispatch to your existing Bukkit command executor on the main thread. */
    private void dispatchBukkit(CommandSender sender, String label, String... args) {
        PluginCommand cmd = plugin.getCommand(label);
        if (cmd == null) {
            sender.sendMessage("Unknown command: " + label);
            return;
        }
        Bukkit.getScheduler().runTask(plugin, () -> cmd.execute(sender, label, args));
    }

    // keep Brigadier nodes typed to <Object> to avoid wildcard/capture issues
    private static LiteralArgumentBuilder<Object> lit(String name) {
        return LiteralArgumentBuilder.literal(name);
    }
    private static <T> RequiredArgumentBuilder<Object, T> arg(String name, com.mojang.brigadier.arguments.ArgumentType<T> type) {
        return RequiredArgumentBuilder.argument(name, type);
    }
}
