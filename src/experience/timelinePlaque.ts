import type { CanvasTexture, ExtrudeGeometry } from 'three'
import { CAP, DESCENT, fillTracked, plaqueGeometry, plaqueTexture, serifFont, wrap, type PlaqueStyle } from './plaque'

// Plaquita de cada entrada del friso cronológico (la placa de museo de plaque.ts): el título en EB
// Garamond y la fecha en mayúsculas espaciadas. Medidas en metros.

export const PLAQUE = { width: 0.5, height: 0.16, depth: 0.004 } as const
const STYLE: PlaqueStyle = { width: PLAQUE.width, height: PLAQUE.height, corner: 0.014, rim: 0.005, detail: 1 }

// El título usa hasta dos líneas: si no entra, se achica hasta minSize.
const TITLE = { size: 0.038, minSize: 0.03, weight: 650, lineHeight: 1.1 }
const DATE = { size: 0.025, weight: 680, tracking: 0.08, gap: 0.008 }
const SIDE = 0.028

export const timelinePlaqueBody = (): ExtrudeGeometry => plaqueGeometry(STYLE.width, STYLE.height, STYLE.corner, PLAQUE.depth)

// Sin fecha (date null), la plaquita lleva solo el título.
export function timelinePlaqueTexture(title: string, date: string | null, pxPerM: number): CanvasTexture {
  const { width, height } = PLAQUE
  return plaqueTexture(STYLE, pxPerM, [TITLE.weight, DATE.weight], (ctx, m) => {
    let size = TITLE.size
    let rows: string[] = []
    for (; ; size -= 0.001) {
      ctx.font = serifFont(TITLE.weight, m(size))
      rows = wrap(ctx, title, m(width - 2 * SIDE))
      if (rows.length <= 2 || size <= TITLE.minSize) break
    }
    // El bloque va de la altura de las mayúsculas del título a la línea de base de la fecha (o a los
    // trazos descendentes del título, sin fecha), centrado en la placa.
    const step = size * TITLE.lineHeight
    const titleBlock = CAP * size + (rows.length - 1) * step
    const dateBlock = DESCENT * size + DATE.gap + CAP * DATE.size
    const block = titleBlock + (date ? dateBlock : DESCENT * size)
    let y = (height - block) / 2 + CAP * size
    ctx.textAlign = 'center'
    rows.forEach((row, i) => {
      if (i) y += step
      ctx.fillText(row, m(width / 2), m(y))
    })
    if (date) {
      y += dateBlock
      ctx.textAlign = 'left'
      ctx.font = serifFont(DATE.weight, m(DATE.size))
      fillTracked(ctx, date.toLocaleUpperCase('es'), m(width / 2), m(y), m(DATE.size * DATE.tracking))
    }
  })
}
