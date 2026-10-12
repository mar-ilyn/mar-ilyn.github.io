import { BoxGeometry, CylinderGeometry, Group, PlaneGeometry, type BufferGeometry } from 'three'
import { CABINET } from '../data/timeline'
import type { TimelineObjectKind } from '../data/types'
import { bake } from './bake'
import { place, ring } from './ornament'
import { ROOM } from './layout'

// Mueble vitrina de la zona "Sobre mí" y sus objetos, modelados por código (assets propios).
// Todo se hornea en una geometría por material: nogal, latón, fondo claro, vidrio y luz.
// Coordenadas de la escena; z = 0 en la cara de la pared.

const WOOD_TILE = 0.9 // metros que cubre una repetición de la textura de nogal

// Caja de madera con UV en metros: la veta conserva su escala real en piezas largas o cortas.
export function woodBox(w: number, h: number, d: number): BoxGeometry {
  const g = new BoxGeometry(w, h, d)
  const uv = g.attributes.uv
  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z (4 vértices cada una).
  const faces: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ]
  faces.forEach(([fw, fh], f) => {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i
      uv.setXY(k, (uv.getX(k) * fw) / WOOD_TILE, (uv.getY(k) * fh) / WOOD_TILE)
    }
  })
  return g
}

const Z = ROOM.wallZ
// El fondo claro va por delante de las molduras de la pared (sobresalen hasta 5 cm).
export const BACKING_Z = 0.065
const D = CABINET.depth
const W = CABINET.width
const CX = CABINET.cx
const L = CX - W / 2
const R = CX + W / 2
const box = (root: Group, w: number, h: number, d: number, x: number, y: number, z: number) =>
  place(root, woodBox(w, h, d), { position: [x, y, Z + z] })
const plain = (root: Group, w: number, h: number, d: number, x: number, y: number, z: number) =>
  place(root, new BoxGeometry(w, h, d), { position: [x, y, Z + z] })

export interface CabinetGeometries {
  walnut: BufferGeometry
  brass: BufferGeometry
  backing: BufferGeometry
  glass: BufferGeometry
  glow: BufferGeometry
}

// Mueble vitrina alto: base de nogal con dos puertas de paneles, cuerpo vidriado con un marco fino de
// latón (montantes, cantos y estante de vidrio), fondo claro, tira de luz bajo el techo y cornisa
// escalonada de nogal.
export function cabinetGeometries(): CabinetGeometries {
  const walnut = new Group()
  const brass = new Group()
  const backing = new Group()
  const glass = new Group()
  const glow = new Group()
  const { baseTop, shelf, top, crown } = CABINET

  // Base: zócalo, cuerpo con dos puertas de panel clásico y moldura de remate.
  box(walnut, W + 0.06, 0.1, D + 0.04, CX, 0.05, D / 2 + 0.02)
  const bodyH = baseTop - 0.14
  const bodyY = 0.1 + bodyH / 2
  box(walnut, W, bodyH, D, CX, bodyY, D / 2)
  for (const s of [-1, 1]) {
    const dx = CX + (s * W) / 4
    const pw = W / 2 - 0.14
    const ph = bodyH - 0.14
    place(walnut, ring(pw, ph, pw - 0.07, ph - 0.07, 0.014, 0.006), { position: [dx, bodyY, Z + D + 0.001] })
    place(walnut, woodBox(pw - 0.09, ph - 0.09, 0.012), { position: [dx, bodyY, Z + D + 0.006] })
    place(brass, new CylinderGeometry(0.011, 0.011, 0.024, 14), {
      position: [CX + s * 0.05, bodyY + 0.04, Z + D + 0.014],
      rotation: [Math.PI / 2, 0, 0],
    })
  }
  // Junta entre las dos puertas.
  plain(walnut, 0.006, bodyH - 0.02, 0.004, CX, bodyY, D + 0.002)
  box(walnut, W + 0.05, 0.04, D + 0.04, CX, baseTop - 0.02, D / 2 + 0.02)
  plain(brass, W + 0.05, 0.006, 0.006, CX, baseTop + 0.002, D + 0.042)

  // Cuerpo vidriado: montantes de latón en las cuatro esquinas y travesaños arriba y abajo.
  const glassH = top - baseTop
  const post = 0.032
  for (const x of [L + post / 2, R - post / 2]) {
    for (const z of [post / 2 + 0.02, D - post / 2]) plain(brass, post, glassH, post, x, baseTop + glassH / 2, z)
  }
  for (const y of [baseTop + 0.012, top - 0.012]) plain(brass, W, 0.024, post, CX, y, D - post / 2)
  for (const x of [L + post / 2, R - post / 2]) {
    for (const y of [baseTop + 0.012, top - 0.012]) plain(brass, post, 0.024, D - 0.02, x, y, D / 2 + 0.01)
  }
  // Estante de vidrio entre los dos compartimentos, con canto de latón y un travesaño al frente.
  plain(glass, W - 2 * post, 0.012, D - 0.06, CX, shelf - 0.006, D / 2)
  plain(brass, W - 2 * post, 0.016, 0.01, CX, shelf - 0.008, D - 0.035)
  plain(brass, W, 0.018, post * 0.8, CX, shelf - 0.009, D - post / 2)
  // Bisagras de la puerta vidriada (lado derecho) y un tirador de latón a la izquierda.
  for (const y of [baseTop + 0.25, top - 0.25]) plain(brass, 0.012, 0.07, 0.012, R - 0.004, y, D + 0.004)
  plain(brass, 0.012, 0.16, 0.014, L + 0.045, (baseTop + top) / 2, D + 0.01)

  // Vidrios: frente (uno por compartimento) y laterales.
  for (const [y0, y1] of [
    [baseTop + 0.024, shelf - 0.018],
    [shelf, top - 0.024],
  ]) {
    plain(glass, W - 2 * post, y1 - y0, 0.004, CX, (y0 + y1) / 2, D - 0.012)
  }
  for (const x of [L + 0.006, R - 0.006]) {
    place(glass, new BoxGeometry(0.004, glassH - 0.05, D - 2 * post - 0.02), {
      position: [x, baseTop + glassH / 2, Z + D / 2 + 0.01],
    })
  }

  // Fondo claro de los dos compartimentos (tela de lino) y techo interior.
  plain(backing, W - 2 * post, glassH, 0.01, CX, baseTop + glassH / 2, BACKING_Z)
  box(walnut, W - 2 * post, 0.03, D - 0.04, CX, top - 0.039, D / 2)
  // Tira de luz bajo el techo, al frente, y otra bajo el estante de vidrio, al fondo.
  plain(glow, W - 0.12, 0.006, 0.02, CX, top - 0.058, D - 0.06)
  plain(glow, W - 0.12, 0.004, 0.016, CX, shelf - 0.016, BACKING_Z + 0.04)

  // Cornisa escalonada: friso liso, filete de latón y dos cornisas que vuelan cada vez más.
  box(walnut, W + 0.02, 0.1, D + 0.02, CX, top + 0.05, D / 2 + 0.01)
  plain(brass, W + 0.03, 0.008, 0.006, CX, top + 0.02, D + 0.024)
  box(walnut, W + 0.08, 0.04, D + 0.05, CX, top + 0.12, D / 2 + 0.025)
  box(walnut, W + 0.14, crown - top - 0.14, D + 0.08, CX, (top + 0.14 + crown) / 2, D / 2 + 0.04)

  return { walnut: bake(walnut), brass: bake(brass), backing: bake(backing), glass: bake(glass), glow: bake(glow) }
}

