import type { ViewState } from './machine'

export type Route = ViewState | { name: 'list' }

// /proyecto/x es la cartela; /proyecto/x/detalle, el objeto. /placa (links viejos) abre la cartela.
const PROJECT_PATH = /^\/proyecto\/([a-z0-9-]+)(\/detalle|\/placa)?$/
// /sobre-mi es el compartimento de experiencia, /sobre-mi/estudios el de estudios; si no, una entrada.
const ABOUT_PATH = /^\/sobre-mi(?:\/([a-z0-9-]+))?$/

function stripBase(pathname: string, base: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const rest = b && pathname.startsWith(b) ? pathname.slice(b.length) : pathname
  const clean = rest.replace(/\/+$/, '')
  return clean === '' ? '/' : clean
}

export function pathToRoute(
  pathname: string,
  isKnownSlug: (slug: string) => boolean,
  base = '/',
  isKnownEntry: (slug: string) => boolean = () => false,
): Route {
  const path = stripBase(pathname, base)
  if (path === '/lista') return { name: 'list' }
  if (path === '/proyectos') return { name: 'gallery' }
  if (path === '/contacto') return { name: 'contact' }
  if (path === '/contacto/libro') return { name: 'contactBook' }

  const about = ABOUT_PATH.exec(path)
  if (about) {
    const slug = about[1]
    if (slug === 'estudios') return { name: 'about', section: 'estudios' }
    return slug && isKnownEntry(slug) ? { name: 'aboutEntry', slug } : { name: 'about', section: 'laboral' }
  }

  const match = PROJECT_PATH.exec(path)
  if (match) {
    const slug = match[1]
    if (!isKnownSlug(slug)) return { name: 'gallery' }
    return match[2] === '/detalle' ? { name: 'projectDetail', slug } : { name: 'project', slug }
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
    case 'projectDetail':
      return `${b}/proyecto/${route.slug}/detalle`
    case 'list':
      return `${b}/lista`
    case 'about':
      return route.section === 'estudios' ? `${b}/sobre-mi/estudios` : `${b}/sobre-mi`
    case 'aboutEntry':
      return `${b}/sobre-mi/${route.slug}`
    case 'contact':
      return `${b}/contacto`
    case 'contactBook':
      return `${b}/contacto/libro`
  }
}
