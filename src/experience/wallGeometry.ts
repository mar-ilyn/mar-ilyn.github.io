import { BoxGeometry, ExtrudeGeometry, Group, Shape, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three'
import { bake } from './bake'
import { place, ring, scroll } from './ornament'
import { flute, lathe } from './pedestalGeometry'

// Pared de palacio modular: columnas adosadas, boiserie con molduras doradas y friso.
// Ritmo de 4 m: un panel centrado en 4n (detrás de cada pedestal) y una columna en 4n + 2.
// Coordenadas: x a lo largo de la pared, y desde el piso, z = 0 en la cara de la pared.

export const WALL = {
  period: 4,
  // Ancho libre del panel entre dos columnas (el resto lo ocupa el pedestal de la columna).
  wide: 3.2,
  dadoTop: 0.9,
  panel: { bottom: 1.1, top: 3.4 },
  lowerPanel: { y: 0.45, height: 0.55 },
  shaft: { bottom: 1.06, top: 3.3, radius: 0.21 },
  // Pedestal de la columna (ancho × profundidad); el fuste va centrado sobre su cara superior.
  pedestal: { width: 0.62, depth: 0.42 },
  columnZ: 0.235,
  frieze: { y: 3.915 },
} as const

export interface Bay {
  left: number
  right: number
}

export interface WallLayout {
  columns: number[]
  wideBays: number[]
}

// Posiciones de columnas y paneles entre `from` y `to`, dejando libre el tramo de la intro
// (sus bordes coinciden con columnas, así queda un panel ancho especial para textos y foto).
export function wallLayout(from: number, to: number, intro: Bay): WallLayout {
  const inside = (x: number) => x > intro.left + 1e-6 && x < intro.right - 1e-6
  const layout: WallLayout = { columns: [], wideBays: [] }
  const { period } = WALL
  for (let n = Math.ceil((from - period) / period); n * period <= to + period; n++) {
    const c = n * period
    const column = c + period / 2
    if (column >= from && column <= to && !inside(column)) layout.columns.push(column)
    if (c >= from && c <= to && !inside(c)) layout.wideBays.push(c)
  }
  layout.columns.sort((a, b) => a - b)
  return layout
}

function concaveSquare(half: number, sag: number, depth: number, curveSegments = 16) {
  const shape = new Shape()
  shape.moveTo(-half, -half)
  shape.quadraticCurveTo(0, -half + sag, half, -half)
  shape.quadraticCurveTo(half - sag, 0, half, half)
  shape.quadraticCurveTo(0, half - sag, -half, half)
  shape.quadraticCurveTo(-half + sag, 0, -half, -half)
  const g = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 1,
    curveSegments,
  })
  g.rotateX(-Math.PI / 2)
  return g
}

function shaftSection(bottom: number, top: number, radius: number, taper: number) {
  const points: [number, number][] = [[0, bottom]]
  const steps = 3
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    points.push([radius * (1 - taper * t), bottom + (top - bottom) * t])
  }
  points.push([0, top])
  return flute(lathe(points, 96), 20, 0.03, bottom + 0.03, top - 0.03)
}

export interface ColumnGeometries {
  ivory: BufferGeometry
  gold: BufferGeometry
}

