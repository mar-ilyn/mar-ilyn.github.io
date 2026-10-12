import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector2,
  type Texture,
} from 'three'

// Materiales de la zona "Sobre mí". Paleta: nogal oscuro satinado, latón envejecido, fondo de lino claro,
// vidrio, cuero, papel marfil. Los efectos de luz (manchas, sombras de contacto, reflejos del vidrio) son
// texturas de degradé sobre planos: livianos y sin luces en tiempo real.

export function createWalnut(color: Texture, normal: Texture, _arm: Texture): MeshStandardMaterial {
  color.colorSpace = SRGBColorSpace
  for (const t of [color, normal]) {
    t.anisotropy = 4
    t.needsUpdate = true
  }
  return new MeshStandardMaterial({
    map: color,
    // Nogal oscuro: la textura se tiñe hacia un marrón profundo, con brillo satinado.
    color: new Color('#6e4f3c'),
    normalMap: normal,
    normalScale: new Vector2(0.5, 0.5),
    // Satinado parejo: el mapa de rugosidad del enchapado es de un barniz brillante y reflejaba la
    // ventana del entorno como una mancha clara.
    roughness: 0.62,
    envMapIntensity: 0.22,
  })
}

// Si las texturas no cargan: nogal liso.
export const walnutPlain = new MeshStandardMaterial({ color: '#3d281c', roughness: 0.5 })

export const agedBrass = new MeshStandardMaterial({ color: '#a5844c', metalness: 0.8, roughness: 0.42 })
// Fondo claro de los compartimentos: lino marfil, mate.
export const backing = new MeshStandardMaterial({ color: '#e4dbc8', roughness: 0.95, envMapIntensity: 0.6 })
// Líneas del friso sobre el fondo claro: bronce oscuro, para que contrasten.
export const bronze = new MeshStandardMaterial({ color: '#6f5128', metalness: 0.6, roughness: 0.45 })
// Tiras de luz del mueble (bajo el techo y bajo el estante de vidrio).
export const cabinetGlow = new MeshBasicMaterial({ color: '#fff2d8' })
export const velvet = new MeshStandardMaterial({ color: '#3e1f22', roughness: 1 })
export const paper = new MeshStandardMaterial({ color: '#efe7d6', roughness: 0.9 })
export const paperLabel = new MeshStandardMaterial({ color: '#f8f5ee', roughness: 0.85 })
export const cardboard = new MeshStandardMaterial({ color: '#a9824f', roughness: 0.92 })
export const charcoal = new MeshStandardMaterial({ color: '#3a3b3d', metalness: 0.55, roughness: 0.45 })
export const keycap = new MeshStandardMaterial({ color: '#4c4d50', roughness: 0.7 })
export const leather = new MeshStandardMaterial({ color: '#5a2a1e', roughness: 0.6 })
export const leatherGreen = new MeshStandardMaterial({ color: '#2f3d2c', roughness: 0.6 })
export const leatherBlue = new MeshStandardMaterial({ color: '#23304a', roughness: 0.6 })
export const pages = new MeshStandardMaterial({ color: '#e6dcc4', roughness: 0.95 })
export const gilt = new MeshStandardMaterial({ color: '#c9a35e', metalness: 0.8, roughness: 0.35 })
export const certificatePaper = new MeshStandardMaterial({ color: '#f1ead9', roughness: 0.92 })

// Vidrio: casi transparente, refleja el entorno (las ventanas de la galería) solo de forma tenue.
export const glass = new MeshPhysicalMaterial({
  color: '#ffffff',
  metalness: 0,
  roughness: 0.04,
  transparent: true,
  opacity: 0.08,
  envMapIntensity: 1.6,
  depthWrite: false,
})

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible')
  draw(ctx, size)
  return new CanvasTexture(canvas)
}

// Degradé radial blanco → transparente: se tiñe con el color del material.
const radial = canvasTexture(128, (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
})

// Hoja de documentación de la caja de envío: renglones y un código de barras genéricos (sin datos ni
// marcas), dibujados en una textura con mipmaps para que no titilen a ninguna escala.
const documentTexture = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 240
  canvas.height = 260
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D no disponible')
  ctx.fillStyle = '#f4f0e6'
  ctx.fillRect(0, 0, 240, 260)
  ctx.fillStyle = '#3d3a37'
  ctx.fillRect(22, 22, 90, 18)
  const widths = [190, 170, 120, 190, 150, 110]
  widths.forEach((lw, i) => ctx.fillRect(22, 60 + i * 22, lw, 7))
  // Código de barras: barras de ancho fijo por patrón, sin codificar nada.
  let x = 22
  for (let i = 0; x < 214; i++) {
    const bar = i % 3 === 0 ? 5 : i % 2 === 0 ? 3 : 2
    ctx.fillRect(x, 200, bar, 38)
    x += bar + 3
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
})()

export const shippingDocument = new MeshStandardMaterial({ map: documentTexture, roughness: 0.85 })

// Luz cálida y tenue de los focos sobre el estante y el fondo.
export const lightPool = new MeshBasicMaterial({
  color: '#ffcf8f',
  map: radial,
  transparent: true,
  opacity: 0.16,
  blending: AdditiveBlending,
  depthWrite: false,
})

// Sombra de contacto bajo cada objeto.
export const contactShadow = new MeshBasicMaterial({
  color: '#000000',
  alphaMap: radial,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
})

// Reflejos localizados en el vidrio: dos franjas suaves en diagonal, como ventanas reflejadas.
const streaks = canvasTexture(256, (ctx, s) => {
  ctx.translate(s / 2, s / 2)
  ctx.rotate(-0.5)
  for (const [x, w, a] of [
    [-40, 46, 0.55],
    [30, 18, 0.35],
  ]) {
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.5, `rgba(255,255,255,${a})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - w, -s, w * 2, s * 2)
  }
})

export const glassReflection = new MeshBasicMaterial({
  color: '#fff4e2',
  map: streaks,
  transparent: true,
  opacity: 0.1,
  blending: AdditiveBlending,
  depthWrite: false,
})
