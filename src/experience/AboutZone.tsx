import { useCursor, useKTX2 } from '@react-three/drei'
import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Box3, BoxGeometry, Color, Mesh, MeshStandardMaterial, type Group, type Material, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { AXIS, axisYears, durationSpan, entryX, HOBBY_SLOT, ROWS, rowOf, timeline, VITRINE } from '../data/timeline'
import type { TimelineEntry } from '../data/types'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import * as M from './aboutMaterials'
import { AssetBoundary } from './AssetBoundary'
import { BASIS_PATH, CERT_FRAME_MODEL, WALNUT } from './assets'
import { ROOM } from './layout'
import { ring } from './ornament'
import { BACKING_Z, objectGeometry, RISER, riserGeometry, vitrineBays, vitrineGeometries } from './vitrineGeometry'

// Zona "Sobre mí": friso cronológico de dos filas sobre una vitrina victoriana de nogal y latón.
// Se carga aparte (React.lazy). Los marcos del friso son más discretos que los de los proyectos.

const Z = ROOM.wallZ
const FRAME = { width: 0.34, height: 0.42 } as const
const OBJ_Z = Z + VITRINE.depth * 0.5

// Oro apagado para los marcos y la banda del friso: más sobrio que las molduras de la pared.
const frameGold = new MeshStandardMaterial({ color: '#a8874a', metalness: 0.7, roughness: 0.5 })
const mat = new MeshStandardMaterial({ color: '#efe6d3', roughness: 0.95 })

