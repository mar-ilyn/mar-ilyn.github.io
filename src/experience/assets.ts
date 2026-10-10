import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

// Assets optimizados por scripts/build-assets.mjs a partir de fuentes CC0 de Poly Haven.
const BASE = `${import.meta.env.BASE_URL}assets/`

export const BASIS_PATH = `${import.meta.env.BASE_URL}basis/`

// Oclusión ambiental horneada en Blender (scripts/bake-lightmaps.mjs), una por superficie grande.
export const LIGHTMAPS = {
  floor: `${BASE}floor_ao.ktx2`,
  wall: `${BASE}wall_ao.ktx2`,
  ceiling: `${BASE}ceiling_ao.ktx2`,
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
