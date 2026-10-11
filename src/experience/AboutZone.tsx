import { useCursor } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { Color, MeshStandardMaterial, type Group } from 'three'
import {
  ABOUT_BAY,
  AXIS,
  axisYears,
  durationSpan,
  entryX,
  HOBBY_SLOT,
  ROWS,
  rowOf,
  timeline,
} from '../data/timeline'
import type { TimelineEntry, TimelineObjectKind } from '../data/types'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import { ROOM } from './layout'

// Zona "Sobre mí" en cajas grises (prototipo): friso de dos filas con eje de tiempo compartido,
// marcos por entrada con su barra de duración y cartela, y una vitrina con un estante por fila.
// Se carga aparte (React.lazy) y el arte final reemplaza estas cajas.

const FRAME = { width: 0.36, height: 0.44, depth: 0.04 } as const
const BAND_H = 0.05
const VITRINE = { left: ABOUT_BAY.left + 0.7, right: ABOUT_BAY.right - 0.45, depth: 0.5, height: 1.62 } as const

const grey = (hex: string) => new MeshStandardMaterial({ color: hex, roughness: 0.8 })
const mat = {
  band: grey('#b9a77f'),
  tick: grey('#8c7d5d'),
  bar: grey('#a08a55'),
  frame: grey('#9a9a9a'),
  canvas: grey('#d9d6cf'),
  cartela: grey('#b5b2aa'),
  vitrine: grey('#8f8f8f'),
  shelf: grey('#c2c0ba'),
  object: grey('#7d7d7d'),
  hobby: new MeshStandardMaterial({ color: '#b0b0b0', roughness: 0.8, transparent: true, opacity: 0.45 }),
  glass: new MeshStandardMaterial({ color: '#dfe8ea', roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }),
}

// Cada objeto es una caja con otra proporción, para leer la composición antes del arte.
const OBJECT_SIZE: Record<TimelineObjectKind, [number, number, number]> = {
  guia: [0.24, 0.02, 0.18],
  laptop: [0.32, 0.03, 0.22],
  cuaderno: [0.2, 0.05, 0.26],
  certificado: [0.22, 0.28, 0.03],
}

const z = (d: number) => ROOM.wallZ + d

