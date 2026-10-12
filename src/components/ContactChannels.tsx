import { useEffect, useRef, useState } from 'react'
import { contact } from '../data/contact'

interface Props {
  // Prefijo para ids únicos cuando la lista aparece más de una vez en la página.
  idPrefix: string
}

// Canales de contacto (mail, LinkedIn, GitHub), cada uno con su botón "Copiar". La confirmación se
// anuncia en una región aria-live y se borra sola a los pocos segundos.
export function ContactChannels({ idPrefix }: Props) {
  const [status, setStatus] = useState('')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async (label: string, value: string) => {
    window.clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(value)
      setStatus(contact.copy.done(label))
    } catch {
      setStatus(contact.copy.failed)
    }
    timer.current = window.setTimeout(() => setStatus(''), 4000)
  }

  return (
    <div className="channels">
      <ul className="channels__list">
        {contact.channels.map((c) => (
          <li key={c.id} className="channels__item">
            <span className="channels__label" id={`${idPrefix}-${c.id}`}>
              {c.label}
            </span>
            <a
              className="channels__link"
              href={c.href}
              aria-describedby={`${idPrefix}-${c.id}`}
              {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {c.display}
              {c.external && <span className="visually-hidden"> (se abre en una pestaña nueva)</span>}
            </a>
            <button
              type="button"
              className="channels__copy"
              aria-label={`${contact.copy.button} ${c.label}`}
              onClick={() => void copy(c.label, c.copyValue)}
            >
              {contact.copy.button}
            </button>
          </li>
        ))}
      </ul>
      <p className="channels__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  )
}
