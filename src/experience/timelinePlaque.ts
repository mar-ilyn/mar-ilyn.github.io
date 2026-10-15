import type { CanvasTexture, ExtrudeGeometry } from 'three'
import { CAP, DESCENT, fillTracked, plaqueGeometry, plaqueTexture, serifFont, wrap, type PlaqueStyle } from './plaque'

// Plaquita de cada entrada del friso cronológico (la placa de museo de plaque.ts): el título en EB
// Garamond y la fecha en mayúsculas espaciadas. Las entradas sin fecha llevan solo el título, en una
// plaquita más chica. Medidas en metros.

// Ancho: las plaquitas están cada SLOT_PITCH (0,56 m); quedan 3 cm entre una y otra.
const DATED = { width: 0.53, height: 0.19 }
const UNDATED = { width: 0.46, height: 0.13 }
export const PLAQUE_DEPTH = 0.004

export const plaqueSize = (dated: boolean) => (dated ? DATED : UNDATED)
const styleFor = (dated: boolean): PlaqueStyle => ({ ...plaqueSize(dated), corner: 0.014, rim: 0.005, detail: 1 })

// El título usa hasta dos líneas: si no entra, se achica hasta minSize.
const TITLE = { size: 0.044, minSize: 0.034, weight: 650, lineHeight: 1.1 }
const DATE = { size: 0.028, weight: 680, tracking: 0.08, gap: 0.009 }
const SIDE = 0.026

export const timelinePlaqueBody = (dated: boolean): ExtrudeGeometry => {
  const { width, height, corner } = styleFor(dated)
  return plaqueGeometry(width, height, corner, PLAQUE_DEPTH)
}

// Sin fecha (date null), la plaquita lleva solo el título.
export function timelinePlaqueTexture(title: string, date: string | null, pxPerM: number): CanvasTexture {
  const style = styleFor(date !== null)
  const { width, height } = style
  return plaqueTexture(style, pxPerM, [TITLE.weight, DATE.weight], (ctx, m) => {
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
