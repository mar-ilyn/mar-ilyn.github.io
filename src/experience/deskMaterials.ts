import { Color, MeshStandardMaterial, Vector2, type Texture } from 'three'
import { LEATHER } from './deskGeometry'

// Materiales del escritorio Luis XV: palisandro lustrado, cuero gris pizarra y bronce dorado.

// Palisandro: el enchapado de nogal (Poly Haven, CC0) llevado a un rojizo cálido; el lustre a muñeca da
// un brillo parejo. Con tint más oscuro, la banda de enchapado que rodea al cuero.
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

// El color supera 1 en rojo para que la textura, oscura, tome el tono rojizo sin apagarse.
export const ROSEWOOD = new Color().setRGB(1.12, 0.5, 0.3)
export const ROSEWOOD_BAND = new Color().setRGB(0.62, 0.27, 0.16)

// Si las texturas no cargan: palisandro liso.
export const rosewoodPlain = new MeshStandardMaterial({ color: '#6e2f18', roughness: 0.4 })
export const rosewoodBandPlain = new MeshStandardMaterial({ color: '#3f1a0e', roughness: 0.4 })

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
