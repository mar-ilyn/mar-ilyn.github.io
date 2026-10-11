import { useEffect, useRef } from 'react'
import { getProject, projects } from '../data/projects'
import { entriesOf, formatRange, getEntry, KIND_LABEL, neighbours, SECTION_LABEL, type Row } from '../data/timeline'
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
    case 'about':
      return <AboutOverlay section={view.section} />
    case 'aboutEntry':
      return <EntryPanel slug={view.slug} />
  }
}

// Capa de botones de cada compartimento: Tab entre sus entradas (en orden cronológico), Enter abre, Esc
// vuelve a la galería; el último botón pasa al otro compartimento.
function AboutOverlay({ section }: { section: Row }) {
  const send = useViewStore((s) => s.send)
  const setHighlighted = useViewStore((s) => s.setHighlighted)
  const heading = useFocusOnMount<HTMLHeadingElement>(section)
  const other: Row = section === 'laboral' ? 'estudios' : 'laboral'
  const hint = section === 'laboral' ? 'deslizá hacia abajo para Estudios' : 'deslizá hacia arriba para Experiencia'
  return (
    <nav className="overlay overlay--gallery" aria-labelledby="about-title">
      <h2 id="about-title" ref={heading} tabIndex={-1} className="overlay__hint">
        Sobre mí · {SECTION_LABEL[section]} · {hint}
      </h2>
      <ul className="pedestal-nav">
        {entriesOf(section).map((e) => (
          <li key={e.slug}>
            <button
              type="button"
              className="pedestal-nav__button"
              onClick={() => send({ type: 'OPEN_ENTRY', slug: e.slug })}
              onFocus={() => setHighlighted(e.slug)}
              onBlur={() => setHighlighted(null)}
            >
              Abrir {e.accessibleName}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="pedestal-nav__button"
            onClick={() => send({ type: other === 'estudios' ? 'STEP_DOWN' : 'STEP_UP' })}
          >
            Ir a {SECTION_LABEL[other]}
          </button>
        </li>
      </ul>
    </nav>
  )
}

function EntryPanel({ slug }: { slug: string }) {
  const send = useViewStore((s) => s.send)
  const heading = useFocusOnMount<HTMLHeadingElement>(slug)
  const entry = getEntry(slug)
  if (!entry) return null
  const { prev, next } = neighbours(slug)

  return (
    <aside className="panel" aria-labelledby="panel-title">
      <p className="eyebrow">{KIND_LABEL[entry.kind]}</p>
      <h2 id="panel-title" ref={heading} tabIndex={-1}>
        {entry.title}
      </h2>
      <p className="panel__summary">{entry.organization}</p>
      <p className="panel__detail">{formatRange(entry)}</p>
      <p className="panel__detail">{entry.description}</p>
      <div className="panel__actions">
        <button type="button" className="button button--primary" onClick={() => send({ type: 'BACK_TO_ABOUT' })}>
          Volver a Sobre mí
        </button>
        <button
          type="button"
          className="button"
          disabled={!prev}
          aria-label={prev ? `Anterior: ${prev.title}` : 'Anterior'}
          onClick={() => prev && send({ type: 'OPEN_ENTRY', slug: prev.slug })}
        >
          ← Anterior
        </button>
        <button
          type="button"
          className="button"
          disabled={!next}
          aria-label={next ? `Siguiente: ${next.title}` : 'Siguiente'}
          onClick={() => next && send({ type: 'OPEN_ENTRY', slug: next.slug })}
        >
          Siguiente →
        </button>
      </div>
    </aside>
  )
}

function useFocusOnMount<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [key])
  return ref
}

// El texto y los botones de la intro viven en IntroText (anclados a la pared); acá solo la pista.
function IntroOverlay() {
  return (
    <div className="overlay overlay--intro-hint" aria-hidden="true">
      <p className="overlay__hint">Deslizá hacia abajo para recorrer la galería</p>
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
        Elegí un proyecto · deslizá hacia abajo para Sobre mí
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
