import { profile } from '../data/profile'
import { useViewStore } from '../state/store'

// El texto de la intro en HTML: está impreso en la cartela de la pared (IntroLabel) y acá queda oculto a
// la vista, para lectores de pantalla y buscadores. Los botones van en la capa de abajo (IntroActions).

export function IntroActions() {
  const send = useViewStore((s) => s.send)
  return (
    <div className="intro-text__actions">
      <button type="button" className="intro-text__cta" onClick={() => send({ type: 'STEP_DOWN' })}>
        Explorar proyectos <span aria-hidden="true">→</span>
      </button>
      <button type="button" className="intro-text__skip" onClick={() => send({ type: 'SKIP_INTRO' })}>
        Saltar intro
      </button>
    </div>
  )
}

export function IntroText({ visible }: { visible: boolean }) {
  return (
    <section className="intro-text" aria-labelledby="intro-name" aria-hidden={!visible}>
      <p>{profile.role}</p>
      <h1 id="intro-name">{profile.name}</h1>
      <p>{profile.tagline}</p>
      <ul aria-label="Tecnologías principales">
        {profile.stack.map((tech) => (
          <li key={tech}>{tech}</li>
        ))}
      </ul>
    </section>
  )
}
