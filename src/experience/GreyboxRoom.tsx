import { INTRO_X, ROOM } from './layout'

// Prototipo de volúmenes: el arte definitivo reemplaza esto en el hito 3.
export function GreyboxRoom() {
  const { length, depth, height, wallZ } = ROOM
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
      <mesh position={[0, height / 2, wallZ - 0.1]}>
        <boxGeometry args={[length, height, 0.2]} />
        <meshStandardMaterial color="#d6d6d6" />
      </mesh>

      <group position={[INTRO_X, 0, wallZ]}>
        <mesh position={[0, 2.55, 0.05]} name="intro-portrait">
          <boxGeometry args={[1.2, 1.5, 0.08]} />
          <meshStandardMaterial color="#8a8a8a" />
        </mesh>
        <mesh position={[0, 1.45, 0.03]} name="intro-name">
          <boxGeometry args={[3, 0.32, 0.04]} />
          <meshStandardMaterial color="#6f6f6f" />
        </mesh>
        <mesh position={[0, 1.05, 0.02]} name="intro-tagline">
          <boxGeometry args={[2.4, 0.14, 0.02]} />
          <meshStandardMaterial color="#9a9a9a" />
        </mesh>
      </group>
    </group>
  )
}
