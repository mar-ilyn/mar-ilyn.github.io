import { useMemo } from 'react'
import { CylinderGeometry, Group, MeshStandardMaterial, Object3D, SphereGeometry, TorusGeometry } from 'three'
import { bake } from './bake'
import { place } from './ornament'

interface Props {
  // Centro del borde superior del cuadro, en coordenadas locales de la pared (z = 0 en la pared).
  x: number
  frameTop: number
  frameWidth: number
}

// Lámpara de cuadro clásica: base contra la pared, brazo curvo y pantalla cilíndrica de bronce
// que cuelga sobre el borde superior del marco. Su luz (un foco cerrado y de alcance corto) ilumina
// solo la parte de arriba del cuadro; el halo sobre la pared está horneado en el lightmap.

const brass = new MeshStandardMaterial({ color: '#a8803f', metalness: 0.9, roughness: 0.35 })
const glow = new MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffd99a', emissiveIntensity: 1.6 })

const ARM_OUT = 0.28
const HOOD_DROP = 0.06
const HOOD_R = 0.06

function lampGeometry(width: number) {
  const root = new Group()
  // Base atornillada a la pared.
  place(root, new CylinderGeometry(0.035, 0.04, 0.02, 20), { position: [0, 0, 0.01], rotation: [Math.PI / 2, 0, 0] })
  // Brazo curvo: cuarto de toro que sale de la pared y baja hacia la pantalla.
  place(root, new TorusGeometry(ARM_OUT / 2, 0.008, 8, 20, Math.PI / 2), {
    position: [0, -ARM_OUT / 2 + 0.01, ARM_OUT / 2],
    rotation: [0, Math.PI / 2, 0],
  })
  // Pantalla: cilindro horizontal de bronce con tapas redondeadas en los extremos.
  place(root, new CylinderGeometry(HOOD_R, HOOD_R, width, 24), {
    position: [0, -ARM_OUT / 2 - HOOD_DROP + 0.01, ARM_OUT],
    rotation: [0, 0, Math.PI / 2],
  })
  for (const side of [-1, 1]) {
    place(root, new SphereGeometry(HOOD_R * 1.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), {
      position: [(side * width) / 2, -ARM_OUT / 2 - HOOD_DROP + 0.01, ARM_OUT],
      rotation: [0, 0, (side * Math.PI) / 2],
      scale: [0.35, 1, 1],
    })
  }
  return bake(root)
}

export function PictureLamp({ x, frameTop, frameWidth }: Props) {
  const width = frameWidth * 0.62
  const lampY = frameTop + 0.22
  const hoodY = lampY - ARM_OUT / 2 - HOOD_DROP + 0.01

  const { geometry, target } = useMemo(() => {
    const target = new Object3D()
    // Apunta al tercio superior del marco, sobre la pared.
    target.position.set(x, frameTop - 0.1, 0.02)
    return { geometry: lampGeometry(width), target }
  }, [x, frameTop, width])

  return (
    <group name="picture-lamp">
      <mesh geometry={geometry} material={brass} position={[x, lampY, 0]} />
      {/* Tubo encendido dentro de la pantalla: se ve como un brillo cálido desde abajo. */}
      <mesh material={glow} position={[x, hoodY - HOOD_R + 0.008, ARM_OUT]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, width * 0.92, 10]} />
      </mesh>
      <primitive object={target} />
      <spotLight
        position={[x, hoodY - HOOD_R - 0.01, ARM_OUT - 0.02]}
        target={target}
        angle={0.75}
        penumbra={0.9}
        distance={1.25}
        decay={2}
        intensity={2.2}
        color="#ffd6a0"
      />
    </group>
  )
}
