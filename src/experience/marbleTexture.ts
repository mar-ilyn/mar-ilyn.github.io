import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// Mármol marfil apenas veteado, generado en un canvas (semilla fija, sin descargas y sin la grilla
// de una textura de baldosas). Vetas finas y translúcidas que bajan en diagonal, con leves nubes.

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createMarbleTexture(size = 512): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible')
  const rand = mulberry32(1887)

  ctx.fillStyle = '#efe4cf'
  ctx.fillRect(0, 0, size, size)

  // Nubes suaves de tono.
  for (let i = 0; i < 26; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = size * (0.08 + rand() * 0.22)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const warm = rand() > 0.5
    g.addColorStop(0, warm ? 'rgba(214, 190, 150, 0.16)' : 'rgba(255, 252, 244, 0.22)')
    g.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }

  // Vetas: trazos ondulados de arriba abajo, repetidos con desplazamiento para que encajen al repetir.
  for (let i = 0; i < 9; i++) {
    const x0 = rand() * size
    const drift = (rand() - 0.5) * size * 0.6
    const amp = 6 + rand() * 18
    const freq = 0.01 + rand() * 0.02
    ctx.strokeStyle = `rgba(150, 122, 88, ${0.12 + rand() * 0.18})`
    ctx.lineWidth = 0.6 + rand() * 1.6
    for (const offset of [-size, 0, size]) {
      ctx.beginPath()
      for (let y = 0; y <= size; y += 4) {
        const x = x0 + offset + (drift * y) / size + Math.sin(y * freq + i) * amp
        if (y === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}
