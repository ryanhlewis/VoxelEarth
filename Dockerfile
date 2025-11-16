FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    maven \
    openjdk-21-jdk \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/voxelearth-src
COPY . .

RUN mvn -B -e -f minecraft-plugin/pom.xml -DskipTests package

RUN mkdir -p /opt/build-assets \
    && cp minecraft-plugin/target/VoxelEarth.jar /opt/build-assets/VoxelEarth.jar

ARG DYNAMICLOADER_REPO=https://github.com/VoxelEarth/dynamicloader
ARG DYNAMICLOADER_REF=main

RUN git clone --depth 1 --branch "${DYNAMICLOADER_REF}" "${DYNAMICLOADER_REPO}" /tmp/dynamicloader \
    && cp /tmp/dynamicloader/velocity-server-folder-items/voxelearth.zip /opt/build-assets/voxelearth.zip \
    && rm -rf /tmp/dynamicloader

# ------------------------------------------------------------------------------

FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openjdk-21-jre-headless \
    unzip \
    && rm -rf /var/lib/apt/lists/*

ENV ROOT_DIR=/opt/voxelearth \
    SERVER_DIR=/opt/voxelearth/server \
    ASSETS_DIR=/opt/voxelearth/assets \
    SERVER_PORT=25565 \
    JAVA_XMS=2G \
    JAVA_XMX=4G

WORKDIR /opt/voxelearth

COPY docker-entrypoint.sh /opt/voxelearth/docker-entrypoint.sh
COPY --from=builder /opt/build-assets/VoxelEarth.jar /opt/voxelearth/assets/VoxelEarth.jar
COPY --from=builder /opt/build-assets/voxelearth.zip /opt/voxelearth/assets/voxelearth.zip

RUN chmod +x /opt/voxelearth/docker-entrypoint.sh

EXPOSE 25565
VOLUME ["/opt/voxelearth/server"]

ENTRYPOINT ["/opt/voxelearth/docker-entrypoint.sh"]
