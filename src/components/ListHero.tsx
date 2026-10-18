import { listWithY } from '../data/format'
import { profile } from '../data/profile'
import { routeToPath } from '../state/routes'

const YEAR = new Date().getFullYear()

// Degradados de las columnas, una sola vez en la página (las dos columnas los usan).
function ColumnDefs() {
  return (
    <svg className="list-hero__defs" aria-hidden="true">
      <defs>
        <linearGradient id="lh-shaft" x1="0" x2="1">
          <stop offset="0" stopColor="#fbf7ef" />
          <stop offset="0.4" stopColor="#efe7d8" />
          <stop offset="1" stopColor="#cfc3ad" />
        </linearGradient>
        <linearGradient id="lh-gold" x1="0" x2="1">
          <stop offset="0" stopColor="#f1d390" />
          <stop offset="0.45" stopColor="#c39441" />
          <stop offset="1" stopColor="#7d5a25" />
        </linearGradient>
        <linearGradient id="lh-marble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f1e7" />
          <stop offset="0.6" stopColor="#e6ddcc" />
          <stop offset="1" stopColor="#cdbfa6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Columna de la sala, plana: pedestal de mármol, basa y capitel dorados, fuste estriado con luz a la
// izquierda. La sombra sobre la pared se la da el CSS (drop-shadow).
function Column({ side }: { side: 'left' | 'right' }) {
  return (
    <svg className={`list-hero__column list-hero__column--${side}`} viewBox="0 0 140 800" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {/* Pedestal. */}
      <rect x="8" y="632" width="124" height="168" fill="url(#lh-marble)" />
      <rect x="2" y="618" width="136" height="16" fill="#efe8db" />
      <rect x="2" y="632" width="136" height="3" fill="#000" fillOpacity="0.12" />
      <rect x="22" y="652" width="96" height="128" fill="none" stroke="#c9bba1" strokeWidth="2" />
      <path d="M40 690c18 6 30-4 52 8M34 740c22-10 40 6 66-2" fill="none" stroke="#bfb196" strokeOpacity="0.5" />
      {/* Basa dorada. */}
      <rect x="14" y="600" width="112" height="18" rx="4" fill="url(#lh-gold)" />
      <rect x="22" y="588" width="96" height="14" rx="4" fill="url(#lh-gold)" />
      {/* Fuste estriado. */}
      <rect x="28" y="160" width="84" height="430" fill="url(#lh-shaft)" />
      <path d="M40 166V584M52 166V584M64 166V584M76 166V584M88 166V584M100 166V584" stroke="#b9ab92" strokeOpacity="0.45" strokeWidth="2" />
      <path d="M43 166V584M55 166V584M67 166V584M79 166V584M91 166V584" stroke="#fff" strokeOpacity="0.5" />
      {/* Capitel dorado: campana con hojas, volutas y ábaco. */}
      <path d="M30 160 22 108H118L110 160Z" fill="url(#lh-gold)" />
      <path d="M44 158c-4-16 2-30 12-38M70 158V112M96 158c4-16-2-30-12-38" fill="none" stroke="#6e4f20" strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="24" cy="104" r="12" fill="url(#lh-gold)" stroke="#6e4f20" strokeOpacity="0.5" />
      <circle cx="116" cy="104" r="12" fill="url(#lh-gold)" stroke="#6e4f20" strokeOpacity="0.5" />
      <circle cx="24" cy="104" r="4" fill="#6e4f20" fillOpacity="0.5" />
      <circle cx="116" cy="104" r="4" fill="#6e4f20" fillOpacity="0.5" />
      <rect x="6" y="80" width="128" height="16" fill="#f3ede1" />
      <rect x="6" y="94" width="128" height="3" fill="#000" fillOpacity="0.14" />
    </svg>
  )
}

// Portada de la vista en lista: la sala de la intro, plana. Pared marfil con cornisa y zócalo, columnas a
// los costados, el panel dorado con la placa (el texto, en HTML) y un cuadro simple con su lámpara.
export function ListHero({ canShowGallery }: { canShowGallery: boolean }) {
  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
  return (
    <section className="list-hero" aria-labelledby="hero-title">
      <ColumnDefs />
      <div className="list-hero__floor" aria-hidden="true" />
      <Column side="left" />
      <Column side="right" />
      <div className="list-hero__panel">
        <div className="list-hero__plaque">
          <div className="list-hero__plaque-face">
            <h1 id="hero-title">{profile.name}</h1>
            <p className="list-hero__role">{profile.role}</p>
            <p className="list-hero__title">
              <strong>{profile.label.title}</strong> {YEAR}
            </p>
            <p className="list-hero__stack">{listWithY(profile.stack)}</p>
            <p className="list-hero__tagline">{profile.tagline}</p>
          </div>
        </div>
        <div className="list-hero__portrait" aria-hidden="true">
          <span className="list-hero__lamp" />
          <span className="list-hero__frame">
            <span className="list-hero__canvas">{initials}</span>
          </span>
        </div>
      </div>
      <div className="list-hero__actions">
        <a className="cta cta--dark" href="#proyectos">
          Ver proyectos
        </a>
        {canShowGallery && (
          <a className="cta cta--paper" href={routeToPath({ name: 'intro' }, import.meta.env.BASE_URL)}>
            Recorrer la galería 3D
          </a>
        )}
      </div>
    </section>
  )
}
