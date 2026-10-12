import { describe, expect, it } from 'vitest'
import { getProject, projects } from './projects'
import { profile } from './profile'

const isFiniteVec3 = (v: readonly number[]) => v.length === 3 && v.every(Number.isFinite)

describe('datos de proyectos', () => {
  it('tiene slugs únicos y aptos para URL', () => {
    const slugs = projects.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it.each(projects)('$slug tiene contenido completo', (p) => {
    expect(p.title.length).toBeGreaterThan(0)
    expect(p.title.length).toBeLessThanOrEqual(24)
    expect(p.summary.length).toBeLessThanOrEqual(140)
    expect(p.stack.length).toBeGreaterThan(0)
    expect(p.image.alt.trim().length).toBeGreaterThan(10)
    for (const href of Object.values(p.links)) {
      expect(href).toMatch(/^https:\/\//)
      expect(href, 'el link debe ir al proyecto, no al perfil').not.toMatch(/^https:\/\/github\.com\/[^/]+\/?$/)
    }
  })

  it.each(projects)('$slug tiene vistas de cámara válidas', (p) => {
    for (const view of [p.camera.detail]) {
      expect(isFiniteVec3(view.position)).toBe(true)
      expect(isFiniteVec3(view.target)).toBe(true)
    }
  })

  it('getProject encuentra por slug y devuelve undefined si no existe', () => {
    expect(getProject('turnapp')?.title).toBe('TurnApp')
    expect(getProject('no-existe')).toBeUndefined()
  })
})

describe('perfil', () => {
  it('incluye CV, GitHub y LinkedIn', () => {
    expect(profile.contacts.map((c) => c.id).sort()).toEqual(['cv', 'github', 'linkedin'])
  })
})
