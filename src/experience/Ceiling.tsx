import { AssetBoundary } from './AssetBoundary'
import { LIGHTMAPS } from './assets'
import { useKTX2 } from './ktx2'

interface Props {
  width: number
  depth: number
  height: number
}

const COLOR = '#f4efe5'
const BOUNCE = '#e8dfd0'

// Nada ilumina el techo de frente: la emisión imita la luz que rebota del piso y las paredes.
// La oclusión horneada modula esa emisión, así el techo se oscurece suave cerca de la pared.
function BakedCeiling({ width, depth, height }: Props) {
  const ao = useKTX2(LIGHTMAPS.ceiling)
  return (
    <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} name="ceiling">
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={COLOR} roughness={0.9} emissive={BOUNCE} emissiveIntensity={0.55} emissiveMap={ao} />
    </mesh>
  )
}

export function Ceiling(props: Props) {
  return (
    <AssetBoundary
      fallback={
        <mesh position={[0, props.height, 0]} rotation={[Math.PI / 2, 0, 0]} name="ceiling">
          <planeGeometry args={[props.width, props.depth]} />
          <meshStandardMaterial color={COLOR} roughness={0.9} emissive={BOUNCE} emissiveIntensity={0.55} />
        </mesh>
      }
    >
      <BakedCeiling {...props} />
    </AssetBoundary>
  )
}
