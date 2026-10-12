import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import { Vector3 } from 'three'
import { profile } from '../data/profile'
import { useViewStore } from '../state/store'
import { INTRO_LAYOUT, INTRO_X, ROOM } from './layout'

// El texto de la intro es HTML real (accesible, nítido, traducible), anclado a la pared:
// IntroAnchor proyecta el panel a la pantalla y le pasa al bloque su posición y cuántos píxeles
// mide un metro (--ppm), así la tipografía escala como si estuviera pintada en la pared.

const TEXT_TOP_Y = INTRO_LAYOUT.textTop
const a = new Vector3()
const b = new Vector3()

export function IntroAnchor({ target }: { target: RefObject<HTMLDivElement | null> }) {
  useFrame(({ camera, size }) => {
    const el = target.current
    if (!el) return
    const x = INTRO_X + INTRO_LAYOUT.textLeft
    const z = ROOM.wallZ + 0.02
    a.set(x, TEXT_TOP_Y, z).project(camera)
    b.set(x + 1, TEXT_TOP_Y, z).project(camera)
    const ax = ((a.x + 1) / 2) * size.width
    const ay = ((1 - a.y) / 2) * size.height
    const ppm = ((b.x - a.x) / 2) * size.width
    el.style.setProperty('--intro-x', `${ax.toFixed(1)}px`)
    el.style.setProperty('--intro-y', `${ay.toFixed(1)}px`)
    el.style.setProperty('--ppm', ppm.toFixed(2))
  })
  return null
}

interface IntroTextProps {
  anchorRef: RefObject<HTMLDivElement | null>
  visible: boolean
  // El nombre se ve en letras 3D sobre la pared (IntroName): el h1 queda transparente, en su lugar.
  name3d: boolean
}

export function IntroText({ anchorRef, visible, name3d }: IntroTextProps) {
  const send = useViewStore((s) => s.send)
  return (
    <section ref={anchorRef} className={`intro-text ${visible ? '' : 'intro-text--hidden'}`} aria-labelledby="intro-name" aria-hidden={!visible}>
      <p className="intro-text__role">{profile.role}</p>
      <svg className="intro-text__ornament" viewBox="0 0 120 12" aria-hidden="true">
        <path d="M2 6h44M74 6h44" stroke="currentColor" strokeWidth="0.8" />
        <path d="M60 1c3 2 3 8 0 10-3-2-3-8 0-10Z M52 6c3-2 6-2 8 0-2 2-5 2-8 0Z M68 6c-3-2-6-2-8 0 2 2 5 2 8 0Z" fill="currentColor" />
      </svg>
      <h1 id="intro-name" className={`intro-text__name ${name3d ? 'intro-text__name--3d' : ''}`}>
        {profile.name}
      </h1>
      <p className="intro-text__tagline">{profile.tagline}</p>
      <div className="intro-text__actions">
        <button type="button" className="intro-text__cta" onClick={() => send({ type: 'STEP_DOWN' })} tabIndex={visible ? 0 : -1}>
          Explorar proyectos <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="intro-text__skip" onClick={() => send({ type: 'SKIP_INTRO' })} tabIndex={visible ? 0 : -1}>
          Saltar intro
        </button>
      </div>
      <ul className="intro-text__stack" aria-label="Tecnologías principales">
        {profile.stack.map((tech) => (
          <li key={tech}>{tech}</li>
        ))}
      </ul>
    </section>
  )
}
