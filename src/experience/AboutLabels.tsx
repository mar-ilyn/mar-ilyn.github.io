import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import { Vector3 } from 'three'
import { axisYears, entryX, formatRange, ROWS, rowOf, timeline } from '../data/timeline'
import { ROOM } from './layout'

// Textos de la zona "Sobre mí" en HTML (cartelas y años del eje), anclados a puntos de la escena:
// cada elemento declara su posición en metros (data-x/y/z) y el ancla lo proyecta a la pantalla.
// La escala sigue a la cámara (--ppm = píxeles por metro en ese punto).

const p = new Vector3()
const q = new Vector3()

export function AboutLabelsAnchor({ target }: { target: RefObject<HTMLDivElement | null> }) {
  useFrame(({ camera, size }) => {
    const root = target.current
    if (!root) return
    for (const el of Array.from(root.children) as HTMLElement[]) {
      const x = Number(el.dataset.x)
      const y = Number(el.dataset.y)
      const z = Number(el.dataset.z)
      p.set(x, y, z).project(camera)
      q.set(x + 1, y, z).project(camera)
      const hidden = p.z > 1
      el.style.visibility = hidden ? 'hidden' : 'visible'
      el.style.transform = `translate(${(((p.x + 1) / 2) * size.width).toFixed(1)}px, ${(((1 - p.y) / 2) * size.height).toFixed(1)}px) translate(-50%, -50%)`
      el.style.setProperty('--ppm', (((q.x - p.x) / 2) * size.width).toFixed(1))
    }
  })
  return null
}

const WALL = ROOM.wallZ + 0.05

export function AboutLabels({ anchorRef, visible }: { anchorRef: RefObject<HTMLDivElement | null>; visible: boolean }) {
  return (
    <div ref={anchorRef} className={`about-labels ${visible ? '' : 'about-labels--hidden'}`} aria-hidden="true">
      {timeline.map((e) => (
        <div
          key={e.slug}
          className="about-label about-label--cartela"
          data-x={entryX(e)}
          data-y={ROWS[rowOf(e.kind)].band - 0.12}
          data-z={WALL}
        >
          <strong>{e.title}</strong>
          <span>{formatRange(e)}</span>
        </div>
      ))}
      {axisYears().map(({ year, x }) => (
        <div key={year} className="about-label about-label--year" data-x={x} data-y={ROWS.laboral.band + 0.62} data-z={WALL}>
          {year}
        </div>
      ))}
    </div>
  )
}
