import { useCursor } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useState } from 'react'
import type { Project } from '../data/types'

interface Props {
  project: Project
  interactive: boolean
  onOpen: (slug: string) => void
}

const PEDESTAL = { width: 0.7, height: 1.1 } as const

export function Pedestal({ project, interactive, onOpen }: Props) {
  const [hovered, setHovered] = useState(false)
  useCursor(interactive && hovered)

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
      <mesh position={[0, PEDESTAL.height / 2, 0]}>
        <boxGeometry args={[PEDESTAL.width, PEDESTAL.height, PEDESTAL.width]} />
        <meshStandardMaterial color={interactive && hovered ? '#bdbdbd' : '#a8a8a8'} />
      </mesh>
      <mesh position={[0, PEDESTAL.height + 0.2, 0]}>
        <boxGeometry args={[0.36, 0.36, 0.36]} />
        <meshStandardMaterial color="#7a7a7a" />
      </mesh>
      <mesh position={[0, 0.75, PEDESTAL.width / 2 + 0.011]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.46, 0.26, 0.02]} />
        <meshStandardMaterial color="#8e8e8e" />
      </mesh>
    </group>
  )
}
