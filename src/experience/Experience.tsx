import { Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { PROJECTS_TITLE, projects } from '../data/projects'
import { sectionOf, type ViewState } from '../state/machine'
import { useViewStore, zoneOf } from '../state/store'
import { AboutLabels, AboutLabelsAnchor } from './AboutLabels'
import { Atmosphere } from './Atmosphere'
import { beamLevel } from './beam'
import { CameraRig } from './CameraRig'
import { BookAnchor, ContactBook } from './ContactBook'
import { DevSceneExport } from './DevSceneExport'
import { IntroLabel } from './IntroLabel'
import { Lettering } from './Lettering'
import { IntroText } from './IntroText'
import { FOV, INTRO_WIDE_POSE, ROOM } from './layout'
import { LightBeam } from './LightBeam'
import { LoadingScreen } from './LoadingScreen'
import { Overlays } from './Overlays'
import { Pedestal } from './Pedestal'
import { Precompile } from './Precompile'
import { detectQuality, readDeviceHints, readUrlOverrides } from './quality'
import { Room } from './Room'
import { useMediaQuery } from './useMediaQuery'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { useStepInput } from './useStepInput'

interface Props {
  view: ViewState
}

// La zona "Sobre mí" se descarga recién cuando se llega a la galería (o se entra directo a ella).
const AboutZone = lazy(() => import('./AboutZone'))
const ABOUT_READY_VIEWS = new Set(['gallery', 'project', 'projectDetail', 'about', 'aboutEntry', 'contact', 'contactBook'])

// El escritorio de contacto, al llegar a "Sobre mí" (la zona anterior) o al entrar directo a él.
const ContactZone = lazy(() => import('./ContactZone'))
const CONTACT_READY_VIEWS = new Set(['about', 'aboutEntry', 'contact', 'contactBook'])

function initialSettings() {
  const overrides = readUrlOverrides(window.location.search)
  return {
    debug: overrides.debug,
    render: overrides.render,
    quality: overrides.render ? 'high' : (overrides.quality ?? detectQuality(readDeviceHints())),
  }
}

export default function Experience({ view }: Props) {
  const send = useViewStore((s) => s.send)
  const cameraPlaced = useViewStore((s) => s.sceneReady)
  const moving = useViewStore((s) => s.cameraMoving)
  const highlighted = useViewStore((s) => s.highlighted)
  const setHighlighted = useViewStore((s) => s.setHighlighted)
  // Sin hover (pantallas táctiles): todos los pedestales con un haz suave constante.
  const noHover = useMediaQuery('(hover: none)')
  const reducedMotion = usePrefersReducedMotion()
  const [{ quality, debug, render }] = useState(initialSettings)
  // Hasta compilar los shaders el canvas no dibuja: así el primer cuadro no congela la página.
  const [compiled, setCompiled] = useState(false)
  const onCompiled = useCallback(() => setCompiled(true), [])
  // Al entrar directo a "Sobre mí" o a Contacto, la pantalla de carga espera también a esa zona (que se
  // descarga aparte); una vez revelada la escena, no vuelve a aparecer.
  const zones = useViewStore((s) => s.zones)
  const initialZone = zoneOf(view)
  const [revealed, setRevealed] = useState(false)
  const ready = revealed || (cameraPlaced && compiled && (!initialZone || zones[initialZone]))
  if (ready && !revealed) setRevealed(true)
  const aboutRef = useRef<HTMLDivElement>(null)
  const [aboutLoaded, setAboutLoaded] = useState(false)
  if (!aboutLoaded && !render && ABOUT_READY_VIEWS.has(view.name)) setAboutLoaded(true)
  const bookRef = useRef<HTMLElement>(null)
  const [contactLoaded, setContactLoaded] = useState(false)
  if (!contactLoaded && !render && CONTACT_READY_VIEWS.has(view.name)) setContactLoaded(true)
  const aboutSection = view.name === 'about' ? view.section : view.name === 'aboutEntry' ? sectionOf(view.slug) : null
  useStepInput()

  // Con la escena lista, las zonas que se cargan aparte se descargan en segundo plano: al llegar a ellas
  // ya están (la sombra horneada del mueble y del escritorio nunca se ve sola).
  useEffect(() => {
    if (!ready || render) return
    void import('./AboutZone')
    void import('./ContactZone')
  }, [ready, render])

  const frameloop = !compiled ? 'never' : debug ? 'always' : 'demand'

  return (
    <div
      className={`experience experience--${quality} ${render ? '' : 'experience--framed'}`}
      data-view={view.name}
      data-ready={ready}
      data-moving={moving}
      data-quality={quality}
    >
      <Canvas
        className="experience__canvas"
        dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
        // ?debug dibuja todos los cuadros para que el medidor de fps sea representativo.
        frameloop={frameloop}
        camera={{
          fov: FOV,
          near: 0.1,
          far: 60,
          position: [...INTRO_WIDE_POSE.position],
        }}
        aria-hidden="true"
      >
        {/* Un solo Suspense: la escena aparece completa (texturas y entorno incluidos) y cada
            shader se compila una vez. La carga progresiva pieza por pieza recompilaba materiales. */}
        <Suspense fallback={null}>
          <Atmosphere quality={quality} />
          <Room quality={quality} bare={render === 'fondo'} />
          {/* Título de los proyectos en la pared, en el centro, sobre los pedestales. */}
          {!render && <Lettering text={PROJECTS_TITLE.toLocaleUpperCase('es')} position={[0, 2.5, ROOM.wallZ + 0.003]} size={0.27} tracking={0.16} />}
          {projects.map((p) => (
            <Pedestal
              key={p.slug}
              project={p}
              interactive={view.name === 'gallery'}
              reducedMotion={reducedMotion}
              onOpen={(slug) => send({ type: 'OPEN', slug })}
              onHover={setHighlighted}
              quality={quality}
            />
          ))}
          {!render &&
            projects.map((p) => (
              <LightBeam
                key={p.slug}
                position={p.pedestal}
                target={beamLevel(view, p.slug, highlighted, noHover)}
                reducedMotion={reducedMotion}
              />
            ))}
          <Precompile onDone={onCompiled} />
        </Suspense>
        <CameraRig view={view} holdWide={render === 'fondo'} />
        {/* Cartela de museo con el texto de la intro, en la pared. */}
        {!render && <IntroLabel quality={quality} />}
        {aboutLoaded && (
          <Suspense fallback={null}>
            <AboutZone view={view} noHover={noHover} reducedMotion={reducedMotion} quality={quality} />
            <AboutLabelsAnchor target={aboutRef} />
          </Suspense>
        )}
        {contactLoaded && (
          <Suspense fallback={null}>
            <ContactZone view={view} noHover={noHover} reducedMotion={reducedMotion} quality={quality} />
            <BookAnchor target={bookRef} />
          </Suspense>
        )}
        {debug && <Stats className="debug-stats" />}
        {import.meta.env.DEV && <DevSceneExport />}
      </Canvas>
      {/* El texto de la cartela, oculto a la vista: para lectores de pantalla y buscadores. */}
      <IntroText visible={view.name === 'intro'} />
      {aboutLoaded && <AboutLabels anchorRef={aboutRef} section={aboutSection} />}
      {view.name === 'contactBook' && <ContactBook anchorRef={bookRef} />}
      <LoadingScreen done={ready} />
      <Overlays view={view} />
    </div>
  )
}
