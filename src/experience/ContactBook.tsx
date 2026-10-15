import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Vector3 } from 'three'
import { contact, messageHref } from '../data/contact'
import { useViewStore } from '../state/store'
import { channelRects, pagePoint, writeRect, type PageSide, type Rect } from './bookPages'

// El contenido del libro abierto está impreso en las hojas (bookPages.ts). Acá van, encima y en el mismo
// lugar, las zonas clickeables (los links, "Copiar" y "Escribirme"), transparentes, y el texto oculto a la
// vista para lectores de pantalla. BookAnchor proyecta a la pantalla las esquinas de cada zona sobre la
// hoja curva, así siguen a lo impreso con la perspectiva.

const a = new Vector3()
const b = new Vector3()

export function BookAnchor({ target }: { target: RefObject<HTMLElement | null> }) {
  useFrame(({ camera, size }) => {
    const root = target.current
    if (!root) return
    for (const el of root.querySelectorAll<HTMLElement>('[data-side]')) {
      const side = el.dataset.side as PageSide
      const [x, y, w, h] = ['x', 'y', 'w', 'h'].map((k) => Number(el.dataset[k]))
      a.set(...pagePoint(side, x, y)).project(camera)
      b.set(...pagePoint(side, x + w, y + h)).project(camera)
      const left = ((a.x + 1) / 2) * size.width
      const top = ((1 - a.y) / 2) * size.height
      el.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`
      el.style.width = `${(((b.x + 1) / 2) * size.width - left).toFixed(1)}px`
      el.style.height = `${(((1 - b.y) / 2) * size.height - top).toFixed(1)}px`
    }
  })
  return null
}

// Una zona sobre una de las hojas (en metros sobre la hoja vista de frente; BookAnchor la ubica).
const at = (side: PageSide, r: Rect) => ({ 'data-side': side, 'data-x': r.x, 'data-y': r.y, 'data-w': r.width, 'data-h': r.height })

export function ContactBook({ anchorRef }: { anchorRef: RefObject<HTMLElement | null> }) {
  const heading = useRef<HTMLHeadingElement>(null)
  const setCopied = useViewStore((s) => s.setCopied)
  const [status, setStatus] = useState('')
  const timers = useRef<number[]>([])
  useEffect(() => heading.current?.focus({ preventScroll: true }), [])
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      setCopied(null)
    },
    [setCopied],
  )

  // Copia el valor y lo confirma dos veces: "Copiado" impreso en la hoja y el aviso para lectores de pantalla.
  const copy = async (id: string, label: string, value: string) => {
    timers.current.forEach((t) => window.clearTimeout(t))
    try {
      await navigator.clipboard.writeText(value)
      setCopied(id)
      setStatus(contact.copy.done(label))
    } catch {
      setStatus(contact.copy.failed)
    }
    timers.current = [window.setTimeout(() => setCopied(null), 2500), window.setTimeout(() => setStatus(''), 4000)]
  }

  return (
    <section
      ref={anchorRef}
      className="contact-book"
      aria-labelledby="contact-book-title"
    >
      <h2 id="contact-book-title" ref={heading} tabIndex={-1} className="visually-hidden">
        {contact.title}
      </h2>
      <h3 className="visually-hidden">{contact.channelsTitle}</h3>
      <p className="visually-hidden">{contact.channelsIntro}</p>
      <ul className="contact-book__channels">
        {contact.channels.map((c, i) => (
          <li key={c.id}>
            <span className="visually-hidden" id={`book-${c.id}`}>
              {c.label}
            </span>
            <a
              className="contact-book__hit"
              {...at('left', channelRects[i].value)}
              href={c.href}
              aria-describedby={`book-${c.id}`}
              {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {c.display}
              {c.external && <span className="visually-hidden"> (se abre en una pestaña nueva)</span>}
            </a>
            <button
              type="button"
              className="contact-book__hit"
              {...at('left', channelRects[i].copy)}
              aria-label={`${contact.copy.button} ${c.label}`}
              onClick={() => void copy(c.id, c.label, c.copyValue)}
            >
              {contact.copy.button}
            </button>
          </li>
        ))}
      </ul>
      <p className="visually-hidden" role="status" aria-live="polite">
        {status}
      </p>
      <h3 className="visually-hidden">{contact.message.title}</h3>
      <p className="visually-hidden">{contact.message.text}</p>
      <a className="contact-book__hit contact-book__hit--pill" {...at('right', writeRect)} href={messageHref}>
        {contact.message.button}
      </a>
    </section>
  )
}
