import { projects } from '../data/projects'
import { routeToPath } from '../state/routes'
import { SectionHeading } from './SectionHeading'

// Marco barroco de los proyectos, dibujado como un grabado: relleno ocre, trazo de tinta marrón y rayado de
// sombra. Se define un cuarto (arriba a la izquierda, en un cuadro de 400 × 320 con el hueco de 44 a 356 por
// 44 a 276) y cada marco lo repite espejado en las otras tres esquinas, así queda simétrico. Va una sola vez
// en la página.
const INK = '#4a2a12'
const OCHRE = '#d6a35b'
const OCHRE_DEEP = '#b5803d'
const OCHRE_LIGHT = '#e8c27e'

function FrameDefs() {
  return (
    <svg className="works__defs" aria-hidden="true">
      <defs>
        <g id="pf-quarter" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
          {/* Cuerpo del marco: el relleno llega a los ejes de simetría, pero el contorno no (sobre los ejes
              no debe verse una costura). El borde de afuera ondula. */}
          <path
            d="M200 9C184 14 168 8 150 9C122 10 104 16 84 13C66 10 56 4 40 7C22 10 10 20 9 36C8 50 15 58 12 72C9 88 6 104 9 120C11 134 16 144 13 160H44V44H200Z"
            fill={OCHRE}
            stroke="none"
          />
          <path
            d="M200 9C184 14 168 8 150 9C122 10 104 16 84 13C66 10 56 4 40 7C22 10 10 20 9 36C8 50 15 58 12 72C9 88 6 104 9 120C11 134 16 144 13 160"
            fill="none"
            strokeWidth="2.6"
          />
          {/* Moldura interior: dos filetes junto al hueco, con una banda en sombra entre ellos. */}
          <path d="M200 40.5H40.5V160" fill="none" stroke={OCHRE_DEEP} strokeWidth="5" />
          <path d="M200 44H44V160" fill="none" strokeWidth="2.4" />
          <path d="M200 36H36V160" fill="none" strokeWidth="1.4" />
          <path d="M60 33h120M33 60v84" fill="none" strokeWidth="0.9" strokeOpacity="0.45" strokeDasharray="1 4" />
          {/* Lóbulo alargado del travesaño de arriba, con su nervio y su rayado. */}
          <path d="M78 30C86 14 116 10 148 13C162 15 172 20 176 28C156 23 116 22 78 30Z" fill={OCHRE_LIGHT} strokeWidth="2" />
          <path d="M90 27C110 21 140 19 164 23" fill="none" strokeWidth="1.2" strokeOpacity="0.7" />
          <path d="M100 24l4-7M111 22l4-7M122 21l3-7M133 20l3-6M144 20l2-6M155 21l1-5" fill="none" strokeWidth="1" strokeOpacity="0.55" />
          {/* Rizo del travesaño, junto a la esquina. */}
          <path d="M78 30C70 32 62 28 62 20C62 12 70 8 76 12C82 16 80 24 74 23" fill={OCHRE_LIGHT} strokeWidth="2.1" />
          <path d="M66 22c1 3 4 5 7 5" fill="none" strokeWidth="1" strokeOpacity="0.6" />
          {/* Lóbulo alargado del costado, con su rizo abajo. */}
          <path d="M30 70C14 82 14 112 26 132C32 114 33 90 30 70Z" fill={OCHRE_LIGHT} strokeWidth="2" />
          <path d="M26 82C21 98 21 112 25 124" fill="none" strokeWidth="1.2" strokeOpacity="0.7" />
          <path d="M22 92l-6 3M21 102l-6 2M21 112l-6 1M22 122l-5 0" fill="none" strokeWidth="1" strokeOpacity="0.55" />
          <path d="M30 70C32 62 28 54 20 54C12 54 8 62 12 68C16 74 24 72 23 66" fill={OCHRE_LIGHT} strokeWidth="2.1" />
          {/* Voluta de la esquina: un rizo grande que sobresale del borde, con su rayado. */}
          <path d="M44 46C24 52 2 42 4 22C6 4 30 -2 40 12C46 22 40 34 28 32C20 30 20 20 27 19C31 19 33 23 31 26" fill={OCHRE_LIGHT} strokeWidth="2.5" />
          <path d="M12 34c4 8 12 12 22 13M14 14c-4 4-5 10-3 16M24 6c-4 1-7 3-9 6" fill="none" strokeWidth="1" strokeOpacity="0.55" />
          {/* Media cartela del centro de arriba: tres hojas de acanto que se abren desde el eje, sin contorno sobre él. */}
          <path d="M200 0C192 0 184 6 184 14C178 8 168 10 166 18C160 16 152 20 154 28C162 28 168 30 172 36C180 34 190 38 200 46Z" fill={OCHRE_LIGHT} stroke="none" />
          <path d="M200 0C192 0 184 6 184 14C178 8 168 10 166 18C160 16 152 20 154 28C162 28 168 30 172 36C180 34 190 38 200 46" fill="none" strokeWidth="2.2" />
          <path d="M200 10C194 12 190 18 192 28M184 16C182 22 184 28 190 32M168 22C168 26 172 30 178 32" fill="none" strokeWidth="1.3" />
          <path d="M196 34c-2-4-2-8 0-12M160 24c3 1 6 3 8 6" fill="none" strokeWidth="1" strokeOpacity="0.6" />
          {/* Medio adorno del centro del costado: una concha con dos rizos, sin contorno sobre el eje. */}
          <path d="M44 160H6C4 150 8 138 18 134C22 126 32 126 34 134C40 138 44 148 44 160Z" fill={OCHRE_LIGHT} stroke="none" />
          <path d="M6 160C4 150 8 138 18 134C22 126 32 126 34 134C40 138 44 148 44 160" fill="none" strokeWidth="2.2" />
          <path d="M14 158c2-8 8-14 16-14M22 159c2-5 6-8 12-8M18 134c2 4 6 6 10 6" fill="none" strokeWidth="1.1" strokeOpacity="0.65" />
          <path d="M18 134C14 128 18 122 24 124" fill="none" strokeWidth="1.6" />
        </g>
      </defs>
    </svg>
  )
}

