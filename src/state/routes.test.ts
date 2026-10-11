import { describe, expect, it } from 'vitest'
import { pathToRoute, routeToPath, type Route } from './routes'

const known = (slug: string) => ['turnapp', 'docu-tool'].includes(slug)
const knownEntry = (slug: string) => slug === 'forit'

describe('rutas', () => {
  it.each<[string, Route]>([
    ['/', { name: 'intro' }],
    ['/proyectos', { name: 'gallery' }],
    ['/proyectos/', { name: 'gallery' }],
    ['/proyecto/turnapp', { name: 'project', slug: 'turnapp' }],
    ['/proyecto/docu-tool/placa', { name: 'plaque', slug: 'docu-tool' }],
    ['/lista', { name: 'list' }],
    ['/sobre-mi', { name: 'about', section: 'laboral' }],
    ['/sobre-mi/estudios', { name: 'about', section: 'estudios' }],
    ['/sobre-mi/forit', { name: 'aboutEntry', slug: 'forit' }],
  ])('%s', (path, route) => {
    expect(pathToRoute(path, known, '/', knownEntry)).toEqual(route)
  })

  it('una entrada desconocida de Sobre mí cae en la zona', () => {
    expect(pathToRoute('/sobre-mi/no-existe', known, '/', knownEntry)).toEqual({ name: 'about', section: 'laboral' })
  })

  it('un slug desconocido cae en la galería y una ruta desconocida en la intro', () => {
    expect(pathToRoute('/proyecto/no-existe', known)).toEqual({ name: 'gallery' })
    expect(pathToRoute('/cualquier/cosa', known)).toEqual({ name: 'intro' })
  })

  it('ida y vuelta entre ruta y path', () => {
    const routes: Route[] = [
      { name: 'intro' },
      { name: 'gallery' },
      { name: 'project', slug: 'turnapp' },
      { name: 'plaque', slug: 'turnapp' },
      { name: 'list' },
      { name: 'about', section: 'laboral' },
      { name: 'about', section: 'estudios' },
      { name: 'aboutEntry', slug: 'forit' },
    ]
    for (const r of routes) expect(pathToRoute(routeToPath(r), known, '/', knownEntry)).toEqual(r)
  })

  it('el vuelo hacia la galería ya publica /proyectos', () => {
    expect(routeToPath({ name: 'toGallery' })).toBe('/proyectos')
  })

  it('respeta un base path', () => {
    expect(routeToPath({ name: 'project', slug: 'turnapp' }, '/portfolio/')).toBe('/portfolio/proyecto/turnapp')
    expect(pathToRoute('/portfolio/proyecto/turnapp', known, '/portfolio/')).toEqual({
      name: 'project',
      slug: 'turnapp',
    })
    expect(pathToRoute('/portfolio/', known, '/portfolio/')).toEqual({ name: 'intro' })
  })
})
