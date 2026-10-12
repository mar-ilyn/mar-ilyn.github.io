import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  CanvasTexture,
  CylinderGeometry,
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  TorusGeometry,
  type Group,
} from 'three'
import { BOOK, BOOK_SHEETS, ENVELOPE, PEN } from './deskLayout'

// Objetos del escritorio de contacto, modelados por código (assets propios): libro encuadernado en cuero,
// pluma fuente, tintero de cristal y sobre con sello de lacre. Cada objeto crea sus propios materiales:
// el brillo del hover se aplica a todos los materiales del objeto y no debe alcanzar a los demás.

const gold = () => new MeshStandardMaterial({ color: '#c99f55', metalness: 0.85, roughness: 0.3, envMapIntensity: 1 })
const paper = (color: string) => new MeshStandardMaterial({ color, roughness: 0.9 })

// Libro abierto, más realista: cada mitad del bloque de hojas se arquea desde el pliegue central (donde
// las hojas se hunden hacia el lomo) y baja apenas hacia el borde de afuera. Las hojas de abajo asoman en
// escalones por los bordes, las tapas de cuero asoman alrededor y en los extremos del lomo va la cabezada.

// Perfil de la superficie de las hojas, de 0 (pliegue) a 1 (borde de afuera).
// u se acota a 0..1: por redondeo, el borde puede dar apenas más que 1 y la potencia de un negativo da NaN.
const pageProfile = (raw: number) => {
  const u = Math.min(1, Math.max(0, raw))
  return (1 - Math.pow(1 - u, 2.5)) * (1 - 0.12 * Math.pow(u, 4))
}
const PAGE_STEPS = 28

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

// Cara de las hojas: marfil, con la sombra del pliegue, un leve oscurecimiento hacia el borde y unas pocas
// manchas de papel viejo, muy suaves.
function pageTexture(): CanvasTexture {
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#f2e8d3'
    ctx.fillRect(0, 0, 512, 512)
    const gutter = ctx.createLinearGradient(0, 0, 512, 0)
    gutter.addColorStop(0, 'rgba(92, 70, 40, 0.55)')
    gutter.addColorStop(0.06, 'rgba(92, 70, 40, 0.22)')
    gutter.addColorStop(0.2, 'rgba(92, 70, 40, 0)')
    gutter.addColorStop(0.9, 'rgba(120, 95, 60, 0)')
    gutter.addColorStop(1, 'rgba(120, 95, 60, 0.16)')
    ctx.fillStyle = gutter
    ctx.fillRect(0, 0, 512, 512)
    const edges = ctx.createLinearGradient(0, 0, 0, 512)
    edges.addColorStop(0, 'rgba(120, 95, 60, 0.12)')
    edges.addColorStop(0.06, 'rgba(120, 95, 60, 0)')
    edges.addColorStop(0.94, 'rgba(120, 95, 60, 0)')
    edges.addColorStop(1, 'rgba(120, 95, 60, 0.12)')
    ctx.fillStyle = edges
    ctx.fillRect(0, 0, 512, 512)
    for (const [x, y, r] of [
      [380, 90, 60],
      [440, 400, 45],
      [200, 300, 70],
    ]) {
      const spot = ctx.createRadialGradient(x, y, 0, x, y, r)
      spot.addColorStop(0, 'rgba(170, 130, 70, 0.07)')
      spot.addColorStop(1, 'rgba(170, 130, 70, 0)')
      ctx.fillStyle = spot
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r)
    }
  })
}

// Canto de las hojas apiladas: rayas finas, en el sentido que corresponde a cada cara.
const PAGE_THICKNESS = 0.0005
function pageEdgeTexture(vertical: boolean): CanvasTexture {
  const stripes = 16
  const texture = canvasTexture(vertical ? 64 : 4, vertical ? 4 : 64, (ctx) => {
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? '#e9dfc9' : '#d8cbb0'
      if (vertical) ctx.fillRect(i * 4, 0, 4, 4)
      else ctx.fillRect(0, i * 4, 4, 4)
    }
  })
  texture.wrapS = texture.wrapT = RepeatWrapping
  const repeat = 1 / (stripes * PAGE_THICKNESS)
  texture.repeat.set(vertical ? repeat : 1, vertical ? 1 : repeat)
  return texture
}

