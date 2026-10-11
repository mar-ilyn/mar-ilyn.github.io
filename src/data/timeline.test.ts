import { describe, expect, it } from 'vitest'
import { AXIS, axisX, axisYears, durationSpan, entryX, formatRange, neighbours, rowOf, timeline } from './timeline'

const NOW = '2026-10' as const

describe('línea de tiempo', () => {
  it('ubica las fechas sobre el eje entre 2022 y hoy', () => {
    expect(axisX('2022-01', NOW)).toBeCloseTo(AXIS.x0)
    expect(axisX(NOW, NOW)).toBeCloseTo(AXIS.x1)
    expect(axisX('2023-03', NOW)).toBeLessThan(axisX('2026-02', NOW))
    expect(axisYears(NOW).map((y) => y.year)).toEqual([2022, 2023, 2024, 2025, 2026])
  })

  it('"actualidad" llega al extremo derecho y lo sin fecha va después del eje', () => {
    expect(durationSpan({ start: '2023-03', end: null }, NOW)?.[1]).toBeCloseTo(AXIS.x1)
    expect(durationSpan({ start: null, end: null }, NOW)).toBeNull()
    expect(entryX({ start: null }, NOW)).toBeGreaterThan(AXIS.x1)
  })

  it('en cada fila los marcos no se pisan (0,45 m de separación mínima)', () => {
    for (const row of ['laboral', 'estudios']) {
      const xs = timeline
        .filter((e) => rowOf(e.kind) === row)
        .map((e) => entryX(e, NOW))
        .sort((a, b) => a - b)
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(0.45)
    }
  })

  it('está en orden cronológico, con lo que no tiene fecha al final, y se recorre con anterior/siguiente', () => {
    expect(timeline.map((e) => e.slug)).toEqual([
      'tecnicatura-ifts-24',
      'the-argentino',
      'full-stack-mern',
      'forit',
      'ingles-c1',
    ])
    expect(neighbours('tecnicatura-ifts-24').prev).toBeUndefined()
    expect(neighbours('the-argentino').next?.slug).toBe('full-stack-mern')
    expect(neighbours('ingles-c1').next).toBeUndefined()
  })

  it('cada entrada tiene nombre accesible y la cámara mira a su columna', () => {
    for (const e of timeline) {
      expect(e.accessibleName.length).toBeGreaterThan(10)
      expect(e.camera.target[0]).toBeCloseTo(entryX(e))
    }
  })

  it('formatea los rangos de fechas', () => {
    expect(formatRange({ start: '2023-07', end: '2024-02' })).toBe('julio 2023 – febrero 2024')
    expect(formatRange({ start: '2023-03', end: null })).toBe('marzo 2023 – actualidad')
    expect(formatRange({ start: null, end: null })).toBe('Sin fecha')
  })
})
