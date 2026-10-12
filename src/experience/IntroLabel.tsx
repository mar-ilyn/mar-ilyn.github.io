import { useMemo } from 'react'
import { profile } from '../data/profile'
import { INTRO_LABEL, INTRO_X, ROOM } from './layout'
import { labelBoard, labelFace, labelShadow, listWithY, museumLabelTexture } from './museumLabel'
import type { Quality } from './quality'

// Cartela de museo junto al retrato: un cartón claro y mate montado en la pared, con el texto impreso
// como en las cartelas de sala (nombre, rol, título en negrita con el año, técnica y una línea de
// texto). El mismo contenido está en el HTML (IntroText, oculto a la vista) para lectores de pantalla y
// buscadores.

// En calidad baja, una textura más chica (menos píxeles que subir a la GPU).
function introLabelTexture(quality: Quality) {
  const { width, height } = INTRO_LABEL
  return museumLabelTexture({ width, height, left: 0.12, top: 0.22, pxPerM: quality === 'high' ? 1100 : 700 }, [
    // Nombre y rol, como el artista y su nacionalidad.
    { parts: [{ text: profile.name }], size: 0.14, gap: 0.1 },
    { parts: [{ text: profile.role }], size: 0.062, soft: true, gap: 0.15 },
    // Título en negrita con el año, como la obra.
    { parts: [{ text: profile.label.title, weight: 600 }, { text: String(new Date().getFullYear()) }], size: 0.062, gap: 0.088 },
    // Técnica: el stack.
    { parts: [{ text: listWithY(profile.stack) }], size: 0.062, gap: 0.13 },
    // Texto, como la línea de procedencia.
    { parts: [{ text: profile.tagline }], size: 0.052, soft: true, wrap: true, lineHeight: 0.074, gap: 0 },
  ])
}

export function IntroLabel({ quality }: { quality: Quality }) {
  const { width, height, depth, standoff, center, scale } = INTRO_LABEL
  const face = useMemo(() => labelFace(introLabelTexture(quality)), [quality])
  const shadow = useMemo(() => labelShadow(), [])
  return (
    <group name="intro-label" position={[INTRO_X + center.x, center.y, ROOM.wallZ]} scale={scale}>
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