// Bloque de hojas de una mitad: el perfil extruido a lo largo del libro (z). x de 0 (pliegue) a width.
function pageBlockGeometry(width: number, depth: number, base: number, height: number): ExtrudeGeometry {
  // El contorno va en sentido horario (perfil de arriba de adentro hacia afuera, después la base): así las
  // caras del costado quedan mirando hacia afuera.
  const shape = new Shape()
  shape.moveTo(0, base)
  for (let i = 1; i <= PAGE_STEPS; i++) {
    const u = i / PAGE_STEPS
    shape.lineTo(u * width, base + height * pageProfile(u))
  }
  shape.lineTo(width, 0)
  shape.lineTo(0, 0)
  shape.closePath()
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 })
  g.translate(0, 0, -depth / 2)
  return g
}

// Cara de arriba de las hojas, con UV de 0 (pliegue) a 1 (borde) para la textura de papel.
function pageSurfaceGeometry(width: number, depth: number, base: number, height: number): PlaneGeometry {
  const g = new PlaneGeometry(width, depth, PAGE_STEPS, 1)
  g.rotateX(-Math.PI / 2)
  g.translate(width / 2, 0, 0)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / width
    pos.setY(i, base + height * pageProfile(u) + 0.0004)
  }
  g.computeVertexNormals()
  return g
}

// Hojas de abajo que asoman en escalones por el borde de afuera y por abajo (BOOK_SHEETS): cada una un
// poco más ancha, más larga y más baja que la anterior, hasta llegar casi a la tapa. Arriba (la cabeza)
// todas quedan parejas.
const SHEET_SHADES = ['#ebe0c8', '#e0d3b6']

