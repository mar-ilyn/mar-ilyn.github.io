import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  CylinderGeometry,
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
  type Group,
} from 'three'
import { BOOK, ENVELOPE, PEN } from './deskLayout'
import { ring } from './ornament'

// Objetos del escritorio de contacto, modelados por código (assets propios): libro encuadernado en cuero,
// pluma fuente, tintero de cristal y sobre con sello de lacre. Cada objeto crea sus propios materiales:
// el brillo del hover se aplica a todos los materiales del objeto y no debe alcanzar a los demás.

const gold = () => new MeshStandardMaterial({ color: '#c99f55', metalness: 0.85, roughness: 0.3, envMapIntensity: 1 })
const paper = (color: string) => new MeshStandardMaterial({ color, roughness: 0.9 })

// Libro grande encuadernado en cuero bordó, con filetes dorados en la tapa y nervios en el lomo. Al
// abrirse, la tapa gira sobre el lomo hasta quedar plana a la izquierda y aparece la otra mitad de las
// hojas. El origen está en el centro del libro cerrado (así el agrandado del hover no lo desplaza).
export function Book({ open, reducedMotion }: { open: boolean; reducedMotion: boolean }) {
  const cover = useRef<Group>(null)
  const leftPages = useRef<Group>(null)
  const progress = useRef(open ? 1 : 0)
  const { width, depth, thickness } = BOOK
  const board = 0.008
  const m = useMemo(
    () => ({
      leather: new MeshStandardMaterial({ color: '#5a1d19', roughness: 0.55, envMapIntensity: 0.6 }),
      pages: paper('#efe5cf'),
      endpaper: paper('#e6d6b6'),
      gilt: gold(),
    }),
    [],
  )
  const tooling = useMemo(
    () => ({
      outer: ring(width - 0.03, depth - 0.03, width - 0.036, depth - 0.036, 0.0006, 0),
      inner: ring(width - 0.05, depth - 0.05, width - 0.053, depth - 0.053, 0.0006, 0),
      lozenge: ring(0.07, 0.07, 0.062, 0.062, 0.0006, 0),
      fleuron: new SphereGeometry(1, 10, 6),
    }),
    [width, depth],
  )

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

  const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => [sx, sz] as const))

  return (
    <group position={[-width / 2, 0, 0]}>
      {/* Tapa de atrás y hojas, a la derecha del lomo. */}
      <mesh material={m.leather} position={[width / 2, board / 2, 0]}>
        <boxGeometry args={[width, board, depth]} />
      </mesh>
      <mesh material={m.pages} position={[width / 2, thickness / 2, 0]}>
        <boxGeometry args={[width - 0.012, thickness - 2 * board, depth - 0.012]} />
      </mesh>
      {/* Lomo con cuatro nervios y filetes dorados. */}
      <mesh material={m.leather} position={[-0.001, thickness / 2, 0]}>
        <boxGeometry args={[0.014, thickness, depth]} />
      </mesh>
      {[-0.12, -0.04, 0.04, 0.12].map((z) => (
        <group key={z}>
          <mesh material={m.leather} position={[-0.008, thickness / 2, z]}>
            <boxGeometry args={[0.004, thickness * 0.92, 0.009]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} material={m.gilt} position={[-0.0085, thickness / 2, z + s * 0.009]}>
              <boxGeometry args={[0.001, thickness * 0.9, 0.0015]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Hojas de la izquierda (las que se ven cuando el libro está abierto). */}
      <group ref={leftPages} position={[-width / 2, 0, 0]}>
        <mesh material={m.pages} position={[0, (thickness - board) / 2, 0]}>
          <boxGeometry args={[width - 0.012, thickness - board, depth - 0.012]} />
        </mesh>
      </group>
      {/* Tapa con bisagra en el lomo: filetes dorados, rombo central y florones en las esquinas. */}
      <group ref={cover} position={[0, thickness, 0]}>
        <mesh material={m.leather} position={[width / 2, -board / 2, 0]}>
          <boxGeometry args={[width, board, depth]} />
        </mesh>
        <group position={[width / 2, 0.0002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={tooling.outer} material={m.gilt} />
          <mesh geometry={tooling.inner} material={m.gilt} />
          <mesh geometry={tooling.lozenge} material={m.gilt} rotation={[0, 0, Math.PI / 4]} />
        </group>
        {corners.map(([sx, sz]) => (
          <mesh
            key={`${sx}${sz}`}
            geometry={tooling.fleuron}
            material={m.gilt}
            position={[width / 2 + sx * (width / 2 - 0.04), 0.0006, sz * (depth / 2 - 0.04)]}
            scale={[0.007, 0.0012, 0.007]}
          />
        ))}
        {/* Guarda: la cara interna de la tapa, arriba a la izquierda con el libro abierto. */}
        <mesh material={m.endpaper} position={[width / 2, -board - 0.001, 0]}>
          <boxGeometry args={[width - 0.012, 0.002, depth - 0.012]} />
        </mesh>
      </group>
    </group>
  )
}

// Pluma fuente de laca negra con anillos, clip y plumín dorados. Indica que el libro se puede abrir:
// con el libro bajo el mouse se levanta y gira apenas.
export function Pen({ nudge, reducedMotion }: { nudge: boolean; reducedMotion: boolean }) {
  const body = useRef<Group>(null)
  const t = useRef(0)
  const m = useMemo(
    () => ({ lacquer: new MeshStandardMaterial({ color: '#141312', roughness: 0.18, envMapIntensity: 1.1 }), gilt: gold() }),
    [],
  )
  const r = 0.0065
  useFrame(({ invalidate }, delta) => {
    const g = body.current
    if (!g) return
    const target = nudge && !reducedMotion ? 1 : 0
    t.current += (target - t.current) * Math.min(1, delta * 8)
    if (Math.abs(target - t.current) < 0.002) t.current = target
    g.position.y = r + t.current * 0.012
    g.rotation.y = t.current * 0.12
    if (t.current !== target) invalidate()
  })
  // Piezas a lo largo del eje x (los cilindros de three van en y: se giran).
  const along = [0, 0, Math.PI / 2] as const
  const half = PEN.length / 2
  return (
    <group ref={body}>
      <group rotation={along}>
        {/* Capuchón (atrás), cuerpo, sección y plumín (adelante, hacia +x → -y del grupo girado). */}
        <mesh material={m.lacquer} position={[0, half - 0.03, 0]}>
          <cylinderGeometry args={[r, r, 0.06, 20]} />
        </mesh>
        <mesh material={m.lacquer} position={[0, half, 0]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={m.lacquer} position={[0, half - 0.06 - 0.032, 0]}>
          <cylinderGeometry args={[r * 0.92, r * 0.85, 0.064, 20]} />
        </mesh>
        <mesh material={m.lacquer} position={[0, -half + 0.022, 0]}>
          <cylinderGeometry args={[r * 0.7, r * 0.6, 0.012, 16]} />
        </mesh>
        <mesh material={m.gilt} position={[0, -half + 0.008, 0]} scale={[1, 1, 0.45]}>
          <cylinderGeometry args={[r * 0.55, 0.0004, 0.016, 12]} />
        </mesh>
        {/* Anillos dorados del capuchón. */}
        {[half - 0.059, half - 0.006].map((y) => (
          <mesh key={y} material={m.gilt} position={[0, y, 0]}>
            <cylinderGeometry args={[r * 1.04, r * 1.04, 0.003, 20]} />
          </mesh>
        ))}
      </group>
      {/* Clip sobre el capuchón, con su bolita. */}
      <mesh material={m.gilt} position={[-half + 0.03, r + 0.0012, 0]}>
        <boxGeometry args={[0.042, 0.0016, 0.003]} />
      </mesh>
      <mesh material={m.gilt} position={[-half + 0.052, r + 0.0005, 0]}>
        <sphereGeometry args={[0.0022, 10, 8]} />
      </mesh>
    </group>
  )
}

// Tintero de cristal tallado con la tinta adentro, cuello y tapa abovedada de bronce dorado.
export function Inkwell() {
  const m = useMemo(
    () => ({
      crystal: new MeshPhysicalMaterial({
        color: '#e4ece9',
        roughness: 0.06,
        transparent: true,
        opacity: 0.32,
        envMapIntensity: 1.4,
        depthWrite: false,
      }),
      ink: new MeshStandardMaterial({ color: '#0c0e18', roughness: 0.15 }),
      gilt: gold(),
    }),
    [],
  )
  return (
    <group>
      <mesh material={m.ink} position={[0, 0.026, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.044, 20]} />
      </mesh>
      {/* Bloque de cristal con las aristas biseladas (prisma de ocho caras). */}
      <mesh material={m.crystal} position={[0, 0.0275, 0]} rotation={[0, Math.PI / 8, 0]} renderOrder={3}>
        <cylinderGeometry args={[0.04, 0.042, 0.055, 8]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.059, 0]}>
        <cylinderGeometry args={[0.022, 0.024, 0.008, 24]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.063, 0]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.022, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.081, 0]}>
        <sphereGeometry args={[0.005, 12, 8]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.062, -0.024]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.003, 0.003, 0.014, 10]} />
      </mesh>
    </group>
  )
}

