import { profile } from '../data/profile'
import { useViewStore } from '../state/store'

// El texto de la intro en HTML: en horizontal está impreso en la cartela de la pared (IntroLabel) y acá
// queda oculto a la vista, para lectores de pantalla y buscadores (los botones van en la capa de abajo);
// en vertical es una tarjeta.

interface IntroTextProps {
  visible: boolean
  // El texto está impreso en la cartela 3D: el HTML queda oculto a la vista.
  label: boolean
}

export function IntroActions({ visible = true }: { visible?: boolean }) {
  const send = useViewStore((s) => s.send)
  return (
    <div className="intro-text__actions">
      <button type="button" className="intro-text__cta" onClick={() => send({ type: 'STEP_DOWN' })} tabIndex={visible ? 0 : -1}>
        Explorar proyectos <span aria-hidden="true">→</span>
      </button>
      <button type="button" className="intro-text__skip" onClick={() => send({ type: 'SKIP_INTRO' })} tabIndex={visible ? 0 : -1}>
        Saltar intro
      </button>
    </div>
  )
}

export function IntroText({ visible, label }: IntroTextProps) {
  return (
    <section className={`intro-text ${label ? 'intro-text--label' : ''} ${visible ? '' : 'intro-text--hidden'}`} aria-labelledby="intro-name" aria-hidden={!visible}>
      <p className="intro-text__role">{profile.role}</p>
      <svg className="intro-text__ornament" viewBox="0 0 120 12" aria-hidden="true">
        <path d="M2 6h44M74 6h44" stroke="currentColor" strokeWidth="0.8" />
        <path d="M60 1c3 2 3 8 0 10-3-2-3-8 0-10Z M52 6c3-2 6-2 8 0-2 2-5 2-8 0Z M68 6c-3-2-6-2-8 0 2 2 5 2 8 0Z" fill="currentColor" />
      </svg>
      <h1 id="intro-name" className="intro-text__name">
        {profile.name}
      </h1>
      <p className="intro-text__tagline">{profile.tagline}</p>
      {!label && <IntroActions visible={visible} />}
      <ul className="intro-text__stack" aria-label="Tecnologías principales">
        {profile.stack.map((tech) => (
          <li key={tech}>{tech}</li>
        ))}
      </ul>
    </section>
  )
}
