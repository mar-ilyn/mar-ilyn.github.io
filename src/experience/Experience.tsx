import { ContactShadows, Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { lazy, Suspense, useState } from 'react'
import { projects } from '../data/projects'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import { CameraRig } from './CameraRig'
import { Atmosphere } from './Atmosphere'
import { Room } from './Room'
import { FOV, INTRO_POSE } from './layout'
import { Overlays } from './Overlays'
import { beamLevel } from './beam'
import { LightBeam } from './LightBeam'
import { Pedestal } from './Pedestal'
import { detectQuality, readDeviceHints, readUrlOverrides } from './quality'
import { useMediaQuery } from './useMediaQuery'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { useStepInput } from './useStepInput'

interface Props {
  view: ViewState
}

// El postprocesado (AO, bloom, grano) va en su propio chunk: solo lo descarga la calidad alta.
const Effects = lazy(() => import('./Effects').then((m) => ({ default: m.Effects })))

function initialSettings() {
  const overrides = readUrlOverrides(window.location.search)
  return { debug: overrides.debug, quality: overrides.quality ?? detectQuality(readDeviceHints()) }
}

export default function Experience({ view }: Props) {
  const send = useViewStore((s) => s.send)
  const ready = useViewStore((s) => s.sceneReady)
  const moving = useViewStore((s) => s.cameraMoving)
  const highlighted = useViewStore((s) => s.highlighted)
  const setHighlighted = useViewStore((s) => s.setHighlighted)
  // Sin hover (pantallas táctiles): todos los pedestales con un haz suave constante.
  const noHover = useMediaQuery('(hover: none)')
  const reducedMotion = usePrefersReducedMotion()
  const [{ quality, debug }] = useState(initialSettings)
  useStepInput()

  return (
    <div
      className={`experience experience--${quality}`}
      data-view={view.name}
      data-ready={ready}
      data-moving={moving}
      data-quality={quality}
    >
      <Canvas
        className="experience__canvas"
        dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
        // ?debug dibuja todos los cuadros para que el medidor de fps sea representativo.
        frameloop={debug ? 'always' : 'demand'}
        camera={{ fov: FOV, near: 0.1, far: 60, position: [...INTRO_POSE.position] }}
        aria-hidden="true"
      >
        <Atmosphere quality={quality} />
        <Room quality={quality} />
        {/* Sombras de contacto bajo los pedestales, calculadas una sola vez (la escena es estática). */}
        <ContactShadows position={[0, 0.003, 0]} scale={[14, 5]} resolution={512} blur={2.4} opacity={0.5} far={1.6} frames={1} />
        {projects.map((p) => (
          <Pedestal
            key={p.slug}
            project={p}
            interactive={view.name === 'gallery'}
            reducedMotion={reducedMotion}
            onOpen={(slug) => send({ type: 'OPEN', slug })}
            onHover={setHighlighted}
          />
        ))}
        {projects.map((p) => (
          <LightBeam key={p.slug} position={p.pedestal} target={beamLevel(view, p.slug, highlighted, noHover)} reducedMotion={reducedMotion} />
        ))}
        <CameraRig view={view} />
        {quality === 'high' && (
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        )}
        {debug && <Stats className="debug-stats" />}
      </Canvas>
      <Overlays view={view} />
    </div>
  )
}
