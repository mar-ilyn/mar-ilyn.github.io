import { BoxGeometry, CylinderGeometry, Group, type BufferGeometry } from 'three'
import { ROWS, VITRINE } from '../data/timeline'
import type { TimelineObjectKind } from '../data/types'
import { bake } from './bake'
import { place, ring } from './ornament'
import { ROOM } from './layout'

// Vitrina victoriana de la zona "Sobre mí" y sus objetos, modelados por código (assets propios).
// Todo se hornea en una geometría por material: nogal, latón, fondo interior y vidrio.
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
export const BACKING_Z = 0.065
const D = VITRINE.depth
const W = VITRINE.right - VITRINE.left
const CX = (VITRINE.left + VITRINE.right) / 2
const box = (root: Group, w: number, h: number, d: number, x: number, y: number, z: number) =>
  place(root, woodBox(w, h, d), { position: [x, y, Z + z] })

export interface VitrineGeometries {
  walnut: BufferGeometry
  brass: BufferGeometry
  backing: BufferGeometry
  glass: BufferGeometry
}

// Tramos entre laterales y montantes (para paneles de la base, luces y vidrios).
export function vitrineBays(): [number, number][] {
  const edges = [VITRINE.left, ...VITRINE.mullions, VITRINE.right]
  return edges.slice(1).map((r, i) => [edges[i], r])
}

