import { useLoader, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { Box3, Mesh, MeshStandardMaterial, Vector3, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { AssetBoundary } from './AssetBoundary'
import { BASIS_PATH, FRAME_MODEL } from './assets'
import { OrnateFrame } from './OrnateFrame'

interface Props {
  width: number
  height: number
  position: [number, number, number]
}

// Lienzo liso y cálido, reservado para la foto de presentación.
const CANVAS_COLOR = '#ebe3d3'
// En el modelo original (66 × 77 cm), el lienzo mide 39 × 50 cm.
const CANVAS_RATIO = { width: 0.392 / 0.66, height: 0.5 / 0.771 }

let ktx2Loader: KTX2Loader | null = null

function CarvedFrame({ height, position }: Props) {
  const gl = useThree((s) => s.gl)
  const gltf = useLoader(GLTFLoader, FRAME_MODEL, (loader) => {
    ktx2Loader ??= new KTX2Loader().setTranscoderPath(BASIS_PATH).detectSupport(gl)
    loader.setKTX2Loader(ktx2Loader)
    loader.setMeshoptDecoder(MeshoptDecoder)
  })

  const { frame, scale, size } = useMemo(() => {
    const frame: Object3D = gltf.scene.clone(true)
    frame.traverse((node) => {
      if (!(node instanceof Mesh)) return
      const source = node.material as MeshStandardMaterial
      // Oro envejecido: metálico, con la rugosidad de la textura para que no parezca plástico.
      const material = source.clone()
      material.color.set('#ffffff')
      material.metalness = 0.85
      material.roughness = 1.7
      material.envMapIntensity = 1
      // La textura original es un dorado oscuro y rojizo: se usa solo su luminancia (desgaste y
      // suciedad del tallado) sobre un oro antiguo propio.
      material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          float frameLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          diffuseColor.rgb = vec3(0.78, 0.58, 0.28) * (0.25 + 1.35 * frameLum);`,
        )
      }
      node.material = material
    })
    const box = new Box3().setFromObject(frame)
    const size = box.getSize(new Vector3())
    return { frame, scale: height / size.y, size }
  }, [gltf, height])

  const canvasW = size.x * scale * CANVAS_RATIO.width
  const canvasH = size.y * scale * CANVAS_RATIO.height

  return (
    <group position={position} name="portrait-frame">
      <primitive object={frame} scale={scale} />
      <mesh position={[0, 0, 0.012 * scale]} name="photo">
        <planeGeometry args={[canvasW + 0.04, canvasH + 0.04]} />
        <meshStandardMaterial color={CANVAS_COLOR} roughness={0.95} />
      </mesh>
    </group>
  )
}

// Marco de la foto de presentación: modelo tallado real; si no carga, el marco procedural.
export function PortraitFrame(props: Props) {
  return (
    <AssetBoundary fallback={<OrnateFrame width={props.width} height={props.height} position={props.position} />}>
      <CarvedFrame {...props} />
    </AssetBoundary>
  )
}
