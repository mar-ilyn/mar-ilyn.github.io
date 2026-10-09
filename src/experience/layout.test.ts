import { describe, expect, it } from 'vitest'
import { projects } from '../data/projects'
import { FOV, galleryPose, INTRO_POSE, poseFor } from './layout'

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

  it('la intro entra completa también en vertical', () => {
    for (const aspect of [0.46, 0.75, 1.78]) {
      const { position, target } = poseFor({ name: 'intro' }, aspect, projects)
      const distance = position[2] - target[2]
      expect(distance * halfTan * aspect).toBeGreaterThanOrEqual(2.6)
    }
  })

  it('intro y vuelo comparten pose con sus estados de destino', () => {
    expect(poseFor({ name: 'intro' }, 16 / 9, projects)).toEqual(INTRO_POSE)
    expect(poseFor({ name: 'toGallery' }, 1.78, projects)).toEqual(poseFor({ name: 'gallery' }, 1.78, projects))
  })
})
