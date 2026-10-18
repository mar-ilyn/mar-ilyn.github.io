import { MeshStandardMaterial, Vector2, type Texture } from 'three'
import { CHERRY, CHERRY_DEEP, CHERRY_DEEP_PLAIN, CHERRY_PLAIN } from './cherry'
import { LEATHER } from './deskGeometry'

// Materiales del escritorio Luis XV: cerezo miel lustrado, cuero gris pizarra y bronce dorado.

// Cerezo miel (cherry.ts, el mismo tono del mueble vitrina); el lustre a muñeca da un brillo parejo. Con
// tint más oscuro, la banda de enchapado que rodea al cuero.
export function createRosewood(color: Texture, normal: Texture, tint = ROSEWOOD): MeshStandardMaterial {
  return new MeshStandardMaterial({
    map: color,
    color: tint,
    normalMap: normal,
    normalScale: new Vector2(0.4, 0.4),
    roughness: 0.38,
    envMapIntensity: 0.45,
  })
}

export const ROSEWOOD = CHERRY
export const ROSEWOOD_BAND = CHERRY_DEEP

// Si las texturas no cargan: cerezo liso.
export const rosewoodPlain = new MeshStandardMaterial({ color: CHERRY_PLAIN, roughness: 0.4 })
export const rosewoodBandPlain = new MeshStandardMaterial({ color: CHERRY_DEEP_PLAIN, roughness: 0.4 })

// Cuero de la tapa: el grano sale del normal map del yeso (CC0), en una copia de la textura con su propia
// repetición para no alterar la de las paredes.
export function createLeather(grain: Texture): MeshStandardMaterial {
  const map = grain.clone()
  map.repeat.set(LEATHER.width / 0.18, LEATHER.depth / 0.18)
  map.needsUpdate = true
  return new MeshStandardMaterial({
    color: '#3b4341',
    normalMap: map,
    normalScale: new Vector2(0.35, 0.35),
    roughness: 0.62,
    envMapIntensity: 0.4,
  })
}

export const leatherPlain = new MeshStandardMaterial({ color: '#3b4341', roughness: 0.62 })

// Bronce dorado (ormolú): metálico, satinado, más cálido y claro que el latón de la vitrina.
export const ormolu = new MeshStandardMaterial({ color: '#c99f55', metalness: 0.85, roughness: 0.32, envMapIntensity: 1 })
