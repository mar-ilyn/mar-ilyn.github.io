// Ilustración de la sección de contacto: un sobre de papel viejo cerrado con un sello de lacre, una hoja que
// asoma detrás y una ramita de flores secas. Es SVG en línea (sin imágenes que descargar): el papel se
// envejece con ruido (manchas, grano, bordes tostados), el lacre toma relieve con luces de SVG sobre un mapa
// de alturas y la ramita se arma por código (tallo, ramas, hojas con nervaduras y racimos de florcitas).
// Decorativa: no se anuncia.

// Generador pseudoaleatorio con semilla: la ramita sale siempre igual.
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Point = [number, number]

const quad = (p0: Point, c: Point, p1: Point, t: number): Point => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1],
]
const f = (n: number) => n.toFixed(1)

interface Leaf {
  x: number
  y: number
  angle: number
  length: number
  width: number
}
interface Floret {
  x: number
  y: number
  r: number
  rot: number
  bud: boolean
}
interface Sprig {
  stems: string[]
  leaves: Leaf[]
  florets: Floret[]
}

// La ramita: un tallo que sube curvándose, ramas alternadas que terminan en racimos de florcitas (o en una
// hoja, las de abajo) y hojas sueltas sobre el tallo.
function buildSprig(): Sprig {
  const rnd = random(11)
  const base: Point = [168, 262]
  const ctrl: Point = [150, 150]
  const tip: Point = [212, 34]
  const stems = [`M${f(base[0])} ${f(base[1])}Q${f(ctrl[0])} ${f(ctrl[1])} ${f(tip[0])} ${f(tip[1])}`]
  const leaves: Leaf[] = []
  const florets: Floret[] = []

  const cluster = (cx: number, cy: number, spread: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2
      const d = Math.sqrt(rnd()) * spread
      const x = cx + Math.cos(a) * d
      const y = cy + Math.sin(a) * d * 0.8
      stems.push(`M${f(cx)} ${f(cy + spread * 0.6)}L${f(x)} ${f(y)}`)
      florets.push({ x, y, r: 2.6 + rnd() * 1.6, rot: rnd() * 72, bud: rnd() < 0.28 })
    }
  }

  const branches = [0.2, 0.32, 0.44, 0.55, 0.65, 0.74, 0.83, 0.91]
  branches.forEach((t, i) => {
    const [x, y] = quad(base, ctrl, tip, t)
    const side = i % 2 === 0 ? -1 : 1
    const len = 30 + rnd() * 26 - t * 8
    const angle = (-90 + side * (38 + rnd() * 22)) * (Math.PI / 180)
    const ex = x + Math.cos(angle) * len
    const ey = y + Math.sin(angle) * len
    const bend: Point = [x + Math.cos(angle) * len * 0.5 + side * 6, y + Math.sin(angle) * len * 0.5 + 4]
    stems.push(`M${f(x)} ${f(y)}Q${f(bend[0])} ${f(bend[1])} ${f(ex)} ${f(ey)}`)
    if (t < 0.3) {
      leaves.push({ x: ex, y: ey, angle: angle * (180 / Math.PI), length: 30 + rnd() * 8, width: 7 + rnd() * 2 })
    } else {
      cluster(ex, ey, 10 + rnd() * 6, 7 + Math.round(rnd() * 5))
      // Hojas sobre la rama: una cerca de la axila y otra hacia la punta, del lado contrario.
      for (const [at, turn] of [
        [0.3, 34],
        [0.62, -30],
      ] as const) {
        const [lx, ly] = quad([x, y], bend, [ex, ey], at)
        leaves.push({ x: lx, y: ly, angle: angle * (180 / Math.PI) + side * turn, length: 18 + rnd() * 9, width: 4.5 + rnd() * 1.5 })
      }
    }
  })
  // Hojas sueltas sobre el tallo, más grandes abajo.
  ;[0.08, 0.17, 0.26, 0.38, 0.5, 0.62].forEach((t, i) => {
    const [x, y] = quad(base, ctrl, tip, t)
    const side = i % 2 === 0 ? 1 : -1
    leaves.push({ x, y, angle: -90 + side * (50 + rnd() * 15), length: 42 - t * 24 + rnd() * 6, width: 9.5 - t * 4 })
  })
  cluster(tip[0], tip[1] - 6, 13, 12)
  return { stems, leaves, florets }
}

