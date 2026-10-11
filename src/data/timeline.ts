import type { CameraView, TimelineEntry, TimelineKind, YearMonth } from './types'

// Zona "Sobre mí": un mueble vitrina alto y angosto entre dos columnas de la pared (x = 14 a 18).
// Arriba, el compartimento de experiencia laboral; abajo, el de estudios y certificaciones. Cada uno
// tiene su friso cronológico sobre el fondo claro y sus objetos en el estante.
// Los textos de las descripciones son de ejemplo.

export const ABOUT_BAY = { left: 14, right: 18 } as const

// Mueble: base maciza con puertas hasta baseTop, cuerpo vidriado con dos compartimentos separados por
// un estante de vidrio (shelf) y techo en top; la cornisa llega a crown.
export const CABINET = {
  cx: 16,
  width: 1.8,
  depth: 0.5,
  baseTop: 0.74,
  shelf: 1.83,
  top: 2.92,
  crown: 3.12,
} as const

export type Row = 'laboral' | 'estudios'

// Piso y techo de cada compartimento.
export const SECTIONS: Record<Row, { floor: number; ceiling: number }> = {
  laboral: { floor: CABINET.shelf, ceiling: CABINET.top },
  estudios: { floor: CABINET.baseTop, ceiling: CABINET.shelf - 0.012 },
}

// Alturas medidas desde el piso del compartimento: título (Experiencia / Estudios), años, eje, primera
// barra de duración (las siguientes bajan de a laneStep), quiebre de las líneas guía y centro de la cartela.
export const FRIEZE = {
  title: 0.985,
  years: 0.895,
  axis: 0.855,
  lane: 0.82,
  laneStep: 0.028,
  elbow: 0.69,
  cartela: 0.575,
} as const

// Eje horizontal dentro del mueble: enero de 2022 en x0, hoy en x1.
export const AXIS = { start: '2022-01' as YearMonth, x0: CABINET.cx - 0.74, x1: CABINET.cx + 0.74 } as const

// Separación entre los objetos de un estante (y sus cartelas), repartidos simétricos.
export const SLOT_PITCH = 0.56

export const rowOf = (kind: TimelineKind): Row => (kind === 'laboral' ? 'laboral' : 'estudios')

const months = (ym: YearMonth) => {
  const [y, m] = ym.split('-').map(Number)
  return y * 12 + (m - 1)
}

