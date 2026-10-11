import type { MouseEvent } from 'react'
import { profile } from '../data/profile'
import { routeToPath, type Route } from '../state/routes'
import { useViewStore } from '../state/store'
import { ContactLinks } from './ContactLinks'

interface Props {
  mode: 'gallery' | 'list'
  canShowGallery: boolean
}

export function SiteHeader({ mode, canShowGallery }: Props) {
  const navigate = useViewStore((s) => s.navigate)
  const toggle: { route: Route; label: string } | null =
    mode === 'gallery'
      ? { route: { name: 'list' }, label: 'Ver como lista' }
      : canShowGallery
        ? { route: { name: 'intro' }, label: 'Ver galería 3D' }
        : null

  // "Sobre mí": en la galería lleva a la zona 3D; en la lista, a su sección.
  const aboutHref = mode === 'gallery' ? routeToPath({ name: 'about' }, import.meta.env.BASE_URL) : '#sobre-mi'
  const onAbout = (e: MouseEvent<HTMLAnchorElement>) => {
    if (mode !== 'gallery' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate({ name: 'about' })
  }

  const onToggle = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!toggle || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(toggle.route)
    window.scrollTo(0, 0)
  }

  return (
    <header className={`site-header ${mode === 'gallery' ? 'site-header--overlay' : ''}`}>
      {mode === 'list' && (
        <a className="skip-link" href="#proyectos">
          Saltar a los proyectos
        </a>
      )}
      <div className="site-header__inner">
        <p className="site-header__id">
          <span className="site-header__name">{profile.name}</span>
          <span className="site-header__role">{profile.role}</span>
        </p>
        <div className="site-header__actions">
          <a className="site-header__toggle" href={aboutHref} onClick={onAbout}>
            Sobre mí
          </a>
          {toggle && (
            <a className="site-header__toggle" href={routeToPath(toggle.route, import.meta.env.BASE_URL)} onClick={onToggle}>
              {toggle.label}
            </a>
          )}
          <ContactLinks />
        </div>
      </div>
    </header>
  )
}
