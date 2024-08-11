import bpy
import os
import sys
from bpy.props import *
import glob

# Required - so we'll provide a local copy of Draco's DLL.
os.environ['BLENDER_EXTERN_DRACO_LIBRARY_PATH'] = './extern_draco.dll'

# Get the current directory name
current_dir = os.path.dirname(os.path.abspath(__file__))

# Read command-line arguments
glb_files = sys.argv[sys.argv.index("--") + 1:]
output_file = glb_files.pop()  # The last argument is the output file path

# If the last glb_file ends with '/' or '*', treat it as a directory or pattern
expanded_glb_files = []
for glb_file in glb_files:
    if glb_file.endswith('/') or '*' in glb_file:
        # Expand the directory or pattern to get all .glb files
        expanded_glb_files.extend(glob.glob(os.path.join(glb_file, "*.glb")))
    else:
        expanded_glb_files.append(glb_file)

glb_files = expanded_glb_files


bpy.ops.wm.read_factory_settings(use_empty=True)

addon_name = 'material-combiner-addon-master'
# addon_path = "material-combiner-addon-master.zip"
addon_path = os.path.join(current_dir, "material-combiner-addon-master.zip")
# addon_path = addon_path.replace("\\", "/")

# Ensure the Material Combiner Addon is loaded
if addon_name not in bpy.context.preferences.addons:
    try:
        bpy.ops.preferences.addon_install(filepath=addon_path)
        bpy.ops.preferences.addon_enable(module=addon_name)
        print("Material Combiner Addon installed and enabled successfully")
    except Exception as e:
        print(f"Failed to install or enable the addon: {e}")

print("Importing " + str(len(glb_files)) + " glb files")
# Import each .glb file
for glb_file in glb_files:
    bpy.ops.import_scene.gltf(filepath=glb_file)

# Select all imported objects
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)

# Join selected objects into a single object
bpy.ops.object.join()

# Ensure the save path for the atlas exists
save_path = os.path.dirname(output_file)
print(f"Save path: {save_path}")
save_path = os.path.join(current_dir, save_path)
if not os.path.exists(save_path):
    os.makedirs(save_path)

# Set scene save path
scn = bpy.context.scene
scn.smc_save_path = save_path

# Refresh object data
bpy.ops.smc.refresh_ob_data()

# Use the addon's functions
from blender.combiner_ops import (
    get_size, get_atlas_size, calculate_adjusted_size, get_atlas, align_uvs,
    get_comb_mats, assign_comb_mats, clear_mats, set_ob_mode, get_data, 
    get_mats_uv, clear_empty_mats, get_duplicates, get_structure, clear_duplicates
)
from blender.packer import BinPacker
import blender.globs as globs

# Get data, UVs, and structure
data = get_data(scn.smc_ob_data)
mats_uv = get_mats_uv(scn, data)
clear_empty_mats(scn, data, mats_uv)
get_duplicates(mats_uv)
structure = get_structure(scn, data, mats_uv)

if len(structure) == 1 and next(iter(structure.values()))['dup']:
    clear_duplicates(scn, structure)
    print("INFO: Duplicates were combined")
elif not structure or len(structure) == 1:
    print("ERROR: No unique materials selected")

# Create texture atlas
size = get_size(scn, structure)
packed_structure = BinPacker(size).fit()

atlas_size = get_atlas_size(packed_structure)
adjusted_size = calculate_adjusted_size(scn, atlas_size)

if max(adjusted_size, default=0) > 20000:
    print(f"ERROR: The output image size of {adjusted_size[0]}x{adjusted_size[1]}px is too large")

atlas = get_atlas(scn, packed_structure, adjusted_size)
align_uvs(scn, packed_structure, atlas.size, adjusted_size)
comb_mats = get_comb_mats(scn, atlas, mats_uv)
assign_comb_mats(scn, data, comb_mats)
clear_mats(scn, mats_uv)
bpy.ops.smc.refresh_ob_data()
print("INFO: Materials were combined")

# Export the combined object as a new .glb file
bpy.ops.export_scene.gltf(filepath=output_file, export_format='GLB',
                          # enable draco
                            export_draco_mesh_compression_enable=True, 
                            export_draco_mesh_compression_level=10, 
                            export_draco_position_quantization=14, 
                            export_draco_normal_quantization=10, 
                            export_draco_texcoord_quantization=12, 
                            export_draco_color_quantization=10, 
                            export_draco_generic_quantization=12,
                            )

print("Export complete")