export function Book() {
  const { width, depth, pageTop } = BOOK
  const board = 0.008
  const margin = 0.006
  const gutterBase = 0.004
  const { count, stepX, stepZ } = BOOK_SHEETS
  // La hoja de arriba (y el bloque bajo ella) es la más chica; la última hoja llega al margen de la tapa.
  const blockW = width - margin - count * stepX
  const blockD = depth - count * stepZ
  // Todas las hojas empiezan en la cabeza (z = -depth / 2): cada una se centra según su largo.
  const zFor = (d: number) => -depth / 2 + d / 2
  const blockH = pageTop - board - gutterBase
  const m = useMemo(
    () => ({
      leather: new MeshStandardMaterial({ color: '#5a1d19', roughness: 0.55, envMapIntensity: 0.6 }),
      page: new MeshStandardMaterial({ map: pageTexture(), roughness: 0.92 }),
      // Cabeza y pie del bloque (rayas a lo largo de x) y canto de afuera (rayas a lo largo de y).
      edges: [
        new MeshStandardMaterial({ map: pageEdgeTexture(false), roughness: 0.95 }),
        new MeshStandardMaterial({ map: pageEdgeTexture(true), roughness: 0.95 }),
      ],
      headband: new MeshStandardMaterial({ color: '#8c2a22', roughness: 0.6 }),
      headbandGold: gold(),
      sheets: SHEET_SHADES.map((color) => paper(color)),
    }),
    [],
  )
  const geo = useMemo(
    () => ({
      block: pageBlockGeometry(blockW, blockD, gutterBase, blockH),
      surface: pageSurfaceGeometry(blockW, blockD, gutterBase, blockH),
      sheets: Array.from({ length: count }, (_, i) => {
        const k = i + 1
        const d = blockD + k * stepZ
        return { d, geometry: pageSurfaceGeometry(blockW + k * stepX, d, gutterBase, blockH * (1 - k / (count + 0.8))) }
      }),
    }),
    [blockW, blockD, blockH, count, stepX, stepZ],
  )
  return (
    <group>
      {[-1, 1].map((side) => (
        // La mitad izquierda es la derecha espejada: el pliegue queda en el lomo (x = 0).
        <group key={side} scale={[side, 1, 1]}>
          <mesh material={m.leather} position={[(width + 0.002) / 2 - 0.002, board / 2, 0]}>
            <boxGeometry args={[width + 0.002, board, depth + 2 * margin]} />
          </mesh>
          <group position={[0.001, board, 0]}>
            <mesh geometry={geo.block} material={m.edges} position={[0, 0, zFor(blockD)]} />
            <mesh geometry={geo.surface} material={m.page} position={[0, 0, zFor(blockD)]} />
            {geo.sheets.map(({ d, geometry }, i) => (
              <mesh key={i} geometry={geometry} material={m.sheets[i % 2]} position={[0, 0, zFor(d)]} />
            ))}
          </group>
        </group>
      ))}
      {/* Cabezadas: en los extremos del pliegue, una banda de tela con un filete dorado. */}
      {[-1, 1].map((end) => (
        <group key={end} position={[0, board + gutterBase / 2, end * (depth / 2 + 0.0015)]}>
          <mesh material={m.headband}>
            <boxGeometry args={[0.012, gutterBase + 0.002, 0.003]} />
          </mesh>
          <mesh material={m.headbandGold} position={[0, gutterBase / 2 + 0.0012, 0]}>
            <boxGeometry args={[0.012, 0.0012, 0.0032]} />
          </mesh>
        </group>
      ))}
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

// Tintero de bronce: bandeja redonda con borde, cuerpo octogonal de bronce envejecido con molduras en
// anillo, hombro, cuello y tapa abovedada con bisagra y botón, en un dorado más claro.
export function Inkwell() {
  const m = useMemo(
    () => ({
      bronze: new MeshStandardMaterial({ color: '#7d5f30', metalness: 0.9, roughness: 0.38, envMapIntensity: 1 }),
      gilt: gold(),
    }),
    [],
  )
  // Cuerpo octogonal: las caras planas, con una arista de frente (giro de medio lado).
  const octagon: [number, number, number] = [0, Math.PI / 8, 0]
  return (
    <group>
      {/* Bandeja con borde. */}
      <mesh material={m.bronze} position={[0, 0.003, 0]}>
        <cylinderGeometry args={[0.056, 0.058, 0.006, 40]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.0065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.054, 0.0022, 8, 48]} />
      </mesh>
      {/* Cuerpo, con una moldura abajo y otra arriba. */}
      <mesh material={m.bronze} position={[0, 0.006 + 0.022, 0]} rotation={octagon}>
        <cylinderGeometry args={[0.034, 0.038, 0.044, 8]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.0085, 0]} rotation={octagon}>
        <cylinderGeometry args={[0.04, 0.041, 0.005, 8]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.05, 0]} rotation={octagon}>
        <cylinderGeometry args={[0.036, 0.036, 0.004, 8]} />
      </mesh>
      {/* Hombro y cuello. */}
      <mesh material={m.bronze} position={[0, 0.056, 0]}>
        <cylinderGeometry args={[0.022, 0.034, 0.008, 32]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.0625, 0]}>
        <cylinderGeometry args={[0.022, 0.023, 0.005, 32]} />
      </mesh>
      {/* Tapa abovedada con botón y bisagra atrás. */}
      <mesh material={m.gilt} position={[0, 0.065, 0]} scale={[1, 0.65, 1]}>
        <sphereGeometry args={[0.023, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.0825, 0]}>
        <sphereGeometry args={[0.005, 14, 10]} />
      </mesh>
      <mesh material={m.gilt} position={[0, 0.065, -0.024]} rotation={[0, 0, Math.PI / 2]}>
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

// Hoja del CV dentro del sobre: papel claro con "CV" grande en la parte que asoma. El lienzo tiene la
// misma proporción que esa parte (si no, las letras salen estiradas). Se redibuja cuando termina de
// cargar la tipografía del sitio (Cormorant).
const SHEET = { width: 0.2, inside: 0.035, out: 0.07 }
const CANVAS = { width: 512, height: Math.round((512 * SHEET.out) / SHEET.width) }

function cvSheetTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS.width
  canvas.height = CANVAS.height
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width: w, height: h } = CANVAS
    ctx.fillStyle = '#f6f1e4'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#3a2a1e'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `600 ${Math.round(h * 0.62)}px "Cormorant Garamond Variable", "Cormorant Garamond", Georgia, serif`
    ctx.fillText('CV', w / 2, h * 0.42)
    // Dos filetes finos, como en un membrete.
    ctx.fillRect(w * 0.27, h * 0.8, w * 0.46, 3)
    ctx.fillRect(w * 0.35, h * 0.87, w * 0.3, 2)
    texture.needsUpdate = true
  }
  draw()
  void document.fonts?.ready.then(draw)
  return texture
}

