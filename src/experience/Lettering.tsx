import { useMemo } from 'react'
import { buildLettering, bronze, CAP_HEIGHT, SHADOW, shadowMaterial } from './letteringGeometry'

interface Props {
  text: string
  // Centro del texto en x y en la altura de las mayúsculas; z en la cara de la pared o del fondo.
  position: readonly [number, number, number]
  // Tamaño de letra (em) en metros.
  size: number
  tracking?: number
  color?: string
}

// Título fijo en letras de bronce en relieve, centrado en `position` (los de las zonas: Proyectos,
// Experiencia, Estudios). Sin texto HTML: cada zona ya tiene su encabezado accesible en la capa del DOM.
export function Lettering({ text, position, size, tracking = 0, color }: Props) {
  const geo = useMemo(() => buildLettering(text, tracking), [text, tracking])
  const material = useMemo(() => bronze(color), [color])
  const shadows = useMemo(() => SHADOW.map((s) => ({ ...s, material: shadowMaterial(s.opacity) })), [])
  const [x, y, z] = position
  return (
    <group name="lettering" position={[x - (geo.width * size) / 2, y - (CAP_HEIGHT * size) / 2, z]} scale={size}>
      {shadows.map((s) => (
        <mesh key={s.dx} geometry={geo.flat} material={s.material} position={[s.dx, s.dy, 0]} renderOrder={1} />
      ))}
      <mesh geometry={geo.letters} material={material} renderOrder={2} />
    </group>
  )
}
