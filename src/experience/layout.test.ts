import { describe, expect, it } from 'vitest'
import { projects } from '../data/projects'
import { CABINET, SECTIONS } from '../data/timeline'
import { cabinetPose, FOV, galleryPose, INTRO_LAYOUT, INTRO_POSE, INTRO_X, introLensShift, introWidePose, poseFor, ROOM } from './layout'

const halfTan = Math.tan((FOV * Math.PI) / 360)
const detail = { name: 'project', slug: projects[0].slug } as const

describe('encuadres de cámara', () => {
  it('la galería en horizontal deja entrar todos los pedestales', () => {
    for (const aspect of [1.33, 1.78, 2.4]) {
      const pose = galleryPose(aspect, 4)
      expect(pose.position[2] * halfTan * aspect).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('el detalle deja el objeto a la derecha en horizontal y en vertical', () => {
    for (const aspect of [1.78, 0.46]) {
      const { offset } = poseFor(detail, aspect, projects)
      expect(offset[0]).toBeLessThan(0)
      expect(offset[1]).toBe(0)
    }
  })

  it('en vertical la cámara de detalle retrocede', () => {
    const dist = (aspect: number) => {
      const { position, target } = poseFor(detail, aspect, projects)
      return Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2])
    }
    expect(dist(0.46)).toBeGreaterThan(dist(1.78))
  })

  it('el acercamiento deja entrar el texto y el cuadro en horizontal, y el cuadro en vertical', () => {
    for (const [aspect, halfWidth] of [
      [1.33, 2.6],
      [1.78, 2.6],
      [0.75, 2.1],
      [0.46, 2.1],
    ]) {
      const { position, target } = poseFor({ name: 'intro' }, aspect, projects)
      const distance = position[2] - target[2]
      expect(distance * halfTan * aspect).toBeGreaterThanOrEqual(halfWidth)
    }
  })

  it('la intro se acerca respecto del plano general', () => {
    for (const aspect of [0.46, 1.33, 1.78, 2.4]) {
      const close = poseFor({ name: 'intro' }, aspect, projects)
      const wide = introWidePose(aspect)
      expect(close.position[2]).toBeLessThan(wide.position[2])
    }
  })

  it('intro y vuelo comparten pose con sus estados de destino', () => {
    expect(poseFor({ name: 'intro' }, 16 / 9, projects)).toEqual(INTRO_POSE)
    expect(poseFor({ name: 'toGallery' }, 1.78, projects)).toEqual(poseFor({ name: 'gallery' }, 1.78, projects))
  })

  it('el vistazo al mueble lo muestra entero y cada compartimento entra a lo ancho', () => {
    for (const aspect of [0.46, 1.33, 1.78]) {
      const whole = cabinetPose(aspect)
      const d = whole.position[2] - ROOM.wallZ
      expect(d * halfTan).toBeGreaterThan(CABINET.crown / 2)
      expect(d * halfTan * aspect).toBeGreaterThan(CABINET.width / 2)
      for (const section of ['laboral', 'estudios'] as const) {
        const { position, target } = poseFor({ name: 'about', section }, aspect, projects)
        const ds = position[2] - ROOM.wallZ
        expect(ds).toBeLessThan(d + 1e-6)
        expect(ds * halfTan * aspect).toBeGreaterThan(CABINET.width / 2)
        expect(target[1]).toBeGreaterThan(SECTIONS[section].floor)
        expect(target[1]).toBeLessThan(SECTIONS[section].ceiling)
      }
    }
  })

  it('la intro mira de frente al retrato y descentra la lente para mantener la composición', () => {
    const { position, target } = poseFor({ name: 'intro' }, 16 / 9, projects)
    expect(position[0]).toBeCloseTo(INTRO_X + INTRO_LAYOUT.frameX)
    expect(target[0]).toBeCloseTo(position[0])
    // Corrida a la derecha del centro, la imagen se desplaza a la izquierda; en el centro, nada.
    expect(introLensShift(position[0], position[2], 35)).toBeLessThan(0)
    expect(introLensShift(INTRO_X + INTRO_LAYOUT.centerX, position[2], 35)).toBeCloseTo(0)
    // El desplazamiento equivale a llevar el centro de la composición al centro de la imagen.
    const d = position[2] - ROOM.wallZ
    expect((-introLensShift(position[0], position[2], 35) / 35) * d).toBeCloseTo(INTRO_LAYOUT.frameX - INTRO_LAYOUT.centerX)
  })

  it('en horizontal, el encuadre de la intro muestra la mitad de cada columna del tramo', () => {
    for (const aspect of [1.33, 1.78]) {
      const { position } = poseFor({ name: 'intro' }, aspect, projects)
      const halfVisible = (position[2] - ROOM.wallZ) * halfTan * aspect
      expect(halfVisible).toBeCloseTo(INTRO_LAYOUT.bay / 2, 1)
    }
  })
})
