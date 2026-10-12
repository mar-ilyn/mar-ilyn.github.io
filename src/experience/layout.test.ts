import { describe, expect, it } from 'vitest'
import { projects } from '../data/projects'
import { CABINET, SECTIONS } from '../data/timeline'
import { PEDESTAL_LABEL } from './pedestalGeometry'
import { cabinetPose, FOV, galleryPose, INTRO_LABEL, INTRO_LABEL_MARGIN, INTRO_LAYOUT, INTRO_POSE, INTRO_X, introLensShift, introWidePose, poseFor, ROOM } from './layout'

const halfTan = Math.tan((FOV * Math.PI) / 360)
const detail = { name: 'projectDetail', slug: projects[0].slug } as const

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

  it('en horizontal, el acercamiento deja entrar el texto y el cuadro', () => {
    for (const aspect of [1.33, 1.78]) {
      const { position, target } = poseFor({ name: 'intro' }, aspect, projects)
      const distance = position[2] - target[2]
      expect(distance * halfTan * aspect).toBeGreaterThanOrEqual(INTRO_LAYOUT.halfWidth)
    }
  })

  it('en vertical, la intro se acerca de frente a la cartela alta: casi todo el ancho, entera a lo alto', () => {
    const { tall, scale, center } = INTRO_LABEL
    for (const aspect of [0.46, 0.75, 1]) {
      const { position, target } = poseFor({ name: 'intro' }, aspect, projects)
      expect(position[0]).toBeCloseTo(INTRO_X + center.x)
      expect(target[0]).toBeCloseTo(position[0])
      const distance = position[2] - ROOM.wallZ
      const halfVisibleWidth = distance * halfTan * aspect
      expect(halfVisibleWidth).toBeGreaterThanOrEqual((tall.width * scale) / 2 + INTRO_LABEL_MARGIN - 1e-6)
      expect(distance * halfTan).toBeGreaterThan((tall.height * scale) / 2 + 0.4)
    }
    // En un celular la cartela llega a los costados, con un margen chico.
    const phone = poseFor({ name: 'intro' }, 0.46, projects)
    const halfVisible = (phone.position[2] - ROOM.wallZ) * halfTan * 0.46
    expect(halfVisible).toBeCloseTo((tall.width * scale) / 2 + INTRO_LABEL_MARGIN)
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

  it('en horizontal, el encuadre de la intro muestra completas las columnas del tramo', () => {
    for (const aspect of [1.33, 1.78]) {
      const { position } = poseFor({ name: 'intro' }, aspect, projects)
      const halfVisible = (position[2] - ROOM.wallZ) * halfTan * aspect
      // Los centros de las columnas están a bay / 2; se ven con 30 cm de margen (fuste y pedestal enteros).
      expect(halfVisible).toBeCloseTo(INTRO_LAYOUT.bay / 2 + 0.3, 1)
    }
  })

  it('el proyecto se abre de frente a la cartela del pedestal, entera en pantalla', () => {
    for (const aspect of [0.46, 1.78]) {
      const { position, target, offset } = poseFor({ name: 'project', slug: projects[0].slug }, aspect, projects)
      expect(target[0]).toBeCloseTo(projects[0].pedestal[0])
      expect(position[0]).toBeCloseTo(target[0])
      expect(offset).toEqual([0, 0, 0])
      const d = position[2] - target[2]
      expect(d * halfTan).toBeGreaterThan(PEDESTAL_LABEL.height / 2)
      expect(d * halfTan * aspect).toBeGreaterThan(PEDESTAL_LABEL.width / 2)
    }
  })
})
