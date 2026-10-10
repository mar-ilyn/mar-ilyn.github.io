# Hornea la iluminación de las superficies grandes de la galería (piso, pared y techo).
# Lo ejecuta scripts/bake-lightmaps.mjs:
#   blender -b --factory-startup --python scripts/blender/bake_lightmaps.py -- <scene.glb> <carpeta de salida>
#
# Dos mapas por superficie:
#   <nombre>_ao.png     oclusión ambiental (contacto de molduras, columnas, pedestales).
#   <nombre>_light.png  luz directa: sol de tarde por ventanas fuera de cuadro + luz sobre el retrato.
#                       Se normaliza a 0..1 y la escala real va a lightmaps.json.
# Las ventanas y las luces existen solo acá: en la página no hay nada de esto en tiempo real.

import json
import math
import sys
import time

import bpy
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
GLB, OUT = argv[0], argv[1]

# Superficie → resolución. Las UV de cada plano ya van de 0 a 1 sin solaparse.
AO_TARGETS = {"floor": (2048, 1024), "wall": (4096, 256), "ceiling": (1024, 512)}
LIGHT_TARGETS = {"floor": (2048, 1024), "wall": (4096, 256)}
AO_SAMPLES = 96
LIGHT_SAMPLES = 128
AO_DISTANCE = 1.2

# Coordenadas de la escena web (three.js, Y arriba) → Blender (Z arriba): (x, y, z) → (x, -z, y).
def b(x, y, z):
    return Vector((x, -z, y))


# Sol de tarde: viaja hacia +x (entra por la izquierda), bajo, y hacia la pared del fondo.
SUN_DIR = Vector((1.0, -0.18, -0.55)).normalized()  # en coordenadas web
SUN_COLOR = (1.0, 0.8, 0.58)
SUN_STRENGTH = 10.0
SUN_SOFTNESS = math.radians(1.2)

# Pared con ventanas fuera de cuadro, a la izquierda (x = -19), perpendicular a la pared del fondo.
# Centros elegidos para que cada ventana proyecte su luz sobre el panel de la intro:
# z = -3 + 0.55 · (x + 15.5) para x = -12, -9 y -6 (dirección del sol de arriba). Cerca de la sala
# para que, con un sol tan bajo, la luz llegue a la pared antes de tocar el piso.
WINDOW_WALL_X = -15.5
WINDOWS_Z = (-1.07, 0.58, 2.23)
WINDOW_W, WINDOW_BOTTOM, WINDOW_TOP = 0.9, 1.0, 4.0
# Sala cerrada solo para el horneado: el sol únicamente entra por las ventanas.
ROOM_Z_MAX, ROOM_TOP = 22.0, 4.2

# Luz del retrato: arriba del cuadro, apuntando a la pared y hacia abajo.
PICTURE_LIGHT = {"pos": (-8.7, 3.45, -2.55), "dir": (0.0, -0.6, -0.8), "power": 22.0, "color": (1.0, 0.85, 0.65)}

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.render.bake.margin = 8
if scene.world is None:
    scene.world = bpy.data.worlds.new("World")
scene.world.light_settings.distance = AO_DISTANCE
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.0  # sin luz de cielo


def find(name):
    for obj in bpy.data.objects:
        if obj.type == "MESH" and (obj.name == name or obj.name.startswith(name + ".")):
            return obj
    raise SystemExit(f"No se encontró la superficie '{name}' en la escena exportada")


