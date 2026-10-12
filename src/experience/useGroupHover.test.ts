import type { ThreeEvent } from '@react-three/fiber'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useGroupHover } from './useGroupHover'

const event = () => ({ pointerType: 'mouse', stopPropagation: vi.fn() }) as unknown as ThreeEvent<PointerEvent>

describe('hover de un objeto de varias piezas', () => {
  it('pasar de una pieza a otra no apaga el resaltado; salir de todas sí', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useGroupHover(onChange))
    const { onPointerOver, onPointerOut } = result.current
    onPointerOver(event()) // la hoja
    onPointerOver(event()) // el cartón, detrás
    onPointerOut(event()) // R3F descarta la pieza de atrás
    onPointerOver(event())
    expect(onChange.mock.calls).toEqual([[true, 'mouse']])
    onPointerOut(event())
    onPointerOut(event())
    expect(onChange.mock.calls).toEqual([
      [true, 'mouse'],
      [false, 'mouse'],
    ])
  })
})
