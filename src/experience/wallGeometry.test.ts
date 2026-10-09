import { describe, expect, it } from 'vitest'
import { INTRO_LAYOUT, INTRO_X } from './layout'
import { WALL, wallLayout } from './wallGeometry'
import { projects } from '../data/projects'

const intro = { left: INTRO_X - INTRO_LAYOUT.bay / 2, right: INTRO_X + INTRO_LAYOUT.bay / 2 }
const layout = wallLayout(-39, 39, intro)

describe('pared de palacio', () => {
  it('cada pedestal queda frente a un panel ancho, entre dos columnas', () => {
    for (const p of projects) {
      const x = p.pedestal[0]
      expect(layout.wideBays).toContain(x)
      expect(layout.columns).toContain(x - WALL.columnOffset)
      expect(layout.columns).toContain(x + WALL.columnOffset)
    }
  })

  it('el panel de la intro queda libre y enmarcado por columnas en sus bordes', () => {
    const insideIntro = (x: number) => x > intro.left + 1e-6 && x < intro.right - 1e-6
    expect(layout.columns.filter(insideIntro)).toEqual([])
    expect(layout.wideBays.filter(insideIntro)).toEqual([])
    expect(layout.narrowBays.filter(insideIntro)).toEqual([])
    expect(layout.columns.some((x) => Math.abs(x - intro.left) < 1e-6)).toBe(true)
    expect(layout.columns.some((x) => Math.abs(x - intro.right) < 1e-6)).toBe(true)
  })

  it('la pared se repite sin huecos fuera de la intro', () => {
    const outside = layout.columns.filter((x) => x > intro.right + 0.1)
    const gaps = outside.slice(1).map((x, i) => +(x - outside[i]).toFixed(6))
    expect(new Set(gaps)).toEqual(new Set([WALL.wide, WALL.narrow]))
  })
})
