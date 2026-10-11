import { BufferGeometry, Float32BufferAttribute } from 'three'
import kit from './giltFrameKit.json'

// Moldura dorada "en 9 partes" a partir del marco tallado de Poly Haven (ver build-frame-kit.mjs):
// las cuatro esquinas reales, el tramo recto de cada lado repetido a lo largo (sin deformar las
// esquinas) y, opcionalmente, la banda superior del marco como crestería. Todo en planos: el relieve
// lo dan el normal map y la oclusión. Coordenadas: centro en el origen, y hacia arriba, z hacia afuera.
// Los planos se apoyan a SURFACE_Z de la pared (una moldura aplicada sobresale de la superficie);
// sobre la pared misma competirían con ella en profundidad.
const SURFACE_Z = 0.03

export interface GiltFrameOptions {
  // Ancho del borde de la moldura, en metros.
  border: number
  // Escala de la crestería respecto del marco original; 0 = sin crestería.
  crest?: number
}

interface Quad {
  x: [number, number]
  y: [number, number]
  u: [number, number]
  // v de la textura crece hacia abajo (las KTX2 no se invierten al cargar).
  v: [number, number]
  z?: number
}

const KIT_W = kit.widthMeters
const KIT_H = KIT_W / kit.aspect

export function giltFrameQuads(width: number, height: number, { border, crest = 0 }: GiltFrameOptions): Quad[] {
  const s = border / (kit.border.u * KIT_W)
  const bx = kit.border.u * KIT_W * s
  const by = kit.border.v * KIT_H * s
  const cw = kit.corner.u * KIT_W * s
  const ch = kit.corner.v * KIT_H * s
  const L = -width / 2
  const R = width / 2
  const T = height / 2
  const B = -height / 2
  const quads: Quad[] = [
    { x: [L, L + cw], y: [T - ch, T], u: [0, kit.corner.u], v: [0, kit.corner.v] },
    { x: [R - cw, R], y: [T - ch, T], u: [1 - kit.corner.u, 1], v: [0, kit.corner.v] },
    { x: [L, L + cw], y: [B, B + ch], u: [0, kit.corner.u], v: [1 - kit.corner.v, 1] },
    { x: [R - cw, R], y: [B, B + ch], u: [1 - kit.corner.u, 1], v: [1 - kit.corner.v, 1] },
  ]

  // Tramos rectos: se repite el segmento de moldura de cada lado, estirado apenas para que encaje.
  const run = (from: number, to: number, segment: number, add: (a: number, b: number) => void) => {
    const n = Math.max(1, Math.round((to - from) / segment))
    const step = (to - from) / n
    for (let i = 0; i < n; i++) add(from + i * step, from + (i + 1) * step)
  }
  const [ta, tb] = kit.straight.top
  run(L + cw, R - cw, (tb - ta) * KIT_W * s, (a, b) =>
    quads.push({ x: [a, b], y: [T - by, T], u: [ta, tb], v: [0, kit.border.v] }),
  )
  const [ba, bb] = kit.straight.bottom
  run(L + cw, R - cw, (bb - ba) * KIT_W * s, (a, b) =>
    quads.push({ x: [a, b], y: [B, B + by], u: [ba, bb], v: [1 - kit.border.v, 1] }),
  )
  const [la, lb] = kit.straight.left
  run(B + ch, T - ch, (lb - la) * KIT_H * s, (a, b) =>
    quads.push({ x: [L, L + bx], y: [a, b], u: [0, kit.border.u], v: [la, lb] }),
  )
  const [ra, rb] = kit.straight.right
  run(B + ch, T - ch, (rb - ra) * KIT_H * s, (a, b) =>
    quads.push({ x: [R - bx, R], y: [a, b], u: [1 - kit.border.u, 1], v: [ra, rb] }),
  )

  // Crestería: la banda superior del marco, centrada y apoyada sobre la moldura superior.
  if (crest > 0) {
    const w = KIT_W * s * crest * (kit.crest.u[1] - kit.crest.u[0])
    const h = (kit.crest.v[1] - kit.crest.v[0]) * KIT_H * s * crest
    const base = T - by * 0.45
    quads.push({ x: [-w / 2, w / 2], y: [base, base + h], u: kit.crest.u as [number, number], v: kit.crest.v as [number, number], z: 0.008 })
  }
  return quads
}

export function giltFrameGeometry(width: number, height: number, options: GiltFrameOptions): BufferGeometry {
  const quads = giltFrameQuads(width, height, options)
  const position: number[] = []
  const normal: number[] = []
  const uv: number[] = []
  const index: number[] = []
  quads.forEach((q, i) => {
    const z = SURFACE_Z + (q.z ?? 0)
    position.push(q.x[0], q.y[0], z, q.x[1], q.y[0], z, q.x[1], q.y[1], z, q.x[0], q.y[1], z)
    normal.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1)
    // y abajo ↔ v[1], y arriba ↔ v[0].
    uv.push(q.u[0], q.v[1], q.u[1], q.v[1], q.u[1], q.v[0], q.u[0], q.v[0])
    const o = i * 4
    index.push(o, o + 1, o + 2, o, o + 2, o + 3)
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normal, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setIndex(index)
  return geometry
}