// Fases de la apertura (0 → 1): primero la solapa, después la hoja sale (dos tercios afuera) y al final
// la parte que asoma se curva hacia arriba, de frente a la cámara.
const smooth = (a: number, b: number, p: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const OPEN_SECONDS = 1.8
const FLAP_OPEN = -0.8 * Math.PI
const SHEET_BEND = 1.05

// Sobre de papel marfil visto del lado de la solapa, cerrado con un sello de lacre. Cuando la cámara se
// acomoda frente al escritorio (open), la solapa se abre y sale la hoja del CV hasta la mitad.
export function Envelope({ open, reducedMotion }: { open: boolean; reducedMotion: boolean }) {
  const flapHinge = useRef<Group>(null)
  const sheetHinge = useRef<Group>(null)
  const sheetTop = useRef<Group>(null)
  const progress = useRef(0)
  const m = useMemo(
    () => ({
      paper: paper('#ece2cb'),
      flap: paper('#e4d8bc'),
      wax: new MeshPhysicalMaterial({ color: '#86201a', roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
      sheet: paper('#f6f1e4'),
      cv: new MeshStandardMaterial({ map: cvSheetTexture(), roughness: 0.85 }),
    }),
    [],
  )
  const geo = useMemo(() => {
    const { width, depth } = ENVELOPE
    // Solapa: triángulo desde el borde de atrás (la bisagra) hasta un poco más allá del centro.
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

  useFrame(({ invalidate }, delta) => {
    const goal = open ? 1 : 0
    // Se abre a su ritmo y se cierra rápido (al irse de la zona, para repetirse en la próxima llegada).
    const step = delta / (open ? OPEN_SECONDS : 0.4)
    const next = reducedMotion ? goal : goal > progress.current ? Math.min(goal, progress.current + step) : Math.max(goal, progress.current - step)
    progress.current = next
    const p = progress.current
    if (flapHinge.current) flapHinge.current.rotation.x = FLAP_OPEN * smooth(0, 0.4, p)
    // La hoja sale por el borde de atrás hasta que el pliegue llega al borde del sobre.
    if (sheetHinge.current) {
      const closed = SHEET.out - ENVELOPE.depth / 2 + 0.004
      sheetHinge.current.position.z = closed + (-ENVELOPE.depth / 2 - closed) * smooth(0.35, 0.75, p)
    }
    if (sheetTop.current) sheetTop.current.rotation.x = SHEET_BEND * smooth(0.7, 1, p)
    if (p !== goal) invalidate()
  })

  return (
    <group>
      <mesh material={m.paper} position={[0, 0.0015, 0]}>
        <boxGeometry args={[ENVELOPE.width, 0.003, ENVELOPE.depth]} />
      </mesh>
      {/* Hoja del CV: la parte de adentro y la que asoma, unidas por un pliegue. Cerrado, queda toda dentro del sobre. */}
      <group ref={sheetHinge} position={[0, 0.0016, SHEET.out - ENVELOPE.depth / 2 + 0.004]}>
        <mesh material={m.sheet} position={[0, 0, SHEET.inside / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SHEET.width, SHEET.inside]} />
        </mesh>
        <group ref={sheetTop}>
          <mesh material={m.cv} position={[0, 0.0001, -SHEET.out / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[SHEET.width, SHEET.out]} />
          </mesh>
        </group>
      </group>
      {/* Solapa con bisagra en el borde de atrás; el sello va pegado en su punta. */}
      <group ref={flapHinge} position={[0, 0.0036, -ENVELOPE.depth / 2]}>
        <mesh geometry={geo.flap} material={m.flap} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={geo.seal} material={m.wax} position={[0, 0.0019, ENVELOPE.depth * 0.62 - 0.004]} />
        <mesh geometry={geo.relief} material={m.wax} position={[0, 0.004, ENVELOPE.depth * 0.62 - 0.004]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]} />
      </group>
    </group>
  )
}
