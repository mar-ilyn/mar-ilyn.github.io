import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Group, InstancedMesh, Mesh, MeshStandardMaterial, type Object3D } from 'three'

// Solo en desarrollo: expone la escena para scripts/bake-lightmaps.mjs, que la exporta a GLB y la
// hornea en Blender. Así el horneado usa exactamente la geometría que se ve, sin duplicarla.
// Las piezas que se mueven o son efectos de luz no proyectan oclusión y se excluyen.
const DYNAMIC = /^(exhibit|light-beam|light-pool)$/

declare global {
  interface Window {
    __exportStaticSceneGLB?: () => Promise<string>
  }
}

function staticCopy(scene: Object3D): Group {
  scene.updateMatrixWorld(true)
  const out = new Group()
  const plain = new MeshStandardMaterial({ color: '#bbbbbb' })
  scene.traverseVisible((node) => {
    if (DYNAMIC.test(node.name) || node.parent?.name.match(DYNAMIC)) return
    if (node instanceof InstancedMesh) {
      const copy = new InstancedMesh(node.geometry, plain, node.count)
      copy.instanceMatrix.copy(node.instanceMatrix)
      copy.applyMatrix4(node.matrixWorld)
      copy.name = node.name
      out.add(copy)
    } else if (node instanceof Mesh) {
      const copy = new Mesh(node.geometry, plain)
      copy.applyMatrix4(node.matrixWorld)
      copy.name = node.name
      out.add(copy)
    }
  })
  return out
}

export function DevSceneExport() {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    window.__exportStaticSceneGLB = async () => {
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
      const glb = (await new GLTFExporter().parseAsync(staticCopy(scene), { binary: true })) as ArrayBuffer
      const bytes = new Uint8Array(glb)
      let binary = ''
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      return btoa(binary)
    }
    return () => {
      delete window.__exportStaticSceneGLB
    }
  }, [scene])
  return null
}
