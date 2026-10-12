import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { Vector3 } from 'three'
import { ContactChannels } from '../components/ContactChannels'
import { contact, messageHref } from '../data/contact'
import { OPEN_BOOK_CENTER } from './deskLayout'

// Las páginas del libro abierto son HTML real: BookAnchor proyecta el centro del libro (el lomo) a la
// pantalla y le pasa al panel su posición y cuántos píxeles mide un metro (--ppm), así las dos páginas
// del panel coinciden con las del libro. En pantallas verticales el panel pasa a una tarjeta.

const a = new Vector3()
const b = new Vector3()

export function BookAnchor({ target }: { target: RefObject<HTMLElement | null> }) {
  useFrame(({ camera, size }) => {
    const el = target.current
    if (!el) return
    const [x, y, z] = OPEN_BOOK_CENTER
    a.set(x, y, z).project(camera)
    b.set(x + 1, y, z).project(camera)
    el.style.setProperty('--book-x', `${(((a.x + 1) / 2) * size.width).toFixed(1)}px`)
    el.style.setProperty('--book-y', `${(((1 - a.y) / 2) * size.height).toFixed(1)}px`)
    el.style.setProperty('--ppm', (((b.x - a.x) / 2) * size.width).toFixed(1))
  })
  return null
}

export function ContactBook({ anchorRef }: { anchorRef: RefObject<HTMLElement | null> }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus({ preventScroll: true }), [])
  return (
    <section ref={anchorRef} className="contact-book" aria-labelledby="contact-book-title">
      <h2 id="contact-book-title" ref={heading} tabIndex={-1} className="visually-hidden">
        {contact.title}
      </h2>
      <div className="contact-book__page contact-book__page--left">
        <h3 className="contact-book__title">{contact.channelsTitle}</h3>
        <p className="contact-book__text">{contact.channelsIntro}</p>
        <ContactChannels idPrefix="book" />
      </div>
      <div className="contact-book__page contact-book__page--right">
        <h3 className="contact-book__title">{contact.message.title}</h3>
        <p className="contact-book__text">{contact.message.text}</p>
        <a className="button button--primary" href={messageHref}>
          {contact.message.button}
        </a>
      </div>
    </section>
  )
}
