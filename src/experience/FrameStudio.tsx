import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useState } from 'react'
import { Atmosphere } from './Atmosphere'
import { INTRO_LAYOUT } from './layout'
import { PictureLamp } from './PictureLamp'
import { PortraitFrame } from './PortraitFrame'
import { Precompile } from './Precompile'

// Render del marco tallado y la lámpara solos, de frente y con fondo transparente, para la vista en
// lista (scripts/render-images.mjs). El hueco del lienzo queda abierto: ahí va la foto en HTML.
// Encuadre: el marco mide 1,8 m de alto y la lámpara asoma ~0,35 m por arriba.
const FRAME_STUDIO = { width: 1.9, height: 2.4, centerY: 0.17 } as const

export default function FrameStudio() {
  const { frame } = INTRO_LAYOUT
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const distance = 12
  const fov = (2 * Math.atan(FRAME_STUDIO.height / 2 / distance) * 180) / Math.PI

  return (
    <div className="frame-studio" data-ready={ready}>
      <Canvas
        gl={{ alpha: true, preserveDrawingBuffer: true }}
        dpr={2}
        frameloop={ready ? 'demand' : 'never'}
        camera={{ fov, near: 1, far: 30, position: [0, FRAME_STUDIO.centerY, distance] }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, FRAME_STUDIO.centerY, 0)
          // Sin la sala alrededor el dorado se ve sobreexpuesto: se baja la exposición.
          gl.toneMappingExposure = 0.72
        }}
      >
        <Suspense fallback={null}>
          <Atmosphere quality="high" transparent />
          <PortraitFrame width={frame.width} height={frame.height} position={[0, 0, 0.01]} showCanvas={false} />
          <PictureLamp x={0} frameTop={frame.height / 2} frameWidth={frame.width} />
          <Precompile onDone={onReady} />
        </Suspense>
      </Canvas>
    </div>
  )
}
