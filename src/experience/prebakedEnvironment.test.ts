import { DataUtils } from 'three'
import { describe, expect, it } from 'vitest'
import { rgbeToHalf } from './prebakedEnvironment'

const decode = (rgbe: number[]) => Array.from(rgbeToHalf(new Uint8Array(rgbe))).map((h) => DataUtils.fromHalfFloat(h))

describe('entorno prefiltrado (RGBE → half float)', () => {
  it('decodifica mantisa y exponente', () => {
    // 128 · 2^(129-136) = 1.0 ; 64 · 2^(130-136) = 1.0
    expect(decode([128, 64, 0, 129])).toEqual([1, 0.5, 0, 1])
    expect(decode([64, 64, 64, 130])).toEqual([1, 1, 1, 1])
  })

  it('exponente 0 es negro', () => {
    expect(decode([200, 100, 50, 0])).toEqual([0, 0, 0, 1])
  })

  it('soporta valores HDR mayores a 1', () => {
    const [r] = decode([200, 0, 0, 140])
    expect(r).toBeCloseTo(200 * 2 ** 4, 0)
  })
})
