import type { ThreeEvent } from '@react-three/fiber'
import { useRef } from 'react'

// Hover de un objeto armado con varias piezas (p. ej. la caja y la hoja pegada encima). R3F lleva un
// registro por pieza: al pasar de una a otra, o cuando stopPropagation descarta la pieza de atrás, avisa
// "salida" de esa pieza aunque el puntero siga sobre el objeto, y el resaltado parpadeaba. Acá se cuentan
// las piezas bajo el puntero y solo se avisa al entrar al objeto (0 → 1) y al salir del todo (1 → 0).
export function useGroupHover(onChange: (hovered: boolean, pointerType: string) => void) {
  const count = useRef(0)
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      count.current += 1
      if (count.current === 1) onChange(true, e.pointerType)
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      count.current = Math.max(0, count.current - 1)
      if (count.current === 0) onChange(false, e.pointerType)
    },
  }
}
