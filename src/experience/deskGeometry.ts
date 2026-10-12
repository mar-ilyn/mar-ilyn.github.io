import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, Group, Shape, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three'
import { bake } from './bake'
import { DESK, SURFACE } from './deskLayout'
import { place, ring } from './ornament'
import { woodBox } from './vitrineGeometry'

// Escritorio Luis XV, modelado por código: tapa de palisandro con cuero repujado (rodeado por una banda
// de enchapado más oscura) y canto de cuentas de
// bronce dorado, dos cajoneras con cajones enmarcados en dorado y tiradores rococó, cajón central,
// apliques dorados en las esquinas y patas cortas con zapatas doradas.
// Coordenadas relativas al centro del escritorio (x, z) y al piso (y); el frente mira a +z.

export interface DeskGeometries {
  wood: BufferGeometry
  band: BufferGeometry
  leather: BufferGeometry
  gilt: BufferGeometry
}

const { width: W, depth: D, height: H, top: T } = DESK
export const PEDESTAL = { width: 0.4, depth: 0.66, x: W / 2 - 0.22, foot: 0.07 } as const
export const LEATHER = { width: W - 0.18, depth: D - 0.18 } as const
const BODY_TOP = H - T

// Tirador rococó: un asa en arco entre dos rosetas.
function handle(gilt: Group, x: number, y: number, z: number) {
  place(gilt, new TorusGeometry(0.028, 0.0035, 6, 18, Math.PI), { position: [x, y - 0.006, z + 0.012], rotation: [0, 0, Math.PI] })
  for (const s of [-1, 1]) {
    place(gilt, new SphereGeometry(1, 10, 8), { position: [x + s * 0.028, y, z + 0.004], scale: [0.012, 0.016, 0.005] })
  }
}

// Frente de cajón: panel de palisandro apenas saliente, filete dorado alrededor y tirador.
function drawer(wood: Group, gilt: Group, x: number, y: number, z: number, w: number, h: number) {
  place(wood, woodBox(w, h, 0.012), { position: [x, y, z + 0.006] })
  place(gilt, ring(w - 0.016, h - 0.016, w - 0.026, h - 0.026, 0.003, 0.001), { position: [x, y, z + 0.0125] })
  handle(gilt, x, y, z + 0.012)
}

// Aplique de esquina (chute): una hoja alargada que se afina hacia abajo, con una voluta arriba.
function chuteShape(): Shape {
  const s = new Shape()
  s.moveTo(0, -0.09)
  s.bezierCurveTo(0.012, -0.04, 0.026, 0.02, 0.018, 0.06)
  s.bezierCurveTo(0.012, 0.085, -0.012, 0.085, -0.018, 0.06)
  s.bezierCurveTo(-0.026, 0.02, -0.012, -0.04, 0, -0.09)
  return s
}

function chute(gilt: Group, x: number, z: number, angle: number) {
  const leaf = new ExtrudeGeometry(chuteShape(), { depth: 0.006, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2, curveSegments: 10 })
  const y = BODY_TOP - 0.1
  place(gilt, leaf, { position: [x, y, z], rotation: [0, angle, 0] })
  place(gilt, new TorusGeometry(0.012, 0.004, 6, 14), { position: [x, y + 0.09, z], rotation: [0, angle, 0] })
}

// Fila de cuentas doradas a lo largo de un canto (eje x o z), entre dos filetes lisos.
function beads(gilt: Group, length: number, along: 'x' | 'z', offset: number) {
  const n = Math.round(length / 0.018)
  const step = length / n
  const y = H - T / 2
  const bead = new SphereGeometry(1, 8, 6)
  for (let i = 0; i < n; i++) {
    const t = -length / 2 + step * (i + 0.5)
    const position: [number, number, number] = along === 'x' ? [t, y, offset] : [offset, y, t]
    const scale: [number, number, number] = along === 'x' ? [0.0075, 0.0085, 0.004] : [0.004, 0.0085, 0.0075]
    place(gilt, bead, { position, scale })
  }
  for (const dy of [-T / 2 + 0.003, T / 2 - 0.003]) {
    const size: [number, number, number] = along === 'x' ? [length, 0.004, 0.006] : [0.006, 0.004, length]
    place(gilt, new BoxGeometry(...size), { position: along === 'x' ? [0, y + dy, offset] : [offset, y + dy, 0] })
  }
}