function Frieze() {
  const years = useMemo(() => axisYears(), [])
  const band = useMemo(() => new BoxGeometry(AXIS.undated - AXIS.x0 + 0.7, 0.026, 0.022), [])
  return (
    <group name="about-frieze">
      {(['laboral', 'estudios'] as const).map((row) => (
        <group key={row}>
          <mesh geometry={band} material={frameGold} position={[(AXIS.x0 + AXIS.undated) / 2, ROWS[row].band, Z + 0.011]} />
          {years.map(({ year, x }) => (
            <mesh key={year} material={M.agedBrass} position={[x, ROWS[row].band, Z + 0.024]}>
              <boxGeometry args={[0.006, 0.05, 0.006]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function useWalnut(): Material {
  const [color, normal, arm] = useKTX2([WALNUT.color, WALNUT.normal, WALNUT.arm], BASIS_PATH)
  return useMemo(() => M.createWalnut(color, normal, arm), [color, normal, arm])
}

function VitrineBody({ walnut }: { walnut: Material }) {
  const geo = useMemo(() => vitrineGeometries(), [])
  const bays = useMemo(() => vitrineBays(), [])
  const glassH = VITRINE.top - 0.05 - VITRINE.baseTop
  return (
    <group name="about-vitrine">
      <mesh geometry={geo.walnut} material={walnut} />
      <mesh geometry={geo.brass} material={M.agedBrass} />
      <mesh geometry={geo.backing} material={M.backing} />
      {/* Luz de los focos sobre el fondo oscuro de cada tramo y de cada estante. */}
      {bays.map(([l, r]) =>
        (['laboral', 'estudios'] as const).map((row) => (
          <mesh
            key={`${l}-${row}`}
            material={M.lightPool}
            position={[(l + r) / 2, ROWS[row].shelf + 0.2, Z + BACKING_Z + 0.007]}
            scale={[(r - l) * 0.9, 0.55, 1]}
            renderOrder={2}
          >
            <planeGeometry />
          </mesh>
        )),
      )}
      <mesh geometry={geo.glass} material={M.glass} renderOrder={4} />
      {bays.map(([l, r]) => (
        <mesh
          key={l}
          material={M.glassReflection}
          position={[(l + r) / 2, VITRINE.baseTop + glassH / 2, Z + VITRINE.depth - 0.002]}
          scale={[r - l - 0.06, glassH - 0.02, 1]}
          renderOrder={5}
        >
          <planeGeometry />
        </mesh>
      ))}
    </group>
  )
}

function Vitrine() {
  return (
    <AssetBoundary fallback={<VitrineBody walnut={M.walnutPlain} />}>
      <TexturedVitrine />
    </AssetBoundary>
  )
}

function TexturedVitrine() {
  const walnut = useWalnut()
  return <VitrineBody walnut={walnut} />
}

const PARTS_MATERIAL: Record<string, Material> = {
  charcoal: M.charcoal,
  keycap: M.keycap,
  paper: M.paper,
  paperLabel: M.paperLabel,
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

let ktx2Loader: KTX2Loader | null = null

// Certificado: marco con atril (Poly Haven, CC0) con papel en blanco para el contenido real.
function Certificate({ scale }: { scale: number }) {
  const gl = useThree((s) => s.gl)
  const gltf = useLoader(GLTFLoader, CERT_FRAME_MODEL, (loader) => {
    ktx2Loader ??= new KTX2Loader().setTranscoderPath(BASIS_PATH).detectSupport(gl)
    loader.setKTX2Loader(ktx2Loader)
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

// Sombra de contacto y luz del foco bajo cada objeto, sobre el estante.
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

// Cartela de latón en el canto del estante, sin texto (el contenido real va en HTML).
function ShelfPlaque({ y }: { y: number }) {
  return (
    <mesh material={M.agedBrass} position={[0, y, VITRINE.depth * 0.5 - 0.02]} rotation={[-0.5, 0, 0]}>
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
  guia: 0.18,
  cuaderno: 0.3,
  certificado: 0.24,
}

// Una entrada: marco y cartela en el friso, barra de duración, línea de latón hasta la vitrina y su
// objeto en el estante, con su cartela.
function Entry({ entry, interactive, noHover, reducedMotion }: EntryProps) {
  const send = useViewStore((s) => s.send)
  const highlighted = useViewStore((s) => s.highlighted)
  const setHighlighted = useViewStore((s) => s.setHighlighted)
  const [hovered, setHovered] = useState(false)
  useCursor(interactive && hovered)
  const groups = useRef<(Group | null)[]>([])
  const scale = useRef(1)
  const frameMat = useMemo(() => frameGold.clone(), [])
  const frameGeo = useMemo(
    () => ring(FRAME.width, FRAME.height, FRAME.width - 0.05, FRAME.height - 0.05, 0.016, 0.006),
    [],
  )

  const row = ROWS[rowOf(entry.kind)]
  const x = entryX(entry)
  const span = durationSpan(entry)
  const active = interactive && highlighted === entry.slug
  const glow = active ? 0.35 : interactive && noHover ? 0.08 : 0
  const cartelaY = row.band - 0.11
  const lineTop = cartelaY - 0.07
  const lineBottom = VITRINE.top + 0.07

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

  return (
    <group name={`entry-${entry.slug}`}>
      {span && (
        <mesh material={M.agedBrass} position={[(span[0] + span[1]) / 2, row.band, Z + 0.026]}>
          <boxGeometry args={[Math.max(0.02, span[1] - span[0]), 0.009, 0.006]} />
        </mesh>
      )}
      <group ref={(g) => void (groups.current[0] = g)} position={[x, row.band + 0.05 + FRAME.height / 2, Z + 0.012]} {...events}>
        <mesh geometry={frameGeo} material={frameMat} />
        <mesh material={mat} position={[0, 0, 0.004]}>
          <planeGeometry args={[FRAME.width - 0.04, FRAME.height - 0.04]} />
        </mesh>
      </group>
      <mesh material={M.agedBrass} position={[x, cartelaY, Z + 0.006]}>
        <boxGeometry args={[0.32, 0.1, 0.004]} />
      </mesh>
      {/* Línea fina de latón que une la entrada con su objeto en la vitrina. */}
      <mesh material={M.agedBrass} position={[x, (lineTop + lineBottom) / 2, Z + 0.008]}>
        <boxGeometry args={[0.003, lineTop - lineBottom, 0.003]} />
      </mesh>
      <group position={[x, row.shelf, OBJ_Z]}>
        <ShelfLight width={OBJECT_WIDTH[entry.object.kind] * OBJECT_SCALE + 0.06} />
        <Riser width={OBJECT_WIDTH[entry.object.kind] * OBJECT_SCALE + 0.04} />
        <group ref={(g) => void (groups.current[1] = g)} position={[0, RISER.height, 0]} {...events}>
          <group scale={OBJECT_SCALE}>
            <EntryObject entry={entry} />
          </group>
        </group>
        <ShelfPlaque y={-0.005} />
      </group>
    </group>
  )
}

// Lugar reservado para el hobby: el pedestal de exposición vacío, con su cartela.
function HobbySlot() {
  return (
    <group position={[HOBBY_SLOT.x, ROWS[HOBBY_SLOT.row].shelf, OBJ_Z]} name="hobby-slot">
      <ShelfLight width={0.28} />
      <Riser width={0.24} />
      <ShelfPlaque y={-0.005} />
    </group>
  )
}

function Riser({ width }: { width: number }) {
  const parts = useMemo(() => riserGeometry(width, 0.24), [width])
  return (
    <>
      <mesh geometry={parts.walnut} material={M.walnutPlain} />
      <mesh geometry={parts.velvet} material={M.velvet} />
    </>
  )
}

// Los objetos se agrandan un poco respecto de su tamaño real para que se lean en una vitrina tan larga.
const OBJECT_SCALE = 1.45

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
      <HobbySlot />
    </group>
  )
}

