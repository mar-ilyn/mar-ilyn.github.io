import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { profile } from '../data/profile'
import { INTRO_LABEL, INTRO_X, introLabelX, ROOM, tallIntro } from './layout'
import { Lettering } from './Lettering'
import { labelFace, labelShadow, listWithY } from './museumLabel'
import { fillTracked, INK, plaqueBrass, plaqueGeometry, plaqueTexture, serifFont, SOFT_INK, wrap, type PlaqueStyle } from './plaque'
import type { Quality } from './quality'

// Cartela de la intro, junto al retrato: la misma placa de museo que las plaquitas del friso (plaque.ts),
// con el nombre en letras de bronce en relieve, como el título de los proyectos en la pared, y debajo,
// impresos, el rol, "Portfolio" con el año, el stack y la frase. El mismo contenido está en el HTML
// (IntroText, oculto a la vista) para lectores de pantalla y buscadores. En pantallas verticales es
// angosta, con el nombre en dos líneas, y va pegada al retrato para que la cámara encuadre los dos de
// cerca (introPose). Medidas sin la escala de la cartela (INTRO_LABEL.scale).

const year = String(new Date().getFullYear())

interface Line {
  text: string
  size: number
  // Línea de base (desde arriba de la placa); con wrap, la de la primera línea.
  y: number
  weight?: number
  soft?: boolean
  // Mayúsculas espaciadas (em).
  tracking?: number
  // Ancho máximo: el texto se corta en varias líneas separadas por lineHeight.
  wrap?: number
  lineHeight?: number
  // Segunda parte en peso normal, a continuación (el año después de "Portfolio").
  after?: string
}

interface Design {
  style: PlaqueStyle
  // Nombre en letras de bronce: un renglón por línea, con el centro de las mayúsculas a esas alturas.
  name: { lines: string[]; size: number; y: number[] }
  lines: Line[]
  pxScale: number
}

const NAME = profile.name.toLocaleUpperCase('es')
const NAME_TRACKING = 0.16

const WIDE: Design = {
  style: { width: INTRO_LABEL.width, height: INTRO_LABEL.height, corner: 0.05, rim: 0.014, detail: 3 },
  name: { lines: [NAME], size: 0.15, y: [0.19] },
  lines: [
    { text: profile.role.toLocaleUpperCase('es'), size: 0.058, y: 0.335, weight: 600, soft: true, tracking: 0.12 },
    { text: profile.label.title, after: year, size: 0.084, y: 0.465, weight: 650 },
    { text: listWithY(profile.stack), size: 0.084, y: 0.565 },
    { text: profile.tagline, size: 0.066, y: 0.675, soft: true, wrap: 1.56, lineHeight: 0.09 },
  ],
  pxScale: 1,
}

const TALL: Design = {
  style: { width: INTRO_LABEL.tall.width, height: INTRO_LABEL.tall.height, corner: 0.032, rim: 0.009, detail: 2 },
  name: { lines: NAME.split(' '), size: 0.1, y: [0.165, 0.275] },
  lines: [
    { text: profile.role.toLocaleUpperCase('es'), size: 0.038, y: 0.385, weight: 600, soft: true, tracking: 0.05 },
    { text: profile.label.title, after: year, size: 0.07, y: 0.49, weight: 650 },
    { text: listWithY(profile.stack), size: 0.07, y: 0.575, wrap: 0.72, lineHeight: 0.08 },
    { text: profile.tagline, size: 0.062, y: 0.75, soft: true, wrap: 0.72, lineHeight: 0.078 },
  ],
  pxScale: 1.3,
}

function drawLines(ctx: CanvasRenderingContext2D, m: (v: number) => number, width: number, lines: Line[]) {
  const cx = m(width / 2)
  for (const line of lines) {
    const weight = line.weight ?? 500
    ctx.font = serifFont(weight, m(line.size))
    ctx.fillStyle = line.soft ? SOFT_INK : INK
    if (line.tracking) {
      ctx.textAlign = 'left'
      fillTracked(ctx, line.text, cx, m(line.y), m(line.size * line.tracking))
    } else if (line.after) {
      // "Portfolio" en negrita y el año en peso normal, centrados como un solo texto.
      const first = ctx.measureText(line.text).width
      const gap = ctx.measureText('  ').width
      ctx.font = serifFont(450, m(line.size))
      const second = ctx.measureText(line.after).width
      const left = cx - (first + gap + second) / 2
      ctx.textAlign = 'left'
      ctx.fillText(line.after, left + first + gap, m(line.y))
      ctx.font = serifFont(weight, m(line.size))
      ctx.fillText(line.text, left, m(line.y))
    } else {
      ctx.textAlign = 'center'
      const rows = line.wrap ? wrap(ctx, line.text, m(line.wrap)) : [line.text]
      rows.forEach((row, i) => ctx.fillText(row, cx, m(line.y + i * (line.lineHeight ?? line.size * 1.3))))
    }
  }
}

// En calidad baja, una textura más chica (menos píxeles que subir a la GPU).
function introPlaqueFace(design: Design, quality: Quality) {
  const pxPerM = (quality === 'high' ? 1100 : 700) * design.pxScale
  const texture = plaqueTexture(design.style, pxPerM, [450, 500, 600, 650], (ctx, m) => drawLines(ctx, m, design.style.width, design.lines))
  const material = labelFace(texture)
  // Fuera del contorno (los recortes de las esquinas) la textura es transparente.
  material.alphaTest = 0.5
  return material
}

export function IntroLabel({ quality }: { quality: Quality }) {
  const tall = useThree((s) => tallIntro(s.size.width / Math.max(1, s.size.height)))
  const design = tall ? TALL : WIDE
  const { width, height, corner } = design.style
  const { depth, standoff, center, scale } = INTRO_LABEL
  const face = useMemo(() => introPlaqueFace(design, quality), [design, quality])
  const body = useMemo(() => plaqueGeometry(width, height, corner, depth), [width, height, corner, depth])
  const shadow = useMemo(() => labelShadow(), [])
  // Al girar la pantalla cambia la cartela: se liberan la textura, el material y el cuerpo de la anterior.
  useEffect(
    () => () => {
      face.map?.dispose()
      face.dispose()
    },
    [face],
  )
  useEffect(() => () => body.dispose(), [body])
  const front = standoff + depth
  return (
    <group name="intro-label" position={[INTRO_X + introLabelX(tall), center.y, ROOM.wallZ]} scale={scale}>
      <mesh material={shadow} position={[0.015, -0.03, 0.002]} scale={[width * 1.08, height * 1.1, 1]} renderOrder={1}>
        <planeGeometry />
      </mesh>
      {/* Cuerpo de latón y la cara impresa al frente. */}
      <mesh geometry={body} material={plaqueBrass} position={[0, 0, standoff]} />
      <mesh material={face} position={[0, 0, front + 0.0005]}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {design.name.lines.map((line, i) => (
        <Lettering
          key={line}
          text={line}
          position={[0, height / 2 - design.name.y[i], front + 0.001]}
          size={design.name.size}
          tracking={NAME_TRACKING}
        />
      ))}
    </group>
  )
}
