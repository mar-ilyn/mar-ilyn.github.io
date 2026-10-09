import { projects } from '../data/projects'

export function ProjectList() {
  return (
    <section id="proyectos" className="projects" aria-labelledby="projects-title" tabIndex={-1}>
      <h2 id="projects-title">Proyectos</h2>
      <ol className="projects__list">
        {projects.map((p, i) => (
          <li key={p.slug} id={p.slug} className="project">
            <img
              className="project__image"
              src={p.image.src}
              alt={p.image.alt}
              width={p.image.width}
              height={p.image.height}
              loading={i < 2 ? 'eager' : 'lazy'}
              decoding="async"
            />
            <div className="project__body">
              <p className="project__meta">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span>{p.year}</span>
                <span>{p.role}</span>
              </p>
              <h3>{p.title}</h3>
              <p className="project__summary">{p.summary}</p>
              {p.details.map((d) => (
                <p key={d} className="project__detail">
                  {d}
                </p>
              ))}
              <ul className="tags" aria-label={`Tecnologías de ${p.title}`}>
                {p.stack.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              {(p.links.demo || p.links.repo) && (
                <p className="project__links">
                  {p.links.demo && (
                    <a href={p.links.demo} target="_blank" rel="noopener noreferrer">
                      Ver demo<span className="visually-hidden"> de {p.title}</span>
                    </a>
                  )}
                  {p.links.repo && (
                    <a href={p.links.repo} target="_blank" rel="noopener noreferrer">
                      Ver código<span className="visually-hidden"> de {p.title}</span>
                    </a>
                  )}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
