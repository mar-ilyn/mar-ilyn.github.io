import {
  BufferGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from 'three'
import { bake } from './bake'

// Pedestal de columna corintia, procedural: sin archivos de modelo y compartido por todos los pedestales.
// Alturas en metros; el ábaco termina en TOP_Y, donde apoya (flotando) el objeto del proyecto.
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

function capitalBell() {
  return lathe([
    [0, 0.86],
    [0.158, 0.86],
    [0.165, 0.875],
    [0.152, 0.885],
    [0.16, 0.92],
    [0.18, 0.96],
    [0.21, 1.0],
    [0.235, 1.025],
    [0, 1.025],
  ])
}

function abacus() {
  const h = 0.29
  const sag = 0.05
  const shape = new Shape()
  shape.moveTo(-h, -h)
  shape.quadraticCurveTo(0, -h + sag, h, -h)
  shape.quadraticCurveTo(h - sag, 0, h, h)
  shape.quadraticCurveTo(0, h - sag, -h, h)
  shape.quadraticCurveTo(-h + sag, 0, -h, -h)
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    curveSegments: 24,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, TOP_Y - 0.065, 0)
  return geometry
}

const LEAVES = Array.from({ length: 16 }, (_, i) => {
  const lower = i % 2 === 0
  const angle = (i / 16) * Math.PI * 2
  return { angle, lower, r: lower ? 0.165 : 0.19, y: lower ? 0.915 : 0.965 }
})

const VOLUTES = [0, 1, 2, 3].map((i) => (i / 4) * Math.PI * 2 + Math.PI / 4)

function stone() {
  const root = new Group()
  for (const geometry of [base(), shaft(), capitalBell(), abacus()]) root.add(new Mesh(geometry))

  const leaf = new SphereGeometry(0.045, 8, 6)
  for (const { angle, r, y, lower } of LEAVES) {
    const mesh = new Mesh(leaf)
    mesh.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r)
    mesh.rotation.set(0, -angle, lower ? 0.35 : 0.5)
    mesh.scale.set(0.45, lower ? 1 : 0.85, 0.9)
    root.add(mesh)
  }

  const volute = new TorusGeometry(0.032, 0.011, 6, 16)
  for (const angle of VOLUTES) {
    const mesh = new Mesh(volute)
    mesh.position.set(Math.cos(angle) * 0.225, 1.0, Math.sin(angle) * 0.225)
    mesh.rotation.set(0, -angle + Math.PI / 2, 0)
    root.add(mesh)
  }

  return bake(root)
}

let cache: BufferGeometry | null = null

// Toda la piedra del pedestal en una sola geometría (un draw call), compartida por los pedestales.
export function pedestalGeometry(): BufferGeometry {
  cache ??= stone()
  return cache
}
