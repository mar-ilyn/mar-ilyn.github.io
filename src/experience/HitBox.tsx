import type { ThreeEvent } from '@react-three/fiber'
import { MeshBasicMaterial } from 'three'

// Zona de hover y clic invisible para objetos de varias piezas: una sola caja que envuelve el objeto y no
// se agranda con él. Con los eventos en las piezas, el rayo saltaba de una a otra (la hoja, el cartón,
// la cinta) y el borde se movía con el agrandado del hover: el resaltado parpadeaba.
// Transparente y sin escribir color ni profundidad: no se ve ni tapa nada, y el horneado la ignora.
const hitMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })

interface Props {
  size: readonly [number, number, number]
  position?: readonly [number, number, number]
  onClick?: (e: ThreeEvent<MouseEvent>) => void
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void
}

export function HitBox({ size, position = [0, 0, 0], ...events }: Props) {
  return (
    <mesh material={hitMaterial} position={[...position]} {...events}>
      <boxGeometry args={[...size]} />
    </mesh>
  )
}
