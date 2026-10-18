import { useProgress } from '@react-three/drei'
import { useEffect } from 'react'
import { finishLoader, setLoaderProgress } from '../lib/loader'

// Pasa el progreso real de descarga de la escena (texturas, modelos, entorno) a la pantalla de carga de
// index.html y, cuando la escena está lista (shaders compilados y cámara ubicada), le avisa que termine.
export function useLoaderProgress(done: boolean) {
  const { progress, active } = useProgress()
  useEffect(() => {
    setLoaderProgress(Math.round(progress), !active && progress >= 100)
  }, [progress, active])
  useEffect(() => {
    if (done) finishLoader()
  }, [done])
}
