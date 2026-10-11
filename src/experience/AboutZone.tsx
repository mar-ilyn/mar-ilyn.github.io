import { useCursor } from '@react-three/drei'
import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Box3, Color, Mesh, type Group, type Material, type MeshStandardMaterial, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import {
  AXIS,
  axisYears,
  CABINET,
  durationSpan,
  entriesOf,
  entryX,
  FRIEZE,
  rowOf,
  SECTIONS,
  timeline,
  type Row,
} from '../data/timeline'
import type { TimelineEntry } from '../data/types'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import * as M from './aboutMaterials'
import { AssetBoundary } from './AssetBoundary'
import { CERT_FRAME_MODEL, WALNUT } from './assets'
import { ROOM } from './layout'
import { BACKING_Z, cabinetGeometries, objectGeometry, RISER, riserGeometry } from './vitrineGeometry'
import { ktx2Loader, useKTX2 } from './ktx2'

// Zona "Sobre mí": un mueble vitrina alto y angosto de nogal y latón. En cada compartimento, el friso
// cronológico sobre el fondo claro y los objetos en el estante. Se carga aparte (React.lazy).

const Z = ROOM.wallZ
const FRIEZE_Z = Z + BACKING_Z + 0.008
const OBJ_Z = Z + CABINET.depth * 0.5
const ROWS: Row[] = ['laboral', 'estudios']
const LINE = 0.004

interface SegmentProps {
  from: [number, number]
  to: [number, number]
  material: Material
  thickness?: number
}

// Una línea del friso entre dos puntos alineados (horizontal o vertical) sobre el fondo.
function Segment({ from, to, material, thickness = LINE }: SegmentProps) {
  const w = Math.max(thickness, Math.abs(to[0] - from[0]))
  const h = Math.max(thickness, Math.abs(to[1] - from[1]))
  return (
    <mesh material={material} position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, FRIEZE_Z]}>
      <boxGeometry args={[w, h, 0.004]} />
    </mesh>
  )
}

function Frieze({ row }: { row: Row }) {
  const years = useMemo(() => axisYears(), [])
  const y = SECTIONS[row].floor + FRIEZE.axis
  return (
    <group name={`about-frieze-${row}`}>
      <Segment from={[AXIS.x0 - 0.03, y]} to={[AXIS.x1 + 0.03, y]} material={M.bronze} />
      {years.map(({ year, x }) => (
        <Segment key={year} from={[x, y - 0.012]} to={[x, y + 0.022]} material={M.bronze} />
      ))}
    </group>
  )
}

function useWalnut(): Material {
  const [color, normal, arm] = useKTX2([WALNUT.color, WALNUT.normal, WALNUT.arm])
  return useMemo(() => M.createWalnut(color, normal, arm), [color, normal, arm])
}

function CabinetBody({ walnut }: { walnut: Material }) {
  const geo = useMemo(() => cabinetGeometries(), [])
  return (
    <group name="about-cabinet">
      <mesh geometry={geo.walnut} material={walnut} />
      <mesh geometry={geo.brass} material={M.agedBrass} />
      <mesh geometry={geo.backing} material={M.backing} />
      <mesh geometry={geo.glow} material={M.cabinetGlow} />
      {/* Luz de las tiras sobre el fondo claro: más intensa arriba de cada compartimento. */}
      {ROWS.map((row) => (
        <mesh
          key={row}
          material={M.lightPool}
          position={[CABINET.cx, SECTIONS[row].ceiling - 0.22, Z + BACKING_Z + 0.006]}
          scale={[CABINET.width * 1.1, 0.9, 1]}
          renderOrder={2}
        >
          <planeGeometry />
        </mesh>
      ))}
      <mesh geometry={geo.glass} material={M.glass} renderOrder={4} />
      {ROWS.map((row) => {
        const { floor, ceiling } = SECTIONS[row]
        return (
          <mesh
            key={row}
            material={M.glassReflection}
            position={[CABINET.cx, (floor + ceiling) / 2, Z + CABINET.depth - 0.008]}
            scale={[CABINET.width - 0.08, ceiling - floor - 0.02, 1]}
            renderOrder={5}
          >
            <planeGeometry />
          </mesh>
        )
      })}
    </group>
  )
}

