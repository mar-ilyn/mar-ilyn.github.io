import { projects } from '../data/projects'
import { routeToPath } from '../state/routes'
import { SectionHeading } from './SectionHeading'

// Adornos de los marcos, una sola vez en la página: la esquina tallada (arriba a la izquierda; las otras
// tres se espejan) y la crestería del centro de cada lado, con su dorado.
function FrameOrnaments() {
  return (
    <svg className="works__defs" aria-hidden="true">
      <defs>
        <linearGradient id="pf-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d996" />
          <stop offset="0.45" stopColor="#b8893d" />
          <stop offset="1" stopColor="#7d5a25" />
        </linearGradient>
        <symbol id="pf-corner" viewBox="0 0 48 48">
          <path d="M3 3h20c6 0 9 4 6 8-4 5-12 3-12-3 0-3 3-4 5-3M3 3v20c0 6 4 9 8 6 5-4 3-12-3-12-3 0-4 3-3 5" fill="none" stroke="#5e4219" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M10 10c7-3 16-1 20 7-7 1-14-1-20-7Zm0 0c-3 7-1 16 7 20 1-7-1-14-7-20Z" fill="url(#pf-gold)" stroke="#5e4219" strokeWidth="1.2" />
          <circle cx="9" cy="9" r="4.5" fill="url(#pf-gold)" stroke="#5e4219" strokeWidth="1.2" />
          <path d="M30 17c5 0 8 2 10 5M17 30c0 5 2 8 5 10" fill="none" stroke="#5e4219" strokeWidth="1.6" strokeLinecap="round" />
        </symbol>
        <symbol id="pf-crest" viewBox="0 0 72 24">
          <path d="M36 2c6 0 8 7 15 7 5 0 9-4 15-2-3 4-7 10-15 10-7 0-9 4-15 4s-8-4-15-4C13 17 9 11 6 7c6-2 10 2 15 2 7 0 9-7 15-7Z" fill="url(#pf-gold)" stroke="#5e4219" strokeWidth="1.3" />
          <path d="M24 12c4-3 8-3 12 0 4-3 8-3 12 0" fill="none" stroke="#5e4219" strokeWidth="1.3" strokeLinecap="round" />
          <ellipse cx="36" cy="10" rx="4" ry="5" fill="#f3d996" stroke="#5e4219" strokeWidth="1.3" />
        </symbol>
      </defs>
    </svg>
  )
}

const ORNAMENTS = [
  ['pf-corner', 'tl'],
  ['pf-corner', 'tr'],
  ['pf-corner', 'bl'],
  ['pf-corner', 'br'],
  ['pf-crest', 'top'],
  ['pf-crest', 'bottom'],
] as const

// Proyectos en la vista en lista: columnas separadas por filetes, como las obras de una sala. Cada una con
// su imagen en un marco dorado tallado; debajo el título, el año y el rol, el resumen, las tecnologías como
// etiquetas y "Ver proyecto".
export function ProjectList() {
  return (
    <section id="proyectos" className="band works" aria-labelledby="projects-title" tabIndex={-1}>
      <FrameOrnaments />
      <div className="works__header">
        <SectionHeading id="projects-title" eyebrow="Obras seleccionadas" title="Proyectos" align="start" />
        <a className="small-caps-link" href={routeToPath({ name: 'gallery' }, import.meta.env.BASE_URL)}>
          Recorrer la galería 3D <span aria-hidden="true">→</span>
        </a>
      </div>
      <ol className="works__list">
        {projects.map((p, i) => (
          <li key={p.slug} id={p.slug} className="project">
            <div className="project__frame">
              {ORNAMENTS.map(([id, pos]) => (
                <svg key={pos} className={`project__orn project__orn--${pos}`} aria-hidden="true">
                  <use href={`#${id}`} />
                </svg>
              ))}
              <img
                className="project__image"
                src={p.image.src}
                alt={p.image.alt}
                width={p.image.width}
                height={p.image.height}
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
            <h3>{p.title}</h3>
            <p className="project__meta">
              {p.year} · {p.role}
            </p>
            <p className="project__summary">{p.summary}</p>
            <ul className="project__tags" aria-label={`Tecnologías de ${p.title}`}>
              {p.stack.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="project__links">
              <a href={routeToPath({ name: 'project', slug: p.slug }, import.meta.env.BASE_URL)}>
                Ver proyecto<span className="visually-hidden"> {p.title} en la galería</span>
                <span aria-hidden="true">→</span>
              </a>
              {p.links.demo && (
                <a href={p.links.demo} target="_blank" rel="noopener noreferrer">
                  Demo<span className="visually-hidden"> de {p.title}</span>
                </a>
              )}
              {p.links.repo && (
                <a href={p.links.repo} target="_blank" rel="noopener noreferrer">
                  Código<span className="visually-hidden"> de {p.title}</span>
                </a>
              )}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
