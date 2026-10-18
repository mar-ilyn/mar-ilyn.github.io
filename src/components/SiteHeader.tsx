import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { profile } from '../data/profile'
import { routeToPath, type Route } from '../state/routes'
import { useViewStore } from '../state/store'
import { ContactMenu } from './ContactMenu'
import { ICONS } from './icons'

interface Props {
  mode: 'gallery' | 'list'
  canShowGallery: boolean
}

// Secciones de la vista en lista, además de "Sobre mí" y "Contacto".
const LIST_LINKS = [
  { href: '#proyectos', label: 'Proyectos' },
  { href: '#experiencia', label: 'Experiencia' },
]

// Redes del perfil (GitHub, LinkedIn), como íconos en la cápsula.
const SOCIAL = profile.contacts.filter((c) => c.external)

// Header: a la izquierda, una pestaña del color del marco de la galería con el rol y el nombre; a la
// derecha, una cápsula clara con la navegación (Sobre mí, la vista en lista, Contacto y las redes). En la
// vista en lista la navegación es solo texto sobre la pared (Sobre mí, Proyectos, Experiencia, Contacto) y
// toma un fondo suave al scrollear, cuando ya pasaría sobre el contenido. El CV se descarga desde el panel
// de Contacto. En pantallas angostas Contacto sigue a la vista y los otros links pasan a un menú que se
// despliega debajo.
export function SiteHeader({ mode, canShowGallery }: Props) {
  const navigate = useViewStore((s) => s.navigate)
  const route = useViewStore((s) => s.route)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const nav = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [menuOpen])

  // En la lista, el nombre del hero está a la vista arriba: la pestaña aparece cuando queda debajo del header.
  // Sin IntersectionObserver la pestaña queda siempre a la vista.
  const [heroNameVisible, setHeroNameVisible] = useState(mode === 'list' && typeof IntersectionObserver !== 'undefined')
  useEffect(() => {
    const name = document.getElementById('hero-title')
    if (mode !== 'list' || !name || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([e]) => setHeroNameVisible(e.isIntersecting), { rootMargin: '-90px 0px 0px 0px' })
    observer.observe(name)
    return () => observer.disconnect()
  }, [mode])

  // Esc cierra el menú y no llega a la escena (ahí Esc retrocede un nivel).
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !menuOpen) return
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    setMenuOpen(false)
    menuButton.current?.focus()
  }

  const toggle: { route: Route; label: string } | null =
    mode === 'gallery'
      ? { route: { name: 'list' }, label: 'Ver como lista' }
      : canShowGallery
        ? { route: { name: 'intro' }, label: 'Ver galería 3D' }
        : null

  // "Sobre mí": en la galería lleva a la zona 3D; en la lista, a su sección.
  const aboutHref = mode === 'gallery' ? routeToPath({ name: 'about', section: 'laboral' }, import.meta.env.BASE_URL) : '#sobre-mi'
  const inAbout = mode === 'gallery' && (route.name === 'about' || route.name === 'aboutEntry')
  // Sin la pestaña donde el nombre ya está grande: la placa de la intro y el hero de la lista.
  const nameElsewhere = mode === 'gallery' ? route.name === 'intro' : heroNameVisible
  const onAbout = (e: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false)
    if (mode !== 'gallery' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate({ name: 'about', section: 'laboral' })
  }

  const onToggle = (e: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false)
    if (!toggle || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(toggle.route)
    window.scrollTo(0, 0)
  }

  return (
    <header
      className={`site-header ${mode === 'gallery' ? 'site-header--overlay' : 'site-header--list'} ${mode === 'list' && !heroNameVisible ? 'site-header--scrolled' : ''}`}
    >
      {mode === 'list' && (
        <a className="skip-link" href="#proyectos">
          Saltar a los proyectos
        </a>
      )}
      <div className="site-header__inner">
        {/* Pestaña en la esquina, del color del marco de la galería: el rol arriba, chico, y el nombre. No está
            mientras el nombre se ve grande (la placa de la intro, el hero de la lista): baja desde arriba después. */}
        <p className={`site-header__id ${nameElsewhere ? 'site-header__id--away' : ''}`} aria-hidden={nameElsewhere || undefined}>
          <span className="site-header__name">{profile.name}</span>
          <span className="site-header__role">{profile.role}</span>
        </p>
        <div className="site-header__end">
          <nav ref={nav} className="site-nav" aria-label="Principal" onKeyDown={onKeyDown}>
            <div id={menuId} className={`site-nav__links ${menuOpen ? 'site-nav__links--open' : ''}`}>
              <a className="site-nav__link" href={aboutHref} onClick={onAbout} aria-current={inAbout ? 'page' : undefined}>
                Sobre mí
              </a>
              {/* En la lista, las secciones de la página (la galería 3D se abre desde la portada). */}
              {mode === 'list' &&
                LIST_LINKS.map((l) => (
                  <a key={l.href} className="site-nav__link" href={l.href} onClick={() => setMenuOpen(false)}>
                    {l.label}
                  </a>
                ))}
              {mode === 'gallery' && toggle && (
                <a className="site-nav__link" href={routeToPath(toggle.route, import.meta.env.BASE_URL)} onClick={onToggle}>
                  {toggle.label}
                </a>
              )}
            </div>
            <ContactMenu mode={mode} />
            {mode === 'gallery' && (
              <ul className="site-nav__social">
                {SOCIAL.map((c) => (
                  <li key={c.id}>
                    <a
                      className="site-nav__icon"
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${c.label} (se abre en una pestaña nueva)`}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path d={ICONS[c.id]} fill="currentColor" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <button
              ref={menuButton}
              type="button"
              className="site-nav__more"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label="Más opciones"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
