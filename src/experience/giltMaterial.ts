import { Color, MeshStandardMaterial, SRGBColorSpace, Vector2, type Texture } from 'three'

// Oro a la hoja envejecido sobre madera tallada: el color sale de la luminancia del render del marco
// y se lleva a una paleta ocre apagada (recovecos marrones, altos ocre, desgaste claro en los cantos).
// Rugosidad entre 0,35 y 0,55 según el mapa; metal solo moderado, sin reflejos tipo espejo.
const RECESS = new Color('#4a3118')
const BASE = new Color('#a67c3d')
const WEAR = new Color('#d6b56c')

const vec3 = (c: Color) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`

export function createGiltMaterial(albedo: Texture, normal: Texture, orm: Texture): MeshStandardMaterial {
  albedo.colorSpace = SRGBColorSpace
  for (const t of [albedo, normal, orm]) {
    t.anisotropy = 4
    t.needsUpdate = true
  }
  const material = new MeshStandardMaterial({
    map: albedo,
    normalMap: normal,
    // La textura KTX2 no se invierte al cargar: el eje v de la normal queda al revés.
    normalScale: new Vector2(1.1, -1.1),
    aoMap: orm,
    aoMapIntensity: 1,
    roughnessMap: orm,
    metalnessMap: orm,
    metalness: 0.72,
    roughness: 1,
    envMapIntensity: 0.8,
    alphaTest: 0.5,
  })
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float giltLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        vec3 gilt = mix(${vec3(RECESS)}, ${vec3(BASE)}, smoothstep(0.015, 0.11, giltLum));
        gilt = mix(gilt, ${vec3(WEAR)}, smoothstep(0.14, 0.3, giltLum) * 0.75);
        diffuseColor.rgb = gilt;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = mix(0.35, 0.55, texture2D(roughnessMap, vRoughnessMapUv).g);`,
      )
  }
  return material
}
