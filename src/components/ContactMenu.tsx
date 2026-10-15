import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { contact, messageHref } from '../data/contact'
import { routeToPath } from '../state/routes'
import { useViewStore } from '../state/store'
import { ContactChannels } from './ContactChannels'

interface Props {
  mode: 'gallery' | 'list'
}

// Botón de contacto fijo en el header, en todas las zonas y también en la vista en lista: abre un panel
// HTML con los canales (sin depender de la escena 3D) y un acceso al escritorio de contacto.
export function ContactMenu({ mode }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const navigate = useViewStore((s) => s.navigate)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // Esc cierra el panel y no llega a la escena (ahí Esc retrocede un nivel).
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !open) return
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    setOpen(false)
    toggle.current?.focus()
  }

  const deskHref = mode === 'gallery' ? routeToPath({ name: 'contact' }, import.meta.env.BASE_URL) : '#contacto'
  const onDesk = (e: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false)
    if (mode !== 'gallery' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate({ name: 'contact' })
  }

  return (
    <div className="contact-menu" ref={root} onKeyDown={onKeyDown}>
      <button
        ref={toggle}
        type="button"
        className="site-nav__link contact-menu__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        {contact.title}
      </button>
      <div id={panelId} className="contact-menu__panel" hidden={!open}>
        <ContactChannels idPrefix="menu" />
        <div className="contact-menu__actions">
          <a className="button button--primary" href={messageHref}>
            {contact.message.button}
          </a>
          <a className="site-header__toggle" href={deskHref} onClick={onDesk}>
            {mode === 'gallery' ? 'Ir al escritorio de contacto' : 'Ir a la sección Contacto'}
          </a>
        </div>
      </div>
    </div>
  )
}
