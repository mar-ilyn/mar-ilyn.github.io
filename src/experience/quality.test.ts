import { describe, expect, it } from 'vitest'
import { detectQuality, readUrlOverrides } from './quality'

const desktop = { coarsePointer: false, cores: 12, memoryGB: 16, shortSide: 1080 }

describe('calidad adaptativa', () => {
  it('un equipo de escritorio potente usa calidad alta', () => {
    expect(detectQuality(desktop)).toBe('high')
  })

  it('celulares, pantallas chicas y equipos modestos usan calidad baja', () => {
    expect(detectQuality({ ...desktop, coarsePointer: true })).toBe('low')
    expect(detectQuality({ ...desktop, shortSide: 412 })).toBe('low')
    expect(detectQuality({ ...desktop, cores: 4 })).toBe('low')
    expect(detectQuality({ ...desktop, memoryGB: 4 })).toBe('low')
  })

  it('sin dato de memoria decide por el resto', () => {
    expect(detectQuality({ ...desktop, memoryGB: undefined })).toBe('high')
  })

  it('lee ?debug y fuerza la calidad desde la URL', () => {
    expect(readUrlOverrides('?debug')).toEqual({ debug: true, quality: undefined })
    expect(readUrlOverrides('?calidad=baja').quality).toBe('low')
    expect(readUrlOverrides('?calidad=alta').quality).toBe('high')
    expect(readUrlOverrides('').debug).toBe(false)
  })
})
