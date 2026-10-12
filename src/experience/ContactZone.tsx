import { useCursor } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Color, MeshStandardMaterial, type Group } from 'three'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import { lightPool } from './aboutMaterials'
import { downloadCv } from './downloadCv'
import { BOOK, contactItemKey, DESK, ENVELOPE, INKWELL, PEN, type ContactItem } from './deskLayout'

// Zona "Contacto" (cajas grises): escritorio con un libro grande, una lapicera, un tintero y un sobre
// con sello de lacre. El libro abre el panel de contacto, el sobre descarga el CV y la lapicera se mueve
// apenas cuando el libro está bajo el mouse. Se carga aparte (React.lazy).

const grey = (color: string) => new MeshStandardMaterial({ color, roughness: 0.8 })
const deskMat = grey('#6f6a64')
const coverMat = grey('#8a8580')
const pagesMat = grey('#e2ded6')
const inkMat = grey('#5b5d60')
const sealMat = new MeshStandardMaterial({ color: '#9b3a32', roughness: 0.45 })

const GLOW = new Color('#ffd27a')
const TOP = DESK.height

type ItemId = ContactItem
const key = contactItemKey

function Desk() {
  const { width, depth, height, top } = DESK
  const legH = height - top
  return (
    <group name="contact-desk" position={[DESK.x, 0, DESK.z]}>
      <mesh material={deskMat} position={[0, height - top / 2, 0]}>
        <boxGeometry args={[width, top, depth]} />
      </mesh>
      {/* Dos cajoneras y un panel de fondo. */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (width / 2 - 0.22), 0, 0]}>
          <mesh material={deskMat} position={[0, legH / 2, 0]}>
            <boxGeometry args={[0.4, legH, depth - 0.06]} />
          </mesh>
          {[0.18, 0.4, 0.6].map((y) => (
            <mesh key={y} material={coverMat} position={[0, y, depth / 2 - 0.025]}>
              <boxGeometry args={[0.34, 0.16, 0.01]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh material={deskMat} position={[0, legH * 0.6, -depth / 2 + 0.05]}>
        <boxGeometry args={[width - 0.84, legH * 0.8, 0.03]} />
      </mesh>
    </group>
  )
}

interface ItemProps {
  id: ItemId
  interactive: boolean
  noHover: boolean
  reducedMotion: boolean
  onSelect: () => void
  children: (material: MeshStandardMaterial) => ReactNode
  position: readonly [number, number, number]
  rotation?: number
}

// Objeto interactivo: se agranda apenas y brilla con hover o foco (en táctiles, brillo suave constante).
function Item({ id, interactive, noHover, reducedMotion, onSelect, children, position, rotation = 0 }: ItemProps) {
  const highlighted = useViewStore((s) => s.highlighted)
  const setHighlighted = useViewStore((s) => s.setHighlighted)
  const [hovered, setHovered] = useState(false)
  useCursor(interactive && hovered)
  const group = useRef<Group>(null)
  const scale = useRef(1)
  const material = useMemo(() => grey('#9a958e'), [])
  const active = interactive && highlighted === key(id)
  const glow = active ? 0.35 : interactive && noHover ? 0.1 : 0

  useFrame(({ invalidate }, delta) => {
    const target = active ? 1.06 : 1
    const next = reducedMotion ? target : scale.current + (target - scale.current) * Math.min(1, delta * 10)
    scale.current = Math.abs(next - target) < 0.001 ? target : next
    group.current?.scale.setScalar(scale.current)
    material.emissive.copy(GLOW).multiplyScalar(glow)
    if (scale.current !== target) invalidate()
  })

  return (
    <group
      ref={group}
      name={`contact-${id}`}
      position={[...position]}
      rotation={[0, rotation, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (interactive) onSelect()
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHovered(true)
        if (e.pointerType === 'mouse') setHighlighted(key(id))
      }}
      onPointerOut={() => {
        setHovered(false)
        setHighlighted(null)
      }}
    >
      {children(material)}
    </group>
  )
}

// Libro grande con el lomo a la izquierda. Al abrirse, la tapa gira sobre el lomo hasta quedar plana a
// la izquierda y debajo aparece la otra mitad de las hojas.
function Book({ open, reducedMotion, material }: { open: boolean; reducedMotion: boolean; material: MeshStandardMaterial }) {
  const cover = useRef<Group>(null)
  const leftPages = useRef<Group>(null)
  const progress = useRef(open ? 1 : 0)
  const { width, depth, thickness } = BOOK
  const board = 0.008

  useFrame(({ invalidate }, delta) => {
    const target = open ? 1 : 0
    const p = progress.current
    const next = reducedMotion ? target : p + (target - p) * Math.min(1, delta * 4)
    progress.current = Math.abs(next - target) < 0.002 ? target : next
    // Tapa: de cerrada (0) a abierta y apoyada sobre las hojas de la izquierda (π).
    if (cover.current) cover.current.rotation.z = progress.current * Math.PI
    if (leftPages.current) {
      leftPages.current.scale.y = Math.max(0.001, progress.current)
      leftPages.current.visible = progress.current > 0.01
    }
    if (progress.current !== target) invalidate()
  })

  return (
    // Origen en el centro del libro cerrado (así el agrandado del hover no lo desplaza); el lomo en -width/2.
    <group position={[-width / 2, 0, 0]}>
      {/* Tapa de atrás y hojas, a la derecha del lomo. */}
      <mesh material={material} position={[width / 2, board / 2, 0]}>
        <boxGeometry args={[width, board, depth]} />
      </mesh>
      <mesh material={pagesMat} position={[width / 2, thickness / 2, 0]}>
        <boxGeometry args={[width - 0.012, thickness - 2 * board, depth - 0.012]} />
      </mesh>
      {/* Lomo. */}
      <mesh material={material} position={[0, thickness / 2, 0]}>
        <boxGeometry args={[0.012, thickness, depth]} />
      </mesh>
      {/* Hojas de la izquierda (las que se ven cuando el libro está abierto). */}
      <group ref={leftPages} position={[-width / 2, 0, 0]}>
        <mesh material={pagesMat} position={[0, (thickness - board) / 2, 0]}>
          <boxGeometry args={[width - 0.012, thickness - board, depth - 0.012]} />
        </mesh>
      </group>
      {/* Tapa con bisagra en el lomo, arriba. */}
      <group ref={cover} position={[0, thickness, 0]}>
        <mesh material={material} position={[width / 2, -board / 2, 0]}>
          <boxGeometry args={[width, board, depth]} />
        </mesh>
        {/* Guarda: la cara interna de la tapa, que queda arriba a la izquierda con el libro abierto. */}
        <mesh material={pagesMat} position={[width / 2, -board - 0.001, 0]}>
          <boxGeometry args={[width - 0.012, 0.002, depth - 0.012]} />
        </mesh>
      </group>
    </group>
  )
}

// La lapicera indica que el libro se puede abrir: con el libro bajo el mouse se levanta y gira apenas.
function Pen({ nudge, reducedMotion, material }: { nudge: boolean; reducedMotion: boolean; material: MeshStandardMaterial }) {
  const body = useRef<Group>(null)
  const t = useRef(0)
  useFrame(({ invalidate }, delta) => {
    const g = body.current
    if (!g) return
    const target = nudge && !reducedMotion ? 1 : 0
    t.current += (target - t.current) * Math.min(1, delta * 8)
    if (Math.abs(target - t.current) < 0.002) t.current = target
    g.position.y = 0.006 + t.current * 0.012
    g.rotation.y = t.current * 0.12
    if (t.current !== target) invalidate()
  })
  return (
    <group ref={body}>
      <mesh material={material} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.004, PEN.length, 12]} />
      </mesh>
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
  const common = { interactive, noHover, reducedMotion }

  return (
    <group name="contact-zone">
      <Desk />
      {/* Luz cálida de lámpara de escritorio sobre la tapa (degradé, sin luces en tiempo real). */}
      <mesh material={lightPool} rotation={[-Math.PI / 2, 0, 0]} position={[DESK.x - 0.05, TOP + 0.002, DESK.z]} scale={[1.6, 0.9, 1]} renderOrder={2}>
        <planeGeometry />
      </mesh>
      <Item id="book" {...common} position={[BOOK.spineX + BOOK.width / 2, BOOK.y, BOOK.z]} onSelect={() => send({ type: 'OPEN_BOOK' })}>
        {(m) => <Book open={view.name === 'contactBook'} reducedMotion={reducedMotion} material={m} />}
      </Item>
      <Item id="pen" {...common} position={PEN.position} rotation={PEN.rotation} onSelect={() => send({ type: 'OPEN_BOOK' })}>
        {(m) => <Pen nudge={highlighted === key('book')} reducedMotion={reducedMotion} material={m} />}
      </Item>
      <Item id="envelope" {...common} position={ENVELOPE.position} rotation={ENVELOPE.rotation} onSelect={downloadCv}>
        {(m) => (
          <>
            <mesh material={m} position={[0, 0.003, 0]}>
              <boxGeometry args={[ENVELOPE.width, 0.006, ENVELOPE.depth]} />
            </mesh>
            <mesh material={sealMat} position={[0, 0.008, 0.01]}>
              <cylinderGeometry args={[0.016, 0.017, 0.006, 20]} />
            </mesh>
          </>
        )}
      </Item>
      {/* Tintero decorativo: no es interactivo. */}
      <group name="contact-inkwell" position={[...INKWELL.position]}>
        <mesh material={inkMat} position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.035, 0.04, 0.06, 20]} />
        </mesh>
        <mesh material={inkMat} position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.014, 0.018, 0.02, 16]} />
        </mesh>
      </group>
    </group>
  )
}