// --- Objetos (centrados en x = 0, apoyados en y = 0, frente hacia +z) ---

export interface ObjectParts {
  [material: string]: BufferGeometry
}

// Teclado mecánico compacto (75 %): carcasa de aluminio oscuro y teclas en gris grafito.
function keyboard(): ObjectParts {
  // Inclinado en un atril de latón para que se lea de frente desde la altura de la cámara.
  const tilted = (parent: Group) => {
    const g = new Group()
    g.position.set(0, 0.07, 0)
    g.rotation.set(0.45, 0, 0)
    parent.add(g)
    return g
  }
  const bodyRoot = new Group()
  const capsRoot = new Group()
  const stand = new Group()
  const body = tilted(bodyRoot)
  const caps = tilted(capsRoot)
  place(stand, new BoxGeometry(0.26, 0.006, 0.09), { position: [0, 0.003, 0] })
  place(stand, new BoxGeometry(0.26, 0.012, 0.005), { position: [0, 0.008, 0.05] })
  place(stand, new BoxGeometry(0.2, 0.09, 0.005), { position: [0, 0.045, -0.045], rotation: [-0.45, 0, 0] })
  place(body, new BoxGeometry(0.32, 0.022, 0.125), { position: [0, 0.011, 0], rotation: [0.07, 0, 0] })
  const cap = new BoxGeometry(0.0165, 0.009, 0.0165)
  const rows = [15, 15, 14, 13, 12]
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i++) {
      const pitch = 0.019
      const x = -((n - 1) * pitch) / 2 + i * pitch
      const z = -0.045 + r * 0.0195
      place(caps, cap, { position: [x, 0.027 - r * 0.0014, z], rotation: [0.07, 0, 0] })
    }
  })
  place(caps, new BoxGeometry(0.11, 0.009, 0.0165), { position: [-0.02, 0.0205, 0.0525], rotation: [0.07, 0, 0] })
  return { charcoal: bake(bodyRoot), keycap: bake(capsRoot), brass: bake(stand) }
}

