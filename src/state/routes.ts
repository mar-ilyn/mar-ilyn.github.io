import type { ViewState } from './machine'

export type Route = ViewState | { name: 'list' }

const PROJECT_PATH = /^\/proyecto\/([a-z0-9-]+)(\/placa)?$/

function stripBase(pathname: string, base: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const rest = b && pathname.startsWith(b) ? pathname.slice(b.length) : pathname
  const clean = rest.replace(/\/+$/, '')
  return clean === '' ? '/' : clean
}

export function pathToRoute(pathname: string, isKnownSlug: (slug: string) => boolean, base = '/'): Route {
  const path = stripBase(pathname, base)
  if (path === '/lista') return { name: 'list' }
  if (path === '/proyectos') return { name: 'gallery' }

  const match = PROJECT_PATH.exec(path)
  if (match) {
    const slug = match[1]
    if (!isKnownSlug(slug)) return { name: 'gallery' }
    return match[2] ? { name: 'plaque', slug } : { name: 'project', slug }
  }

  return { name: 'intro' }
}

export function routeToPath(route: Route, base = '/'): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  switch (route.name) {
    case 'intro':
      return `${b}/`
    case 'toGallery':
    case 'gallery':
      return `${b}/proyectos`
    case 'project':
      return `${b}/proyecto/${route.slug}`
    case 'plaque':
      return `${b}/proyecto/${route.slug}/placa`
    case 'list':
      return `${b}/lista`
  }
}
