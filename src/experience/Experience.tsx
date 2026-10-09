import { Environment, Lightformer } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { projects } from '../data/projects'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import { CameraRig } from './CameraRig'
import { GreyboxRoom } from './GreyboxRoom'
import { FOV, INTRO_POSE } from './layout'
import { Overlays } from './Overlays'
import { Pedestal } from './Pedestal'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { useStepInput } from './useStepInput'

interface Props {
  view: ViewState
}

export default function Experience({ view }: Props) {
  const send = useViewStore((s) => s.send)
  const ready = useViewStore((s) => s.sceneReady)
  const moving = useViewStore((s) => s.cameraMoving)
  const reducedMotion = usePrefersReducedMotion()
  useStepInput()

  return (
    <div className="experience" data-view={view.name} data-ready={ready} data-moving={moving}>
      <Canvas
        className="experience__canvas"
        dpr={[1, 2]}
        frameloop="demand"
        camera={{ fov: FOV, near: 0.1, far: 60, position: [...INTRO_POSE.position] }}
        aria-hidden="true"
      >
        <color attach="background" args={['#cfcfcf']} />
        <fog attach="fog" args={['#cfcfcf', 12, 34]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 8, 6]} intensity={1.4} />
        {/* Entorno generado en la escena (sin descargar HDR) para que el dorado tenga qué reflejar. */}
        <Environment resolution={64} frames={1} environmentIntensity={1}>
          <Lightformer intensity={3} position={[0, 4, 6]} scale={[12, 3, 1]} color="#fff4e0" />
          <Lightformer intensity={1.5} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
          <Lightformer intensity={0.6} position={[6, 1, -2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#ffe2b0" />
        </Environment>
        <GreyboxRoom />
        {projects.map((p) => (
          <Pedestal
            key={p.slug}
            project={p}
            interactive={view.name === 'gallery'}
            reducedMotion={reducedMotion}
            onOpen={(slug) => send({ type: 'OPEN', slug })}
          />
        ))}
        <CameraRig view={view} />
      </Canvas>
      <Overlays view={view} />
    </div>
  )
}
