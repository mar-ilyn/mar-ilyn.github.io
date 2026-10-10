import {
  CubeUVReflectionMapping,
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  LinearSRGBColorSpace,
  Loader,
  RGBAFormat,
} from 'three'

// Decodifica RGBE de 8 bits (r, g, b, exponente) a flotantes de 16 bits.
export function rgbeToHalf(rgbe: Uint8ClampedArray | Uint8Array): Uint16Array {
  const half = new Uint16Array(rgbe.length)
  for (let i = 0; i < rgbe.length; i += 4) {
    const e = rgbe[i + 3]
    const f = e === 0 ? 0 : Math.pow(2, e - 136)
    half[i] = DataUtils.toHalfFloat(rgbe[i] * f)
    half[i + 1] = DataUtils.toHalfFloat(rgbe[i + 1] * f)
    half[i + 2] = DataUtils.toHalfFloat(rgbe[i + 2] * f)
    half[i + 3] = DataUtils.toHalfFloat(1)
  }
  return half
}

// Carga el entorno prefiltrado (PMREM) que genera scripts/bake-environment.mjs. three.js lo usa
// directo como mapa de reflejos, sin compilar ni ejecutar el shader de prefiltrado en el navegador.
export class PrebakedEnvironmentLoader extends Loader<DataTexture> {
  load(
    url: string,
    onLoad: (texture: DataTexture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) {
    this.manager.itemStart(url)
    this.read(url)
      .then((texture) => {
        onLoad(texture)
        this.manager.itemEnd(url)
      })
      .catch((error) => {
        onError?.(error)
        this.manager.itemError(url)
        this.manager.itemEnd(url)
      })
    void onProgress
  }

  private async read(url: string): Promise<DataTexture> {
    const res = await fetch(this.manager.resolveURL(url))
    if (!res.ok) throw new Error(`Entorno no disponible: ${res.status}`)
    // Sin premultiplicar ni convertir color: el canal alfa es el exponente RGBE.
    const bitmap = await createImageBitmap(await res.blob(), {
      premultiplyAlpha: 'none',
      colorSpaceConversion: 'none',
    })
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D no disponible')
    ctx.drawImage(bitmap, 0, 0)
    const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
    const texture = new DataTexture(rgbeToHalf(data), bitmap.width, bitmap.height, RGBAFormat, HalfFloatType)
    texture.mapping = CubeUVReflectionMapping
    texture.colorSpace = LinearSRGBColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    bitmap.close()
    return texture
  }
}
