import { CanvasTexture, MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace } from 'three'

// Cartelas de museo (la de la intro y las de los pedestales): un cartón claro y mate con el texto impreso,
// dibujado en una textura con la tipografía del sitio (Inter). La textura se redibuja cuando termina de
// cargar la fuente. Medidas en metros.

const INK = '#2b2926'
const SOFT = '#45413b'
const SANS = '"Inter Variable", Inter, "Helvetica Neue", Arial, sans-serif'
// La serif del sitio (--serif en index.css), para los textos dibujados en lienzos.
export const SERIF = '"EB Garamond Variable", "EB Garamond", Garamond, Georgia, serif'

export interface LabelLine {
  // Partes de una misma línea (p. ej. un título en negrita seguido del año).
  parts: readonly { text: string; weight?: number }[]
  size: number
  soft?: boolean
  // Avance después de la línea; si el texto se corta en varias líneas, cada una avanza lineHeight.
  gap: number
  wrap?: boolean
  lineHeight?: number
}

export interface LabelLayout {
  width: number
  height: number
  // Margen izquierdo y altura de la primera línea de base, desde arriba.
  left: number
  top: number
  pxPerM: number
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

export function museumLabelTexture(layout: LabelLayout, lines: readonly LabelLine[]): CanvasTexture {
  const m = (meters: number) => meters * layout.pxPerM
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(m(layout.width))
  canvas.height = Math.round(m(layout.height))
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8

  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#f2efe9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.textBaseline = 'alphabetic'
    const left = m(layout.left)
    const textWidth = canvas.width - 2 * left
    let y = m(layout.top)
    for (const line of lines) {
      ctx.fillStyle = line.soft ? SOFT : INK
      if (line.wrap) {
        const step = m(line.lineHeight ?? line.size * 1.4)
        ctx.font = `${line.parts[0]?.weight ?? 400} ${m(line.size)}px ${SANS}`
        const rows = wrap(ctx, line.parts.map((p) => p.text).join(' '), textWidth)
        rows.forEach((text, i) => {
          ctx.fillText(text, left, y)
          if (i < rows.length - 1) y += step
        })
        y += m(line.gap)
        continue
      }
      let x = left
      for (const part of line.parts) {
        ctx.font = `${part.weight ?? 400} ${m(line.size)}px ${SANS}`
        ctx.fillText(part.text, x, y)
        x += ctx.measureText(`${part.text}  `).width
      }
      y += m(line.gap)
    }
    texture.needsUpdate = true
  }
  draw()
  void document.fonts?.load(`600 40px ${SANS}`).then(draw)
  void document.fonts?.ready.then(draw)
  return texture
}

// Cara impresa, con un poco de luz propia: el cartón mate quedaba gris al lado de la pared.
export const labelFace = (map: CanvasTexture) =>
  new MeshStandardMaterial({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.2, roughness: 0.92, envMapIntensity: 0.4 })

export const labelBoard = new MeshStandardMaterial({ color: '#e9e5dd', roughness: 0.9 })

// Sombra difusa detrás del cartón, apenas corrida hacia abajo.
export function labelShadow(): MeshBasicMaterial {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.filter = 'blur(10px)'
    ctx.fillStyle = 'rgba(40, 30, 20, 1)'
    ctx.fillRect(26, 26, 204, 204)
  }
  return new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, opacity: 0.35, depthWrite: false })
}

// "React, TypeScript, Node.js y PostgreSQL".
export const listWithY = (items: readonly string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}` : (items[0] ?? '')
