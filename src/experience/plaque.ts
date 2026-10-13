import { CanvasTexture, ExtrudeGeometry, MeshStandardMaterial, Shape, SRGBColorSpace } from 'three'
import { SERIF } from './museumLabel'

// Placa de museo (las plaquitas del friso cronológico y la cartela de la intro): una placa crema con
// filete dorado, las esquinas recortadas en cuarto de círculo y un tornillo chico en cada esquina. El
// cuerpo es de latón y la cara, una textura con el texto en EB Garamond. Medidas en metros.

export interface PlaqueStyle {
  width: number
  height: number
  corner: number
  rim: number
  // Escala de los detalles (tornillos, sombra junto al filete): 1 en las plaquitas del friso.
  detail: number
}

export const INK = '#2e2116'
export const SOFT_INK = '#4a3b2c'
// Altura de las mayúsculas y largo de los trazos descendentes de EB Garamond, en em.
export const CAP = 0.65
export const DESCENT = 0.27

export const plaqueBrass = new MeshStandardMaterial({ color: '#a5844c', metalness: 0.8, roughness: 0.42 })

type Point = [number, number]

// Contorno con las esquinas recortadas, en coordenadas de lienzo (origen arriba a la izquierda, y hacia
// abajo). inset lo achica de forma pareja: los recortes conservan su centro (en las esquinas) y crecen.
export function plaqueOutline(width: number, height: number, corner: number, inset = 0, steps = 8): Point[] {
  const r = corner + inset
  const k = Math.sqrt(r * r - inset * inset)
  // Esquinas en orden horario, con el lado hacia adentro en x e y; vertical indica si el arco empieza en
  // el borde vertical (TL, BR) o en el horizontal (TR, BL).
  const corners: [number, number, number, number, boolean][] = [
    [0, 0, 1, 1, true],
    [width, 0, -1, 1, false],
    [width, height, -1, -1, true],
    [0, height, 1, -1, false],
  ]
  const points: Point[] = []
  for (const [cx, cy, sx, sy, vertical] of corners) {
    const onVertical: Point = [cx + sx * inset, cy + sy * k]
    const onHorizontal: Point = [cx + sx * k, cy + sy * inset]
    const [from, to] = vertical ? [onVertical, onHorizontal] : [onHorizontal, onVertical]
    const a0 = Math.atan2(from[1] - cy, from[0] - cx)
    let sweep = Math.atan2(to[1] - cy, to[0] - cx) - a0
    if (sweep > Math.PI) sweep -= 2 * Math.PI
    if (sweep < -Math.PI) sweep += 2 * Math.PI
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (sweep * i) / steps
      points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
    }
  }
  return points
}

// Cuerpo de la placa (el canto de latón), centrado, con la cara de atrás en z = 0 y el frente en z = depth.
export function plaqueGeometry(width: number, height: number, corner: number, depth: number): ExtrudeGeometry {
  const shape = new Shape()
  plaqueOutline(width, height, corner).forEach(([x, y], i) =>
    i ? shape.lineTo(x - width / 2, height / 2 - y) : shape.moveTo(x - width / 2, height / 2 - y),
  )
  shape.closePath()
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 4 })
}

function tracePath(ctx: CanvasRenderingContext2D, points: Point[], m: (v: number) => number) {
  ctx.beginPath()
  points.forEach(([x, y], i) => (i ? ctx.lineTo(m(x), m(y)) : ctx.moveTo(m(x), m(y))))
  ctx.closePath()
}

// Filete dorado, fondo crema y tornillos. Fuera del contorno queda transparente.
function drawPlaque(ctx: CanvasRenderingContext2D, style: PlaqueStyle, m: (v: number) => number) {
  const { width, height, corner, rim, detail } = style
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  ctx.clearRect(0, 0, W, H)

  const gold = ctx.createLinearGradient(0, 0, W * 0.4, H * 1.6)
  gold.addColorStop(0, '#d2ad6a')
  gold.addColorStop(0.45, '#8f6630')
  gold.addColorStop(1, '#c79f5c')
  ctx.fillStyle = gold
  tracePath(ctx, plaqueOutline(width, height, corner), m)
  ctx.fill()

  // Fondo crema, apenas más claro en el centro, con una sombra fina junto al filete.
  const cream = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.6)
  cream.addColorStop(0, '#e9dec7')
  cream.addColorStop(1, '#d8c8a6')
  ctx.fillStyle = cream
  tracePath(ctx, plaqueOutline(width, height, corner, rim), m)
  ctx.fill()
  ctx.strokeStyle = 'rgba(92, 64, 30, 0.35)'
  ctx.lineWidth = Math.max(1, m(0.0008 * detail))
  ctx.stroke()

  // Tornillos chicos en las cuatro esquinas, junto a los recortes.
  const screw = corner + rim + 0.006 * detail
  const radius = 0.0022 * detail
  for (const [sx, sy] of [
    [screw, screw],
    [width - screw, screw],
    [width - screw, height - screw],
    [screw, height - screw],
  ]) {
    const g = ctx.createRadialGradient(m(sx - radius * 0.3), m(sy - radius * 0.3), 0, m(sx), m(sy), m(radius * 1.1))
    g.addColorStop(0, '#e3c88e')
    g.addColorStop(1, '#7a5a2c')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(m(sx), m(sy), m(radius), 0, Math.PI * 2)
    ctx.fill()
  }
}

// Textura de la cara: la placa y, encima, el texto que dibuja `content` (en metros, con m() a píxeles).
// Se redibuja cuando terminan de cargar los pesos de la tipografía que usa.
export function plaqueTexture(
  style: PlaqueStyle,
  pxPerM: number,
  weights: readonly number[],
  content: (ctx: CanvasRenderingContext2D, m: (v: number) => number) => void,
): CanvasTexture {
  const m = (v: number) => v * pxPerM
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(m(style.width))
  canvas.height = Math.round(m(style.height))
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawPlaque(ctx, style, m)
    ctx.fillStyle = INK
    ctx.textBaseline = 'alphabetic'
    content(ctx, m)
    texture.needsUpdate = true
  }
  draw()
  for (const weight of weights) void document.fonts?.load(`${weight} 40px ${SERIF}`).then(draw)
  void document.fonts?.ready.then(draw)
  return texture
}

// Corta un texto en líneas que entren en `width` píxeles. En dos líneas, elige el corte que las deja lo
// más parejas posible.
export function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  if (lines.length !== 2) return lines
  const words = text.split(' ')
  let best = lines
  let bestWidth = Math.max(...lines.map((l) => ctx.measureText(l).width))
  for (let i = 1; i < words.length; i++) {
    const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')]
    const widest = Math.max(...pair.map((l) => ctx.measureText(l).width))
    if (widest <= width && widest < bestWidth) {
      best = pair
      bestWidth = widest
    }
  }
  return best
}

// Texto espaciado letra por letra (letterSpacing del canvas no está en todos los navegadores), centrado en x.
export function fillTracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  const chars = [...text]
  const widths = chars.map((c) => ctx.measureText(c).width)
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1)
  let cx = x - total / 2
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y)
    cx += widths[i] + tracking
  })
}

export const serifFont = (weight: number, px: number) => `${weight} ${px}px ${SERIF}`
