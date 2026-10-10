import { describe, expect, it } from 'vitest'
import { beamLevel } from './beam'

describe('haz de luz', () => {
  it('en la galería se enciende solo el pedestal resaltado', () => {
    expect(beamLevel({ name: 'gallery' }, 'a', 'a', false)).toBe(1)
    expect(beamLevel({ name: 'gallery' }, 'b', 'a', false)).toBe(0)
    expect(beamLevel({ name: 'gallery' }, 'b', null, false)).toBe(0)
  })

  it('sin hover (táctil) todos tienen un brillo suave y el resaltado sigue al máximo', () => {
    expect(beamLevel({ name: 'gallery' }, 'b', null, true)).toBeGreaterThan(0)
    expect(beamLevel({ name: 'gallery' }, 'b', null, true)).toBeLessThan(1)
    expect(beamLevel({ name: 'gallery' }, 'a', 'a', true)).toBe(1)
  })

  it('el proyecto abierto conserva un haz tenue; los demás se apagan', () => {
    expect(beamLevel({ name: 'project', slug: 'a' }, 'a', null, false)).toBeGreaterThan(0)
    expect(beamLevel({ name: 'plaque', slug: 'a' }, 'a', null, false)).toBeGreaterThan(0)
    expect(beamLevel({ name: 'project', slug: 'a' }, 'b', 'b', true)).toBe(0)
  })

  it('en la intro y en el vuelo no hay haces', () => {
    expect(beamLevel({ name: 'intro' }, 'a', 'a', true)).toBe(0)
    expect(beamLevel({ name: 'toGallery' }, 'a', 'a', true)).toBe(0)
  })
})
