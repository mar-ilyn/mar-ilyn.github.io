# Renderiza de frente el marco tallado fancy_picture_frame_02 (Poly Haven, CC0) para armar con sus
# piezas las molduras doradas de la pared (scripts/build-frame-kit.mjs). Cuatro renders del mismo
# encuadre ortográfico, con fondo transparente; en cada uno el material emite un solo dato:
#   kit_albedo.png  color base del tallado (sin luz)
#   kit_normal.png  normal map en espacio tangente (R = derecha, G = arriba, B = hacia la cámara)
#   kit_ao.png      oclusión ambiental: oscurece los recovecos del tallado
#   kit_rough.png   rugosidad del material original
#   kit_height.png  altura del relieve (blanco = lo más saliente): separa ornamentos de la moldura
# Con nombres de pasada después de la carpeta se renderizan solo esas (p. ej. "kit_height").
# Uso: blender -b --factory-startup --python scripts/blender/render_frame_kit.py -- <frame.gltf> <carpeta>

import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :]
GLTF, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
ONLY = set(argv[2:])
RES = 2048

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLTF)
for obj in list(bpy.data.objects):
    if "canvas" in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)

frame = next(o for o in bpy.data.objects if o.type == "MESH")
# glTF mira hacia +Z; importado en Blender, el frente queda hacia -Y.
pts = [frame.matrix_world @ v.co for v in frame.data.vertices]
xs, zs = [p.x for p in pts], [p.z for p in pts]
width, height = max(xs) - min(xs), max(zs) - min(zs)
cx, cz = (max(xs) + min(xs)) / 2, (max(zs) + min(zs)) / 2
size = max(width, height) * 1.02
print(f"[kit] marco {width:.3f} x {height:.3f} m, encuadre {size:.3f} m", flush=True)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.render.resolution_x = RES
scene.render.resolution_y = RES
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
if scene.world is None:
    scene.world = bpy.data.worlds.new("World")

cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = size
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
cam.location = (cx, -3.0, cz)
cam.rotation_euler = (1.5707963, 0.0, 0.0)
scene.camera = cam

source = frame.active_material
src_bsdf = next(n for n in source.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def linked_or_value(socket):
    return socket.links[0].from_socket if socket.is_linked else socket.default_value


def emission_material(name, build):
    """Copia el material original (texturas y UV) y reemplaza la salida por una emisión."""
    mat = source.copy()
    mat.name = name
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    out = next(n for n in nodes if n.type == "OUTPUT_MATERIAL")
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.0
    build(nodes, links, bsdf, emit.inputs["Color"])
    links.new(emit.outputs[0], out.inputs["Surface"])
    return mat


def albedo(nodes, links, bsdf, color_in):
    src = linked_or_value(bsdf.inputs["Base Color"])
    if isinstance(src, bpy.types.NodeSocket):
        links.new(src, color_in)
    else:
        color_in.default_value = src


def roughness(nodes, links, bsdf, color_in):
    src = linked_or_value(bsdf.inputs["Roughness"])
    if isinstance(src, bpy.types.NodeSocket):
        links.new(src, color_in)
    else:
        color_in.default_value = (src, src, src, 1)


def normal(nodes, links, bsdf, color_in):
    # Normal con el normal map original aplicado, del mundo → espacio tangente de la imagen.
    geo_normal = bsdf.inputs["Normal"].links[0].from_socket if bsdf.inputs["Normal"].is_linked else None
    if geo_normal is None:
        geo_normal = nodes.new("ShaderNodeNewGeometry").outputs["Normal"]
    sep = nodes.new("ShaderNodeSeparateXYZ")
    links.new(geo_normal, sep.inputs[0])

    def remap(socket, sign):
        m = nodes.new("ShaderNodeMath")
        m.operation = "MULTIPLY_ADD"
        m.inputs[1].default_value = 0.5 * sign
        m.inputs[2].default_value = 0.5
        links.new(socket, m.inputs[0])
        return m.outputs[0]

    comb = nodes.new("ShaderNodeCombineXYZ")
    links.new(remap(sep.outputs["X"], 1), comb.inputs["X"])
    links.new(remap(sep.outputs["Z"], 1), comb.inputs["Y"])
    links.new(remap(sep.outputs["Y"], -1), comb.inputs["Z"])
    links.new(comb.outputs[0], color_in)


def occlusion(nodes, links, bsdf, color_in):
    ao = nodes.new("ShaderNodeAmbientOcclusion")
    ao.inputs["Distance"].default_value = 0.03
    ao.samples = 16
    ao.inputs["Color"].default_value = (1, 1, 1, 1)
    links.new(ao.outputs["Color"], color_in)


def relief_height(nodes, links, bsdf, color_in):
    # Distancia hacia la cámara (−Y en Blender) normalizada al espesor del marco.
    ys = [p.y for p in pts]
    near, far = min(ys), max(ys)
    geo = nodes.new("ShaderNodeNewGeometry")
    sep = nodes.new("ShaderNodeSeparateXYZ")
    links.new(geo.outputs["Position"], sep.inputs[0])
    m = nodes.new("ShaderNodeMapRange")
    m.inputs["From Min"].default_value = far
    m.inputs["From Max"].default_value = near
    links.new(sep.outputs["Y"], m.inputs["Value"])
    links.new(m.outputs["Result"], color_in)


PASSES = [
    # nombre, armado del material, transformación de vista, muestras
    ("kit_albedo", albedo, "Standard", 16),
    ("kit_rough", roughness, "Raw", 16),
    ("kit_normal", normal, "Raw", 16),
    ("kit_ao", occlusion, "Raw", 64),
    ("kit_height", relief_height, "Raw", 16),
]

for name, build, view, samples in PASSES:
    if ONLY and name not in ONLY:
        continue
    frame.data.materials[0] = emission_material(name, build)
    scene.view_settings.view_transform = view
    scene.cycles.samples = samples
    scene.render.filepath = os.path.join(OUT, name + ".png")
    bpy.ops.render.render(write_still=True)
    print(f"[kit] {name} listo", flush=True)
