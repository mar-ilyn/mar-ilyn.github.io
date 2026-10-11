import { describe, expect, it } from 'vitest'
import { giltFrameQuads } from './giltFrameGeometry'

const area = (q: { x: [number, number]; y: [number, number] }) => (q.x[1] - q.x[0]) * (q.y[1] - q.y[0])

describe('moldura dorada en 9 partes', () => {
  it('cubre el contorno completo sin salirse del ancho y el alto', () => {
    const quads = giltFrameQuads(2.75, 2.3, { border: 0.11 })
    for (const q of quads) {
      expect(q.x[0]).toBeGreaterThanOrEqual(-1.375 - 1e-9)
      expect(q.x[1]).toBeLessThanOrEqual(1.375 + 1e-9)
      expect(q.y[0]).toBeGreaterThanOrEqual(-1.15 - 1e-9)
      expect(q.y[1]).toBeLessThanOrEqual(1.15 + 1e-9)
      expect(area(q)).toBeGreaterThan(0)
    }
  })

  it('los tramos rectos se repiten para no estirar la talla', () => {
    const short = giltFrameQuads(1.2, 1.4, { border: 0.11 }).length
    const long = giltFrameQuads(6, 1.4, { border: 0.11 }).length
    expect(long).toBeGreaterThan(short)
  })

  it('la crestería sobresale por encima del borde superior', () => {
    const quads = giltFrameQuads(2.75, 2.3, { border: 0.11, crest: 1.2 })
    const crest = quads[quads.length - 1]
    expect(crest.y[1]).toBeGreaterThan(1.15)
    expect(crest.z).toBeGreaterThan(0)
  })
})
