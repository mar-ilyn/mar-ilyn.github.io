import { useKTX2 } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { Vector2, type MeshStandardMaterial } from 'three'
import { AssetBoundary } from './AssetBoundary'
import { BASIS_PATH, LIGHT_MAPS, LIGHTMAPS, TEXTURES, tile } from './assets'
import bakedLighting from './bakedLighting.json'
import { FLOOR_SUN_GAIN } from './lighting'
import type { Quality } from './quality'

interface Props {
  length: number
  depth: number
  quality: Quality
}

// Metros reales que cubre una repetición de la textura de Poly Haven.
const TILE_METERS = 2
const BASE_TINT = '#9b7b5c'

// Rompe la repetición: vuelve a muestrear el color a una escala mucho mayor y lo usa como
// variación de tono suave, así no aparece un patrón que se repite cada 2 m.
function addMacroVariation(material: MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      vec3 macroSample = texture2D(map, vMapUv * 0.071 + vec2(0.37, 0.11)).rgb;
      float macroLum = dot(macroSample, vec3(0.299, 0.587, 0.114));
      diffuseColor.rgb *= mix(0.84, 1.1, smoothstep(0.22, 0.5, macroLum));`,
    )
  }
}

function TexturedFloor({ length, depth, quality }: Props) {
  const anisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy())
  const [color, normal, arm, ao, light] = useKTX2(
    [TEXTURES.parquet.color, TEXTURES.parquet.normal, TEXTURES.parquet.arm, LIGHTMAPS.floor, LIGHT_MAPS.floor],
    BASIS_PATH,
  )
  const maps = useMemo(() => {
    const rx = length / TILE_METERS
    const ry = depth / TILE_METERS
    for (const t of [color, normal, arm]) {
      tile(t, rx, ry, t === color)
      t.anisotropy = Math.min(4, anisotropy)
    }
    return { color, normal, arm, ao, light }
  }, [color, normal, arm, ao, light, length, depth, anisotropy])

  const normalScale = useMemo(() => new Vector2(0.6, 0.6), [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} name="floor">
      <planeGeometry args={[length, depth]} />
      {/* Brillo de piso encerado: en calidad alta la madera es menos rugosa y refleja el entorno
          prefiltrado. Un reflejo con espejo (MeshReflectorMaterial) volvía a dibujar la escena en
          cada cuadro y obligaba a compilar otra versión de cada material (~1 s en GPU integrada). */}
      <meshStandardMaterial
        map={maps.color}
        normalMap={maps.normal}
        normalScale={normalScale}
        roughnessMap={maps.arm}
        roughness={quality === 'high' ? 0.62 : 1}
        // Oclusión horneada (pared, pedestales) en lugar de la micro-oclusión de la textura.
        aoMap={maps.ao}
        lightMap={maps.light}
        lightMapIntensity={bakedLighting.lightScale.floor * FLOOR_SUN_GAIN}
        envMapIntensity={quality === 'high' ? 1.25 : 1}
        onUpdate={addMacroVariation}
      />
    </mesh>
  )
}

// Las texturas se esperan en el Suspense de la escena (una sola compilación de shaders).
// Si no cargan, queda un piso liso del mismo tono.
export function ParquetFloor(props: Props) {
  return (
    <AssetBoundary
      fallback={
        <mesh rotation={[-Math.PI / 2, 0, 0]} name="floor-fallback">
          <planeGeometry args={[props.length, props.depth]} />
          <meshStandardMaterial color={BASE_TINT} roughness={0.6} />
        </mesh>
      }
    >
      <TexturedFloor {...props} />
    </AssetBoundary>
  )
}
