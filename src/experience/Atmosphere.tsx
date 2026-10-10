import { Environment, Lightformer } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import type { Scene } from 'three'
import { AssetBoundary } from './AssetBoundary'
import { ENVIRONMENT } from './assets'
import { PrebakedEnvironmentLoader } from './prebakedEnvironment'
import { SUN_COLOR, SUN_DIRECTION } from './lighting'
import type { Quality } from './quality'

// Color de la niebla y del fondo: el marfil de la pared, para que la galería se funda a lo lejos
// sin que se vea un final.
export const AIR = '#e6dfd2'

// Entorno generado en la escena: reflejos inmediatos para el dorado mientras carga el HDRI.
function StudioEnvironment() {
  return (
    <Environment resolution={64} frames={1} environmentIntensity={1}>
      <Lightformer intensity={3} position={[0, 4, 6]} scale={[12, 3, 1]} color="#fff4e0" />
      <Lightformer intensity={1.5} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
      <Lightformer intensity={0.6} position={[6, 1, -2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#ffe2b0" />
    </Environment>
  )
}

// Reflejos del HDRI "ballroom" ya prefiltrados: se aplican sin generar nada en la GPU.
function BallroomEnvironment({ intensity }: { intensity: number }) {
  const texture = useLoader(PrebakedEnvironmentLoader, ENVIRONMENT)
  return (
    <primitive
      object={texture}
      attach={(scene: Scene) => {
        scene.environment = texture
        scene.environmentIntensity = intensity
        return () => {
          scene.environment = null
        }
      }}
    />
  )
}

interface Props {
  quality: Quality
  // Sin fondo ni niebla: para renderizar piezas sueltas con transparencia.
  transparent?: boolean
}

export function Atmosphere({ quality, transparent = false }: Props) {
  return (
    <>
      {!transparent && <color attach="background" args={[AIR]} />}
      {!transparent && <fog attach="fog" args={[AIR, 12, 34]} />}
      {/* Luz que rebota del piso: cálida pero clara, para que el techo no se tiña de marrón. */}
      <hemisphereLight args={['#fff6e8', '#d9c3a5', 0.38]} />
      {/* Sol de tarde desde la izquierda, como el horneado: luz lateral cálida y suave. */}
      <directionalLight
        position={[-SUN_DIRECTION[0] * 12, -SUN_DIRECTION[1] * 12, -SUN_DIRECTION[2] * 12]}
        intensity={0.7}
        color={SUN_COLOR}
      />
      {/* Reflejos del HDRI de un salón de baile (Poly Haven, CC0), prefiltrados en el build.
          Si no cargan, se usa el entorno generado en la escena. */}
      <AssetBoundary fallback={<StudioEnvironment />}>
        <BallroomEnvironment intensity={quality === 'high' ? 0.7 : 0.62} />
      </AssetBoundary>
    </>
  )
}
