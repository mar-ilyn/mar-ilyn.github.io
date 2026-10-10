import { projects } from '../data/projects'
import { routeToPath } from '../state/routes'

export function ProjectList() {
  return (
    <section id="proyectos" className="works" aria-labelledby="projects-title" tabIndex={-1}>
      <div className="works__header">
        <div>
          <p className="works__eyebrow">Una selección de obras</p>
          <h2 id="projects-title">Proyectos destacados</h2>
        </div>
        <a className="works__gallery-link" href={routeToPath({ name: 'gallery' }, import.meta.env.BASE_URL)}>
          Recorrer la galería 3D <span aria-hidden="true">→</span>
        </a>
      </div>
      <ol className="works__list">
        {projects.map((p, i) => (
          <li key={p.slug} id={p.slug} className="project">
            <div className="gilt-frame">
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
            <p className="project__summary">{p.summary}</p>
            <ul className="tags" aria-label={`Tecnologías de ${p.title}`}>
              {p.stack.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="project__links">
              <a href={routeToPath({ name: 'project', slug: p.slug }, import.meta.env.BASE_URL)}>
                Ver proyecto<span className="visually-hidden"> {p.title} en la galería</span>{' '}
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