export function deskGeometries(): DeskGeometries {
  const wood = new Group()
  const band = new Group()
  const leather = new Group()
  const gilt = new Group()

  // Tapa: palisandro con el canto de cuentas doradas y el cuero al centro, con un filete repujado.
  place(wood, woodBox(W, T, D), { position: [0, H - T / 2, 0] })
  beads(gilt, W, 'x', D / 2 + 0.002)
  beads(gilt, W, 'x', -D / 2 - 0.002)
  beads(gilt, D, 'z', W / 2 + 0.002)
  beads(gilt, D, 'z', -W / 2 - 0.002)
  place(leather, new BoxGeometry(LEATHER.width, 0.003, LEATHER.depth), { position: [0, SURFACE - 0.0015, 0] })
  // Banda de enchapado más oscura alrededor del cuero.
  place(band, ring(LEATHER.width + 0.07, LEATHER.depth + 0.07, LEATHER.width, LEATHER.depth, 0.0006, 0), {
    position: [0, H + 0.0006, 0],
    rotation: [-Math.PI / 2, 0, 0],
  })
  place(gilt, ring(LEATHER.width - 0.04, LEATHER.depth - 0.04, LEATHER.width - 0.048, LEATHER.depth - 0.048, 0.0008, 0), {
    position: [0, SURFACE + 0.0003, 0],
    rotation: [-Math.PI / 2, 0, 0],
  })

  // Cajoneras sobre patas cortas, con tres cajones al frente y un panel enmarcado a cada lado.
  for (const s of [-1, 1]) {
    const px = s * PEDESTAL.x
    const bodyH = BODY_TOP - PEDESTAL.foot
    place(wood, woodBox(PEDESTAL.width, bodyH, PEDESTAL.depth), { position: [px, PEDESTAL.foot + bodyH / 2, 0] })
    // Filete dorado en la base de la cajonera.
    place(gilt, new BoxGeometry(PEDESTAL.width + 0.008, 0.008, PEDESTAL.depth + 0.008), { position: [px, PEDESTAL.foot + 0.004, 0] })
    const front = PEDESTAL.depth / 2
    const drawers = [0.2, 0.4, 0.605]
    for (const y of drawers) drawer(wood, gilt, px, y + 0.01, front, PEDESTAL.width - 0.05, 0.17)
    // Panel lateral exterior, enmarcado.
    const side = new Group()
    side.position.set(px + s * (PEDESTAL.width / 2), PEDESTAL.foot + bodyH / 2, 0)
    side.rotation.set(0, (s * Math.PI) / 2, 0)
    gilt.add(side)
    place(side, ring(PEDESTAL.depth - 0.1, bodyH - 0.12, PEDESTAL.depth - 0.11, bodyH - 0.13, 0.003, 0.001), { position: [0, 0, 0.001] })
    // Apliques en las dos esquinas del frente.
    for (const e of [-1, 1]) chute(gilt, px + e * (PEDESTAL.width / 2), front, (e * Math.PI) / 4)
    // Patas: troncos de pirámide de palisandro con zapata dorada.
    for (const fx of [-1, 1]) {
      for (const fz of [-1, 1]) {
        const x = px + fx * (PEDESTAL.width / 2 - 0.035)
        const z = fz * (PEDESTAL.depth / 2 - 0.035)
        place(wood, new CylinderGeometry(0.034, 0.022, PEDESTAL.foot - 0.016, 4), {
          position: [x, 0.016 + (PEDESTAL.foot - 0.016) / 2, z],
          rotation: [0, Math.PI / 4, 0],
        })
        place(gilt, new CylinderGeometry(0.024, 0.026, 0.016, 4), { position: [x, 0.008, z], rotation: [0, Math.PI / 4, 0] })
      }
    }
  }

  // Faldón central con un cajón ancho, y panel de fondo entre las cajoneras.
  const gap = 2 * (PEDESTAL.x - PEDESTAL.width / 2)
  const apronH = 0.11
  place(wood, woodBox(gap, apronH, 0.03), { position: [0, BODY_TOP - apronH / 2, D / 2 - 0.06] })
  drawer(wood, gilt, 0, BODY_TOP - apronH / 2, D / 2 - 0.045, gap - 0.06, apronH - 0.025)
  place(wood, woodBox(gap, BODY_TOP - PEDESTAL.foot - 0.12, 0.02), {
    position: [0, PEDESTAL.foot + 0.06 + (BODY_TOP - PEDESTAL.foot - 0.12) / 2, -D / 2 + 0.08],
  })

  return { wood: bake(wood), band: bake(band), leather: bake(leather), gilt: bake(gilt) }
}
