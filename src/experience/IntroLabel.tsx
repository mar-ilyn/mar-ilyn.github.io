import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { profile } from '../data/profile'
import { INTRO_LABEL, INTRO_X, introLabelX, ROOM, tallIntro } from './layout'
import { labelBoard, labelFace, labelShadow, listWithY, museumLabelTexture, type LabelLine } from './museumLabel'
import type { Quality } from './quality'

// Cartela de museo junto al retrato: un cartón claro y mate montado en la pared, con el texto impreso
// como en las cartelas de sala (nombre, rol, título en negrita con el año, técnica y una línea de
// texto). El mismo contenido está en el HTML (IntroText, oculto a la vista) para lectores de pantalla y
// buscadores. En pantallas verticales es angosta, con el texto más grande en proporción, y va pegada al
// retrato para que la cámara encuadre los dos de cerca (introPose).

const year = String(new Date().getFullYear())

const WIDE_LINES: readonly LabelLine[] = [
  // Nombre y rol, como el artista y su nacionalidad.
  { parts: [{ text: profile.name }], size: 0.14, gap: 0.1 },
  { parts: [{ text: profile.role }], size: 0.062, soft: true, gap: 0.15 },
  // Título en negrita con el año, como la obra.
  { parts: [{ text: profile.label.title, weight: 600 }, { text: year }], size: 0.062, gap: 0.088 },
  // Técnica: el stack.
  { parts: [{ text: listWithY(profile.stack) }], size: 0.062, gap: 0.13 },
  // Texto, como la línea de procedencia.
  { parts: [{ text: profile.tagline }], size: 0.052, soft: true, wrap: true, lineHeight: 0.074, gap: 0 },
]

const TALL_LINES: readonly LabelLine[] = [
  { parts: [{ text: profile.name }], size: 0.105, gap: 0.09 },
  { parts: [{ text: profile.role }], size: 0.056, soft: true, wrap: true, lineHeight: 0.076, gap: 0.115 },
  { parts: [{ text: profile.label.title, weight: 600 }, { text: year }], size: 0.064, gap: 0.085 },
  { parts: [{ text: listWithY(profile.stack) }], size: 0.064, wrap: true, lineHeight: 0.084, gap: 0.115 },
  { parts: [{ text: profile.tagline }], size: 0.058, soft: true, wrap: true, lineHeight: 0.08, gap: 0 },
]

// En calidad baja, una textura más chica (menos píxeles que subir a la GPU).
function introLabelTexture(quality: Quality, tall: boolean) {
  const { width, height } = tall ? INTRO_LABEL.tall : INTRO_LABEL
  const pxPerM = quality === 'high' ? 1100 : 700
  return tall
    ? museumLabelTexture({ width, height, left: 0.06, top: 0.17, pxPerM: pxPerM * 1.3 }, TALL_LINES)
    : museumLabelTexture({ width, height, left: 0.12, top: 0.22, pxPerM }, WIDE_LINES)
}

export function IntroLabel({ quality }: { quality: Quality }) {
  const tall = useThree((s) => tallIntro(s.size.width / Math.max(1, s.size.height)))
  const { depth, standoff, center, scale } = INTRO_LABEL
  const { width, height } = tall ? INTRO_LABEL.tall : INTRO_LABEL
  const face = useMemo(() => labelFace(introLabelTexture(quality, tall)), [quality, tall])
  const shadow = useMemo(() => labelShadow(), [])
  // Al girar la pantalla cambia la cartela: se liberan la textura y el material de la anterior.
  useEffect(
    () => () => {
      face.map?.dispose()
      face.dispose()
    },
    [face],
  )
  return (
    <group name="intro-label" position={[INTRO_X + introLabelX(tall), center.y, ROOM.wallZ]} scale={scale}>
      <mesh material={shadow} position={[0.015, -0.03, 0.002]} scale={[width * 1.08, height * 1.1, 1]} renderOrder={1}>
        <planeGeometry />
      </mesh>
      {/* Cartón (los cantos) y la cara impresa al frente. */}
      <mesh material={labelBoard} position={[0, 0, standoff + depth / 2]}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      <mesh material={face} position={[0, 0, standoff + depth + 0.0005]}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  )
}