const SPRIG = buildSprig()

// Hoja lanceolada a lo largo del eje x, con la nervadura central y cuatro pares de nervaduras laterales.
const leafPath = (l: number, w: number) => `M0 0C${f(l * 0.2)} ${f(-w)} ${f(l * 0.7)} ${f(-w * 0.85)} ${f(l)} 0C${f(l * 0.7)} ${f(w * 0.85)} ${f(l * 0.2)} ${f(w)} 0 0Z`
const veinPath = (l: number, w: number) =>
  [0.25, 0.45, 0.62, 0.78]
    .map((t) => `M${f(l * t)} 0L${f(l * (t + 0.12))} ${f(-w * 0.55)}M${f(l * t)} 0L${f(l * (t + 0.12))} ${f(w * 0.55)}`)
    .join('') + `M0 0L${f(l * 0.94)} 0`

function Florets() {
  return (
    <g>
      {SPRIG.florets.map((fl, i) =>
        fl.bud ? (
          <ellipse key={i} cx={fl.x} cy={fl.y} rx={fl.r * 0.55} ry={fl.r * 0.8} transform={`rotate(${fl.rot} ${fl.x} ${fl.y})`} fill="url(#ea-bud)" stroke="#8a6b45" strokeWidth="0.4" />
        ) : (
          <g key={i} transform={`translate(${f(fl.x)} ${f(fl.y)}) rotate(${f(fl.rot)})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy={-fl.r * 0.62} rx={fl.r * 0.42} ry={fl.r * 0.62} transform={`rotate(${a})`} fill="url(#ea-petal)" stroke="#9b7d52" strokeWidth="0.35" />
            ))}
            <circle r={fl.r * 0.32} fill="#8a6338" />
            <circle r={fl.r * 0.14} cx={-fl.r * 0.08} cy={-fl.r * 0.08} fill="#c9a26b" />
          </g>
        ),
      )}
    </g>
  )
}

export function EnvelopeArt() {
  return (
    <svg className="envelope-art" viewBox="0 0 440 352" aria-hidden="true">
      <defs>
        {/* Papel viejo: manchas grandes y grano fino, multiplicados sobre el color; bordes apenas irregulares. */}
        <filter id="ea-aged" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="4" result="blotch" />
          <feColorMatrix in="blotch" values="0 0 0 0 0.6 0 0 0 0 0.45 0 0 0 0 0.24 0 0 0 0.9 -0.45" result="stain" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="grain" />
          <feColorMatrix in="grain" values="0 0 0 0 0.4 0 0 0 0 0.3 0 0 0 0 0.18 0 0 0 0.24 -0.05" result="grainC" />
          <feMerge result="marks">
            <feMergeNode in="stain" />
            <feMergeNode in="grainC" />
          </feMerge>
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="2" result="edgeNoise" />
          <feDisplacementMap in="SourceGraphic" in2="edgeNoise" scale="3" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feComposite in="marks" in2="rough" operator="in" result="marksIn" />
          <feBlend in="marksIn" in2="rough" mode="multiply" />
        </filter>
        {/* Bordes tostados: transparente al centro, marrón hacia los bordes. */}
        <radialGradient id="ea-burn" cx="0.5" cy="0.5" r="0.72">
          <stop offset="0.55" stopColor="#7a5528" stopOpacity="0" />
          <stop offset="1" stopColor="#7a5528" stopOpacity="0.38" />
        </radialGradient>
        <radialGradient id="ea-fox" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#9a6b35" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#9a6b35" stopOpacity="0.1" />
          <stop offset="1" stopColor="#9a6b35" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ea-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ebdcc0" />
          <stop offset="1" stopColor="#d6c19c" />
        </linearGradient>
        <linearGradient id="ea-side-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#efe2c8" />
          <stop offset="1" stopColor="#ddc9a6" />
        </linearGradient>
        <linearGradient id="ea-side-r" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#d3bd96" />
          <stop offset="1" stopColor="#c9b18a" />
        </linearGradient>
        <linearGradient id="ea-bottom" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#d9c6a2" />
          <stop offset="1" stopColor="#c8b089" />
        </linearGradient>
        <linearGradient id="ea-flap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe3cb" />
          <stop offset="1" stopColor="#dcc8a4" />
        </linearGradient>
        <linearGradient id="ea-sheet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efe5d1" />
          <stop offset="1" stopColor="#d9c9aa" />
        </linearGradient>
        <linearGradient id="ea-leaf" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7d6440" />
          <stop offset="0.5" stopColor="#a08559" />
          <stop offset="1" stopColor="#b8a07a" />
        </linearGradient>
        <radialGradient id="ea-petal" cx="0.5" cy="0.8" r="0.9">
          <stop offset="0" stopColor="#d9c39a" />
          <stop offset="1" stopColor="#f2e6cc" />
        </radialGradient>
        <radialGradient id="ea-bud" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#e6d3ad" />
          <stop offset="1" stopColor="#ad8d5d" />
        </radialGradient>
        {/* Lacre: el gris del dibujo es un mapa de alturas (borde abultado, centro hundido, emblema en relieve);
            la luz difusa y el brillo salen de él, y el color es el del lacre. */}
        <filter id="ea-wax" x="-20%" y="-20%" width="140%" height="140%">
          <feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="height" />
          <feGaussianBlur in="height" stdDeviation="1.3" result="soft" />
          <feDiffuseLighting in="soft" surfaceScale="7" diffuseConstant="1.15" lightingColor="#ffffff" result="diffuse">
            <feDistantLight azimuth="225" elevation="48" />
          </feDiffuseLighting>
          <feSpecularLighting in="soft" surfaceScale="7" specularConstant="0.55" specularExponent="26" lightingColor="#ffe3d4" result="spec">
            <feDistantLight azimuth="225" elevation="52" />
          </feSpecularLighting>
          <feFlood floodColor="#6a1e16" result="wax" />
          <feBlend in="diffuse" in2="wax" mode="multiply" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" result="litIn" />
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feComposite in="litIn" in2="specIn" operator="arithmetic" k2="1" k3="0.55" />
        </filter>
        <filter id="ea-drop" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="7" dy="13" stdDeviation="9" floodColor="#4a3420" floodOpacity="0.28" />
        </filter>
        <filter id="ea-drop-soft" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="2.5" dy="4" stdDeviation="2.5" floodColor="#4a3420" floodOpacity="0.25" />
        </filter>
        <filter id="ea-blur" x="-20%" y="-20%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <clipPath id="ea-env-clip">
          <rect x="90" y="150" width="320" height="160" rx="3" />
        </clipPath>
        <clipPath id="ea-sheet-clip">
          <rect x="190" y="30" width="210" height="190" />
        </clipPath>
      </defs>

      {/* Hoja que asoma detrás, inclinada, con su papel envejecido y la sombra del sobre encima. */}
      <g transform="rotate(-11 300 120)" filter="url(#ea-drop-soft)">
        <g filter="url(#ea-aged)">
          <rect x="190" y="30" width="210" height="190" fill="url(#ea-sheet)" />
        </g>
        <g clipPath="url(#ea-sheet-clip)">
          <rect x="190" y="30" width="210" height="190" fill="url(#ea-burn)" />
          <circle cx="352" cy="70" r="16" fill="url(#ea-fox)" />
          <path d="M296 30v190" stroke="#fff6e4" strokeOpacity="0.5" strokeWidth="1.2" />
          <path d="M298 30v190" stroke="#8a6a3e" strokeOpacity="0.16" strokeWidth="1.5" />
        </g>
      </g>

      {/* Ramita de flores secas, detrás del sobre, con su sombra sobre el papel. */}
      <g filter="url(#ea-drop-soft)">
        <g fill="none" stroke="#6f5233" strokeLinecap="round">
          {SPRIG.stems.map((d, i) => (
            <path key={i} d={d} strokeWidth={i === 0 ? 2.2 : 0.9} />
          ))}
        </g>
        {SPRIG.leaves.map((l, i) => (
          <g key={i} transform={`translate(${f(l.x)} ${f(l.y)}) rotate(${f(l.angle)})`}>
            <path d={leafPath(l.length, l.width)} fill="url(#ea-leaf)" stroke="#6f5233" strokeWidth="0.5" />
            <path d={veinPath(l.length, l.width)} fill="none" stroke="#5e4428" strokeOpacity="0.55" strokeWidth="0.45" />
          </g>
        ))}
        <Florets />
      </g>

      {/* Sobre cerrado, apenas inclinado. */}
      <g transform="rotate(-6 250 230)" filter="url(#ea-drop)">
        <g filter="url(#ea-aged)">
          <rect x="90" y="150" width="320" height="160" rx="3" fill="url(#ea-body)" />
          {/* Solapas plegadas: izquierda (de cara a la luz), derecha y abajo (en sombra). */}
          <path d="M90 152 236 240 90 308Z" fill="url(#ea-side-l)" />
          <path d="M410 152 264 240 410 308Z" fill="url(#ea-side-r)" />
          <path d="M92 310 250 222 408 310Z" fill="url(#ea-bottom)" />
        </g>
        <g clipPath="url(#ea-env-clip)">
          {/* Sombra que la solapa de arriba proyecta sobre las de abajo. */}
          <path d="M96 160 250 262 404 160Z" fill="#3b2812" opacity="0.32" filter="url(#ea-blur)" />
          {/* Pliegues con su luz y su sombra. */}
          <path d="M92 309 250 223" stroke="#fff6e2" strokeOpacity="0.55" strokeWidth="1.2" />
          <path d="M250 223 408 309" stroke="#7d6036" strokeOpacity="0.3" strokeWidth="1.3" />
          <path d="M91 153 236 240" stroke="#fff6e2" strokeOpacity="0.4" strokeWidth="1" />
          <path d="M409 153 264 240" stroke="#7d6036" strokeOpacity="0.28" strokeWidth="1.1" />
        </g>
        {/* Solapa de arriba, cerrada. */}
        <g filter="url(#ea-aged)">
          <path d="M90 150h320L250 250Z" fill="url(#ea-flap)" />
        </g>
        <g clipPath="url(#ea-env-clip)">
          <path d="M90 150 250 250 410 150" fill="none" stroke="#9c845c" strokeOpacity="0.55" strokeWidth="1.3" />
          <path d="M93 152 250 247" stroke="#fff8ea" strokeOpacity="0.55" strokeWidth="0.9" />
          {/* Bordes tostados y manchas de humedad. */}
          <rect x="90" y="150" width="320" height="160" fill="url(#ea-burn)" />
          <circle cx="132" cy="282" r="22" fill="url(#ea-fox)" />
          <circle cx="372" cy="178" r="14" fill="url(#ea-fox)" />
          <circle cx="330" cy="290" r="10" fill="url(#ea-fox)" />
        </g>
        {/* Sello de lacre: mapa de alturas en grises (borde 0,75, centro hundido 0,45, anillo 0,6, emblema 0,85). */}
        <g filter="url(#ea-drop-soft)">
          <g filter="url(#ea-wax)">
            <path
              d="M250 212c10-1 15 4 23 6 8 3 10 10 9 18 3 8-1 14-7 19-5 7-13 9-21 8-9 1-17-2-22-9-7-5-10-12-8-20-1-8 3-14 10-18 5-3 9-4 16-4Z"
              fill="rgb(190 190 190)"
            />
            <circle cx="251" cy="238" r="18" fill="rgb(150 150 150)" />
            <circle cx="251" cy="238" r="14.5" fill="rgb(115 115 115)" />
            <path d="M241.5 246v-15l9.5 9.5 9.5-9.5v15" fill="none" stroke="rgb(215 215 215)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  )
}
