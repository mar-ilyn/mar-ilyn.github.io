import type { CameraView, TimelineEntry, TimelineKind, YearMonth } from './types'

// Zona "Sobre mí": friso cronológico sobre una vitrina, en el tramo de pared entre x = 10 y x = 22.
// Dos filas comparten el eje de tiempo: arriba la experiencia laboral, abajo estudios y certificaciones.
// Los textos de las descripciones son de ejemplo.

export const ABOUT_BAY = { left: 10, right: 22 } as const

// Eje horizontal: enero de 2022 en AXIS.x0, hoy en AXIS.x1. Lo que no tiene fecha va en AXIS.undated.
export const AXIS = { start: '2022-01' as YearMonth, x0: 11.1, x1: 20.1, undated: 21.15 } as const

// Altura de la banda de cada fila (los marcos van encima y la cartela debajo) y del estante de la vitrina.
export const ROWS = {
  laboral: { band: 2.72, shelf: 1.2 },
  estudios: { band: 1.98, shelf: 0.64 },
} as const

export type Row = keyof typeof ROWS

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

export const entryX = (e: Pick<TimelineEntry, 'start'>, now: YearMonth = NOW) =>
  e.start ? axisX(e.start, now) : AXIS.undated

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

// Cámara de cada entrada: de frente a su columna, encuadrando desde el marco (arriba) hasta el
// objeto en el estante (abajo), con margen para el header.
const WALL_Z = -3
function entryCamera(x: number, kind: TimelineKind): CameraView {
  const row = ROWS[rowOf(kind)]
  const top = row.band + 0.56
  const bottom = row.shelf - 0.05
  const y = (top + bottom) / 2 + 0.08
  const distance = ((top - bottom) / 2 + 0.45) / Math.tan((45 * Math.PI) / 360)
  return { position: [x, y + 0.05, WALL_Z + distance], target: [x, y, WALL_Z] }
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
    object: { kind: 'guia', alt: 'Guía de envío en papel con una etiqueta genérica' },
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

const order = (a: Draft, b: Draft) =>
  a.start && b.start ? months(a.start) - months(b.start) : a.start ? -1 : b.start ? 1 : 0

// Orden cronológico (las entradas sin fecha al final): es el orden de "Anterior / Siguiente".
export const timeline: readonly TimelineEntry[] = [...drafts]
  .sort(order)
  .map((d) => ({ ...d, camera: entryCamera(entryX(d), d.kind) }))

export const getEntry = (slug: string) => timeline.find((e) => e.slug === slug)

export function neighbours(slug: string): { prev?: TimelineEntry; next?: TimelineEntry } {
  const i = timeline.findIndex((e) => e.slug === slug)
  if (i < 0) return {}
  return { prev: timeline[i - 1], next: timeline[i + 1] }
}

// Espacio reservado en la vitrina para un objeto de un hobby (se completa más adelante).
export const HOBBY_SLOT = { x: AXIS.undated, row: 'laboral' as Row }

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
