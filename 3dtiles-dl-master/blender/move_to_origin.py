import bpy

if __name__ == "__main__":
    meshes = list(filter(lambda o: o.type == "MESH", bpy.data.objects))
    l0 = meshes[0].location.copy()
    for m in meshes:
        m.location -= l0
