import { roman } from '../data/principles'
import { entriesOf, formatRange, KIND_LABEL, type Row } from '../data/timeline'
import { SectionHeading } from './SectionHeading'

interface Props {
  row: Row
  // Ancla de la sección (la de experiencia es #sobre-mi, adonde lleva "Sobre mí" del header).
  id: string
  eyebrow: string
  title: string
}

// Experiencia o estudios en la vista en lista: una lista numerada, como las exposiciones de un museo.
// Cada entrada tiene su número romano, el título, la organización en itálica, las fechas y el texto.
export function TimelineSection({ row, id, eyebrow, title }: Props) {
  const titleId = `${id}-title`
  return (
    <section id={id} className="band timeline" aria-labelledby={titleId} tabIndex={-1}>
      <SectionHeading id={titleId} eyebrow={eyebrow} title={title} />
      <ol className="timeline__list">
        {entriesOf(row).map((e, i) => (
          <li key={e.slug} className="timeline__item">
            <span className="timeline__numeral" aria-hidden="true">
              {roman(i + 1)}
            </span>
            <div>
              <h3>{e.title}</h3>
              <p className="timeline__org">{e.organization}</p>
              <p className="timeline__meta">
                {e.start ? <time>{formatRange(e)}</time> : null}
                <span>{KIND_LABEL[e.kind]}</span>
              </p>
              <p className="timeline__desc">{e.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
