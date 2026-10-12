import { useMemo } from 'react'
import { CanvasTexture, MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace } from 'three'
import { profile } from '../data/profile'
import { INTRO_LABEL, INTRO_X, ROOM } from './layout'

// Cartela de museo junto al retrato: un cartón claro y mate montado en la pared, con el texto impreso
// como en las cartelas de sala (nombre, rol, título en negrita con el año, técnica y una línea de
// texto). El mismo contenido está en el HTML (IntroText, oculto a la vista) para lectores de pantalla y
// buscadores. El texto se dibuja en una textura con la tipografía del sitio (Inter) y se redibuja cuando
// termina de cargar.

const PX_PER_M = 1100
const INK = '#2b2926'
const SOFT = '#45413b'
const SANS = '"Inter Variable", Inter, "Helvetica Neue", Arial, sans-serif'

// Corta un texto en líneas que entren en `width` píxeles.
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function labelTexture(): CanvasTexture {
  const { width, height } = INTRO_LABEL
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * PX_PER_M)
  canvas.height = Math.round(height * PX_PER_M)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  const m = (meters: number) => meters * PX_PER_M

  const draw = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#f2efe9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.textBaseline = 'alphabetic'
    const left = m(0.12)
    const textWidth = canvas.width - 2 * left
    let y = m(0.22)
    const line = (text: string, size: number, weight: number, color: string, gap: number) => {
      ctx.font = `${weight} ${m(size)}px ${SANS}`
      ctx.fillStyle = color
      ctx.fillText(text, left, y)
      y += m(gap)
    }
    // Nombre y rol, como el artista y su nacionalidad.
    line(profile.name, 0.14, 400, INK, 0.1)
    line(profile.role, 0.062, 400, SOFT, 0.15)
    // Título en negrita con el año, como la obra.
    ctx.font = `600 ${m(0.062)}px ${SANS}`
    ctx.fillStyle = INK
    const title = profile.label.title
    ctx.fillText(title, left, y)
    const titleWidth = ctx.measureText(`${title}  `).width
    ctx.font = `400 ${m(0.062)}px ${SANS}`
    ctx.fillText(String(new Date().getFullYear()), left + titleWidth, y)
    y += m(0.088)
    // Técnica: el stack.
    const stack = profile.stack
    line(`${stack.slice(0, -1).join(', ')} y ${stack[stack.length - 1]}`, 0.062, 400, INK, 0.13)
    // Texto, como la línea de procedencia.
    ctx.font = `400 ${m(0.052)}px ${SANS}`
    ctx.fillStyle = SOFT
    for (const text of wrap(ctx, profile.tagline, textWidth)) {
      ctx.fillText(text, left, y)
      y += m(0.074)
    }
    texture.needsUpdate = true
  }
  draw()
  void document.fonts?.load(`600 40px ${SANS}`).then(draw)
  void document.fonts?.ready.then(draw)
  return texture
}

const board = new MeshStandardMaterial({ color: '#e9e5dd', roughness: 0.9 })

// Sombra difusa sobre la pared, apenas corrida hacia abajo.
function shadowMaterial(): MeshBasicMaterial {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.filter = 'blur(10px)'
    ctx.fillStyle = 'rgba(40, 30, 20, 1)'
    ctx.fillRect(26, 26, 204, 204)
  }
  return new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, opacity: 0.35, depthWrite: false })
}

export function IntroLabel() {
  const { width, height, depth, standoff, center } = INTRO_LABEL
  // La cara impresa con un poco de luz propia: el cartón mate quedaba gris al lado de la pared.
  const face = useMemo(() => {
    const map = labelTexture()
    return new MeshStandardMaterial({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.2, roughness: 0.92, envMapIntensity: 0.4 })
  }, [])
  const shadow = useMemo(() => shadowMaterial(), [])
  const z = ROOM.wallZ + standoff
  return (
    <group name="intro-label" position={[INTRO_X + center.x, center.y, 0]}>
      <mesh material={shadow} position={[0.015, -0.03, ROOM.wallZ + 0.002]} scale={[width * 1.08, height * 1.1, 1]} renderOrder={1}>
        <planeGeometry />
      </mesh>
      {/* Cartón (los cantos) y la cara impresa al frente. */}
      <mesh material={board} position={[0, 0, z + depth / 2]}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      <mesh material={face} position={[0, 0, z + depth + 0.0005]}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  )
}
