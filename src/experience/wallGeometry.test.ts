import { describe, expect, it } from 'vitest'
import { projects } from '../data/projects'
import { INTRO_LAYOUT, INTRO_X } from './layout'
import { WALL, wallLayout } from './wallGeometry'

const intro = { left: INTRO_X - INTRO_LAYOUT.bay / 2, right: INTRO_X + INTRO_LAYOUT.bay / 2 }
const layout = wallLayout(-39, 39, intro)
const near = (list: number[], x: number) => list.some((v) => Math.abs(v - x) < 1e-6)

describe('pared de palacio', () => {
  it('cada pedestal queda frente a un panel, entre dos columnas sueltas', () => {
    for (const p of projects) {
      const x = p.pedestal[0]
      expect(near(layout.wideBays, x)).toBe(true)
      expect(near(layout.columns, x - WALL.period / 2)).toBe(true)
      expect(near(layout.columns, x + WALL.period / 2)).toBe(true)
    }
  })

  it('el panel de la intro queda libre y enmarcado por columnas en sus bordes', () => {
    const insideIntro = (x: number) => x > intro.left + 1e-6 && x < intro.right - 1e-6
    expect(layout.columns.filter(insideIntro)).toEqual([])
    expect(layout.wideBays.filter(insideIntro)).toEqual([])
    expect(near(layout.columns, intro.left)).toBe(true)
    expect(near(layout.columns, intro.right)).toBe(true)
  })

  it('una sola columna por separación, sin pares, cada 4 m fuera de la intro', () => {
    const outside = layout.columns.filter((x) => x > intro.right + 0.1)
    const gaps = outside.slice(1).map((x, i) => +(x - outside[i]).toFixed(6))
    expect(new Set(gaps)).toEqual(new Set([WALL.period]))
  })
})
