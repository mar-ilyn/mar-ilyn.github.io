import { useCursor } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { MeshStandardMaterial, type Mesh } from 'three'
import type { Project } from '../data/types'
import { pedestalGeometry, SHAFT, TOP_Y } from './pedestalGeometry'

interface Props {
  project: Project
  interactive: boolean
  reducedMotion: boolean
  onOpen: (slug: string) => void
}

const OBJECT_SIZE = 0.3
export const FLOAT_Y = TOP_Y + 0.12 + OBJECT_SIZE / 2

const stone = new MeshStandardMaterial({ color: '#e8e0cc', roughness: 0.75 })

export function Pedestal({ project, interactive, reducedMotion, onOpen }: Props) {
  const [hovered, setHovered] = useState(false)
  const exhibit = useRef<Mesh>(null)
  useCursor(interactive && hovered)

  const phase = project.pedestal[0]
  // Con frameloop="demand" el flotado pide el próximo cuadro; con reduced-motion la escena queda quieta.
  useFrame(({ clock, invalidate }) => {
    const mesh = exhibit.current
    if (!mesh || reducedMotion) return
    const t = clock.getElapsedTime() + phase
    mesh.position.y = FLOAT_Y + Math.sin(t * 1.1) * 0.025
    mesh.rotation.y = t * 0.25
    invalidate()
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (interactive) onOpen(project.slug)
  }

  return (
    <group
      position={project.pedestal}
      name={`pedestal-${project.slug}`}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh geometry={pedestalGeometry()} material={stone} />

      <mesh position={[0, 0.6, SHAFT.radius + 0.012]} name="plaque">
        <boxGeometry args={[0.2, 0.12, 0.01]} />
        <meshStandardMaterial color="#8e8e8e" />
      </mesh>

      <mesh ref={exhibit} position={[0, FLOAT_Y, 0]} name="exhibit">
        <boxGeometry args={[OBJECT_SIZE, OBJECT_SIZE, OBJECT_SIZE]} />
        <meshStandardMaterial color="#7a7a7a" />
      </mesh>
    </group>
  )
}
