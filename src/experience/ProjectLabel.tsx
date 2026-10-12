import { useMemo } from 'react'
import type { Project } from '../data/types'
import { labelBoard, labelFace, listWithY, museumLabelTexture } from './museumLabel'
import { PEDESTAL_LABEL, SHAFT } from './pedestalGeometry'
import type { Quality } from './quality'

// Cartela de museo del proyecto, al frente del pedestal: nombre, rol, "Proyecto" en negrita con el año,
// las tecnologías (como la técnica de una obra) y el resumen. Es lo primero que se ve al abrir un
// proyecto; el mismo contenido está en el HTML (oculto a la vista) para lectores de pantalla.

// Resolución de la textura: en calidad baja, la mitad (cuatro veces menos píxeles que subir a la GPU).
function projectLabelTexture(project: Project, quality: Quality) {
  const { width, height } = PEDESTAL_LABEL
  return museumLabelTexture({ width, height, left: 0.017, top: 0.033, pxPerM: quality === 'high' ? 4200 : 2100 }, [
    { parts: [{ text: project.title }], size: 0.021, gap: 0.016 },
    { parts: [{ text: project.role }], size: 0.0086, soft: true, gap: 0.019 },
    { parts: [{ text: 'Proyecto', weight: 600 }, { text: String(project.year) }], size: 0.0086, gap: 0.0125 },
    { parts: [{ text: listWithY(project.stack) }], size: 0.0086, wrap: true, lineHeight: 0.012, gap: 0.019 },
    { parts: [{ text: project.summary }], size: 0.008, soft: true, wrap: true, lineHeight: 0.0115, gap: 0 },
  ])
}

export function ProjectLabel({ project, quality }: { project: Project; quality: Quality }) {
  const { width, height, depth, y, z } = PEDESTAL_LABEL
  const face = useMemo(() => labelFace(projectLabelTexture(project, quality)), [project, quality])
  const back = z - depth
  return (
    <group name="project-label" position={[0, y, 0]}>
      {/* Taco de montaje entre el fuste y la cartela. */}
      <mesh material={labelBoard} position={[0, 0, (SHAFT.radius - 0.02 + back) / 2]}>
        <boxGeometry args={[width * 0.5, height * 0.5, back - SHAFT.radius + 0.02]} />
      </mesh>
      <mesh material={labelBoard} position={[0, 0, z - depth / 2]}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      <mesh material={face} position={[0, 0, z + 0.0005]}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  )
}
