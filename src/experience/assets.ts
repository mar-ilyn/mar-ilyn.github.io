import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

// Assets optimizados por scripts/build-assets.mjs a partir de fuentes CC0 de Poly Haven.
const BASE = `${import.meta.env.BASE_URL}assets/`

export const BASIS_PATH = `${import.meta.env.BASE_URL}basis/`

// Oclusión ambiental horneada en Blender (scripts/bake-lightmaps.mjs), una por superficie grande.
export const LIGHTMAPS = {
  floor: `${BASE}floor_ao.ktx2`,
  wall: `${BASE}wall_ao.ktx2`,
  // Sin el cuadro ni la lámpara de la intro: solo para el render del fondo de la vista en lista.
  wallBare: `${BASE}wall_ao_bare.ktx2`,
  ceiling: `${BASE}ceiling_ao.ktx2`,
} as const

// Luz directa horneada (sol de tarde por ventanas fuera de cuadro y luz del retrato), normalizada a
// 0..1; la escala real sale del horneado (bakedLighting.json).
export const LIGHT_MAPS = {
  floor: `${BASE}floor_light.ktx2`,
  wall: `${BASE}wall_light.ktx2`,
} as const

export const TEXTURES = {
  parquet: {
    color: `${BASE}parquet_color.ktx2`,
    normal: `${BASE}parquet_normal.ktx2`,
    arm: `${BASE}parquet_arm.ktx2`,
  },
  plaster: {
    normal: `${BASE}plaster_normal.ktx2`,
    arm: `${BASE}plaster_arm.ktx2`,
  },
} as const

// Molduras doradas de la pared, armadas con el mismo marco tallado (scripts/build-frame-kit.mjs).
export const GILT_FRAME = {
  albedo: `${BASE}giltframe_albedo.ktx2`,
  normal: `${BASE}giltframe_normal.ktx2`,
  orm: `${BASE}giltframe_orm.ktx2`,
} as const

// Nogal de la vitrina (black_walnut_veneer_01) y marco con atril de los certificados
// (standing_picture_frame_02), ambos de Poly Haven, CC0.
export const WALNUT = {
  color: `${BASE}walnut_color.ktx2`,
  normal: `${BASE}walnut_normal.ktx2`,
  arm: `${BASE}walnut_arm.ktx2`,
} as const
export const CERT_FRAME_MODEL = `${BASE}cert_frame.glb`

// Marco tallado (fancy_picture_frame_02, Poly Haven CC0): geometría meshopt y texturas KTX2.
export const FRAME_MODEL = `${BASE}frame.glb`

// Entorno de reflejos ya prefiltrado (scripts/bake-environment.mjs), a partir del HDRI "ballroom".
export const ENVIRONMENT = `${BASE}ballroom_pmrem.png`

export function tile(texture: Texture, repeatX: number, repeatY: number, srgb = false): Texture {
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  if (srgb) texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}