function Cabinet() {
  return (
    <AssetBoundary fallback={<CabinetBody walnut={M.walnutPlain} />}>
      <TexturedCabinet />
    </AssetBoundary>
  )
}

function TexturedCabinet() {
  const walnut = useWalnut()
  return <CabinetBody walnut={walnut} />
}

const PARTS_MATERIAL: Record<string, Material> = {
  charcoal: M.charcoal,
  keycap: M.keycap,
  paper: M.paper,
  paperLabel: M.paperLabel,
  cardboard: M.cardboard,
  tape: M.tape,
  ink: M.ink,
  brass: M.agedBrass,
  leather: M.leather,
  leatherGreen: M.leatherGreen,
  pages: M.pages,
  gilt: M.gilt,
  walnut: M.walnutPlain,
  velvet: M.velvet,
}

function ObjectMeshes({ kind }: { kind: Parameters<typeof objectGeometry>[0] }) {
  const parts = useMemo(() => objectGeometry(kind), [kind])
  return (
    <>
      {Object.entries(parts).map(([name, geometry]) => (
        <mesh key={name} geometry={geometry} material={PARTS_MATERIAL[name]} />
      ))}
    </>
  )
}

// Certificado: marco con atril (Poly Haven, CC0) con papel en blanco para el contenido real.
function Certificate({ scale }: { scale: number }) {
  const gl = useThree((s) => s.gl)
  const gltf = useLoader(GLTFLoader, CERT_FRAME_MODEL, (loader) => {
    loader.setKTX2Loader(ktx2Loader(gl))
    loader.setMeshoptDecoder(MeshoptDecoder)
  })
  const model = useMemo(() => {
    const root: Object3D = gltf.scene.clone(true)
    root.traverse((node) => {
      if (node instanceof Mesh && /artwork/i.test((node.material as Material).name)) node.material = M.certificatePaper
    })
    const box = new Box3().setFromObject(root)
    root.position.y -= box.min.y
    return root
  }, [gltf])
  // El modelo mira hacia +x: se gira para que el certificado quede de frente.
  return <primitive object={model} scale={scale} rotation={[0, -Math.PI / 2, 0]} />
}

function CertificateObject({ scale }: { scale: number }) {
  return (
    <AssetBoundary
      fallback={
        <mesh material={M.certificatePaper} position={[0, 0.13 * scale, 0]}>
          <boxGeometry args={[0.2 * scale, 0.26 * scale, 0.02]} />
        </mesh>
      }
    >
      <Certificate scale={scale} />
    </AssetBoundary>
  )
}

// Sombra de contacto y luz de la tira bajo cada objeto, sobre el estante.
function ShelfLight({ width }: { width: number }) {
  return (
    <>
      <mesh material={M.contactShadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} scale={[width, width * 0.6, 1]} renderOrder={1}>
        <planeGeometry />
      </mesh>
      <mesh material={M.lightPool} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0.02]} scale={[width * 2.2, 0.4, 1]} renderOrder={2}>
        <planeGeometry />
      </mesh>
    </>
  )
}

// Cartela de latón al frente del estante, sin texto (el contenido real va en HTML).
function ShelfPlaque({ y }: { y: number }) {
  return (
    <mesh material={M.agedBrass} position={[0, y, CABINET.depth * 0.5 - 0.06]} rotation={[-0.5, 0, 0]}>
      <boxGeometry args={[0.13, 0.035, 0.003]} />
    </mesh>
  )
}

const GLOW = new Color('#ffd27a')

interface EntryProps {
  entry: TimelineEntry
  interactive: boolean
  noHover: boolean
  reducedMotion: boolean
}

function EntryObject({ entry }: { entry: TimelineEntry }): ReactNode {
  switch (entry.object.kind) {
    case 'certificado':
      return <CertificateObject scale={entry.kind === 'certificacion' ? 0.85 : 1} />
    default:
      return <ObjectMeshes kind={entry.object.kind} />
  }
}

const OBJECT_WIDTH: Record<TimelineEntry['object']['kind'], number> = {
  laptop: 0.36,
  guia: 0.3,
  cuaderno: 0.3,
  certificado: 0.24,
}

