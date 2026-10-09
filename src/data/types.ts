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
  contacts: readonly ContactLink[]
}
