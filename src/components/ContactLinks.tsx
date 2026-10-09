import { profile } from '../data/profile'

interface Props {
  variant?: 'compact' | 'large'
}

export function ContactLinks({ variant = 'compact' }: Props) {
  return (
    <ul className={`contacts contacts--${variant}`} aria-label="Contacto">
      {profile.contacts.map((c) => (
        <li key={c.id}>
          <a
            className={`button ${c.id === 'cv' ? 'button--primary' : ''}`}
            href={c.href}
            {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : { download: '' })}
          >
            {c.label}
            {c.external && <span className="visually-hidden"> (se abre en una pestaña nueva)</span>}
          </a>
        </li>
      ))}
    </ul>
  )
}