// Proyectos en la vista en lista: columnas separadas por filetes, como las obras de una sala. Cada una con
// su imagen en un marco barroco dibujado a mano; debajo el título, el año y el rol, el resumen, las tecnologías como
// etiquetas y "Ver proyecto".
export function ProjectList() {
  return (
    <section id="proyectos" className="band works" aria-labelledby="projects-title" tabIndex={-1}>
      <FrameDefs />
      <div className="works__header">
        <SectionHeading id="projects-title" eyebrow="Obras seleccionadas" title="Proyectos" align="start" />
        <a className="small-caps-link" href={routeToPath({ name: 'gallery' }, import.meta.env.BASE_URL)}>
          Recorrer la galería 3D <span aria-hidden="true">→</span>
        </a>
      </div>
      <ol className="works__list">
        {projects.map((p, i) => (
          <li key={p.slug} id={p.slug} className="project">
            <div className="project__frame">
              <img
                className="project__image"
                src={p.image.src}
                alt={p.image.alt}
                width={p.image.width}
                height={p.image.height}
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <svg className="project__carving" viewBox="0 0 400 320" aria-hidden="true">
                <use href="#pf-quarter" />
                <use href="#pf-quarter" transform="matrix(-1 0 0 1 400 0)" />
                <use href="#pf-quarter" transform="matrix(1 0 0 -1 0 320)" />
                <use href="#pf-quarter" transform="matrix(-1 0 0 -1 400 320)" />
              </svg>
            </div>
            <h3>{p.title}</h3>
            <p className="project__meta">
              {p.year} · {p.role}
            </p>
            <p className="project__summary">{p.summary}</p>
            <ul className="project__tags" aria-label={`Tecnologías de ${p.title}`}>
              {p.stack.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="project__links">
              <a href={routeToPath({ name: 'project', slug: p.slug }, import.meta.env.BASE_URL)}>
                Ver proyecto<span className="visually-hidden"> {p.title} en la galería</span>
                <span aria-hidden="true">→</span>
              </a>
              {p.links.demo && (
                <a href={p.links.demo} target="_blank" rel="noopener noreferrer">
                  Demo<span className="visually-hidden"> de {p.title}</span>
                </a>
              )}
              {p.links.repo && (
                <a href={p.links.repo} target="_blank" rel="noopener noreferrer">
                  Código<span className="visually-hidden"> de {p.title}</span>
                </a>
              )}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
