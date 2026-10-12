import type { Project, Vec3 } from '../data/types'
import type { ViewState } from '../state/machine'
import { CABINET, FRIEZE, getEntry, SECTIONS, type Row } from '../data/timeline'
import { BOOK, DESK, OPEN_BOOK_CENTER } from './deskLayout'
import { PEDESTAL_LABEL } from './pedestalGeometry'

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
  bay: 8,
  textLeft: -2.6,
  // Altura del borde de arriba del bloque de texto (el rol, sobre el nombre).
  textTop: 3.24,
  frameX: 1.3,
  frame: { width: 1.55, height: 1.8, y: 2.25 },
  halfWidth: 2.6,
  centerX: 0,
} as const

// Plano general de la sala: con él empieza la página y por él pasa la cámara al irse a la galería.
// En vertical la cámara retrocede lo necesario para que entre la composición.
export function introWidePose(aspect: number): CameraPose {
  const { halfWidth, centerX } = INTRO_LAYOUT
  // Siempre más lejos que el encuadre final de la intro, así la apertura es un acercamiento.
  const distance = Math.max(6.8, (halfWidth + 0.3) / (halfTan * aspect), introFit(aspect) / 0.85)
  return {
    position: [INTRO_X + centerX, 2.15, ROOM.wallZ + distance],
    target: [INTRO_X + centerX, 2.3, ROOM.wallZ],
    offset: NO_OFFSET,
  }
}

// Acercamiento a la parte principal (cartela y cuadro): el panel ocupa casi todo el ancho. La cámara se
// para frente al retrato y mira derecho a la pared, así el marco tallado se ve de frente (desde el centro
// de la composición se le veía el canto y parecía inclinado). CameraRig descentra la lente para que la
// imagen siga centrada en la composición (introLensShift).
// En vertical, de frente a la cartela (la versión alta) y cerca, para que se lea: ocupa casi todo el ancho.
export function introPose(aspect: number): CameraPose {
  if (tallIntro(aspect)) {
    const { center } = INTRO_LABEL
    const x = INTRO_X + center.x
    return {
      position: [x, center.y, ROOM.wallZ + introFit(aspect)],
      target: [x, center.y, ROOM.wallZ],
      offset: NO_OFFSET,
    }
  }
  const wide = introWidePose(aspect)
  const distance = Math.min(introFit(aspect), (wide.position[2] - ROOM.wallZ) * 0.85)
  const x = INTRO_X + INTRO_LAYOUT.frameX
  return {
    position: [x, 2.25, ROOM.wallZ + distance],
    target: [x, 2.27, ROOM.wallZ],
    offset: NO_OFFSET,
  }
}

// Descentramiento de lente (filmOffset de three, en mm) para que el centro de la imagen caiga en el
// centro de la composición de la intro aunque la cámara esté corrida: con la pared paralela a la imagen,
// nada se deforma. Depende de dónde esté la cámara en cada cuadro, así acompaña el acercamiento inicial.
export function introLensShift(cameraX: number, cameraZ: number, filmWidth: number): number {
  const dx = cameraX - (INTRO_X + INTRO_LAYOUT.centerX)
  const distance = Math.max(0.5, cameraZ - ROOM.wallZ)
  return (-filmWidth * dx) / distance
}

// Cartela de museo de la intro (IntroLabel): tamaño de diseño, espesor del cartón y separación de la pared;
// scale la agranda entera (texto incluido) en la escena. Su
// centro (relativo a INTRO_X) va a la altura del centro del panel de la pared (1,10 a 3,40 m) y, en
// ancho, entre la moldura dorada del panel (borde interno en -3,39) y el cuadro del retrato (borde en 0,53).
// En pantallas verticales la cartela es alta y angosta (tall), con el texto más grande en proporción.
export const INTRO_LABEL = {
  width: 1.7,
  height: 0.9,
  tall: { width: 1.3, height: 1.3 },
  depth: 0.012,
  standoff: 0.004,
  scale: 1.25,
  center: { x: -1.43, y: 2.25 },
} as const

export const tallIntro = (aspect: number) => aspect <= 1

// Distancia del encuadre final de la intro. En horizontal entra el panel entero y las columnas que lo
// rodean (sus centros están en los bordes del tramo, a bay / 2 del centro), con 30 cm más a cada lado:
// se ve cada columna completa, con su pedestal. En vertical, la cartela a lo ancho con un margen chico a
// los costados (INTRO_LABEL_MARGIN) y, a lo alto, lugar para el header arriba y los botones abajo.
const INTRO_COLUMN_MARGIN = 0.3
export const INTRO_LABEL_MARGIN = 0.07

function introFit(aspect: number): number {
  const { bay } = INTRO_LAYOUT
  if (tallIntro(aspect)) {
    const { tall, scale } = INTRO_LABEL
    return Math.max((tall.width * scale) / 2 + INTRO_LABEL_MARGIN, ((tall.height * scale) / 2 + 0.5) * aspect) / (halfTan * aspect)
  }
  return Math.max(4.2, (bay / 2 + INTRO_COLUMN_MARGIN) / (halfTan * aspect))
}

export const INTRO_POSE = introPose(16 / 9)
export const INTRO_WIDE_POSE = introWidePose(16 / 9)

