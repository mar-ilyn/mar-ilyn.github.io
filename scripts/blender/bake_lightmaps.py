# Hornea la oclusión ambiental de las superficies grandes de la galería (piso, pared y techo).
# Lo ejecuta scripts/bake-lightmaps.mjs:
#   blender -b --factory-startup --python scripts/blender/bake_lightmaps.py -- <scene.glb> <carpeta de salida>
# Las demás piezas (columnas, molduras, pedestales, marco) solo proyectan oclusión sobre esas tres.

import sys
import time

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :]
GLB, OUT = argv[0], argv[1]

# Superficie → resolución del lightmap. Las UV de cada plano ya van de 0 a 1 sin solaparse.
TARGETS = {
    "floor": (2048, 1024),  # 80 × 40 m
    "wall": (4096, 256),  # 80 × 4,2 m
    "ceiling": (1024, 512),  # 80 × 40 m, oclusión muy suave
}
SAMPLES = 96
AO_DISTANCE = 1.2  # metros: alcance de la oclusión (contacto y rincones, no sombras lejanas)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = SAMPLES
scene.render.bake.margin = 8
if scene.world is None:
    scene.world = bpy.data.worlds.new("World")
scene.world.light_settings.distance = AO_DISTANCE


def find(name):
    for obj in bpy.data.objects:
        if obj.type == "MESH" and (obj.name == name or obj.name.startswith(name + ".")):
            return obj
    raise SystemExit(f"No se encontró la superficie '{name}' en la escena exportada")


for name, (width, height) in TARGETS.items():
    target = find(name)
    image = bpy.data.images.new(f"{name}_ao", width=width, height=height, alpha=False, float_buffer=False)
    image.colorspace_settings.name = "Non-Color"

    # Material propio para la superficie destino, con el nodo de imagen activo (donde se hornea).
    mat = bpy.data.materials.new(f"bake_{name}")
    mat.use_nodes = True
    node = mat.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = image
    mat.node_tree.nodes.active = node
    target.data.materials.clear()
    target.data.materials.append(mat)

    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    bpy.context.view_layer.objects.active = target

    start = time.time()
    bpy.ops.object.bake(type="AO", use_clear=True)
    image.filepath_raw = f"{OUT}/{name}_ao.png"
    image.file_format = "PNG"
    image.save()
    print(f"[bake] {name}: {width}x{height} en {time.time() - start:.0f} s", flush=True)
