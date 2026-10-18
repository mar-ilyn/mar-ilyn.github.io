import { principles, roman } from '../data/principles'
import { profile } from '../data/profile'
import { SectionHeading } from './SectionHeading'

// Columna jónica dorada, el ícono de cada principio.
function Column() {
  return (
    <svg className="principle__icon" viewBox="0 0 32 64" aria-hidden="true">
      <path d="M2 4h28v4H2zM4 8c0 3 3 4 6 4h12c3 0 6-1 6-4" fill="currentColor" />
      <path d="M8 12h16v42H8z" fill="currentColor" opacity="0.85" />
      <path d="M11 14v38M14.5 14v38M17.5 14v38M21 14v38" stroke="#f3ead8" strokeWidth="0.8" opacity="0.45" />
      <path d="M5 54h22v4H5zM3 58h26v4H3z" fill="currentColor" />
    </svg>
  )
}

// "Cómo trabajo": tres principios en columnas, con su número romano y su lema.
export function Principles() {
  return (
    <section id="sobre-mi" className="band band--warm principles" aria-labelledby="principles-title" tabIndex={-1}>
      <SectionHeading id="principles-title" eyebrow="Cómo trabajo" title="Tres principios" intro={profile.about} />
      <ol className="principles__list">
        {principles.map((p, i) => (
          <li key={p.title} className="principle">
            <Column />
            <span className="principle__numeral" aria-hidden="true">
              {roman(i + 1)}
            </span>
            <h3>{p.title}</h3>
            <p className="principle__motto">{p.motto}</p>
            <p className="principle__text">{p.text}</p>
            <p className="principle__stack">{p.stack}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
