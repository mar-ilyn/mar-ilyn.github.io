import { CanvasTexture, ExtrudeGeometry, Shape, SRGBColorSpace } from 'three'
import { SERIF } from './museumLabel'

// Plaquita de cada entrada del friso cronológico: una placa crema con filete dorado y las esquinas
// recortadas en cuarto de círculo, con un tornillo chico en cada esquina. El título va en EB Garamond y la fecha en
// mayúsculas espaciadas, como las placas grabadas de museo. Medidas en metros.

export const PLAQUE = { width: 0.5, height: 0.15, depth: 0.004, corner: 0.014, rim: 0.005 } as const

// El título usa hasta dos líneas: si no entra, se achica hasta minSize.
const TITLE = { size: 0.034, minSize: 0.026, weight: 650, lineHeight: 1.1 }
const DATE = { size: 0.022, weight: 680, tracking: 0.08, gap: 0.008 }
const SIDE = 0.032
const INK = '#2e2116'

type Point = [number, number]

// Contorno con las esquinas recortadas, en coordenadas de lienzo (origen arriba a la izquierda, y hacia
// abajo). inset lo achica de forma pareja: los recortes conservan su centro (en las esquinas) y crecen.
export function plaqueOutline(width: number, height: number, corner: number, inset = 0, steps = 8): Point[] {
  const r = corner + inset
  const k = Math.sqrt(r * r - inset * inset)
  // Esquinas en orden horario, con el lado hacia adentro en x e y; along indica si el arco empieza en el
  // borde vertical (TL, BR) o en el horizontal (TR, BL).
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

// Cuerpo de la placa (el canto de latón), centrado, con el frente en z = depth.
export function plaqueGeometry(): ExtrudeGeometry {
  const { width, height, depth, corner } = PLAQUE
  const points = plaqueOutline(width, height, corner)
  const shape = new Shape()
  points.forEach(([x, y], i) => (i ? shape.lineTo(x - width / 2, height / 2 - y) : shape.moveTo(x - width / 2, height / 2 - y)))
  shape.closePath()
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 4 })
}

function tracePath(ctx: CanvasRenderingContext2D, points: Point[], m: (v: number) => number) {
  ctx.beginPath()
  points.forEach(([x, y], i) => (i ? ctx.lineTo(m(x), m(y)) : ctx.moveTo(m(x), m(y))))
  ctx.closePath()
}

// Corta un texto en líneas que entren en `width` píxeles.
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
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
  // En dos líneas, el corte que deja las dos lo más parejas posible.
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
function fillTracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  const chars = [...text]
  const widths = chars.map((c) => ctx.measureText(c).width)
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1)
  let cx = x - total / 2
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y)
    cx += widths[i] + tracking
  })
}

// Cara de la placa: filete dorado, fondo crema, tornillos y texto. Fuera del contorno es transparente.
// Sin fecha (date null), la plaquita lleva solo el título.
export function plaqueTexture(title: string, date: string | null, pxPerM: number): CanvasTexture {
  const { width, height, corner, rim } = PLAQUE
  const m = (v: number) => v * pxPerM
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(m(width))
  canvas.height = Math.round(m(height))
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8

  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Filete dorado.
    const gold = ctx.createLinearGradient(0, 0, W * 0.4, H * 1.6)
    gold.addColorStop(0, '#d2ad6a')
    gold.addColorStop(0.45, '#8f6630')
    gold.addColorStop(1, '#c79f5c')
    ctx.fillStyle = gold
    tracePath(ctx, plaqueOutline(width, height, corner), m)
    ctx.fill()

    // Fondo crema, apenas más claro en el centro, con una sombra fina junto al filete.
    const face = plaqueOutline(width, height, corner, rim)
    const cream = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H / 2, W * 0.6)
    cream.addColorStop(0, '#e9dec7')
    cream.addColorStop(1, '#d8c8a6')
    ctx.fillStyle = cream
    tracePath(ctx, face, m)
    ctx.fill()
    ctx.strokeStyle = 'rgba(92, 64, 30, 0.35)'
    ctx.lineWidth = Math.max(1, m(0.0008))
    ctx.stroke()

    // Tornillos chicos en las cuatro esquinas, junto a los recortes.
    const screw = corner + rim + 0.006
    for (const [sx, sy] of [
      [screw, screw],
      [width - screw, screw],
      [width - screw, height - screw],
      [screw, height - screw],
    ]) {
      const g = ctx.createRadialGradient(m(sx - 0.0006), m(sy - 0.0006), 0, m(sx), m(sy), m(0.0024))
      g.addColorStop(0, '#e3c88e')
      g.addColorStop(1, '#7a5a2c')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(m(sx), m(sy), m(0.0022), 0, Math.PI * 2)
      ctx.fill()
    }

    // Título (en una o dos líneas) y fecha, centrados en bloque.
    ctx.fillStyle = INK
    ctx.textBaseline = 'alphabetic'
    let size = TITLE.size
    let rows: string[] = []
    for (; ; size -= 0.001) {
      ctx.font = `${TITLE.weight} ${m(size)}px ${SERIF}`
      rows = wrap(ctx, title, m(width - 2 * SIDE))
      if (rows.length <= 2 || size <= TITLE.minSize) break
    }
    const step = size * TITLE.lineHeight
    const block = rows.length * step + (date ? DATE.gap + DATE.size : -step + size)
    let y = (height - block) / 2 + size * 0.86
    ctx.textAlign = 'center'
    for (const row of rows) {
      ctx.fillText(row, m(width / 2), m(y))
      y += step
    }
    if (date) {
      y += DATE.gap + DATE.size * 0.1
      ctx.textAlign = 'left'
      ctx.font = `${DATE.weight} ${m(DATE.size)}px ${SERIF}`
      fillTracked(ctx, date.toLocaleUpperCase('es'), m(width / 2), m(y), m(DATE.size * DATE.tracking))
    }
    texture.needsUpdate = true
  }
  draw()
  void document.fonts?.load(`${TITLE.weight} 40px ${SERIF}`).then(draw)
  void document.fonts?.load(`${DATE.weight} 40px ${SERIF}`).then(draw)
  void document.fonts?.ready.then(draw)
  return texture
}
