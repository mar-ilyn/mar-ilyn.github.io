import { BoxGeometry, ExtrudeGeometry, Group, Shape, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three'
import { bake } from './bake'
import { place, ring, scroll } from './ornament'
import { flute, lathe } from './pedestalGeometry'

// Pared de palacio modular: columnas adosadas, boiserie con molduras doradas y friso.
// Ritmo de 4 m: panel ancho centrado en 4n (detrás de cada pedestal) y panel angosto en 4n + 2.
// Coordenadas: x a lo largo de la pared, y desde el piso, z = 0 en la cara de la pared.

export const WALL = {
  period: 4,
  columnOffset: 1.4,
  wide: 2.8,
  narrow: 1.2,
  dadoTop: 0.9,
  panel: { bottom: 1.1, top: 3.4 },
  lowerPanel: { y: 0.45, height: 0.55 },
  shaft: { bottom: 1.02, goldTop: 1.65, top: 3.33, radius: 0.16 },
  columnZ: 0.14,
  frieze: { y: 3.915 },
} as const

export interface Bay {
  left: number
  right: number
}

export interface WallLayout {
  columns: number[]
  wideBays: number[]
  narrowBays: number[]
}

// Posiciones de columnas y paneles entre `from` y `to`, dejando libre el tramo de la intro
// (sus bordes coinciden con columnas, así queda un panel ancho especial para textos y foto).
export function wallLayout(from: number, to: number, intro: Bay): WallLayout {
  const inside = (x: number) => x > intro.left + 1e-6 && x < intro.right - 1e-6
  const layout: WallLayout = { columns: [], wideBays: [], narrowBays: [] }
  const { period, columnOffset } = WALL
  for (let n = Math.ceil((from - period) / period); n * period <= to + period; n++) {
    const c = n * period
    for (const x of [c - columnOffset, c + columnOffset]) {
      if (x >= from && x <= to && !inside(x)) layout.columns.push(x)
    }
    if (c >= from && c <= to && !inside(c)) layout.wideBays.push(c)
    const narrow = c + period / 2
    if (narrow >= from && narrow <= to && !inside(narrow)) layout.narrowBays.push(narrow)
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
  return flute(lathe(points, 64), 16, 0.016, bottom + 0.01, top - 0.01)
}

export interface ColumnGeometries {
  ivory: BufferGeometry
  gold: BufferGeometry
}

// Columna corintia adosada: zócalo y fuste superior en marfil; tercio inferior estriado y capitel en dorado.
export function columnGeometries(): ColumnGeometries {
  const { shaft, dadoTop, columnZ } = WALL

  const ivoryRoot = new Group()
  place(ivoryRoot, new BoxGeometry(0.46, dadoTop, 0.34), { position: [0, dadoTop / 2, 0.17] })
  place(ivoryRoot, new BoxGeometry(0.52, 0.05, 0.38), { position: [0, dadoTop + 0.025, 0.19] })
  place(
    ivoryRoot,
    lathe([
      [0, dadoTop + 0.05],
      [0.22, dadoTop + 0.05],
      [0.22, dadoTop + 0.08],
      [0.2, dadoTop + 0.1],
      [0.18, shaft.bottom],
      [0, shaft.bottom],
    ], 48),
    { position: [0, 0, columnZ] },
  )
  place(ivoryRoot, shaftSection(shaft.goldTop, shaft.top, shaft.radius * 0.99, 0.06), { position: [0, 0, columnZ] })

  const goldRoot = new Group()
  place(goldRoot, shaftSection(shaft.bottom, shaft.goldTop, shaft.radius, 0.01), { position: [0, 0, columnZ] })
  place(goldRoot, new TorusGeometry(shaft.radius + 0.005, 0.014, 5, 32), {
    position: [0, shaft.goldTop, columnZ],
    rotation: [Math.PI / 2, 0, 0],
  })
  place(
    goldRoot,
    lathe([
      [0, shaft.top],
      [0.16, shaft.top],
      [0.172, shaft.top + 0.02],
      [0.16, shaft.top + 0.03],
      [0.18, shaft.top + 0.12],
      [0.22, shaft.top + 0.22],
      [0.27, shaft.top + 0.29],
      [0, shaft.top + 0.29],
    ], 48),
    { position: [0, 0, columnZ] },
  )
  const leaf = new SphereGeometry(0.06, 6, 5)
  for (let i = 0; i < 16; i++) {
    const lower = i % 2 === 0
    const angle = (i / 16) * Math.PI * 2
    const r = lower ? 0.18 : 0.21
    place(goldRoot, leaf, {
      position: [Math.cos(angle) * r, shaft.top + (lower ? 0.09 : 0.18), columnZ + Math.sin(angle) * r],
      rotation: [0, -angle, lower ? 0.35 : 0.5],
      scale: [0.45, lower ? 1 : 0.85, 0.9],
    })
  }
  const volute = new TorusGeometry(0.045, 0.015, 5, 14)
  for (const angle of [0.25, 0.75, 1.25, 1.75].map((t) => t * Math.PI)) {
    place(goldRoot, volute, {
      position: [Math.cos(angle) * 0.26, shaft.top + 0.25, columnZ + Math.sin(angle) * 0.26],
      rotation: [0, -angle + Math.PI / 2, 0],
    })
  }
  place(goldRoot, concaveSquare(0.32, 0.06, 0.06, 8), { position: [0, shaft.top + 0.29, columnZ] })

  return { ivory: bake(ivoryRoot), gold: bake(goldRoot) }
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