// Caja de envío de cartón con la documentación pegada en el centro del frente. Los renglones y el código
// de barras van dibujados en la textura de la hoja (shippingDocument): como geometría medían 1-3 mm y
// titilaban al agrandarse con el hover. Levemente girada para que se vea un lateral.
function shippingBox(): ObjectParts {
  const root = (parent: Group) => {
    const g = new Group()
    g.rotation.set(0, -0.18, 0)
    parent.add(g)
    return g
  }
  const cardboardRoot = new Group()
  const documentRoot = new Group()
  const cardboard = root(cardboardRoot)
  const doc = root(documentRoot)
  const w = 0.28
  const h = 0.2
  const d = 0.18
  place(cardboard, new BoxGeometry(w, h, d), { position: [0, h / 2, 0] })
  place(doc, new PlaneGeometry(0.12, 0.13), { position: [0, h / 2, d / 2 + 0.003], rotation: [0, 0, -0.02] })
  return { cardboard: bake(cardboardRoot), document: bake(documentRoot) }
}

// Libro clásico acostado, con el lomo hacia el frente (+z): tapas de cuero, bloque de páginas, nervios
// en el lomo y filetes dorados (sin títulos). length va en x, depth en z y thickness en y; el libro
// apoya en y = 0. Cada material va en su propio grupo; un contenedor por grupo lleva la posición y el giro.
interface BookGroups {
  leather: Group
  pages: Group
  gilt: Group
}

function flatBook(groups: BookGroups, length: number, depth: number, thickness: number, y: number, yaw: number, dx = 0) {
  const holder = (parent: Group) => {
    const g = new Group()
    g.position.set(dx, y, 0)
    g.rotation.set(0, yaw, 0)
    parent.add(g)
    return g
  }
  const leather = holder(groups.leather)
  const pages = holder(groups.pages)
  const gilt = holder(groups.gilt)
  const board = 0.004
  // Tapas (apenas más grandes que las hojas) y lomo redondeado al frente.
  for (const by of [board / 2, thickness - board / 2]) place(leather, new BoxGeometry(length, board, depth), { position: [0, by, 0] })
  place(pages, new BoxGeometry(length - 0.008, thickness - 2 * board, depth - 0.008), { position: [0, thickness / 2, -0.002] })
  place(leather, new CylinderGeometry(thickness / 2, thickness / 2, length, 16, 1, false, -Math.PI / 2, Math.PI), {
    position: [0, thickness / 2, depth / 2 - 0.002],
    rotation: [0, 0, Math.PI / 2],
  })
  // Nervios en el lomo, con filetes dorados a los lados, y un filete a lo largo cerca de cada tapa.
  const spineZ = depth / 2 - 0.002 + thickness / 2
  for (const t of [-0.3, -0.1, 0.1, 0.3]) {
    const x = t * length
    place(leather, new BoxGeometry(0.006, thickness * 0.9, 0.006), { position: [x, thickness / 2, spineZ] })
    for (const sx of [-1, 1]) {
      place(gilt, new BoxGeometry(0.0012, thickness * 0.8, 0.003), { position: [x + sx * 0.007, thickness / 2, spineZ - 0.0005] })
    }
  }
  for (const fy of [0.18, 0.82]) {
    place(gilt, new BoxGeometry(length * 0.9, 0.0012, 0.003), { position: [0, thickness * fy, spineZ - thickness * 0.12] })
  }
}

// Tres libros acostados uno sobre otro, de mayor a menor y apenas girados, con los lomos al frente.
function books(): ObjectParts {
  const brown: BookGroups = { leather: new Group(), pages: new Group(), gilt: new Group() }
  const green: BookGroups = { leather: new Group(), pages: brown.pages, gilt: brown.gilt }
  const blue: BookGroups = { leather: new Group(), pages: brown.pages, gilt: brown.gilt }
  flatBook(green, 0.24, 0.17, 0.042, 0, 0.04)
  flatBook(brown, 0.22, 0.155, 0.036, 0.042, -0.07, -0.006)
  flatBook(blue, 0.19, 0.135, 0.03, 0.078, 0.1, 0.008)
  return {
    leather: bake(brown.leather),
    leatherGreen: bake(green.leather),
    leatherBlue: bake(blue.leather),
    pages: bake(brown.pages),
    gilt: bake(brown.gilt),
  }
}

// Pedestal de exposición bajo cada objeto: bloque de nogal con tapa de terciopelo.
export const RISER = { height: 0.06 } as const
export function riserGeometry(width: number, depth: number): ObjectParts {
  const wood = new Group()
  const top = new Group()
  place(wood, woodBox(width, RISER.height - 0.006, depth), { position: [0, (RISER.height - 0.006) / 2, 0] })
  place(top, new BoxGeometry(width - 0.012, 0.006, depth - 0.012), { position: [0, RISER.height - 0.003, 0] })
  return { walnut: bake(wood), velvet: bake(top) }
}

export function objectGeometry(kind: TimelineObjectKind): ObjectParts {
  switch (kind) {
    case 'laptop':
      return keyboard()
    case 'guia':
      return shippingBox()
    case 'cuaderno':
      return books()
    case 'certificado':
      return {}
  }
}