export function vitrineGeometries(): VitrineGeometries {
  const walnut = new Group()
  const brass = new Group()
  const backing = new Group()
  const glass = new Group()
  const { baseTop, top } = VITRINE

  // Base maciza: zócalo, cuerpo con un panel clásico por tramo y moldura de remate.
  box(walnut, W + 0.08, 0.08, D + 0.06, CX, 0.04, D / 2 + 0.03)
  box(walnut, W, baseTop - 0.12, D, CX, 0.08 + (baseTop - 0.12) / 2, D / 2)
  for (const [l, r] of vitrineBays()) {
    const pw = r - l - 0.16
    const ph = baseTop - 0.26
    place(walnut, ring(pw, ph, pw - 0.07, ph - 0.07, 0.014, 0.006), {
      position: [(l + r) / 2, 0.08 + (baseTop - 0.12) / 2, Z + D + 0.001],
    })
    place(walnut, woodBox(pw - 0.09, ph - 0.09, 0.012), {
      position: [(l + r) / 2, 0.08 + (baseTop - 0.12) / 2, Z + D + 0.006],
    })
  }
  box(walnut, W + 0.05, 0.04, D + 0.04, CX, baseTop - 0.02, D / 2 + 0.02)

  // Cuerpo vidriado: piso interior (estante de estudios), estante de experiencia, techo y cornisa.
  box(walnut, W - 0.04, 0.03, D - 0.04, CX, ROWS.estudios.shelf - 0.015, D / 2)
  box(walnut, W - 0.06, 0.025, D - 0.08, CX, ROWS.laboral.shelf - 0.0125, D / 2 - 0.01)
  box(walnut, W + 0.02, 0.05, D + 0.02, CX, top - 0.025, D / 2 + 0.01)
  box(walnut, W + 0.08, 0.035, D + 0.06, CX, top + 0.0175, D / 2 + 0.03)
  box(walnut, W + 0.13, 0.03, D + 0.09, CX, top + 0.05, D / 2 + 0.045)

  // Laterales y montantes finos (el marco exterior), con esquinas reforzadas.
  const glassH = top - 0.05 - baseTop
  for (const x of [VITRINE.left + 0.025, VITRINE.right - 0.025]) {
    box(walnut, 0.05, glassH, D, x, baseTop + glassH / 2, D / 2)
    box(walnut, 0.07, 0.07, 0.07, x, top - 0.02, D - 0.005)
    box(walnut, 0.07, 0.07, 0.07, x, baseTop + 0.02, D - 0.005)
  }
  for (const x of VITRINE.mullions) box(walnut, 0.035, glassH, 0.035, x, baseTop + glassH / 2, D - 0.02)
  // Travesaño fino a la altura del estante superior, delante del vidrio.
  box(walnut, W - 0.05, 0.022, 0.025, CX, ROWS.laboral.shelf - 0.012, D - 0.01)

  // Latón envejecido: filete bajo la cornisa, cantos de los estantes y pomos de las puertas.
  place(brass, new BoxGeometry(W + 0.02, 0.008, 0.006), { position: [CX, top - 0.052, Z + D + 0.013] })
  place(brass, new BoxGeometry(W - 0.06, 0.006, 0.004), { position: [CX, ROWS.laboral.shelf - 0.001, Z + D - 0.005] })
  place(brass, new BoxGeometry(W + 0.05, 0.006, 0.006), { position: [CX, baseTop + 0.002, Z + D + 0.022] })
  const knob = new CylinderGeometry(0.009, 0.009, 0.02, 12)
  for (const x of VITRINE.mullions) {
    for (const s of [-1, 1]) {
      place(brass, knob, { position: [x + s * 0.04, (baseTop + top) / 2, Z + D + 0.012], rotation: [Math.PI / 2, 0, 0] })
    }
  }
  // Focos de museo: pequeñas pastillas de latón bajo el techo, una por tramo.
  const puck = new CylinderGeometry(0.03, 0.034, 0.018, 16)
  for (const [l, r] of vitrineBays()) {
    place(brass, puck, { position: [(l + r) / 2, top - 0.059, Z + D * 0.55] })
    place(brass, puck, { position: [(l + r) / 2, ROWS.laboral.shelf - 0.034, Z + D * 0.55] })
  }

  // Fondo interior oscuro (separa los objetos de la pared) y el vidrio frontal.
  // Por delante de las molduras de la pared (sobresalen hasta 5 cm), para que no se vean a través.
  place(backing, new BoxGeometry(W - 0.06, glassH, 0.01), { position: [CX, baseTop + glassH / 2, Z + BACKING_Z] })
  for (const [l, r] of vitrineBays()) {
    place(glass, new BoxGeometry(r - l - 0.04, glassH - 0.01, 0.004), {
      position: [(l + r) / 2, baseTop + glassH / 2, Z + D - 0.006],
    })
  }

  return { walnut: bake(walnut), brass: bake(brass), backing: bake(backing), glass: bake(glass) }
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

// Guía de envío en papel, apoyada en un atril de latón, con una etiqueta en blanco (sin marcas).
function shippingGuide(): ObjectParts {
  const paper = new Group()
  const label = new Group()
  const brass = new Group()
  const tilt = -0.32
  place(paper, new BoxGeometry(0.15, 0.21, 0.002), { position: [0, 0.112, 0.01], rotation: [tilt, 0, 0] })
  place(label, new BoxGeometry(0.1, 0.06, 0.001), { position: [0.012, 0.15, 0.025], rotation: [tilt, 0, 0] })
  place(label, new BoxGeometry(0.06, 0.008, 0.001), { position: [-0.03, 0.075, 0.0002], rotation: [tilt, 0, 0] })
  place(brass, new BoxGeometry(0.12, 0.006, 0.05), { position: [0, 0.003, 0.0] })
  place(brass, new BoxGeometry(0.12, 0.012, 0.004), { position: [0, 0.009, 0.048] })
  place(brass, new BoxGeometry(0.006, 0.16, 0.004), { position: [0, 0.08, -0.03], rotation: [tilt, 0, 0] })
  return { paper: bake(paper), paperLabel: bake(label), brass: bake(brass) }
}

// Libro clásico: tapas de cuero, bloque de páginas, nervios en el lomo y filetes dorados (sin títulos).
// Cada material va en su propio grupo; un contenedor por grupo lleva la posición y el giro del libro.
interface BookGroups {
  leather: Group
  pages: Group
  gilt: Group
}

function book(groups: BookGroups, w: number, h: number, t: number, at: [number, number, number], rot: [number, number, number]) {
  const holder = (parent: Group) => {
    const g = new Group()
    g.position.set(...at)
    g.rotation.set(...rot)
    parent.add(g)
    return g
  }
  const leather = holder(groups.leather)
  const pages = holder(groups.pages)
  const gilt = holder(groups.gilt)
  place(leather, new BoxGeometry(w, h, 0.004), { position: [0, h / 2, t / 2 - 0.002] })
  place(leather, new BoxGeometry(w, h, 0.004), { position: [0, h / 2, -t / 2 + 0.002] })
  place(leather, new BoxGeometry(0.006, h, t), { position: [-w / 2 + 0.003, h / 2, 0] })
  place(pages, new BoxGeometry(w - 0.01, h - 0.008, t - 0.008), { position: [0.002, h / 2, 0] })
  for (const y of [0.25, 0.45, 0.55, 0.75]) {
    place(leather, new BoxGeometry(0.009, 0.006, t + 0.002), { position: [-w / 2 + 0.003, h * y, 0] })
  }
  for (const y of [0.15, 0.85]) {
    place(gilt, new BoxGeometry(0.0095, 0.0015, t + 0.0025), { position: [-w / 2 + 0.003, h * y, 0] })
  }
}

function books(): ObjectParts {
  const brown: BookGroups = { leather: new Group(), pages: new Group(), gilt: new Group() }
  const green: BookGroups = { leather: new Group(), pages: brown.pages, gilt: brown.gilt }
  // Uno parado con el lomo al frente, levemente inclinado, y otro acostado delante.
  book(green, 0.03, 0.22, 0.155, [0.05, 0, -0.04], [0, Math.PI / 2, 0.06])
  book(brown, 0.16, 0.035, 0.12, [-0.06, 0, 0.03], [0, 0.25, 0])
  return { leather: bake(brown.leather), leatherGreen: bake(green.leather), pages: bake(brown.pages), gilt: bake(brown.gilt) }
}

// Lugar para el hobby: un pequeño pedestal de nogal con tapa de terciopelo, vacío.
function hobbyStand(): ObjectParts {
  const wood = new Group()
  const velvet = new Group()
  place(wood, woodBox(0.18, 0.04, 0.14), { position: [0, 0.02, 0] })
  place(velvet, new BoxGeometry(0.16, 0.006, 0.12), { position: [0, 0.043, 0] })
  return { walnut: bake(wood), velvet: bake(velvet) }
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

export function objectGeometry(kind: TimelineObjectKind | 'hobby'): ObjectParts {
  switch (kind) {
    case 'laptop':
      return keyboard()
    case 'guia':
      return shippingGuide()
    case 'cuaderno':
      return books()
    case 'certificado':
      return {}
    case 'hobby':
      return hobbyStand()
  }
}
