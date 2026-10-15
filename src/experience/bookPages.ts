import { CanvasTexture, SRGBColorSpace } from 'three'
import { contact } from '../data/contact'
import { BOOK, BOOK_PAGE, pageSurfaceY } from './deskLayout'
import { SERIF } from './museumLabel'
import type { Quality } from './quality'

// Contenido del libro de contacto, impreso en las hojas de arriba: a la izquierda los canales (mail,
// LinkedIn, GitHub) con "Copiar", a la derecha "Dejá un mensaje" con "Escribirme". Las posiciones están
// en metros sobre cada hoja, vista de frente (x desde el borde izquierdo de la hoja en pantalla, y desde
// la cabeza): las usa la textura (bookPageTexture) y las zonas clickeables del HTML (ContactBook), que
// van encima en el mismo lugar.

export type PageSide = 'left' | 'right'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const { width: W } = BOOK_PAGE
const INK = '#2e2116'
const SOFT = '#5a4634'
const ACCENT = '#9c4a2b'
const PAPER = '#f4ead6'

const TITLE = { size: 0.03, weight: 600, y: 0.066 }
const TEXT = { size: 0.0165, lineHeight: 0.023, y: 0.1 }
const LABEL = { size: 0.0105, weight: 650, tracking: 0.14 }
const VALUE = { size: 0.0165, weight: 500 }
// Margen del lado de afuera y del pliegue (la hoja se curva hacia el pliegue: ahí va más margen).
const OUTER = 0.03
const GUTTER = 0.036

const left = { x0: OUTER, x1: W - GUTTER }
const right = { x0: GUTTER, x1: W - OUTER }

// Canales: rótulo, valor (link) y "Copiar" a la derecha, en la misma línea que el valor.
const CHANNELS = { y: 0.17, step: 0.064, valueGap: 0.023 }
const COPY = { width: 0.064, height: 0.022 }
// Botón "Escribirme", debajo del texto de la derecha.
const WRITE = { y: 0.18, width: 0.114, height: 0.034 }

export const channelRects = contact.channels.map((_, i) => {
  const base = CHANNELS.y + i * CHANNELS.step + CHANNELS.valueGap
  return {
    // Valor: desde el margen hasta "Copiar", a la altura de su línea.
    value: { x: left.x0, y: base - VALUE.size * 1.05, width: left.x1 - left.x0 - COPY.width - 0.01, height: VALUE.size * 1.5 },
    copy: { x: left.x1 - COPY.width, y: base - VALUE.size * 0.95, width: COPY.width, height: COPY.height },
    base,
  }
})

export const writeRect: Rect = { x: right.x0, y: WRITE.y, width: WRITE.width, height: WRITE.height }

// Punto de una hoja en la escena (x, y en metros sobre la hoja vista de frente), sobre su superficie
// curva: ahí se proyectan las esquinas de cada zona clickeable.
export function pagePoint(side: PageSide, x: number, y: number): [number, number, number] {
  const fromGutter = side === 'right' ? x : BOOK_PAGE.width - x
  const sign = side === 'right' ? 1 : -1
  return [BOOK.spineX + sign * (0.001 + fromGutter), pageSurfaceY(fromGutter / BOOK_PAGE.width), BOOK.z - BOOK.depth / 2 + y]
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
  return lines
}

// Mayúsculas espaciadas, desde x (alineadas a la izquierda) o centradas en x.
function tracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, center = false) {
  const chars = [...text]
  const widths = chars.map((c) => ctx.measureText(c).width)
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1)
  let cx = center ? x - total / 2 : x
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y)
    cx += widths[i] + tracking
  })
}

const font = (weight: number, px: number) => `${weight} ${px}px ${SERIF}`

// Papel marfil con la sombra del pliegue (en x = 0 de la textura), un leve oscurecimiento hacia los bordes
// y unas pocas manchas de papel viejo, muy suaves.
function paper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f2e8d3'
  ctx.fillRect(0, 0, w, h)
  const gutter = ctx.createLinearGradient(0, 0, w, 0)
  gutter.addColorStop(0, 'rgba(92, 70, 40, 0.55)')
  gutter.addColorStop(0.06, 'rgba(92, 70, 40, 0.22)')
  gutter.addColorStop(0.2, 'rgba(92, 70, 40, 0)')
  gutter.addColorStop(0.9, 'rgba(120, 95, 60, 0)')
  gutter.addColorStop(1, 'rgba(120, 95, 60, 0.16)')
  ctx.fillStyle = gutter
  ctx.fillRect(0, 0, w, h)
  const edges = ctx.createLinearGradient(0, 0, 0, h)
  edges.addColorStop(0, 'rgba(120, 95, 60, 0.12)')
  edges.addColorStop(0.06, 'rgba(120, 95, 60, 0)')
  edges.addColorStop(0.94, 'rgba(120, 95, 60, 0)')
  edges.addColorStop(1, 'rgba(120, 95, 60, 0.12)')
  ctx.fillStyle = edges
  ctx.fillRect(0, 0, w, h)
  for (const [x, y, r] of [
    [0.74, 0.18, 0.12],
    [0.86, 0.78, 0.09],
    [0.39, 0.59, 0.14],
  ]) {
    const spot = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w)
    spot.addColorStop(0, 'rgba(170, 130, 70, 0.07)')
    spot.addColorStop(1, 'rgba(170, 130, 70, 0)')
    ctx.fillStyle = spot
    ctx.fillRect(x * w - r * w, y * h - r * w, 2 * r * w, 2 * r * w)
  }
}

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number, m: (v: number) => number) {
  ctx.beginPath()
  ctx.roundRect(m(r.x), m(r.y), m(r.width), m(r.height), m(radius))
}

