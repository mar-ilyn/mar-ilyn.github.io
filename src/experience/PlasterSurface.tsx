import { useKTX2 } from '@react-three/drei'
import { useMemo } from 'react'
import { Vector2 } from 'three'
import { AssetBoundary } from './AssetBoundary'
import { BASIS_PATH, LIGHTMAPS, TEXTURES, tile } from './assets'
import { ivory } from './ornament'

interface Props {
  width: number
  height: number
  position: [number, number, number]
}

const TILE_METERS = 2

function TexturedPlaster({ width, height, position }: Props) {
  const [normal, arm, ao] = useKTX2([TEXTURES.plaster.normal, TEXTURES.plaster.arm, LIGHTMAPS.wall], BASIS_PATH)
  const maps = useMemo(() => {
    for (const t of [normal, arm]) tile(t, width / TILE_METERS, height / TILE_METERS)
    return { normal, arm, ao }
  }, [normal, arm, ao, width, height])
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
        // Oclusión horneada en Blender: contacto de molduras, columnas y cornisa.
        aoMap={maps.ao}
      />
    </mesh>
  )
}

export function PlasterSurface(props: Props) {
  return (
    <AssetBoundary
      fallback={
        <mesh position={props.position} material={ivory} name="wall-fallback">
          <planeGeometry args={[props.width, props.height]} />
        </mesh>
      }
    >
      <TexturedPlaster {...props} />
    </AssetBoundary>
  )
}
