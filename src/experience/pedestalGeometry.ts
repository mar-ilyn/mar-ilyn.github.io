import { BufferGeometry, Group, LatheGeometry, Mesh, Vector2 } from 'three'
import { bake } from './bake'

// Pedestal de columna, procedural: base con molduras y faldón estriado, fuste estriado y el mismo
// diseño de la base invertido arriba. Sin archivos de modelo y compartido por todos los pedestales.
// Alturas en metros; la cara superior está en TOP_Y, donde apoya (flotando) el objeto del proyecto.
export const TOP_Y = 1.1
export const SHAFT = { bottom: 0.27, top: 0.86, radius: 0.15 } as const

export const lathe = (points: [number, number][], segments = 96) =>
  new LatheGeometry(
    points.map(([r, y]) => new Vector2(r, y)),
    segments,
  )

// Estrías: hunde el radio en N canales a lo largo del perímetro.
export function flute(geometry: BufferGeometry, count: number, depth: number, from: number, to: number) {
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y < from || y > to) continue
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const r = Math.hypot(x, z)
    if (r === 0) continue
    const theta = Math.atan2(z, x)
    const groove = Math.pow(0.5 + 0.5 * Math.cos(count * theta), 3)
    const k = (r - depth * groove) / r
    pos.setX(i, x * k)
    pos.setZ(i, z * k)
  }
  geometry.computeVertexNormals()
  return geometry
}

function base() {
  return flute(
    lathe(
      [
        [0, 0],
        [0.3, 0],
        [0.3, 0.05],
        [0.285, 0.06],
        [0.29, 0.075],
        [0.27, 0.09],
        [0.25, 0.1],
        [0.225, 0.14],
        [0.2, 0.19],
        [0.18, 0.23],
        [0.175, 0.245],
        [0.185, 0.255],
        [0.18, 0.27],
        [0, 0.27],
      ],
      96,
    ),
    20,
    0.018,
    0.1,
    0.235,
  )
}

function shaft() {
  const steps = 12
  const points: [number, number][] = [[0, SHAFT.bottom]]
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    points.push([SHAFT.radius * (1.03 - 0.06 * t), SHAFT.bottom + (SHAFT.top - SHAFT.bottom) * t])
  }
  points.push([0, SHAFT.top])
  return flute(lathe(points, 96), 16, 0.016, SHAFT.bottom + 0.01, SHAFT.top - 0.01)
}

// Remate superior: la misma base, invertida como en un espejo y ajustada a la altura que va del
// fuste a la cara superior (TOP_Y), así arriba y abajo tienen el mismo diseño.
const BASE_HEIGHT = 0.27

function stone() {
  const root = new Group()
  for (const geometry of [base(), shaft()]) root.add(new Mesh(geometry))
  const top = new Mesh(base())
  top.scale.set(1, -(TOP_Y - SHAFT.top) / BASE_HEIGHT, 1)
  top.position.y = TOP_Y
  root.add(top)
  return bake(root)
}

let cache: BufferGeometry | null = null

// Toda la piedra del pedestal en una sola geometría (un draw call), compartida por los pedestales.
export function pedestalGeometry(): BufferGeometry {
  cache ??= stone()
  return cache
}
