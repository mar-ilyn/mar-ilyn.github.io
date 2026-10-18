interface Props {
  id: string
  eyebrow: string
  title: string
  intro?: string
  // Alineado a la izquierda (con un enlace a la derecha) en lugar de centrado.
  align?: 'center' | 'start'
}

// Encabezado de sección de la vista en lista: una línea chica en mayúsculas, el título y un filete dorado
// con un rombo en el medio; debajo, opcional, una línea en itálica.
export function SectionHeading({ id, eyebrow, title, intro, align = 'center' }: Props) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <p className="section-heading__eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {align === 'center' && (
        <svg className="section-heading__rule" viewBox="0 0 160 10" aria-hidden="true">
          <path d="M0 5h70M90 5h70" stroke="currentColor" strokeWidth="0.8" />
          <path d="M80 1l4 4-4 4-4-4z" fill="currentColor" />
        </svg>
      )}
      {intro && <p className="section-heading__intro">{intro}</p>}
    </div>
  )
}
