import { useEffect, useRef } from 'react'
import { getProject, projects } from '../data/projects'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'

interface Props {
  view: ViewState
}

export function Overlays({ view }: Props) {
  switch (view.name) {
    case 'intro':
      return <IntroOverlay />
    case 'toGallery':
      return null
    case 'gallery':
      return <GalleryOverlay />
    case 'project':
    case 'plaque':
      return <ProjectPanel slug={view.slug} atPlaque={view.name === 'plaque'} />
  }
}

function useFocusOnMount<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [key])
  return ref
}

function IntroOverlay() {
  const send = useViewStore((s) => s.send)
  return (
    <div className="overlay overlay--intro">
      <p className="overlay__hint">Deslizá hacia abajo para recorrer la galería</p>
      <div className="overlay__actions">
        <button type="button" className="button button--primary" onClick={() => send({ type: 'STEP_DOWN' })}>
          Ver los proyectos
        </button>
        <button type="button" className="button button--ghost" onClick={() => send({ type: 'SKIP_INTRO' })}>
          Saltar intro
        </button>
      </div>
    </div>
  )
}

function GalleryOverlay() {
  const send = useViewStore((s) => s.send)
  const setHighlighted = useViewStore((s) => s.setHighlighted)
  const heading = useFocusOnMount<HTMLHeadingElement>('gallery')
  return (
    <nav className="overlay overlay--gallery" aria-labelledby="gallery-title">
      <h2 id="gallery-title" ref={heading} tabIndex={-1} className="overlay__hint">
        Elegí un proyecto
      </h2>
      <ul className="pedestal-nav">
        {projects.map((p) => (
          <li key={p.slug}>
            <button
              type="button"
              className="pedestal-nav__button"
              onClick={() => send({ type: 'OPEN', slug: p.slug })}
              onFocus={() => setHighlighted(p.slug)}
              onBlur={() => setHighlighted(null)}
            >
              Abrir {p.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ProjectPanel({ slug, atPlaque }: { slug: string; atPlaque: boolean }) {
  const send = useViewStore((s) => s.send)
  const heading = useFocusOnMount<HTMLHeadingElement>(`${slug}-${atPlaque}`)
  const project = getProject(slug)
  if (!project) return null

  return (
    <aside className={`panel ${atPlaque ? 'panel--plaque' : ''}`} aria-labelledby="panel-title">
      <p className="eyebrow">{atPlaque ? 'Placa' : `${project.year} · ${project.role}`}</p>
      <h2 id="panel-title" ref={heading} tabIndex={-1}>
        {project.title}
      </h2>
      <p className="panel__summary">{project.summary}</p>

      {atPlaque && (
        <>
          {project.details.map((d) => (
            <p key={d} className="panel__detail">
              {d}
            </p>
          ))}
          <ul className="tags" aria-label={`Tecnologías de ${project.title}`}>
            {project.stack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {(project.links.demo || project.links.repo) && (
            <p className="project__links">
              {project.links.demo && (
                <a href={project.links.demo} target="_blank" rel="noopener noreferrer">
                  Ver demo
                </a>
              )}
              {project.links.repo && (
                <a href={project.links.repo} target="_blank" rel="noopener noreferrer">
                  Ver código
                </a>
              )}
            </p>
          )}
        </>
      )}

      <div className="panel__actions">
        {atPlaque ? (
          <button type="button" className="button button--primary" onClick={() => send({ type: 'BACK' })}>
            Volver al proyecto
          </button>
        ) : (
          <button type="button" className="button button--primary" onClick={() => send({ type: 'MORE_INFO' })}>
            Ver más información
          </button>
        )}
        <button type="button" className="button" onClick={() => send({ type: 'BACK_TO_GALLERY' })}>
          Volver a los proyectos
        </button>
      </div>
    </aside>
  )
}
