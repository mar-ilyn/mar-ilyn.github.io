import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { profile } from '../data/profile'
import { routeToPath, type Route } from '../state/routes'
import { useViewStore } from '../state/store'
import { CV_URL } from '../config'
import { contact } from '../data/contact'
import { ContactMenu } from './ContactMenu'

interface Props {
  mode: 'gallery' | 'list'
  canShowGallery: boolean
}

// Header flotante: a la izquierda el nombre y el rol; a la derecha una cápsula de vidrio con la navegación
// (Sobre mí, la vista en lista o la galería, Contacto) y "Descargar CV". En pantallas angostas Contacto y
// el CV siguen a la vista y los otros links pasan a un menú que se despliega debajo.
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
    <header className={`site-header ${mode === 'gallery' ? 'site-header--overlay' : ''}`}>
      {mode === 'list' && (
        <a className="skip-link" href="#proyectos">
          Saltar a los proyectos
        </a>
      )}
      <div className="site-header__inner">
        <p className="site-header__id glass">
          <span className="site-header__name">{profile.name}</span>
          <span className="site-header__role">{profile.role}</span>
        </p>
        <nav ref={nav} className="site-nav glass" aria-label="Principal" onKeyDown={onKeyDown}>
          <div id={menuId} className={`site-nav__links ${menuOpen ? 'site-nav__links--open' : ''}`}>
            <a className="site-nav__link" href={aboutHref} onClick={onAbout} aria-current={inAbout ? 'page' : undefined}>
              Sobre mí
            </a>
            {toggle && (
              <a className="site-nav__link" href={routeToPath(toggle.route, import.meta.env.BASE_URL)} onClick={onToggle}>
                {toggle.label}
              </a>
            )}
          </div>
          <ContactMenu mode={mode} />
          <a className="site-nav__cta" href={CV_URL} download>
            <span className="site-nav__cta-label">{contact.cv.label}</span>
            <span className="site-nav__cta-short" aria-hidden="true">
              CV
            </span>
            {/* Al pasar el mouse se despliega debajo un recuadro de vidrio oscuro con la flecha de descarga. */}
            <span className="site-nav__tile" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M12 4v11M6.5 10 12 15.5 17.5 10M5 19.5h14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
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
    </header>
  )
}