// Columna corintia adosada, como la referencia: pedestal cuadrado de mármol con panel rehundido,
// base dorada con toros, fuste estriado de mármol en toda su altura y capitel corintio dorado con
// dos coronas de acanto, volutas en las esquinas y flor en el ábaco.
export function columnGeometries(): ColumnGeometries {
  const { shaft, dadoTop, columnZ } = WALL
  const W = WALL.pedestal.width
  const D = WALL.pedestal.depth
  // Cara superior del pedestal (cornisa): el plinto dorado de la base y el ábaco del capitel
  // tienen exactamente este tamaño, así los cuadrados de arriba y abajo coinciden.
  const TOP_W = W + 0.08
  const TOP_D = D + 0.05
  // Las proporciones de base y capital se diseñaron para un fuste de radio 0,16.
  const k = shaft.radius / 0.16

  const marble = new Group()
  // Pedestal: zócalo, dado con panel rehundido al frente y cornisa.
  place(marble, new BoxGeometry(W + 0.06, 0.08, D + 0.04), { position: [0, 0.04, (D + 0.04) / 2] })
  place(marble, new BoxGeometry(W, dadoTop - 0.14, D), { position: [0, 0.08 + (dadoTop - 0.14) / 2, D / 2] })
  place(marble, ring(W - 0.1, dadoTop - 0.34, W - 0.16, dadoTop - 0.4, 0.012, 0.004), {
    position: [0, 0.08 + (dadoTop - 0.14) / 2, D],
  })
  place(marble, new BoxGeometry(W + 0.05, 0.035, D + 0.035), { position: [0, dadoTop - 0.04, (D + 0.035) / 2] })
  place(marble, new BoxGeometry(TOP_W, 0.025, TOP_D), { position: [0, dadoTop - 0.01, TOP_D / 2] })
  // Fuste estriado en toda su altura, con éntasis suave.
  place(marble, shaftSection(shaft.bottom, shaft.top, shaft.radius, 0.08), { position: [0, 0, columnZ] })

  const gold = new Group()
  // Base ática dorada: plinto cuadrado del tamaño de la cornisa del pedestal, toros y escocia.
  place(gold, new BoxGeometry(TOP_W, 0.04, TOP_D), { position: [0, dadoTop + 0.02, TOP_D / 2] })
  place(
    gold,
    lathe(
      [
        [0, dadoTop + 0.04],
        [0.2 * k, dadoTop + 0.04],
        [0.205 * k, dadoTop + 0.06],
        [0.195 * k, dadoTop + 0.08],
        [0.172 * k, dadoTop + 0.095],
        [0.178 * k, dadoTop + 0.11],
        [0.185 * k, dadoTop + 0.125],
        [0.172 * k, dadoTop + 0.145],
        [shaft.radius + 0.005, shaft.bottom],
        [0, shaft.bottom],
      ],
      56,
    ),
    { position: [0, 0, columnZ] },
  )
  // Astrágalo bajo el capitel.
  place(gold, new TorusGeometry(shaft.radius * 0.93, 0.015, 6, 40), {
    position: [0, shaft.top - 0.015, columnZ],
    rotation: [Math.PI / 2, 0, 0],
  })
  // Campana del capitel.
  const top = shaft.top
  const capH = 0.32 * k
  place(
    gold,
    lathe(
      [
        [0, top],
        [0.15 * k, top],
        [0.155 * k, top + 0.06 * k],
        [0.17 * k, top + 0.16 * k],
        [0.2 * k, top + 0.26 * k],
        [0.235 * k, top + capH],
        [0, top + capH],
      ],
      48,
    ),
    { position: [0, 0, columnZ] },
  )
  // Dos coronas de hojas de acanto: hojas altas y finas, inclinadas hacia afuera, con la punta enrulada.
  const leaf = new SphereGeometry(0.06 * k, 10, 8)
  const tip = new TorusGeometry(0.026 * k, 0.01 * k, 6, 12, Math.PI * 1.3)
  for (const [row, count, r, y, h] of [
    [0, 12, 0.165 * k, top + 0.07 * k, 1.25],
    [1, 12, 0.195 * k, top + 0.17 * k, 1.1],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const angle = ((i + row * 0.5) / count) * Math.PI * 2
      const x = Math.cos(angle) * r
      const z = columnZ + Math.sin(angle) * r
      place(gold, leaf, { position: [x, y, z], rotation: [0, -angle, 0.22], scale: [0.3, h * 1.15, 0.38] })
      place(gold, tip, {
        position: [Math.cos(angle) * (r + 0.035 * k), y + 0.075 * h * k, columnZ + Math.sin(angle) * (r + 0.035 * k)],
        rotation: [0, -angle + Math.PI / 2, 0.3],
      })
    }
  }
  // Volutas en las cuatro esquinas, bajo el ábaco.
  const volute = new TorusGeometry(0.065 * k, 0.019 * k, 6, 18, Math.PI * 1.7)
  for (const angle of [0.25, 0.75, 1.25, 1.75].map((t) => t * Math.PI)) {
    place(gold, volute, {
      position: [Math.cos(angle) * 0.255 * k, top + 0.265 * k, columnZ + Math.sin(angle) * 0.255 * k],
      rotation: [0, -angle + Math.PI / 2, -0.4],
    })
  }
  // Ábaco: mismo tamaño que la cornisa del pedestal, con lados apenas cóncavos y una flor al centro
  // de cada cara.
  const abacus = concaveSquare(0.5, 0.06, 0.055, 10)
  abacus.scale(TOP_W, 1, TOP_D)
  place(gold, abacus, { position: [0, top + capH, columnZ] })
  const flower = new SphereGeometry(0.03 * k, 8, 6)
  for (const [fx, fz] of [
    [TOP_W / 2 - 0.04, 0],
    [-TOP_W / 2 + 0.04, 0],
    [0, TOP_D / 2 - 0.04],
  ]) {
    place(gold, flower, { position: [fx, top + capH + 0.03, columnZ + fz], scale: [1, 1, 0.7] })
  }

  return { ivory: bake(marble), gold: bake(gold) }
}

interface Ornaments {
  cScroll: TorusGeometry
  curl: TorusGeometry
  shell: SphereGeometry
  leaf: SphereGeometry
  knob: SphereGeometry
}

