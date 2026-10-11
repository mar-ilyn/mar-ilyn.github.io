import { Stats } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useRef, useState } from 'react'
import { projects } from '../data/projects'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import { Atmosphere } from './Atmosphere'
import { beamLevel } from './beam'
import { CameraRig } from './CameraRig'
import { DevSceneExport } from './DevSceneExport'
import { IntroAnchor, IntroText } from './IntroText'
import { FOV, INTRO_WIDE_POSE } from './layout'
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
  const ready = cameraPlaced && compiled
  const introRef = useRef<HTMLDivElement>(null)
  useStepInput()

  const frameloop = !compiled ? 'never' : debug ? 'always' : 'demand'

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
        <IntroAnchor target={introRef} />
        {debug && <Stats className="debug-stats" />}
        {import.meta.env.DEV && <DevSceneExport />}
      </Canvas>
      {/* El texto aparece cuando la cámara termina de acercarse y se va al empezar a alejarse. */}
      <IntroText anchorRef={introRef} visible={view.name === 'intro' && ready && !moving} />
      <LoadingScreen done={ready} />
      <Overlays view={view} />
    </div>
  )
}
