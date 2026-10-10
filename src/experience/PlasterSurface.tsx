import { useKTX2 } from '@react-three/drei'
import { Suspense, useMemo } from 'react'
import { Vector2 } from 'three'
import { BASIS_PATH, TEXTURES, tile } from './assets'
import { ivory } from './ornament'

interface Props {
  width: number
  height: number
  position: [number, number, number]
}

const TILE_METERS = 2

function TexturedPlaster({ width, height, position }: Props) {
  const [normal, arm] = useKTX2([TEXTURES.plaster.normal, TEXTURES.plaster.arm], BASIS_PATH)
  const maps = useMemo(() => {
    for (const t of [normal, arm]) tile(t, width / TILE_METERS, height / TILE_METERS)
    return { normal, arm }
  }, [normal, arm, width, height])
  // Relieve de yeso muy sutil: el color sigue siendo el marfil de la pared.
  const normalScale = useMemo(() => new Vector2(0.35, 0.35), [])

  return (
    <mesh position={position} name="wall">
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={ivory.color}
        normalMap={maps.normal}
        normalScale={normalScale}
        roughnessMap={maps.arm}
        aoMap={maps.arm}
        aoMapIntensity={0.6}
      />
    </mesh>
  )
}

export function PlasterSurface(props: Props) {
  return (
    <Suspense
      fallback={
        <mesh position={props.position} material={ivory} name="wall-fallback">
          <planeGeometry args={[props.width, props.height]} />
        </mesh>
      }
    >
      <TexturedPlaster {...props} />
    </Suspense>
  )
}
