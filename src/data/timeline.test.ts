import { describe, expect, it } from 'vitest'
import {
  AXIS,
  axisX,
  axisYears,
  CABINET,
  durationSpan,
  entriesOf,
  entryX,
  formatRange,
  HOBBY_SLOT,
  neighbours,
  rowOf,
  SECTIONS,
  timeline,
} from './timeline'

const NOW = '2026-10' as const

describe('línea de tiempo', () => {
  it('ubica las fechas sobre el eje entre 2022 y hoy, dentro del mueble', () => {
    expect(axisX('2022-01', NOW)).toBeCloseTo(AXIS.x0)
    expect(axisX(NOW, NOW)).toBeCloseTo(AXIS.x1)
    expect(axisX('2023-03', NOW)).toBeLessThan(axisX('2026-02', NOW))
    expect(axisYears(NOW).map((y) => y.year)).toEqual([2022, 2023, 2024, 2025, 2026])
    expect(AXIS.x0).toBeGreaterThan(CABINET.cx - CABINET.width / 2 + 0.05)
    expect(AXIS.x1).toBeLessThan(CABINET.cx + CABINET.width / 2 - 0.05)
  })

  it('"actualidad" llega al extremo derecho y lo sin fecha no tiene barra', () => {
    expect(durationSpan({ start: '2023-03', end: null }, NOW)?.[1]).toBeCloseTo(AXIS.x1)
    expect(durationSpan({ start: null, end: null }, NOW)).toBeNull()
  })

  it('arriba la experiencia y abajo los estudios', () => {
    expect(SECTIONS.laboral.floor).toBeGreaterThan(SECTIONS.estudios.ceiling)
    expect(entriesOf('laboral').map((e) => e.slug)).toEqual(['the-argentino', 'forit'])
    expect(entriesOf('estudios').map((e) => e.slug)).toEqual(['tecnicatura-ifts-24', 'full-stack-mern', 'ingles-c1'])
  })

  it('en cada estante los objetos no se pisan y quedan dentro del mueble', () => {
    const inner = CABINET.width / 2 - 0.05
    for (const row of ['laboral', 'estudios'] as const) {
      const xs = entriesOf(row).map((e) => entryX(e))
      if (row === HOBBY_SLOT.row) xs.push(HOBBY_SLOT.x)
      xs.sort((a, b) => a - b)
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(0.45)
      for (const x of xs) expect(Math.abs(x - CABINET.cx)).toBeLessThan(inner - 0.2)
    }
  })

  it('se recorre por secciones, cada una en orden cronológico, con anterior/siguiente', () => {
    expect(timeline.map((e) => e.slug)).toEqual([
      'the-argentino',
      'forit',
      'tecnicatura-ifts-24',
      'full-stack-mern',
      'ingles-c1',
    ])
    expect(neighbours('the-argentino').prev).toBeUndefined()
    expect(neighbours('forit').next?.slug).toBe('tecnicatura-ifts-24')
    expect(neighbours('ingles-c1').next).toBeUndefined()
  })

  it('cada entrada tiene nombre accesible y la cámara mira a su objeto, en su compartimento', () => {
    for (const e of timeline) {
      expect(e.accessibleName.length).toBeGreaterThan(10)
      expect(e.camera.target[0]).toBeCloseTo(entryX(e))
      const { floor, ceiling } = SECTIONS[rowOf(e.kind)]
      expect(e.camera.target[1]).toBeGreaterThan(floor)
      expect(e.camera.target[1]).toBeLessThan(ceiling)
      expect(e.camera.position[2]).toBeGreaterThan(-3 + CABINET.depth + 0.5)
    }
  })

  it('formatea los rangos de fechas', () => {
    expect(formatRange({ start: '2023-07', end: '2024-02' })).toBe('julio 2023 – febrero 2024')
    expect(formatRange({ start: '2023-03', end: null })).toBe('marzo 2023 – actualidad')
    expect(formatRange({ start: null, end: null })).toBe('Sin fecha')
  })
})
