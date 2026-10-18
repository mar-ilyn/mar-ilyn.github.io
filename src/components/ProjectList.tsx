import { listWithY } from '../data/format'
import { projects } from '../data/projects'
import { routeToPath } from '../state/routes'
import { SectionHeading } from './SectionHeading'

// Proyectos en la vista en lista: una grilla de obras, como la colección de un museo. Debajo de cada
// imagen, el título en versalitas, el año y el rol en itálica dorada, las tecnologías y los enlaces.
export function ProjectList() {
  return (
    <section id="proyectos" className="band works" aria-labelledby="projects-title" tabIndex={-1}>
      <div className="works__header">
        <SectionHeading id="projects-title" eyebrow="Obras seleccionadas" title="Proyectos" align="start" />
        <a className="small-caps-link" href={routeToPath({ name: 'gallery' }, import.meta.env.BASE_URL)}>
          Recorrer la galería 3D <span aria-hidden="true">→</span>
        </a>
      </div>
      <ol className="works__list">
        {projects.map((p, i) => (
          <li key={p.slug} id={p.slug} className="project">
            <img
              className="project__image"
              src={p.image.src}
              alt={p.image.alt}
              width={p.image.width}
              height={p.image.height}
              loading={i < 3 ? 'eager' : 'lazy'}
              decoding="async"
            />
            <h3>{p.title}</h3>
            <p className="project__meta">
              {p.year} · {p.role}
            </p>
            <p className="project__stack">{listWithY(p.stack)}</p>
            <p className="project__summary">{p.summary}</p>
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