function ornaments(k = 1): Ornaments {
  return {
    cScroll: new TorusGeometry(0.075 * k, 0.018 * k, 5, 14, Math.PI * 1.5),
    curl: new TorusGeometry(0.035 * k, 0.012 * k, 5, 10, Math.PI * 1.75),
    shell: new SphereGeometry(0.07 * k, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    leaf: new SphereGeometry(0.045 * k, 6, 4),
    knob: new SphereGeometry(0.022 * k, 6, 4),
  }
}

function crest(parent: Group, o: Ornaments, x: number, y: number, flip: boolean, k: number) {
  const s = flip ? -1 : 1
  const r = flip ? Math.PI : 0
  place(parent, o.shell, { position: [x, y, 0.01], rotation: [Math.PI / 2, 0, r], scale: [1, 0.55, 0.8] })
  place(parent, o.knob, { position: [x, y + s * 0.07 * k, 0.025] })
  place(parent, o.cScroll, { position: [x + 0.12 * k, y - s * 0.005, 0.01], ...scroll(r + Math.PI * 0.85, 0.85) })
  place(parent, o.cScroll, { position: [x - 0.12 * k, y - s * 0.005, 0.01], ...scroll(r + Math.PI * 0.15, 0.85, true) })
  place(parent, o.curl, { position: [x + 0.22 * k, y + s * 0.02, 0.01], ...scroll(r + Math.PI * 0.2) })
  place(parent, o.curl, { position: [x - 0.22 * k, y + s * 0.02, 0.01], ...scroll(r + Math.PI * 0.8, 1, true) })
  place(parent, o.leaf, { position: [x + 0.32 * k, y, 0.005], scale: [2.2, 0.45, 0.4] })
  place(parent, o.leaf, { position: [x - 0.32 * k, y, 0.005], scale: [2.2, 0.45, 0.4] })
}

// Moldura dorada de boiserie: marco fino, floreos en las esquinas y crestas arriba y abajo.
export function goldPanel(width: number, height: number, k = 1): BufferGeometry {
  const o = ornaments(k)
  const root = new Group()
  const t = 0.045
  place(root, ring(width, height, width - 2 * t, height - 2 * t, 0.02, 0.008), { position: [0, 0, 0] })
  place(root, ring(width - 0.16, height - 0.16, width - 0.16 - 0.03, height - 0.16 - 0.03, 0.01, 0.004), {
    position: [0, 0, 0],
  })
  const hw = width / 2 - t
  const hh = height / 2 - t
  for (const [sx, sy] of [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ] as const) {
    const angle = Math.atan2(sy, sx)
    place(root, o.curl, { position: [sx * (hw - 0.05), sy * (hh - 0.05), 0.02], ...scroll(angle + Math.PI) })
    place(root, o.leaf, {
      position: [sx * (hw - 0.12), sy * (hh - 0.03), 0.015],
      rotation: [0, 0, sx * sy * 0.25],
      scale: [1.8, 0.4, 0.4],
    })
    place(root, o.leaf, {
      position: [sx * (hw - 0.03), sy * (hh - 0.12), 0.015],
      rotation: [0, 0, Math.PI / 2 - sx * sy * 0.25],
      scale: [1.8, 0.4, 0.4],
    })
  }
  crest(root, o, 0, height / 2 + 0.02, false, k)
  crest(root, o, 0, -height / 2 - 0.02, true, k * 0.7)
  return bake(root)
}

// Tramo de friso dorado de un período (se repite sin cortes): filetes arriba y abajo,
// concha central y volutas en C encadenadas con hojas entre ellas.
export function friezeSegment(): BufferGeometry {
  const o = ornaments(1.15)
  const root = new Group()
  const { y } = WALL.frieze
  const { period } = WALL
  for (const dy of [-0.13, 0.13]) {
    place(root, new BoxGeometry(period, 0.018, 0.016), { position: [0, y + dy, 0.008] })
  }
  place(root, o.shell, { position: [0, y, 0.01], rotation: [Math.PI / 2, 0, 0], scale: [1.4, 0.65, 1] })
  place(root, o.knob, { position: [0, y + 0.09, 0.03] })
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const x = side * (0.27 + i * 0.32)
      const up = i % 2 === 0
      place(root, o.cScroll, {
        position: [x, y + (up ? 0.025 : -0.025), 0.01],
        ...scroll((up ? 0.15 : 1.15) * Math.PI, 1, side < 0),
      })
      place(root, o.curl, { position: [x + side * 0.1, y + (up ? -0.04 : 0.04), 0.012], ...scroll(up ? Math.PI : 0, 0.8, side < 0) })
      place(root, o.leaf, {
        position: [x + side * 0.17, y, 0.006],
        rotation: [0, 0, up ? 0.5 : -0.5],
        scale: [2.1, 0.5, 0.45],
      })
    }
  }
  return bake(root)
}

// Zócalo, moldura del dado, arquitrabe y cornisa a lo largo de toda la pared.
export function trimGeometry(length: number): BufferGeometry {
  const root = new Group()
  const box = (h: number, d: number, y: number) =>
    place(root, new BoxGeometry(length, h, d), { position: [0, y, d / 2] })
  box(0.12, 0.04, 0.06)
  box(0.05, 0.05, WALL.dadoTop)
  box(0.03, 0.035, WALL.dadoTop - 0.035)
  box(0.08, 0.08, WALL.shaft.top + 0.36)
  box(0.04, 0.11, WALL.shaft.top + 0.42)
  box(0.1, 0.16, 4.1)
  box(0.05, 0.22, 4.175)
  return bake(root)
}

export function lowerPanel(width: number): BufferGeometry {
  const { height } = WALL.lowerPanel
  return ring(width, height, width - 0.06, height - 0.06, 0.015, 0.006)
}
