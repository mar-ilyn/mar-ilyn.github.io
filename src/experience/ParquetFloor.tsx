import { MeshReflectorMaterial, useKTX2 } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import { Vector2, type MeshStandardMaterial } from 'three'
import { BASIS_PATH, TEXTURES, tile } from './assets'
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
  const [color, normal, arm] = useKTX2(
    [TEXTURES.parquet.color, TEXTURES.parquet.normal, TEXTURES.parquet.arm],
    BASIS_PATH,
  )
  const maps = useMemo(() => {
    const rx = length / TILE_METERS
    const ry = depth / TILE_METERS
    for (const t of [color, normal, arm]) {
      tile(t, rx, ry, t === color)
      t.anisotropy = Math.min(quality === 'high' ? 8 : 4, anisotropy)
    }
    return { color, normal, arm }
  }, [color, normal, arm, length, depth, quality, anisotropy])

  const normalScale = useMemo(() => new Vector2(0.6, 0.6), [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} name="floor">
      <planeGeometry args={[length, depth]} />
      {quality === 'high' ? (
        // Reflejo suave y difuso, como un parquet encerado. Solo en equipos potentes.
        <MeshReflectorMaterial
          map={maps.color}
          normalMap={maps.normal}
          normalScale={normalScale}
          roughnessMap={maps.arm}
          aoMap={maps.arm}
          roughness={1}
          metalness={0}
          blur={[400, 120]}
          resolution={512}
          mixBlur={1}
          mixStrength={0.55}
          mixContrast={1}
          mirror={0}
          depthScale={0.6}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.2}
        />
      ) : (
        <meshStandardMaterial
          map={maps.color}
          normalMap={maps.normal}
          normalScale={normalScale}
          roughnessMap={maps.arm}
          aoMap={maps.arm}
          onUpdate={addMacroVariation}
        />
      )}
    </mesh>
  )
}

// Mientras llegan las texturas, un piso liso del mismo tono: la escena se ve desde el primer cuadro.
export function ParquetFloor(props: Props) {
  return (
    <Suspense
      fallback={
        <mesh rotation={[-Math.PI / 2, 0, 0]} name="floor-fallback">
          <planeGeometry args={[props.length, props.depth]} />
          <meshStandardMaterial color={BASE_TINT} roughness={0.6} />
        </mesh>
      }
    >
      <TexturedFloor {...props} />
    </Suspense>
  )
}
