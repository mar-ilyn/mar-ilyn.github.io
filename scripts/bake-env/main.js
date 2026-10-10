// Corre en el navegador (lo abre scripts/bake-environment.mjs): genera el entorno prefiltrado
// (PMREM) del HDRI con three.js y lo devuelve codificado en RGBE de 8 bits.
import { DataUtils, PMREMGenerator, WebGLRenderer } from 'three'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'

function toRGBE(r, g, b) {
  const m = Math.max(r, g, b)
  if (m < 1e-32) return [0, 0, 0, 0]
  const e = Math.ceil(Math.log2(m)) + 1
  const f = 256 / Math.pow(2, e)
  return [Math.min(255, Math.round(r * f)), Math.min(255, Math.round(g * f)), Math.min(255, Math.round(b * f)), e + 128]
}

window.bake = async (url) => {
  const renderer = new WebGLRenderer()
  const pmrem = new PMREMGenerator(renderer)
  const hdr = await new HDRLoader().loadAsync(url)
  const target = pmrem.fromEquirectangular(hdr)
  const { width, height } = target
  const half = new Uint16Array(width * height * 4)
  renderer.readRenderTargetPixels(target, 0, 0, width, height, half)
  const rgbe = new Uint8Array(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const [r, g, b, e] = toRGBE(
      DataUtils.fromHalfFloat(half[i * 4]),
      DataUtils.fromHalfFloat(half[i * 4 + 1]),
      DataUtils.fromHalfFloat(half[i * 4 + 2]),
    )
    rgbe.set([r, g, b, e], i * 4)
  }
  return { width, height, data: Array.from(rgbe) }
}
