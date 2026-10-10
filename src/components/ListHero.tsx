import { profile } from '../data/profile'

const LISTA = `${import.meta.env.BASE_URL}lista/`

// Portada de la vista en lista: la sala de la galería de fondo (render de la propia escena 3D, sin
// cuadro ni texto) y, encima, el texto en HTML y el marco tallado con su lámpara (también un render,
// con fondo transparente) con el lugar para la foto.
export function ListHero() {
  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')

  return (
    <section className="list-hero" aria-labelledby="hero-title">
      <picture className="list-hero__bg">
        <source media="(max-width: 760px)" srcSet={`${LISTA}hero-v.avif`} type="image/avif" />
        <source media="(max-width: 760px)" srcSet={`${LISTA}hero-v.webp`} type="image/webp" />
        <source srcSet={`${LISTA}hero-h.avif`} type="image/avif" />
        <img src={`${LISTA}hero-h.webp`} alt="" width={1920} height={1080} fetchPriority="high" decoding="async" />
      </picture>

      <div className="list-hero__content">
        <p className="list-hero__role">{profile.role}</p>
        <svg className="list-hero__ornament" viewBox="0 0 120 12" aria-hidden="true">
          <path d="M2 6h44M74 6h44" stroke="currentColor" strokeWidth="0.8" />
          <path
            d="M60 1c3 2 3 8 0 10-3-2-3-8 0-10Z M52 6c3-2 6-2 8 0-2 2-5 2-8 0Z M68 6c-3-2-6-2-8 0 2 2 5 2 8 0Z"
            fill="currentColor"
          />
        </svg>
        <h1 id="hero-title">{profile.name}</h1>
        <p className="list-hero__tagline">{profile.tagline}</p>
        <a className="list-hero__cta" href="#proyectos">
          Explorar proyectos <span aria-hidden="true">→</span>
        </a>
        <ul className="list-hero__stack" aria-label="Tecnologías principales">
          {profile.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </div>

      <div className="list-hero__portrait" aria-hidden="true">
        <img className="list-hero__frame" src={`${LISTA}frame.webp`} alt="" width={627} height={837} />
        <div className="list-hero__photo">
          <span>{initials}</span>
        </div>
      </div>
    </section>
  )
}
