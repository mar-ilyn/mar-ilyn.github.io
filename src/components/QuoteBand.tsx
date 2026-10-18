import { profile } from '../data/profile'

// Banda oscura con la frase del perfil, como una cita en la pared de la sala.
export function QuoteBand() {
  return (
    <section className="quote-band" aria-label="Mi forma de trabajar">
      <figure>
        <blockquote>
          <p>“{profile.tagline}”</p>
        </blockquote>
        <figcaption>
          {profile.name} · {profile.role}
        </figcaption>
      </figure>
    </section>
  )
}