// Sello de lacre: un disco de borde irregular (el lacre se derrama al sellar) con un anillo en relieve.
function sealGeometry(): CylinderGeometry {
  const g = new CylinderGeometry(0.017, 0.018, 0.004, 28, 1)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const radius = Math.hypot(x, z)
    if (radius < 0.01) continue
    const a = Math.atan2(z, x)
    const k = 1 + 0.08 * Math.sin(a * 5 + 0.7) + 0.05 * Math.sin(a * 11 + 2.1)
    pos.setXYZ(i, x * k, pos.getY(i), z * k)
  }
  g.computeVertexNormals()
  return g
}

// Sobre de papel marfil visto del lado de la solapa, cerrado con el sello de lacre.
export function Envelope() {
  const m = useMemo(
    () => ({
      paper: paper('#ece2cb'),
      flap: paper('#e4d8bc'),
      wax: new MeshPhysicalMaterial({ color: '#86201a', roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
    }),
    [],
  )
  const geo = useMemo(() => {
    const { width, depth } = ENVELOPE
    // Solapa: triángulo desde el borde de atrás hasta un poco más allá del centro.
    const flap = new Shape()
    flap.moveTo(-width / 2, 0)
    flap.lineTo(width / 2, 0)
    flap.lineTo(0, depth * 0.62)
    flap.closePath()
    return {
      flap: new ExtrudeGeometry(flap, { depth: 0.0006, bevelEnabled: false }),
      seal: sealGeometry(),
      relief: new TorusGeometry(0.009, 0.0016, 8, 28),
    }
  }, [])
  const apexZ = -ENVELOPE.depth / 2 + ENVELOPE.depth * 0.62
  return (
    <group>
      <mesh material={m.paper} position={[0, 0.0015, 0]}>
        <boxGeometry args={[ENVELOPE.width, 0.003, ENVELOPE.depth]} />
      </mesh>
      {/* La solapa apoya sobre el papel (su cara de arriba, 0,6 mm más alta: sin caras coincidentes). */}
      <mesh geometry={geo.flap} material={m.flap} position={[0, 0.0036, -ENVELOPE.depth / 2]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={geo.seal} material={m.wax} position={[0, 0.0055, apexZ - 0.004]} />
      <mesh geometry={geo.relief} material={m.wax} position={[0, 0.0076, apexZ - 0.004]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]} />
    </group>
  )
}