def box(name, center_web, size_web):
    """Caja en coordenadas web (centro y tamaño en x, y, z)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=b(*center_web))
    obj = bpy.context.active_object
    obj.name = name
    sx, sy, sz = size_web
    obj.scale = (sx, sz, sy)
    return obj


def build_window_wall():
    z_min, z_max = -3.2, ROOM_Z_MAX
    y_mid = 2.1
    edges = [z_min]
    for zc in WINDOWS_Z:
        edges += [zc - WINDOW_W / 2, zc + WINDOW_W / 2]
    edges.append(z_max)
    # Tramos de pared entre ventanas (alto completo).
    for i in range(0, len(edges), 2):
        z0, z1 = edges[i], edges[i + 1]
        box("window_wall", (WINDOW_WALL_X, y_mid, (z0 + z1) / 2), (0.3, 4.4, z1 - z0))
    for zc in WINDOWS_Z:
        box("window_sill", (WINDOW_WALL_X, WINDOW_BOTTOM / 2, zc), (0.3, WINDOW_BOTTOM, WINDOW_W))
        box("window_lintel", (WINDOW_WALL_X, (WINDOW_TOP + 4.4) / 2, zc), (0.3, 4.4 - WINDOW_TOP, WINDOW_W))
        # Parteluz y travesaño: dibujan la cruz de la ventana en la luz.
        box("window_mullion", (WINDOW_WALL_X, (WINDOW_BOTTOM + WINDOW_TOP) / 2, zc), (0.1, WINDOW_TOP - WINDOW_BOTTOM, 0.06))
        box("window_transom", (WINDOW_WALL_X, 2.9, zc), (0.1, 0.06, WINDOW_W))
    # Más allá de la pared de ventanas la pared del fondo sigue: ahí tampoco tiene que pegar el sol.
    # A la altura de x = -26 los rayos que entran por las ventanas pasan por z >= 4,1 y los que
    # llegarían a esa parte exterior por z <= 2,8: este bloque frena solo a los segundos.
    box("outer_block", (-26.0, 4.0, 0.15), (0.5, 8.0, 6.7))
    # Techo-oclusor desde la pared de ventanas hacia adentro de la sala.
    x0, x1 = WINDOW_WALL_X, 40.0
    box("room_roof", ((x0 + x1) / 2, ROOM_TOP + 0.15, (z_min + z_max) / 2), (x1 - x0, 0.3, z_max - z_min))


def add_lights():
    sun_data = bpy.data.lights.new("sun", type="SUN")
    sun_data.energy = SUN_STRENGTH
    sun_data.color = SUN_COLOR
    sun_data.angle = SUN_SOFTNESS
    sun = bpy.data.objects.new("sun", sun_data)
    bpy.context.collection.objects.link(sun)
    d = b(*SUN_DIR)
    sun.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

    lamp_data = bpy.data.lights.new("picture_light", type="AREA")
    lamp_data.shape = "RECTANGLE"
    lamp_data.size, lamp_data.size_y = 0.7, 0.12
    lamp_data.energy = PICTURE_LIGHT["power"]
    lamp_data.color = PICTURE_LIGHT["color"]
    lamp = bpy.data.objects.new("picture_light", lamp_data)
    bpy.context.collection.objects.link(lamp)
    lamp.location = b(*PICTURE_LIGHT["pos"])
    lamp.rotation_euler = b(*PICTURE_LIGHT["dir"]).to_track_quat("-Z", "Y").to_euler()


def bake_target(target, image_name, width, height, float_buffer):
    image = bpy.data.images.new(image_name, width=width, height=height, alpha=False, float_buffer=float_buffer)
    image.colorspace_settings.name = "Non-Color"
    mat = bpy.data.materials.new(f"bake_{image_name}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
    bsdf.inputs["Roughness"].default_value = 1.0
    node = nodes.new("ShaderNodeTexImage")
    node.image = image
    nodes.active = node
    target.data.materials.clear()
    target.data.materials.append(mat)
    bpy.ops.object.select_all(action="DESELECT")
    target.select_set(True)
    bpy.context.view_layer.objects.active = target
    return image


scales = {}

# 1. Oclusión ambiental (sin luces: solo geometría).
scene.cycles.samples = AO_SAMPLES
for name, (w, h) in AO_TARGETS.items():
    start = time.time()
    image = bake_target(find(name), f"{name}_ao", w, h, False)
    bpy.ops.object.bake(type="AO", use_clear=True)
    image.filepath_raw = f"{OUT}/{name}_ao.png"
    image.file_format = "PNG"
    image.save()
    print(f"[bake] {name} AO: {w}x{h} en {time.time() - start:.0f} s", flush=True)

# 2. Luz directa: sol por las ventanas y luz del retrato.
build_window_wall()
add_lights()
# El techo de la escena se extiende 40 m a cada lado y taparía el sol antes de las ventanas:
# en esta pasada no proyecta sombra (la luz entra desde afuera de la sala).
find("ceiling").visible_shadow = False
scene.cycles.samples = LIGHT_SAMPLES
scene.render.bake.use_pass_direct = True
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = False
for name, (w, h) in LIGHT_TARGETS.items():
    start = time.time()
    image = bake_target(find(name), f"{name}_light", w, h, True)
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT"}, use_clear=True)
    pixels = np.array(image.pixels[:], dtype=np.float32).reshape(h, w, 4)
    peak = float(np.percentile(pixels[..., :3], 99.9)) or 1.0
    pixels[..., :3] = np.clip(pixels[..., :3] / peak, 0, 1)
    out = bpy.data.images.new(f"{name}_light_8bit", width=w, height=h, alpha=False, float_buffer=False)
    out.colorspace_settings.name = "Non-Color"
    out.pixels[:] = pixels.ravel()
    out.filepath_raw = f"{OUT}/{name}_light.png"
    out.file_format = "PNG"
    out.save()
    scales[name] = round(peak, 4)
    print(f"[bake] {name} luz: {w}x{h}, pico {peak:.3f}, en {time.time() - start:.0f} s", flush=True)

with open(f"{OUT}/lightmaps.json", "w") as f:
    json.dump({"lightScale": scales}, f, indent=2)
