import { BoxGeometry, ExtrudeGeometry, Group, Shape, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three'
import { bake } from './bake'
import { place, ring, scroll } from './ornament'
import { flute, lathe } from './pedestalGeometry'

// Pared de palacio modular: columnas adosadas, boiserie con molduras doradas y friso.
// Ritmo de 4 m: un panel centrado en 4n (detrás de cada pedestal) y una columna en 4n + 2.
// Coordenadas: x a lo largo de la pared, y desde el piso, z = 0 en la cara de la pared.

const WALL_HEIGHT = 4.2

export const WALL = {
  period: 4,
  // Ancho libre del panel entre dos columnas (el resto lo ocupa el pedestal de la columna).
  wide: 3.2,
  dadoTop: 0.9,
  panel: { bottom: 1.1, top: 3.4 },
  lowerPanel: { y: 0.45, height: 0.55 },
  // El capitel termina justo bajo la cornisa (capitalTop): la columna llega al techo.
  shaft: { bottom: 1.06, top: 3.6, radius: 0.21 },
  capitalTop: 4.05,
  // Arquitrabe bajo el friso, fijo (no depende de la altura de la columna).
  architrave: 3.69,
  // Pedestal de la columna (ancho × profundidad); el fuste va centrado sobre su cara superior.
  pedestal: { width: 0.62, depth: 0.42 },
  columnZ: 0.235,
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

function shaftSection(bottom: number, top: number, radius: number, taper: number) {
  const points: [number, number][] = [[0, bottom]]
  const steps = 3
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    points.push([radius * (1 - taper * t), bottom + (top - bottom) * t])
  }
  points.push([0, top])
  return flute(lathe(points, 96), 20, 0.036, bottom + 0.03, top - 0.03)
}

export interface ColumnGeometries {
  ivory: BufferGeometry
  gold: BufferGeometry
}

// Columna adosada, como la referencia: pedestal cuadrado de mármol con panel rehundido, base dorada
// con toros, fuste estriado de mármol en toda su altura y capitel simple (cuerpo dorado con relieves
// ovalados, molduras escalonadas y placa) que llega hasta la cornisa.
export function columnGeometries(): ColumnGeometries {
  const { shaft, dadoTop, columnZ } = WALL
  const W = WALL.pedestal.width
  const D = WALL.pedestal.depth
  // Cara superior del pedestal (cornisa): el plinto dorado de la base y el ábaco del capitel
  // tienen exactamente este tamaño, así los cuadrados de arriba y abajo coinciden.
  const TOP_W = W + 0.08
  const TOP_D = D + 0.05
  // Las proporciones de la base se diseñaron para un fuste de radio 0,16.
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
  // Capitel simple, como la referencia: astrágalo, cuerpo dorado apenas cónico con relieves
  // ovalados y, arriba, dos molduras escalonadas y una placa cuadrada de mármol bajo la cornisa.
  const top = shaft.top
  const R = shaft.radius
  place(gold, new TorusGeometry(R * 1.02, 0.018, 8, 48), {
    position: [0, top + 0.012, columnZ],
    rotation: [Math.PI / 2, 0, 0],
  })
  const bodyBottom = top + 0.03
  const bodyTop = WALL.capitalTop - 0.16
  const bodyR0 = R * 1.02
  const bodyR1 = R * 1.28
  place(
    gold,
    lathe(
      [
        [0, bodyBottom],
        [bodyR0, bodyBottom],
        [bodyR0 + (bodyR1 - bodyR0) * 0.35, bodyBottom + (bodyTop - bodyBottom) * 0.5],
        [bodyR1, bodyTop - 0.02],
        [bodyR1 + 0.012, bodyTop],
        [0, bodyTop],
      ],
      56,
    ),
    { position: [0, 0, columnZ] },
  )
  // Relieves ovalados repartidos en la mitad visible (la otra mitad queda contra la pared).
  const oval = new SphereGeometry(0.05, 14, 10)
  const ovalY = (bodyBottom + bodyTop) / 2 + 0.01
  const ovalR = bodyR0 + (bodyR1 - bodyR0) * 0.4
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI * (0.08 + (i / 5) * 0.84)
    place(gold, oval, {
      position: [Math.cos(angle) * ovalR, ovalY, columnZ + Math.sin(angle) * ovalR],
      rotation: [0, -angle + Math.PI / 2, 0],
      scale: [0.75, 1.35, 0.55],
    })
  }
  // Molduras escalonadas y placa cuadrada (mármol), del ancho de la cornisa del pedestal.
  const steps: [number, number, number][] = [
    [bodyR1 * 2 + 0.02, 0.035, bodyTop + 0.0175],
    [TOP_W - 0.06, 0.04, bodyTop + 0.055],
  ]
  for (const [w, h, y] of steps) {
    place(marble, new BoxGeometry(w, h, w * 0.5 + columnZ), { position: [0, y, (w * 0.5 + columnZ) / 2] })
  }
  const plateH = WALL.capitalTop - (bodyTop + 0.075)
  place(marble, new BoxGeometry(TOP_W, plateH, TOP_D + 0.06), {
    position: [0, bodyTop + 0.075 + plateH / 2, (TOP_D + 0.06) / 2],
  })

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

// Moldura dorada de boiserie con detalle de marco tallado: moldura principal biselada, fila de
// perlas, relieve de hojas alternadas, filete interior, floreos en las esquinas y cartela arriba.
export function goldPanel(width: number, height: number, k = 1): BufferGeometry {
  const o = ornaments(k)
  const root = new Group()
  const t = 0.07
  place(root, ring(width, height, width - 2 * t, height - 2 * t, 0.025, 0.014), { position: [0, 0, 0] })
  place(root, ring(width - 2 * t + 0.02, height - 2 * t + 0.02, width - 2 * t - 0.01, height - 2 * t - 0.01, 0.035, 0.005), {
    position: [0, 0, 0],
  })
  place(root, ring(width - 0.24, height - 0.24, width - 0.24 - 0.025, height - 0.24 - 0.025, 0.012, 0.004), {
    position: [0, 0, 0],
  })

  // Perlas sobre el canto interior y hojas sobre la moldura principal.
  const bead = new SphereGeometry(0.011, 6, 4)
  const leafRun = new SphereGeometry(0.026, 6, 4)
  const perimeter = (w: number, h: number, spacing: number, fn: (x: number, y: number, along: number, i: number) => void) => {
    let i = 0
    const side = (x0: number, y0: number, x1: number, y1: number, rot: number) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / spacing))
      for (let j = 0; j < n; j++) fn(x0 + ((x1 - x0) * j) / n, y0 + ((y1 - y0) * j) / n, rot, i++)
    }
    side(-w / 2, -h / 2, w / 2, -h / 2, 0)
    side(w / 2, -h / 2, w / 2, h / 2, Math.PI / 2)
    side(w / 2, h / 2, -w / 2, h / 2, 0)
    side(-w / 2, h / 2, -w / 2, -h / 2, Math.PI / 2)
  }
  perimeter(width - 2 * t + 0.005, height - 2 * t + 0.005, 0.03, (x, y) => place(root, bead, { position: [x, y, 0.036] }))
  perimeter(width - t, height - t, 0.065, (x, y, rot, i) =>
    place(root, leafRun, {
      position: [x, y, 0.03],
      rotation: [0, 0, rot + (i % 2 === 0 ? 0.55 : -0.55)],
      scale: [1.5, 0.6, 0.7],
    }),
  )

  const hw = width / 2 - t
  const hh = height / 2 - t
  for (const [sx, sy] of [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ] as const) {
    const angle = Math.atan2(sy, sx)
    // Floreo de esquina: voluta y dos hojas que siguen los lados.
    place(root, o.curl, { position: [sx * (hw - 0.05), sy * (hh - 0.05), 0.03], ...scroll(angle + Math.PI) })
    place(root, o.leaf, {
      position: [sx * (hw - 0.13), sy * (hh - 0.03), 0.02],
      rotation: [0, 0, sx * sy * 0.25],
      scale: [2, 0.45, 0.45],
    })
    place(root, o.leaf, {
      position: [sx * (hw - 0.03), sy * (hh - 0.13), 0.02],
      rotation: [0, 0, Math.PI / 2 - sx * sy * 0.25],
      scale: [2, 0.45, 0.45],
    })
  }
  // Cartela arriba (más grande y elaborada) y un remate chico abajo.
  crest(root, o, 0, height / 2 + 0.03, false, k * 1.35)
  crest(root, o, -0.42 * k, height / 2 + 0.01, false, k * 0.55)
  crest(root, o, 0.42 * k, height / 2 + 0.01, false, k * 0.55)
  crest(root, o, 0, -height / 2 - 0.02, true, k * 0.7)
  return bake(root)
}