// Los objetos se agrandan un poco respecto de su tamaño real para que se lean desde la vista del compartimento.
const OBJECT_SCALE = 1.25

// Índice de la barra de duración de cada entrada con fecha dentro de su compartimento.
const LANES = new Map<string, number>()
for (const row of ROWS) {
  entriesOf(row)
    .filter((e) => e.start)
    .forEach((e, i) => LANES.set(e.slug, i))
}

// Una entrada: barra de duración en el friso, línea guía hasta su cartela (texto en HTML) y su objeto
// en el estante.
function Entry({ entry, interactive, noHover, reducedMotion }: EntryProps) {
  const send = useViewStore((s) => s.send)
  const highlighted = useViewStore((s) => s.highlighted)
  const setHighlighted = useViewStore((s) => s.setHighlighted)
  const [hovered, setHovered] = useState(false)
  useCursor(interactive && hovered)
  const object = useRef<Group>(null)
  const scale = useRef(1)
  const lineMat = useMemo(() => M.bronze.clone() as MeshStandardMaterial, [])

  const { floor } = SECTIONS[rowOf(entry.kind)]
  const x = entryX(entry)
  const span = durationSpan(entry)
  const active = interactive && highlighted === entry.slug
  const glow = active ? 0.6 : interactive && noHover ? 0.15 : 0
  const barY = floor + FRIEZE.lane - (LANES.get(entry.slug) ?? 0) * FRIEZE.laneStep
  const elbowY = floor + FRIEZE.elbow
  const cartelaTop = floor + FRIEZE.cartela + 0.06

  useFrame(({ invalidate }, delta) => {
    const target = active ? 1.06 : 1
    const next = reducedMotion ? target : scale.current + (target - scale.current) * Math.min(1, delta * 10)
    scale.current = Math.abs(next - target) < 0.001 ? target : next
    object.current?.scale.setScalar(scale.current)
    lineMat.emissive.copy(GLOW).multiplyScalar(glow)
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

  return (
    <group name={`entry-${entry.slug}`}>
      {span && (
        <>
          <Segment from={[span[0], barY]} to={[span[1], barY]} material={lineMat} thickness={0.009} />
          <mesh material={lineMat} position={[span[0], barY, FRIEZE_Z + 0.002]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.006, 16]} />
          </mesh>
          {/* Línea guía en ángulo recto: del inicio de la barra a la columna de la entrada. */}
          <Segment from={[span[0], barY]} to={[span[0], elbowY]} material={lineMat} />
          <Segment from={[span[0], elbowY]} to={[x, elbowY]} material={lineMat} />
          <Segment from={[x, elbowY]} to={[x, cartelaTop]} material={lineMat} />
        </>
      )}
      {/* Zona de clic sobre la cartela (el texto es HTML y no recibe eventos). */}
      <mesh position={[x, floor + FRIEZE.cartela, FRIEZE_Z + 0.01]} {...events}>
        <planeGeometry args={[0.48, 0.16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group position={[x, floor, OBJ_Z]}>
        <ShelfLight width={OBJECT_WIDTH[entry.object.kind] * OBJECT_SCALE + 0.06} />
        <Riser width={OBJECT_WIDTH[entry.object.kind] * OBJECT_SCALE + 0.04} />
        <group ref={object} position={[0, RISER.height, 0]} {...events}>
          <group scale={OBJECT_SCALE}>
            <EntryObject entry={entry} />
          </group>
        </group>
        <ShelfPlaque y={0.012} />
      </group>
    </group>
  )
}

function Riser({ width }: { width: number }) {
  const parts = useMemo(() => riserGeometry(width, 0.28), [width])
  return (
    <>
      <mesh geometry={parts.walnut} material={M.walnutPlain} />
      <mesh geometry={parts.velvet} material={M.velvet} />
    </>
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
      <Cabinet />
      {ROWS.map((row) => (
        <Frieze key={row} row={row} />
      ))}
      {timeline.map((e) => (
        <Entry key={e.slug} entry={e} interactive={interactive} noHover={noHover} reducedMotion={reducedMotion} />
      ))}
    </group>
  )
}
