import { useEffect } from 'react'
import { useViewStore } from '../state/store'

const WHEEL_THRESHOLD = 40
const SWIPE_THRESHOLD = 50
const COOLDOWN_MS = 700
const WHEEL_IDLE_MS = 200

const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement && !!el.closest('input, textarea, select, [contenteditable]')

const isInteractive = (el: EventTarget | null) =>
  el instanceof HTMLElement && !!el.closest('a, button, input, textarea, select, [contenteditable]')

// Convierte rueda, gestos y teclado en pasos discretos: un gesto = un paso, sin scroll libre.
export function useStepInput() {
  useEffect(() => {
    let wheelAccum = 0
    let lastWheel = 0
    let lastStep = Number.NEGATIVE_INFINITY
    let touchStartY: number | null = null

    const step = (dir: 'down' | 'up') => {
      const now = performance.now()
      const { cameraMoving, send } = useViewStore.getState()
      if (cameraMoving || now - lastStep < COOLDOWN_MS) return
      lastStep = now
      send({ type: dir === 'down' ? 'STEP_DOWN' : 'STEP_UP' })
    }

    const onWheel = (e: WheelEvent) => {
      const now = performance.now()
      if (now - lastWheel > WHEEL_IDLE_MS) wheelAccum = 0
      lastWheel = now
      wheelAccum += e.deltaY
      if (Math.abs(wheelAccum) < WHEEL_THRESHOLD) return
      step(wheelAccum > 0 ? 'down' : 'up')
      wheelAccum = 0
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY
      if (touchStartY === null || endY === undefined) return
      const dy = touchStartY - endY
      touchStartY = null
      if (Math.abs(dy) >= SWIPE_THRESHOLD) step(dy > 0 ? 'down' : 'up')
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === 'Escape') {
        useViewStore.getState().send({ type: 'BACK' })
        return
      }
      if (isTextField(e.target)) return
      if (e.key === ' ' && isInteractive(e.target)) return
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        step('down')
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        step('up')
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
}
