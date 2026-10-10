import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

interface Props {
  onDone: () => void
}

// Compila todos los shaders de la escena antes del primer cuadro, sin bloquear la página:
// compileAsync usa KHR_parallel_shader_compile y espera en segundo plano. Sin esto, cada
// material se compila en su primer uso y congela el hilo principal (en GPUs integradas, ~150 ms
// por shader). Va al final del árbol para que corra cuando el entorno y las texturas ya están.
export function Precompile({ onDone }: Props) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    let alive = true
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (alive) onDone()
      })
    return () => {
      alive = false
    }
  }, [gl, scene, camera, onDone])

  return null
}