// En horizontal, frente a la fila y lo bastante lejos para que entre a lo ancho.
// En vertical, en diagonal: la fila se escorza y entra completa sin alejarse demasiado.
export function galleryPose(aspect: number, rowHalfWidth: number): CameraPose {
  if (aspect < 1) {
    return {
      position: [rowHalfWidth * 3, 3.0, rowHalfWidth * 1.25],
      target: [-rowHalfWidth * 0.18, 1.4, -rowHalfWidth * 0.2],
      offset: NO_OFFSET,
    }
  }
  const distance = Math.min(14, Math.max(6.5, (rowHalfWidth + 2.2) / (halfTan * aspect)))
  return {
    position: [0, 2.4, distance],
    target: [0, 1.6, 0],
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

// Vistazo al mueble entero de "Sobre mí": la cámara se corre a la derecha desde la galería, sin acercarse
// casi, y sigue de largo hacia el compartimento de experiencia.
export function cabinetPose(aspect: number): CameraPose {
  const halfHeight = CABINET.crown / 2 + 0.35
  const halfWidth = CABINET.width / 2 + 0.5
  const distance = Math.max(7, halfHeight / halfTan, halfWidth / (halfTan * aspect))
  const y = CABINET.crown / 2 + 0.1
  return { position: [CABINET.cx, y + 0.25, ROOM.wallZ + distance], target: [CABINET.cx, y, ROOM.wallZ], offset: NO_OFFSET }
}

// Un compartimento: del piso (los objetos) al título, con margen para el header. En vertical
// la cámara retrocede hasta que entra el ancho del mueble.
export function sectionPose(section: Row, aspect: number): CameraPose {
  const { floor } = SECTIONS[section]
  const bottom = floor - 0.1
  const top = floor + FRIEZE.title + 0.06
  // Margen para el header arriba y la pista abajo.
  const halfHeight = (top - bottom) / 2 + 0.32
  const halfWidth = CABINET.width / 2 + 0.12
  const distance = Math.max(halfHeight / halfTan, halfWidth / (halfTan * aspect))
  const y = (top + bottom) / 2 - 0.02
  return { position: [CABINET.cx, y + 0.06, ROOM.wallZ + distance], target: [CABINET.cx, y, ROOM.wallZ], offset: NO_OFFSET }
}

// Pose a una distancia y con una inclinación (grados sobre la horizontal) hacia un punto.
function orbit(target: Vec3, distance: number, elevation: number): CameraPose {
  const a = (elevation * Math.PI) / 180
  return {
    position: [target[0], target[1] + distance * Math.sin(a), target[2] + distance * Math.cos(a)],
    target,
    offset: NO_OFFSET,
  }
}

// Escritorio de contacto: desde arriba y adelante, como quien se acerca a sentarse. Entra todo el
// escritorio con un poco de pared detrás; en vertical la cámara retrocede hasta que entre a lo ancho.
export function deskPose(aspect: number): CameraPose {
  const halfWidth = DESK.width / 2 + 0.15
  const distance = Math.max(2.3, halfWidth / (halfTan * aspect))
  return orbit([DESK.x + 0.05, DESK.height + 0.12, DESK.z], distance, 36)
}

// Libro abierto: casi cenital, para que las dos páginas (y el panel HTML anclado a ellas) se vean
// planas. Margen arriba para el header y abajo para los botones.
export function bookPose(aspect: number): CameraPose {
  const halfWidth = BOOK.width + 0.05
  const halfDepth = BOOK.depth / 2 + 0.09
  const distance = Math.max(halfDepth / halfTan, halfWidth / (halfTan * aspect))
  return orbit([...OPEN_BOOK_CENTER], distance, 82)
}

// De frente a la cartela del pedestal, cerca para que se lea: entra la cartela entera con margen para el
// header arriba y los botones abajo; en vertical la cámara retrocede hasta que entre a lo ancho.
export function labelPose(project: Project, aspect: number): CameraPose {
  const { width, height, y, z } = PEDESTAL_LABEL
  const [px, , pz] = project.pedestal
  const distance = Math.max((height / 2 + 0.11) / halfTan, (width / 2 + 0.07) / (halfTan * aspect))
  return {
    position: [px, y + 0.015, pz + z + distance],
    target: [px, y, pz + z],
    offset: NO_OFFSET,
  }
}

export function poseFor(view: ViewState, aspect: number, projects: readonly Project[]): CameraPose {
  const rowHalfWidth = Math.max(...projects.map((p) => Math.abs(p.pedestal[0])), 0)
  switch (view.name) {
    case 'intro':
      return introPose(aspect)
    case 'toGallery':
    case 'gallery':
      return galleryPose(aspect, rowHalfWidth)
    // Primero la cartela del pedestal; con "Más info", el objeto de arriba.
    case 'project':
    case 'projectDetail': {
      const project = projects.find((p) => p.slug === view.slug)
      if (!project) return galleryPose(aspect, rowHalfWidth)
      if (view.name === 'project') return labelPose(project, aspect)
      const framing = project.camera.detail
      const position = portraitPullBack(framing.position, framing.target, aspect)
      return { position, target: framing.target, offset: sideOffset(position, framing.target, aspect) }
    }
    case 'about':
      return sectionPose(view.section, aspect)
    case 'aboutEntry': {
      const entry = getEntry(view.slug)
      if (!entry) return sectionPose('laboral', aspect)
      const { position: p, target } = entry.camera
      const position = portraitPullBack(p, target, aspect)
      return { position, target, offset: sideOffset(position, target, aspect) }
    }
    case 'contact':
      return deskPose(aspect)
    case 'contactBook':
      return bookPose(aspect)
  }
}
