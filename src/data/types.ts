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
  // Vista del objeto, arriba del pedestal (la de la cartela se calcula a partir del pedestal).
  camera: {
    detail: CameraView
  }
}

export interface ContactLink {
  id: 'cv' | 'github' | 'linkedin'
  label: string
  href: string
  external: boolean
}

// Canal de contacto: lo que se muestra, a dónde lleva y lo que copia el botón "Copiar".
export interface ContactChannel {
  id: 'email' | 'linkedin' | 'github'
  label: string
  display: string
  href: string
  copyValue: string
  external: boolean
}

export interface ContactContent {
  title: string
  hint: string
  channelsTitle: string
  channelsIntro: string
  channels: readonly ContactChannel[]
  message: {
    title: string
    text: string
    button: string
    subject: string
  }
  cv: { label: string; accessibleName: string }
  copy: { button: string; done: (label: string) => string; failed: string }
  actions: { openBook: string; closeBook: string; backToGallery: string; restart: string }
}

export interface Profile {
  name: string
  role: string
  tagline: string
  stack: readonly string[]
  about: string
  // Cartela de la intro: título en negrita (como el de la obra), junto al año.
  label: { title: string }
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
