import { Color } from 'three'

// Cerezo miel de los muebles de madera (el mueble vitrina de "Sobre mí" y el escritorio de contacto): el
// enchapado de nogal (Poly Haven, CC0) teñido hacia un marrón anaranjado cálido y medio. El tinte supera 1
// en rojo y verde para que la textura, oscura, tome el tono sin apagarse. DEEP: la misma madera más oscura,
// para bandas y molduras.
export const CHERRY = new Color().setRGB(0.54, 0.215, 0)
export const CHERRY_DEEP = new Color().setRGB(0.32, 0.12, 0)

// Si las texturas no cargan: el mismo tono, liso.
export const CHERRY_PLAIN = '#7f3a0a'
export const CHERRY_DEEP_PLAIN = '#4f2306'