export const toYearMonth = (date: Date): YearMonth =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` as YearMonth

const NOW = toYearMonth(new Date())

// Posición en x de una fecha sobre el eje (now = fin del eje).
export function axisX(ym: YearMonth, now: YearMonth = NOW): number {
  const span = Math.max(1, months(now) - months(AXIS.start))
  const t = Math.min(1, Math.max(0, (months(ym) - months(AXIS.start)) / span))
  return AXIS.x0 + t * (AXIS.x1 - AXIS.x0)
}

// Extremos de la barra de duración; null si no hay fecha.
export function durationSpan(e: Pick<TimelineEntry, 'start' | 'end'>, now: YearMonth = NOW): [number, number] | null {
  if (!e.start) return null
  return [axisX(e.start, now), e.end ? axisX(e.end, now) : AXIS.x1]
}

// Años del eje para las marcas (2022, 2023, ...) hasta el año actual.
export function axisYears(now: YearMonth = NOW): { year: number; x: number }[] {
  const last = Number(now.split('-')[0])
  const out: { year: number; x: number }[] = []
  for (let y = Number(AXIS.start.split('-')[0]); y <= last; y++) out.push({ year: y, x: axisX(`${y}-01`, now) })
  return out
}

// Columna i de n en un estante.
export const slotX = (i: number, n: number) => CABINET.cx + (i - (n - 1) / 2) * SLOT_PITCH

// Cámara de cada entrada: de frente a su columna, encuadrando desde la cartela hasta el objeto.
const WALL_Z = -3
const HALF_TAN = Math.tan((45 * Math.PI) / 360)
function entryCamera(x: number, row: Row): CameraView {
  const { floor } = SECTIONS[row]
  const top = floor + FRIEZE.cartela + 0.08
  const bottom = floor - 0.06
  const y = (top + bottom) / 2
  const distance = ((top - bottom) / 2 + 0.3) / HALF_TAN
  return { position: [x, y + 0.04, WALL_Z + distance], target: [x, y, WALL_Z] }
}

type Draft = Omit<TimelineEntry, 'camera'>

const drafts: Draft[] = [
  {
    slug: 'the-argentino',
    kind: 'laboral',
    title: 'Asistente de Documentación Internacional',
    organization: 'The Argentino',
    start: '2023-03',
    end: null,
    description:
      'Texto de ejemplo: gestión de la documentación de envíos internacionales. Reemplazar por la descripción real.',
    object: { kind: 'guia', alt: 'Caja de envío con la documentación pegada encima' },
    accessibleName: 'Experiencia: Asistente de Documentación Internacional en The Argentino, desde marzo de 2023',
  },
  {
    slug: 'forit',
    kind: 'laboral',
    title: 'Desarrolladora Full Stack (pasantía)',
    organization: 'ForIT Software Factory',
    start: '2026-02',
    end: null,
    description:
      'Texto de ejemplo: desarrollo full stack en el equipo de la fábrica de software. Reemplazar por la descripción real.',
    object: { kind: 'laptop', alt: 'Laptop genérica' },
    accessibleName: 'Experiencia: Desarrolladora Full Stack, pasantía en ForIT Software Factory, desde febrero de 2026',
  },
  {
    slug: 'tecnicatura-ifts-24',
    kind: 'estudio',
    title: 'Tecnicatura en Desarrollo de Software',
    organization: 'IFTS N°24',
    start: '2022-03',
    end: null,
    description: 'Texto de ejemplo: formación técnica en desarrollo de software. Reemplazar por la descripción real.',
    object: { kind: 'cuaderno', alt: 'Cuaderno de estudio' },
    accessibleName: 'Estudio: Tecnicatura en Desarrollo de Software en IFTS N°24, desde marzo de 2022',
  },
  {
    slug: 'full-stack-mern',
    kind: 'estudio',
    title: 'Desarrollo Full Stack MERN',
    organization: 'Educación IT / Fundación Pescar',
    start: '2023-07',
    end: '2024-02',
    description:
      'Texto de ejemplo: curso de desarrollo full stack con el stack MERN. Reemplazar por la descripción real.',
    object: { kind: 'certificado', alt: 'Certificado enmarcado' },
    accessibleName:
      'Estudio: Desarrollo Full Stack MERN en Educación IT y Fundación Pescar, de julio de 2023 a febrero de 2024',
  },
  {
    slug: 'ingles-c1',
    kind: 'certificacion',
    title: 'Inglés C1',
    organization: 'EF SET',
    start: null,
    end: null,
    description: 'Texto de ejemplo: certificación de inglés de nivel C1. Reemplazar por la descripción real.',
    object: { kind: 'certificado', alt: 'Certificado enmarcado' },
    accessibleName: 'Certificación: Inglés C1, EF SET',
  },
]

const ROW_ORDER: Row[] = ['laboral', 'estudios']

const order = (a: Draft, b: Draft) =>
  ROW_ORDER.indexOf(rowOf(a.kind)) - ROW_ORDER.indexOf(rowOf(b.kind)) ||
  (a.start && b.start ? months(a.start) - months(b.start) : a.start ? -1 : b.start ? 1 : 0)

// Columnas de cada estante: las entradas en orden cronológico (sin fecha al final), centradas.
const sorted = [...drafts].sort(order)
const slots = new Map<string, number>()
for (const row of ROW_ORDER) {
  const ids = sorted.filter((d) => rowOf(d.kind) === row).map((d) => d.slug)
  ids.forEach((id, i) => slots.set(id, slotX(i, ids.length)))
}

// Columna de la entrada en su estante: ahí van su objeto y su cartela.
export const entryX = (e: Pick<TimelineEntry, 'slug'>) => slots.get(e.slug) ?? CABINET.cx

// Primero la experiencia y después los estudios, cada uno en orden cronológico: es el orden de
// "Anterior / Siguiente".
export const timeline: readonly TimelineEntry[] = sorted.map((d) => ({
  ...d,
  camera: entryCamera(entryX(d), rowOf(d.kind)),
}))

export const getEntry = (slug: string) => timeline.find((e) => e.slug === slug)

export const entriesOf = (row: Row) => timeline.filter((e) => rowOf(e.kind) === row)

export function neighbours(slug: string): { prev?: TimelineEntry; next?: TimelineEntry } {
  const i = timeline.findIndex((e) => e.slug === slug)
  if (i < 0) return {}
  return { prev: timeline[i - 1], next: timeline[i + 1] }
}

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export function formatRange(e: Pick<TimelineEntry, 'start' | 'end'>): string {
  if (!e.start) return 'Sin fecha'
  const fmt = (ym: YearMonth) => {
    const [y, m] = ym.split('-').map(Number)
    return `${MONTHS[m - 1]} ${y}`
  }
  return `${fmt(e.start)} – ${e.end ? fmt(e.end) : 'actualidad'}`
}

export const KIND_LABEL: Record<TimelineKind, string> = {
  laboral: 'Experiencia laboral',
  estudio: 'Estudio',
  certificacion: 'Certificación',
}

export const SECTION_LABEL: Record<Row, string> = {
  laboral: 'Experiencia',
  estudios: 'Estudios',
}
