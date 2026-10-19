import { skills } from '../data/skills'
import type { SkillGroupId } from '../data/types'

// Íconos de línea de cada grupo (24 × 24): pantalla, servidores, base de datos y llave.
const GROUP_ICONS: Record<SkillGroupId, string> = {
  frontend: 'M3.5 4.5h17v11h-17zM8.5 19.5h7M12 15.5v4',
  backend: 'M4 3.5h16v5H4zM4 9.5h16v5H4zM4 15.5h16v5H4zM7.5 6h2M7.5 12h2M7.5 18h2',
  datos: 'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3',
  herramientas:
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z',
}

// Banda oscura de habilidades: a la izquierda el encabezado, una línea de presentación y el enlace a la
// experiencia; a la derecha los grupos en columnas separadas por filetes, cada uno con su ícono.
export function SkillsBand() {
  return (
    <section id="habilidades" className="skills" aria-labelledby="skills-title" tabIndex={-1}>
      <div className="skills__inner">
        <div className="skills__intro">
          <p className="skills__eyebrow">{skills.eyebrow}</p>
          <h2 id="skills-title">{skills.title}</h2>
          <p className="skills__lead">{skills.intro}</p>
          <a className="skills__more" href="#experiencia">
            Ver mi experiencia <span aria-hidden="true">→</span>
          </a>
        </div>
        <ul className="skills__groups">
          {skills.groups.map((g) => (
            <li key={g.id} className="skills__group">
              <svg className="skills__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d={GROUP_ICONS[g.id]} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 id={`skills-${g.id}`}>{g.title}</h3>
              <ul aria-labelledby={`skills-${g.id}`}>
                {g.items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
