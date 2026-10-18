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
    <svg className={`list-hero__column list-hero__column--${side}`} viewBox="0 0 190 1000" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {/* Pedestal y basa, al pie (el fuste es largo: la columna llega hasta el nav). */}
      <g transform="translate(0 200)">
        <rect x="10" y="632" width="170" height="168" fill="url(#lh-marble)" />
        <rect x="2" y="618" width="186" height="16" fill="#efe8db" />
        <rect x="2" y="632" width="186" height="3" fill="#000" fillOpacity="0.12" />
        <rect x="28" y="652" width="134" height="128" fill="none" stroke="#c9bba1" strokeWidth="2" />
        <path d="M50 690c24 6 40-4 70 8M44 740c30-10 54 6 92-2" fill="none" stroke="#bfb196" strokeOpacity="0.5" />
        <rect x="18" y="600" width="154" height="18" rx="4" fill="url(#lh-gold)" />
        <rect x="30" y="588" width="130" height="14" rx="4" fill="url(#lh-gold)" />
      </g>
      {/* Fuste estriado. */}
      <rect x="38" y="160" width="114" height="630" fill="url(#lh-shaft)" />
      <path d="M52 166V784M66 166V784M80 166V784M95 166V784M110 166V784M124 166V784M138 166V784" stroke="#b9ab92" strokeOpacity="0.45" strokeWidth="2" />
      <path d="M55 166V784M69 166V784M83 166V784M98 166V784M113 166V784M127 166V784" stroke="#fff" strokeOpacity="0.5" />
      {/* Capitel dorado: campana con hojas, volutas y ábaco. */}
      <path d="M40 160 30 106H160L150 160Z" fill="url(#lh-gold)" />
      <path d="M58 158c-5-16 2-32 15-40M95 158V110M132 158c5-16-2-32-15-40" fill="none" stroke="#6e4f20" strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="32" cy="102" r="15" fill="url(#lh-gold)" stroke="#6e4f20" strokeOpacity="0.5" />
      <circle cx="158" cy="102" r="15" fill="url(#lh-gold)" stroke="#6e4f20" strokeOpacity="0.5" />
      <circle cx="32" cy="102" r="5" fill="#6e4f20" fillOpacity="0.5" />
      <circle cx="158" cy="102" r="5" fill="#6e4f20" fillOpacity="0.5" />
      <rect x="6" y="76" width="178" height="18" fill="#f3ede1" />
      <rect x="6" y="92" width="178" height="3" fill="#000" fillOpacity="0.14" />
    </svg>
  )
}

// Portada de la vista en lista: la sala de la intro, plana. Pared marfil con cornisa y zócalo, columnas a
// los costados (hasta el nav), el panel dorado con la placa (el texto, en HTML) y el cuadro: una moldura
// dorada fina con biseles y un filete interno, sin adornos, con la foto (por ahora, las iniciales).
export function ListHero({ canShowGallery }: { canShowGallery: boolean }) {
  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
  return (
    <section className="list-hero" aria-labelledby="hero-title">
      <ColumnDefs />
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