function drawChannels(ctx: CanvasRenderingContext2D, m: (v: number) => number, copied: string | null) {
  ctx.fillStyle = INK
  ctx.font = font(TITLE.weight, m(TITLE.size))
  ctx.fillText(contact.channelsTitle, m(left.x0), m(TITLE.y))
  ctx.fillStyle = SOFT
  ctx.font = font(450, m(TEXT.size))
  wrap(ctx, contact.channelsIntro, m(left.x1 - left.x0)).forEach((row, i) => ctx.fillText(row, m(left.x0), m(TEXT.y + i * TEXT.lineHeight)))

  contact.channels.forEach((c, i) => {
    const { value, copy, base } = channelRects[i]
    ctx.fillStyle = SOFT
    ctx.font = font(LABEL.weight, m(LABEL.size))
    tracked(ctx, c.label.toLocaleUpperCase('es'), m(left.x0), m(base - CHANNELS.valueGap + LABEL.size * 0.9), m(LABEL.size * LABEL.tracking))
    // El valor se achica si no entra antes de "Copiar"; subrayado, como un link.
    let size = VALUE.size
    ctx.font = font(VALUE.weight, m(size))
    while (ctx.measureText(c.display).width > m(value.width) && size > VALUE.size * 0.7) {
      size *= 0.96
      ctx.font = font(VALUE.weight, m(size))
    }
    ctx.fillStyle = INK
    ctx.fillText(c.display, m(left.x0), m(base))
    ctx.fillStyle = 'rgba(46, 33, 22, 0.55)'
    ctx.fillRect(m(left.x0), m(base + size * 0.18), ctx.measureText(c.display).width, Math.max(1, m(0.0006)))
    // "Copiar" en un recuadro fino; "Copiado" cuando se acaba de copiar.
    const done = copied === c.id
    ctx.strokeStyle = done ? ACCENT : 'rgba(46, 33, 22, 0.6)'
    ctx.lineWidth = Math.max(1, m(0.0007))
    roundRect(ctx, copy, 0.004, m)
    ctx.stroke()
    ctx.fillStyle = done ? ACCENT : INK
    ctx.font = font(LABEL.weight, m(LABEL.size))
    const word = (done ? 'Copiado' : contact.copy.button).toLocaleUpperCase('es')
    tracked(ctx, word, m(copy.x + copy.width / 2), m(copy.y + copy.height / 2 + LABEL.size * 0.34), m(LABEL.size * 0.1), true)
  })
}

function drawMessage(ctx: CanvasRenderingContext2D, m: (v: number) => number) {
  ctx.fillStyle = INK
  ctx.font = font(TITLE.weight, m(TITLE.size))
  ctx.fillText(contact.message.title, m(right.x0), m(TITLE.y))
  ctx.fillStyle = SOFT
  ctx.font = font(450, m(TEXT.size))
  wrap(ctx, contact.message.text, m(right.x1 - right.x0)).forEach((row, i) => ctx.fillText(row, m(right.x0), m(TEXT.y + i * TEXT.lineHeight)))
  // "Escribirme": un sello en el color de acento del sitio, con el texto en papel.
  ctx.fillStyle = ACCENT
  roundRect(ctx, writeRect, writeRect.height / 2, m)
  ctx.fill()
  ctx.fillStyle = PAPER
  ctx.font = font(600, m(TEXT.size))
  ctx.textAlign = 'center'
  ctx.fillText(contact.message.button, m(writeRect.x + writeRect.width / 2), m(writeRect.y + writeRect.height / 2 + TEXT.size * 0.33))
  ctx.textAlign = 'left'
}

// Textura de una hoja de arriba. La hoja izquierda es la derecha espejada en la escena (el pliegue queda
// en x = 0 de la textura de las dos): su contenido se dibuja espejado para que se lea al derecho.
export function bookPageTexture(side: PageSide, quality: Quality, copied: string | null = null): CanvasTexture {
  const pxPerM = quality === 'high' ? 2600 : 1700
  const m = (v: number) => v * pxPerM
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(m(BOOK_PAGE.width))
  canvas.height = Math.round(m(BOOK_PAGE.depth))
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    paper(ctx, canvas.width, canvas.height)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    if (side === 'left') {
      ctx.setTransform(-1, 0, 0, 1, canvas.width, 0)
      drawChannels(ctx, m, copied)
    } else drawMessage(ctx, m)
    texture.needsUpdate = true
  }
  draw()
  for (const weight of [450, 500, 600, 650]) void document.fonts?.load(`${weight} 40px ${SERIF}`).then(draw)
  void document.fonts?.ready.then(draw)
  return texture
}