function Frieze() {
  const years = useMemo(() => axisYears(), [])
  return (
    <group name="about-frieze">
      {(['laboral', 'estudios'] as const).map((row) => (
        <group key={row}>
          {/* Banda de moldura de la fila, de punta a punta del tramo. */}
          <mesh material={mat.band} position={[(AXIS.x0 + AXIS.undated) / 2 + 0.1, ROWS[row].band, z(0.02)]}>
            <boxGeometry args={[AXIS.undated - AXIS.x0 + 0.9, BAND_H, 0.04]} />
          </mesh>
          {/* Marcas de los años sobre la banda: el mismo eje para las dos filas. */}
          {years.map(({ year, x }) => (
            <mesh key={year} material={mat.tick} position={[x, ROWS[row].band, z(0.045)]}>
              <boxGeometry args={[0.012, BAND_H + 0.04, 0.01]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Vitrine() {
  const w = VITRINE.right - VITRINE.left
  const cx = (VITRINE.left + VITRINE.right) / 2
  return (
    <group name="about-vitrine">
      <mesh material={mat.vitrine} position={[cx, 0.06, z(VITRINE.depth / 2)]}>
        <boxGeometry args={[w + 0.06, 0.12, VITRINE.depth + 0.04]} />
      </mesh>
      {(['laboral', 'estudios'] as const).map((row) => (
        <mesh key={row} material={mat.shelf} position={[cx, ROWS[row].shelf - 0.015, z(VITRINE.depth / 2)]}>
          <boxGeometry args={[w, 0.03, VITRINE.depth]} />
        </mesh>
      ))}
      <mesh material={mat.vitrine} position={[cx, VITRINE.height, z(VITRINE.depth / 2)]}>
        <boxGeometry args={[w + 0.06, 0.06, VITRINE.depth + 0.04]} />
      </mesh>
      {[VITRINE.left, VITRINE.right].map((x) => (
        <mesh key={x} material={mat.vitrine} position={[x, VITRINE.height / 2, z(VITRINE.depth / 2)]}>
          <boxGeometry args={[0.05, VITRINE.height, VITRINE.depth + 0.04]} />
        </mesh>
      ))}
      <mesh material={mat.glass} position={[cx, VITRINE.height / 2 + 0.06, z(VITRINE.depth)]} renderOrder={3}>
        <planeGeometry args={[w, VITRINE.height - 0.12]} />
      </mesh>
      {/* Espacio reservado para un objeto de un hobby. */}
      <mesh material={mat.hobby} position={[HOBBY_SLOT.x, ROWS[HOBBY_SLOT.row].shelf + 0.12, z(0.25)]} name="hobby-slot">
        <boxGeometry args={[0.22, 0.24, 0.22]} />
      </mesh>
    </group>
  )
}

const GLOW = new Color('#ffd27a')

interface EntryProps {
  entry: TimelineEntry
  interactive: boolean
  noHover: boolean
  reducedMotion: boolean
}

// Una entrada: barra de duración sobre la banda, marco, cartela y su objeto en el estante.
function Entry({ entry, interactive, noHover, reducedMotion }: EntryProps) {
  const send = useViewStore((s) => s.send)
  const highlighted = useViewStore((s) => s.highlighted)
  const setHighlighted = useViewStore((s) => s.setHighlighted)
  const [hovered, setHovered] = useState(false)
  useCursor(interactive && hovered)
  const groups = useRef<(Group | null)[]>([])
  const scale = useRef(1)
  const frameMat = useMemo(() => mat.frame.clone(), [])

  const row = ROWS[rowOf(entry.kind)]
  const x = entryX(entry)
  const span = durationSpan(entry)
  const active = interactive && highlighted === entry.slug
  const glow = active ? 0.45 : interactive && noHover ? 0.12 : 0

  useFrame(({ invalidate }, delta) => {
    const target = active ? 1.06 : 1
    const next = reducedMotion ? target : scale.current + (target - scale.current) * Math.min(1, delta * 10)
    scale.current = Math.abs(next - target) < 0.001 ? target : next
    for (const g of groups.current) g?.scale.setScalar(scale.current)
    frameMat.emissive.copy(GLOW).multiplyScalar(glow)
    if (scale.current !== target) invalidate()
  })

  const events = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      if (interactive) send({ type: 'OPEN_ENTRY', slug: entry.slug })
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      setHovered(true)
      if (e.pointerType === 'mouse') setHighlighted(entry.slug)
    },
    onPointerOut: () => {
      setHovered(false)
      setHighlighted(null)
    },
  }

  const [ow, oh, od] = OBJECT_SIZE[entry.object.kind]
  return (
    <group name={`entry-${entry.slug}`}>
      {span && (
        <mesh material={mat.bar} position={[(span[0] + span[1]) / 2, row.band, z(0.05)]}>
          <boxGeometry args={[Math.max(0.02, span[1] - span[0]), 0.018, 0.01]} />
        </mesh>
      )}
      <group ref={(g) => void (groups.current[0] = g)} position={[x, row.band + 0.06 + FRAME.height / 2, z(0.04)]} {...events}>
        <mesh material={frameMat}>
          <boxGeometry args={[FRAME.width, FRAME.height, FRAME.depth]} />
        </mesh>
        <mesh material={mat.canvas} position={[0, 0, FRAME.depth / 2 + 0.002]}>
          <planeGeometry args={[FRAME.width - 0.08, FRAME.height - 0.08]} />
        </mesh>
      </group>
      <mesh material={mat.cartela} position={[x, row.band - 0.12, z(0.03)]}>
        <boxGeometry args={[0.34, 0.12, 0.012]} />
      </mesh>
      <group ref={(g) => void (groups.current[1] = g)} position={[x, row.shelf + oh / 2, z(0.25)]} {...events}>
        <mesh material={mat.object}>
          <boxGeometry args={[ow, oh, od]} />
        </mesh>
      </group>
    </group>
  )
}

interface Props {
  view: ViewState
  noHover: boolean
  reducedMotion: boolean
}

export default function AboutZone({ view, noHover, reducedMotion }: Props) {
  const interactive = view.name === 'about' || view.name === 'aboutEntry'
  return (
    <group name="about-zone">
      <Frieze />
      <Vitrine />
      {timeline.map((e) => (
        <Entry key={e.slug} entry={e} interactive={interactive} noHover={noHover} reducedMotion={reducedMotion} />
      ))}
    </group>
  )
}
