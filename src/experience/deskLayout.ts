// Zona "Contacto": un escritorio antiguo en el tramo de pared entre las columnas de x = 22 y x = 26,
// a la derecha del mueble de "Sobre mí". Medidas en metros; y = 0 en el piso.

// Cara de la pared (ROOM.wallZ; no se importa de layout.ts, que importa este archivo).
const WALL_Z = -3

export const CONTACT_BAY = { left: 22, right: 26 } as const

export const DESK = {
  x: 24,
  // Centro de la tapa en profundidad: la parte de atrás queda a ~25 cm de la pared.
  z: WALL_Z + 0.62,
  width: 1.5,
  depth: 0.75,
  height: 0.78,
  top: 0.04,
} as const

// Superficie de apoyo de los objetos: la cara de arriba del cuero, 2 mm sobre la madera de la tapa.
export const SURFACE = DESK.height + 0.002
const TOP = SURFACE

// Libro grande, siempre abierto: spineX es el lomo (el centro del libro abierto); width es el ancho de
// cada mitad y pageTop la altura de las páginas sobre la tapa.
export const BOOK = {
  spineX: DESK.x - 0.12,
  z: DESK.z + 0.03,
  y: TOP,
  width: 0.3,
  depth: 0.4,
  thickness: 0.06,
  pageTop: 0.036,
} as const

export const PEN = { position: [BOOK.spineX + 0.4, TOP, DESK.z + 0.06] as const, length: 0.15, rotation: 0.35 }
export const INKWELL = { position: [DESK.x + 0.52, TOP, DESK.z - 0.2] as const }
// El sobre queda fuera del cuadro del libro (en el borde de la pantalla, la perspectiva lo estiraba).
export const ENVELOPE = { position: [DESK.x + 0.54, TOP, DESK.z + 0.16] as const, width: 0.22, depth: 0.11, rotation: -0.12 }

// Centro del libro abierto (las dos páginas), donde se ancla el panel HTML.
export const OPEN_BOOK_CENTER = [BOOK.spineX, BOOK.y + BOOK.pageTop, BOOK.z] as const

// Objetos interactivos del escritorio y su clave de resaltado (hover o foco de su botón en el DOM).
export type ContactItem = 'book' | 'envelope'
export const contactItemKey = (id: ContactItem) => `contact:${id}`