// Cornisa de yeso hasta el techo, como en las salas clásicas: filetes escalonados que avanzan,
// una media caña cóncava y un último escalón contra el techo. Es un perfil (profundidad × altura)
// extruido a lo largo de toda la pared, así las sombras corren continuas.
function corniceGeometry(length: number): BufferGeometry {
  const y0 = WALL.architrave - 0.04
  const shape = new Shape()
  shape.moveTo(0, y0)
  const step = (d: number, y: number) => {
    shape.lineTo(d, shape.currentPoint.y)
    shape.lineTo(d, y)
  }
  step(0.03, y0 + 0.05)
  step(0.05, y0 + 0.1)
  step(0.075, y0 + 0.13)
  step(0.09, y0 + 0.17)
  // Media caña: curva cóncava que sale hacia adelante y arriba.
  shape.quadraticCurveTo(0.1, y0 + 0.36, 0.25, y0 + 0.38)
  step(0.27, y0 + 0.43)
  step(0.3, WALL_HEIGHT)
  shape.lineTo(0, WALL_HEIGHT)
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 12 })
  geometry.rotateY(-Math.PI / 2)
  geometry.translate(length / 2, 0, 0)
  return geometry
}

// Zócalo, moldura del dado, arquitrabe y cornisa a lo largo de toda la pared.
export function trimGeometry(length: number): BufferGeometry {
  const root = new Group()
  const box = (h: number, d: number, y: number) =>
    place(root, new BoxGeometry(length, h, d), { position: [0, y, d / 2] })
  box(0.12, 0.04, 0.06)
  box(0.05, 0.05, WALL.dadoTop)
  box(0.03, 0.035, WALL.dadoTop - 0.035)
  place(root, corniceGeometry(length), { position: [0, 0, 0] })
  return bake(root)
}

export function lowerPanel(width: number): BufferGeometry {
  const { height } = WALL.lowerPanel
  return ring(width, height, width - 0.06, height - 0.06, 0.015, 0.006)
}
