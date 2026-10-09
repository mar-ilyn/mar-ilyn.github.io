import { Canvas } from '@react-three/fiber'
import { projects } from '../data/projects'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import { CameraRig } from './CameraRig'
import { GreyboxRoom } from './GreyboxRoom'
import { FOV, INTRO_POSE } from './layout'
import { Overlays } from './Overlays'
import { Pedestal } from './Pedestal'
import { useStepInput } from './useStepInput'

interface Props {
  view: ViewState
}

export default function Experience({ view }: Props) {
  const send = useViewStore((s) => s.send)
  const ready = useViewStore((s) => s.sceneReady)
  useStepInput()

  return (
    <div className="experience" data-view={view.name} data-ready={ready}>
      <Canvas
        className="experience__canvas"
        dpr={[1, 2]}
        camera={{ fov: FOV, near: 0.1, far: 60, position: [...INTRO_POSE.position] }}
        aria-hidden="true"
      >
        <color attach="background" args={['#cfcfcf']} />
        <fog attach="fog" args={['#cfcfcf', 12, 34]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 8, 6]} intensity={1.4} />
        <GreyboxRoom />
        {projects.map((p) => (
          <Pedestal
            key={p.slug}
            project={p}
            interactive={view.name === 'gallery'}
            onOpen={(slug) => send({ type: 'OPEN', slug })}
          />
        ))}
        <CameraRig view={view} />
      </Canvas>
      <Overlays view={view} />
    </div>
  )
}
