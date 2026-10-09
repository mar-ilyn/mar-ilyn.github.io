import { INTRO_LAYOUT, INTRO_X, ROOM } from './layout'
import { OrnateFrame } from './OrnateFrame'
import { PalaceWall } from './PalaceWall'

// Piso y techo siguen como volúmenes de prototipo (hito 3); la pared ya tiene su diseño de palacio.
export function GreyboxRoom() {
  const { length, depth, height, wallZ } = ROOM
  const { textLeft, frameX, frame } = INTRO_LAYOUT
  return (
    <group>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[length, 0.1, depth]} />
        <meshStandardMaterial color="#9b9b9b" />
      </mesh>
      <mesh position={[0, height + 0.05, 0]}>
        <boxGeometry args={[length, 0.1, depth]} />
        <meshStandardMaterial color="#c9c9c9" />
      </mesh>
      <PalaceWall />

      <group position={[INTRO_X, 0, wallZ]}>
        <mesh position={[textLeft + 1.0, 2.55, 0.03]} name="intro-name">
          <boxGeometry args={[2.0, 0.34, 0.04]} />
          <meshStandardMaterial color="#6f6f6f" />
        </mesh>
        <mesh position={[textLeft + 0.6, 2.15, 0.02]} name="intro-role">
          <boxGeometry args={[1.2, 0.12, 0.02]} />
          <meshStandardMaterial color="#8a8a8a" />
        </mesh>
        <mesh position={[textLeft + 0.8, 1.9, 0.02]} name="intro-tagline">
          <boxGeometry args={[1.6, 0.08, 0.02]} />
          <meshStandardMaterial color="#9a9a9a" />
        </mesh>
        <mesh position={[textLeft + 0.65, 1.76, 0.02]}>
          <boxGeometry args={[1.3, 0.08, 0.02]} />
          <meshStandardMaterial color="#9a9a9a" />
        </mesh>
        <OrnateFrame width={frame.width} height={frame.height} position={[frameX, frame.y, 0.01]} />
      </group>
    </group>
  )
}
