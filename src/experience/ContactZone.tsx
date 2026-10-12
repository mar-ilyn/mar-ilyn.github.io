import { useCursor } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Color, Mesh, type Group, type Material, type MeshStandardMaterial } from 'three'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import { lightPool } from './aboutMaterials'
import { AssetBoundary } from './AssetBoundary'
import { TEXTURES, WALNUT } from './assets'
import { deskGeometries } from './deskGeometry'
import {
  createLeather,
  createRosewood,
  leatherPlain,
  ormolu,
  ROSEWOOD_BAND,
  rosewoodBandPlain,
  rosewoodPlain,
} from './deskMaterials'
import { downloadCv } from './downloadCv'
import { HitBox } from './HitBox'
import { useKTX2 } from './ktx2'
import { useGroupHover } from './useGroupHover'
import { BOOK, contactItemKey, DESK, ENVELOPE, INKWELL, PEN, SURFACE, type ContactItem } from './deskLayout'
import { Book, Envelope, Inkwell, Pen } from './DeskObjects'

// Zona "Contacto": escritorio Luis XV (palisandro, cuero y bronce dorado) con un libro grande, una
// pluma fuente, un tintero y un sobre con sello de lacre. El libro abre el panel de contacto, el sobre
// descarga el CV y la pluma se mueve apenas cuando el libro está bajo el mouse. Se carga aparte
// (React.lazy).

const GLOW = new Color('#ffd27a')

type ItemId = ContactItem
const key = contactItemKey

function DeskBody({ wood, band, leather }: { wood: Material; band: Material; leather: Material }) {
  const geo = useMemo(() => deskGeometries(), [])
  return (
    <group name="contact-desk" position={[DESK.x, 0, DESK.z]}>
      <mesh geometry={geo.wood} material={wood} />
      <mesh geometry={geo.band} material={band} />
      <mesh geometry={geo.leather} material={leather} />
      <mesh geometry={geo.gilt} material={ormolu} />
    </group>
  )
}

function TexturedDesk() {
  const [color, normal, grain] = useKTX2([WALNUT.color, WALNUT.normal, TEXTURES.plaster.normal])
  const wood = useMemo(() => createRosewood(color, normal), [color, normal])
  const band = useMemo(() => createRosewood(color, normal, ROSEWOOD_BAND), [color, normal])
  const leather = useMemo(() => createLeather(grain), [grain])
  return <DeskBody wood={wood} band={band} leather={leather} />
}

function Desk() {
  return (
    <AssetBoundary fallback={<DeskBody wood={rosewoodPlain} band={rosewoodBandPlain} leather={leatherPlain} />}>
      <TexturedDesk />
    </AssetBoundary>
  )
}

interface ItemProps {
  id: ItemId
  interactive: boolean
  noHover: boolean
  reducedMotion: boolean
  onSelect: () => void
  children: ReactNode
  position: readonly [number, number, number]
  rotation?: number
  // Caja de hover (ancho, alto, profundidad), apoyada en el escritorio.
  hit: readonly [number, number, number]
}

// Objeto interactivo: se agranda apenas y brilla con hover o foco (en táctiles, brillo suave constante).
function Item({ id, interactive, noHover, reducedMotion, onSelect, children, position, rotation = 0, hit }: ItemProps) {
  const highlighted = useViewStore((s) => s.highlighted)
  const setHighlighted = useViewStore((s) => s.setHighlighted)
  const [hovered, setHovered] = useState(false)
  useCursor(interactive && hovered)
  const group = useRef<Group>(null)
  const scale = useRef(1)
  const lastGlow = useRef(-1)
  const active = interactive && highlighted === key(id)
  const hover = useGroupHover((over, pointerType) => {
    setHovered(over)
    if (!over) setHighlighted(null)
    else if (pointerType === 'mouse') setHighlighted(key(id))
  })
  const glow = active ? 0.35 : interactive && noHover ? 0.1 : 0

  useFrame(({ invalidate }, delta) => {
    const target = active ? 1.06 : 1
    const next = reducedMotion ? target : scale.current + (target - scale.current) * Math.min(1, delta * 10)
    scale.current = Math.abs(next - target) < 0.001 ? target : next
    group.current?.scale.setScalar(scale.current)
    // Brillo: en todos los materiales del objeto (cada objeto tiene los suyos).
    if (glow !== lastGlow.current) {
      lastGlow.current = glow
      group.current?.traverse((node) => {
        if (!(node instanceof Mesh)) return
        for (const material of [node.material].flat() as MeshStandardMaterial[]) {
          if (material.emissive) material.emissive.copy(GLOW).multiplyScalar(glow)
        }
      })
      invalidate()
    }
    if (scale.current !== target) invalidate()
  })

  return (
    <group name={`contact-${id}`} position={[...position]} rotation={[0, rotation, 0]}>
      <group ref={group}>{children}</group>
      <HitBox
        size={hit}
        position={[0, hit[1] / 2, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (interactive) onSelect()
        }}
        {...hover}
      />
    </group>
  )
}

interface Props {
  view: ViewState
  noHover: boolean
  reducedMotion: boolean
}

export default function ContactZone({ view, noHover, reducedMotion }: Props) {
  const send = useViewStore((s) => s.send)
  const highlighted = useViewStore((s) => s.highlighted)
  const interactive = view.name === 'contact'
  // El sobre se abre cuando la cámara ya se acomodó frente al escritorio y se cierra al acercarse al
  // libro (al volver al escritorio se abre de nuevo).
  const cameraMoving = useViewStore((s) => s.cameraMoving)
  const envelopeOpen = view.name === 'contact' && !cameraMoving
  const common = { interactive, noHover, reducedMotion }

  return (
    <group name="contact-zone">
      <Desk />
      {/* Luz cálida de lámpara de escritorio sobre la tapa (degradé, sin luces en tiempo real). */}
      {/* Va 4 mm sobre el cuero: en su mismo plano, la GPU alternaba cuál dibujar mientras la cámara se movía. */}
      <mesh material={lightPool} rotation={[-Math.PI / 2, 0, 0]} position={[DESK.x - 0.05, SURFACE + 0.004, DESK.z]} scale={[1.6, 0.9, 1]} renderOrder={2}>
        <planeGeometry />
      </mesh>
      <Item id="book" {...common} position={[BOOK.spineX, BOOK.y, BOOK.z]} hit={[2 * BOOK.width + 0.03, BOOK.pageTop + 0.02, BOOK.depth + 0.03]} onSelect={() => send({ type: 'OPEN_BOOK' })}>
        <Book />
      </Item>
      {/* Pluma decorativa (no se selecciona): se mueve apenas cuando el libro está bajo el mouse. */}
      <group name="contact-pen" position={[...PEN.position]} rotation={[0, PEN.rotation, 0]}>
        <Pen nudge={highlighted === key('book')} reducedMotion={reducedMotion} />
      </group>
      <Item id="envelope" {...common} position={ENVELOPE.position} rotation={ENVELOPE.rotation} hit={[ENVELOPE.width + 0.03, 0.08, ENVELOPE.depth + 0.16]} onSelect={downloadCv}>
        <Envelope open={envelopeOpen} reducedMotion={reducedMotion} />
      </Item>
      {/* Tintero decorativo: no es interactivo. */}
      <group name="contact-inkwell" position={[...INKWELL.position]}>
        <Inkwell />
      </group>
    </group>
  )
}
