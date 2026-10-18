import { profile } from '../data/profile'
import { routeToPath } from '../state/routes'

const YEAR = new Date().getFullYear()

// Portada de la vista en lista, plana: fondo oscuro liso, una línea chica arriba, el nombre en mayúsculas
// grandes (el apellido en dorado), la frase en itálica, dos botones y una franja con las tecnologías.
export function ListHero({ canShowGallery }: { canShowGallery: boolean }) {
  const words = profile.name.split(' ')
  const last = words.pop()
  return (
    <section className="list-hero" aria-labelledby="hero-title">
      <div className="list-hero__content">
        <p className="list-hero__eyebrow">
          {profile.role} · {profile.label.title} {YEAR}
        </p>
        <h1 id="hero-title">
          <span>{words.join(' ')}</span> <span className="list-hero__gold">{last}</span>
        </h1>
        <p className="list-hero__tagline">{profile.tagline}</p>
        <div className="list-hero__actions">
          <a className="cta cta--gold" href="#proyectos">
            Ver proyectos
          </a>
          {canShowGallery && (
            <a className="cta cta--light" href={routeToPath({ name: 'intro' }, import.meta.env.BASE_URL)}>
              Recorrer la galería 3D
            </a>
          )}
        </div>
      </div>
      <ul className="list-hero__strip" aria-label="Tecnologías principales">
        {profile.stack.map((tech) => (
          <li key={tech}>{tech}</li>
        ))}
      </ul>
    </section>
  )
}
