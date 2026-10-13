import { describe, expect, it } from 'vitest'
import { profile } from '../data/profile'
import { PROJECTS_TITLE } from '../data/projects'
import { SECTION_LABEL } from '../data/timeline'
import { hasGlyphs } from './letteringGeometry'

// Las letras 3D solo traen los caracteres que se usan: si cambia un texto, hay que regenerar la fuente.
describe('letras 3D', () => {
  it('la fuente tiene todas las letras de los títulos (si falla: npm run lettering-font)', () => {
    const texts = [PROJECTS_TITLE, ...Object.values(SECTION_LABEL), profile.name].map((t) => t.toLocaleUpperCase('es'))
    for (const text of texts) expect(hasGlyphs(text), text).toBe(true)
  })
})
