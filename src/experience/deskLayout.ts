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

// Hojas de abajo que asoman en escalones por el borde de afuera y por abajo (la cabeza, arriba, va
// pareja): cada una stepX más ancha y stepZ más larga que la anterior.
export const BOOK_SHEETS = { count: 6, stepX: 0.0035, stepZ: 0.0022 } as const

// Centro de las dos hojas de arriba del libro abierto (adonde mira la cámara de cerca): los escalones de
// abajo las corren hacia la cabeza.
export const OPEN_BOOK_CENTER = [BOOK.spineX, BOOK.y + BOOK.pageTop, BOOK.z - (BOOK_SHEETS.count * BOOK_SHEETS.stepZ) / 2] as const

// Hoja de arriba de cada mitad, donde va impreso el contenido (bookPages.ts): de ancho, del pliegue al
// borde de afuera; de largo, de la cabeza al pie. La tapa de cuero asoma COVER_MARGIN alrededor.
export const BOOK_COVER_MARGIN = 0.006
export const BOOK_PAGE = {
  width: BOOK.width - BOOK_COVER_MARGIN - BOOK_SHEETS.count * BOOK_SHEETS.stepX,
  depth: BOOK.depth - BOOK_SHEETS.count * BOOK_SHEETS.stepZ,
} as const

// Espesor de la tapa y altura del bloque de hojas en el pliegue (donde las hojas se hunden hacia el lomo).
export const BOOK_BOARD = 0.008
export const BOOK_GUTTER_BASE = 0.004

// Perfil de la superficie de las hojas, de 0 (pliegue) a 1 (borde de afuera): cada mitad se arquea desde
// el pliegue y baja apenas hacia el borde.
// u se acota a 0..1: por redondeo, el borde puede dar apenas más que 1 y la potencia de un negativo da NaN.
export const pageProfile = (raw: number) => {
  const u = Math.min(1, Math.max(0, raw))
  return (1 - Math.pow(1 - u, 2.5)) * (1 - 0.12 * Math.pow(u, 4))
}

// Altura de la hoja de arriba a una fracción u del ancho de la hoja, desde el pliegue.
export const pageSurfaceY = (u: number) =>
  BOOK.y + BOOK_BOARD + BOOK_GUTTER_BASE + (BOOK.pageTop - BOOK_BOARD - BOOK_GUTTER_BASE) * pageProfile(u) + 0.0004

// Objetos interactivos del escritorio y su clave de resaltado (hover o foco de su botón en el DOM).
export type ContactItem = 'book' | 'envelope'
export const contactItemKey = (id: ContactItem) => `contact:${id}`