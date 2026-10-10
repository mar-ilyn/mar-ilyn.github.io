// Nivel de calidad según el dispositivo. "high": reflejo del piso, oclusión ambiental y bloom.
// "low" (celulares y equipos modestos): sin esos efectos y con menos resolución.
export type Quality = 'high' | 'low'

interface DeviceHints {
  coarsePointer: boolean
  cores: number
  memoryGB: number | undefined
  shortSide: number
}

export function detectQuality({ coarsePointer, cores, memoryGB, shortSide }: DeviceHints): Quality {
  if (coarsePointer || shortSide < 600) return 'low'
  if (cores < 6) return 'low'
  if (memoryGB !== undefined && memoryGB < 6) return 'low'
  return 'high'
}

export function readDeviceHints(): DeviceHints {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    cores: nav.hardwareConcurrency || 4,
    memoryGB: nav.deviceMemory,
    shortSide: Math.min(window.screen.width, window.screen.height),
  }
}

// Modos de render para scripts/render-images.mjs (imágenes de la vista en lista):
//   fondo: la sala de la intro sin cuadro, lámpara ni texto.
//   marco: solo el marco tallado y la lámpara, con fondo transparente.
export type RenderMode = 'fondo' | 'marco'

// ?debug muestra el medidor de cuadros por segundo; ?calidad=alta|baja fuerza el nivel.
export function readUrlOverrides(search: string): { debug: boolean; quality?: Quality; render?: RenderMode } {
  const params = new URLSearchParams(search)
  const forced = params.get('calidad')
  const render = params.get('render')
  return {
    debug: params.has('debug'),
    quality: forced === 'alta' ? 'high' : forced === 'baja' ? 'low' : undefined,
    render: render === 'fondo' || render === 'marco' ? render : undefined,
  }
}
