import { formatRange, KIND_LABEL, timeline } from '../data/timeline'

// "Sobre mí" en la vista en lista: la misma línea de tiempo como lista ordenada (orden cronológico).
export function TimelineList() {
  return (
    <section id="sobre-mi" className="timeline" aria-labelledby="timeline-title" tabIndex={-1}>
      <p className="works__eyebrow">Trayectoria</p>
      <h2 id="timeline-title">Sobre mí</h2>
      <ol className="timeline__list">
        {timeline.map((e) => (
          <li key={e.slug} className="timeline__item">
            <p className="timeline__meta">
              <span>{KIND_LABEL[e.kind]}</span>
              <time>{formatRange(e)}</time>
            </p>
            <h3>{e.title}</h3>
            <p className="timeline__org">{e.organization}</p>
            <p className="timeline__desc">{e.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
