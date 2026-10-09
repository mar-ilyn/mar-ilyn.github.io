import type { Project, Vec3 } from '../data/types'
import type { ViewState } from '../state/machine'

export const FOV = 45
export const ROOM = { length: 80, depth: 40, height: 4.2, wallZ: -3 } as const
export const INTRO_X = -10

export interface CameraPose {
  position: Vec3
  target: Vec3
  offset: Vec3
}

const NO_OFFSET: Vec3 = [0, 0, 0]
const halfTan = Math.tan((FOV * Math.PI) / 360)

// Pared de la intro, relativa a INTRO_X: textos alineados a la izquierda y el cuadro con la foto a la derecha.
export const INTRO_LAYOUT = {
  // Ancho del panel especial de la intro: sus bordes coinciden con columnas de la pared (ver wallGeometry).
  bay: 6.8,
  textLeft: -2.6,
  frameX: 1.3,
  frame: { width: 1.55, height: 1.8, y: 2.25 },
  halfWidth: 2.6,
  centerX: 0,
} as const

// Mantiene la composición entera en pantalla: en vertical la cámara retrocede lo necesario.
export function introPose(aspect: number): CameraPose {
  const { halfWidth, centerX } = INTRO_LAYOUT
  const distance = Math.max(6.8, (halfWidth + 0.3) / (halfTan * aspect))
  return {
    position: [INTRO_X + centerX, 2.15, ROOM.wallZ + distance],
    target: [INTRO_X + centerX, 2.3, ROOM.wallZ],
    offset: NO_OFFSET,
  }
}

export const INTRO_POSE = introPose(16 / 9)

// En horizontal, frente a la fila y lo bastante lejos para que entre a lo ancho.
// En vertical, en diagonal: la fila se escorza y entra completa sin alejarse demasiado.
export function galleryPose(aspect: number, rowHalfWidth: number): CameraPose {
  if (aspect < 1) {
    return {
      position: [rowHalfWidth * 3, 2.6, rowHalfWidth * 1.25],
      target: [-rowHalfWidth * 0.18, 1.0, -rowHalfWidth * 0.2],
      offset: NO_OFFSET,
    }
  }
  const distance = Math.min(14, Math.max(6.5, (rowHalfWidth + 2.2) / (halfTan * aspect)))
  return {
    position: [0, 1.9, distance],
    target: [0, 1.1, 0],
    offset: NO_OFFSET,
  }
}

// El objeto queda en la mitad derecha de la pantalla y el panel de texto a la izquierda, en cualquier orientación.
function sideOffset(position: Vec3, target: Vec3, aspect: number): Vec3 {
  const distance = Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2])
  const halfWidth = distance * halfTan * aspect
  return [-(aspect >= 1 ? 0.3 : 0.55) * halfWidth, 0, 0]
}

// Las vistas de datos están pensadas para pantallas horizontales: en vertical la cámara retrocede.
function portraitPullBack(position: Vec3, target: Vec3, aspect: number): Vec3 {
  const k = Math.min(2.2, Math.max(1, 0.8 / aspect))
  return [
    target[0] + (position[0] - target[0]) * k,
    target[1] + (position[1] - target[1]) * k,
    target[2] + (position[2] - target[2]) * k,
  ]
}

export function poseFor(view: ViewState, aspect: number, projects: readonly Project[]): CameraPose {
  const rowHalfWidth = Math.max(...projects.map((p) => Math.abs(p.pedestal[0])), 0)
  switch (view.name) {
    case 'intro':
      return introPose(aspect)
    case 'toGallery':
    case 'gallery':
      return galleryPose(aspect, rowHalfWidth)
    case 'project':
    case 'plaque': {
      const project = projects.find((p) => p.slug === view.slug)
      if (!project) return galleryPose(aspect, rowHalfWidth)
      const framing = view.name === 'project' ? project.camera.detail : project.camera.plaque
      const position = portraitPullBack(framing.position, framing.target, aspect)
      return { position, target: framing.target, offset: sideOffset(position, framing.target, aspect) }
    }
  }
}
