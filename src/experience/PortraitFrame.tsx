import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { InstancedMesh, MeshStandardMaterial, Object3D, SphereGeometry } from 'three'
import { sweptRectangle } from './moldingGeometry'

interface Props {
  width: number
  height: number
  position: [number, number, number]
  // Sin lienzo: el hueco queda abierto (para el render con transparencia de la vista en lista).
  showCanvas?: boolean
}

// Lienzo liso y cálido, reservado para la foto de presentación.
const CANVAS_COLOR = '#ebe3d3'

// Ancho de la moldura y perfil, del borde de afuera hacia el hueco: [distancia hacia adentro, altura] en
// metros. Un canto exterior redondeado, una garganta, un toro alto (el cuerpo de la moldura), un cordón
// fino de perlas sobre un filete, un escalón y el filo interior que baja hacia la foto.
// El perfil se dibuja a escala 1 (0,105 m de ancho) y se agranda con SCALE.
const SCALE = 1.22
const BASE_PROFILE: [number, number][] = [
  [0, 0],
  [0, 0.022],
  [0.003, 0.03],
  [0.008, 0.034],
  [0.013, 0.031],
  [0.017, 0.026],
  [0.022, 0.024],
  [0.027, 0.028],
  [0.033, 0.037],
  [0.04, 0.044],
  [0.048, 0.047],
  [0.056, 0.046],
  [0.063, 0.041],
  [0.068, 0.035],
  [0.071, 0.034],
  [0.073, 0.037],
  [0.076, 0.037],
  [0.078, 0.034],
  [0.081, 0.033],
  [0.083, 0.036],
  [0.086, 0.036],
  [0.088, 0.032],
  [0.093, 0.029],
  [0.097, 0.026],
  [0.1, 0.021],
  [0.103, 0.014],
  [0.105, 0.006],
]
const PROFILE = BASE_PROFILE.map(([d, z]) => [d * SCALE, z * SCALE] as [number, number])
const BORDER = 0.105 * SCALE
// Cordón de perlas sobre el filete fino, entre el toro y el escalón: distancia hacia adentro, altura y
// separación entre perlas.
const BEADS = { inset: 0.0795 * SCALE, z: 0.036 * SCALE, radius: 0.0034 * SCALE, spacing: 0.0095 * SCALE }

// Puntos a lo largo del rectángulo metido inset hacia adentro, cada spacing.
function beadPoints(width: number, height: number): [number, number][] {
  const w = width / 2 - BEADS.inset
  const h = height / 2 - BEADS.inset
  const points: [number, number][] = []
  const side = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / BEADS.spacing))
    for (let i = 0; i < n; i++) points.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n])
  }
  side(-w, -h, w, -h)
  side(w, -h, w, h)
  side(w, h, -w, h)
  side(-w, h, -w, -h)
  return points
}

const beadGeometry = new SphereGeometry(1, 8, 6)

const frameGeometry = (width: number, height: number) => sweptRectangle(width, height, PROFILE)

// Oro de la moldura: metálico y satinado, con reflejos suaves.
const gilt = new MeshStandardMaterial({ color: '#d2ad62', metalness: 0.88, roughness: 0.34, envMapIntensity: 1.1, flatShading: true })
const beadGilt = new MeshStandardMaterial({ color: '#d8b56c', metalness: 0.85, roughness: 0.3, envMapIntensity: 1.1 })

// Marco de la foto de presentación: un marco dorado clásico de moldura escalonada, con un cordón fino de
// perlas (una sola malla instanciada).
export function PortraitFrame({ width, height, position, showCanvas = true }: Props) {
  const geometry = useMemo(() => frameGeometry(width, height), [width, height])
  useEffect(() => () => geometry.dispose(), [geometry])
  const beads = useMemo(() => beadPoints(width, height), [width, height])
  const beadMesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = beadMesh.current
    if (!mesh) return
    const dummy = new Object3D()
    beads.forEach(([x, y], i) => {
      dummy.position.set(x, y, BEADS.z)
      dummy.scale.set(BEADS.radius, BEADS.radius, BEADS.radius * 0.7)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [beads])
  return (
    <group position={position} name="portrait-frame">
      <mesh geometry={geometry} material={gilt} />
      <instancedMesh ref={beadMesh} args={[beadGeometry, beadGilt, beads.length]} />
      {showCanvas && (
        <mesh position={[0, 0, 0.004]} name="photo">
          <planeGeometry args={[width - 2 * BORDER + 0.01, height - 2 * BORDER + 0.01]} />
          <meshStandardMaterial color={CANVAS_COLOR} roughness={0.95} />
        </mesh>
      )}
    </group>
  )
}
