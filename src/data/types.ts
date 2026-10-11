export type Vec3 = readonly [x: number, y: number, z: number]

export interface CameraView {
  position: Vec3
  target: Vec3
}

export interface ProjectImage {
  src: string
  alt: string
  width: number
  height: number
}

export interface ProjectLinks {
  demo?: string
  repo?: string
}

export interface Project {
  slug: string
  title: string
  year: number
  role: string
  stack: readonly string[]
  summary: string
  details: readonly string[]
  links: ProjectLinks
  image: ProjectImage
  pedestal: Vec3
  camera: {
    detail: CameraView
    plaque: CameraView
  }
}

export interface ContactLink {
  id: 'cv' | 'github' | 'linkedin'
  label: string
  href: string
  external: boolean
}

export interface Profile {
  name: string
  role: string
  tagline: string
  stack: readonly string[]
  about: string
  contacts: readonly ContactLink[]
}

export type TimelineKind = 'laboral' | 'estudio' | 'certificacion'

// Año y mes, p. ej. '2023-03'.
export type YearMonth = `${number}-${number}`

export type TimelineObjectKind = 'guia' | 'laptop' | 'cuaderno' | 'certificado'

export interface TimelineEntry {
  slug: string
  kind: TimelineKind
  title: string
  organization: string
  // null: sin fecha (se ubica al final del eje).
  start: YearMonth | null
  // null: actualidad (la barra llega hasta el extremo derecho).
  end: YearMonth | null
  description: string
  object: { kind: TimelineObjectKind; alt: string }
  accessibleName: string
  camera: CameraView
}
