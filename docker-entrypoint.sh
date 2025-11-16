#!/bin/bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/voxelearth}"
SERVER_DIR="${SERVER_DIR:-$ROOT_DIR/server}"
ASSETS_DIR="${ASSETS_DIR:-$ROOT_DIR/assets}"
SERVER_ZIP="${SERVER_ZIP:-$ASSETS_DIR/voxelearth.zip}"
PLUGIN_JAR_PATH="${PLUGIN_JAR_PATH:-$ASSETS_DIR/VoxelEarth.jar}"
SERVER_PORT="${SERVER_PORT:-25565}"
JAVA_XMS="${JAVA_XMS:-2G}"
JAVA_XMX="${JAVA_XMX:-4G}"
EXTRA_JAVA_FLAGS="${EXTRA_JAVA_FLAGS:-}"

log() {
  echo "[VoxelEarth] $*"
}

die() {
  log "ERROR: $*"
  exit 1
}

set_prop() {
  local file="$1" key="$2" value="$3"
  touch "$file"
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >>"$file"
  fi
}

prepare_server() {
  [[ -f "$SERVER_ZIP" ]] || die "Server zip not found at $SERVER_ZIP"
  [[ -f "$PLUGIN_JAR_PATH" ]] || die "Plugin jar not found at $PLUGIN_JAR_PATH"

  mkdir -p "$SERVER_DIR"

  if [[ ! -f "$SERVER_DIR/paper.jar" ]]; then
    log "paper.jar missing; extracting bundled server from $(basename "$SERVER_ZIP")"
    unzip -q "$SERVER_ZIP" -d "$SERVER_DIR"
  fi

  local plugins_dir="$SERVER_DIR/plugins"
  mkdir -p "$plugins_dir"
  cp "$PLUGIN_JAR_PATH" "$plugins_dir/VoxelEarth.jar"

  local props="$SERVER_DIR/server.properties"
  set_prop "$props" "server-port" "$SERVER_PORT"
  set_prop "$props" "motd" "VoxelEarth Docker Server"

  echo "eula=true" >"$SERVER_DIR/eula.txt"
}

launch_server() {
  local java_flags=(
    "-Xms${JAVA_XMS}"
    "-Xmx${JAVA_XMX}"
    "-XX:+UseG1GC"
    "-XX:+ParallelRefProcEnabled"
    "-XX:MaxGCPauseMillis=100"
    "-XX:+UnlockExperimentalVMOptions"
    "-XX:G1NewSizePercent=20"
    "-XX:G1MaxNewSizePercent=30"
    "-XX:G1HeapRegionSize=4M"
    "-XX:G1ReservePercent=15"
    "-XX:InitiatingHeapOccupancyPercent=20"
    "-XX:G1MixedGCLiveThresholdPercent=90"
    "-XX:MaxTenuringThreshold=1"
    "-XX:+DisableExplicitGC"
    "-XX:+AlwaysPreTouch"
    "-XX:+PerfDisableSharedMem"
    "-Daikars.new.flags=true"
  )

  if [[ -n "$EXTRA_JAVA_FLAGS" ]]; then
    read -r -a extra_parts <<<"$EXTRA_JAVA_FLAGS"
    java_flags+=("${extra_parts[@]}")
  fi

  cd "$SERVER_DIR"
  log "Starting Paper server on port ${SERVER_PORT}"
  exec java "${java_flags[@]}" -jar paper.jar --nogui "$@"
}

prepare_server
launch_server "$@"
