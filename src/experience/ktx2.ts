import { useLoader, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { Texture, WebGLRenderer } from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { BASIS_PATH } from './assets'

// Un solo cargador KTX2 para toda la escena, texturas sueltas y las de los GLB: cada instancia descarga
// su propio transcodificador (~245 KB comprimido) y levanta sus propios workers.
let shared: KTX2Loader | null = null

export function ktx2Loader(gl: WebGLRenderer): KTX2Loader {
  shared ??= new KTX2Loader().setTranscoderPath(BASIS_PATH).detectSupport(gl)
  return shared
}

// Como useKTX2 de drei, pero con el cargador compartido. Sube las texturas a la GPU apenas cargan.
export function useKTX2(url: string): Texture
export function useKTX2(urls: string[]): Texture[]
export function useKTX2(input: string | string[]): Texture | Texture[] {
  const gl = useThree((s) => s.gl)
  const textures = useLoader(ktx2Loader(gl), input) as Texture | Texture[]
  useEffect(() => {
    for (const t of Array.isArray(textures) ? textures : [textures]) gl.initTexture(t)
  }, [gl, textures])
  return textures
}
