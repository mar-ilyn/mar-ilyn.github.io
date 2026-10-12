import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { projects } from '../data/projects'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import type { PerspectiveCamera } from 'three'
import { cabinetPose, introLensShift, introWidePose, poseFor, tallIntro, type CameraPose } from './layout'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const { ACTION } = CameraControlsImpl

interface Props {
  view: ViewState
  // Mantener el plano general de la intro (render del fondo de la vista en lista).
  holdWide?: boolean
}

// Duración (smoothTime) de cada vuelo. Hacia la galería es un solo vuelo continuo: al salir del
// acercamiento la cámara ya se aleja y se desplaza a la derecha a la vez. Al escritorio y al libro, más
// lento: es el cierre del recorrido. Reiniciar cruza toda la sala hasta la intro.
function flightTime(view: ViewState, previous: ViewState | null): number {
  if (view.name === 'toGallery') return 0.8
  if (view.name === 'intro' && previous?.name.startsWith('contact')) return 0.9
  if (view.name === 'contact' || view.name === 'contactBook') return previous?.name === 'about' ? 0.7 : 0.5
  return 0.45
}

export function CameraRig({ view, holdWide = false }: Props) {
  const controls = useRef<CameraControlsImpl>(null)
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height))
  const invalidate = useThree((s) => s.invalidate)
  const reducedMotion = usePrefersReducedMotion()
  const lastView = useRef<ViewState | null>(null)
  // Peso del descentramiento de lente de la intro (0 fuera de la intro): entra y sale suave con los vuelos.
  // En vertical la cámara ya está de frente a la cartela, sin descentrar.
  const lensShift = view.name === 'intro' && !holdWide && !tallIntro(aspect)
  const shift = useRef(lensShift ? 1 : 0)

  useFrame(({ camera, invalidate }, delta) => {
    const cam = camera as PerspectiveCamera
    const goal = lensShift ? 1 : 0
    // Al irse de la intro se apaga rápido, antes de que la cámara se aleje del retrato.
    const rate = goal > shift.current ? 3 : 8
    const next = reducedMotion ? goal : shift.current + (goal - shift.current) * Math.min(1, delta * rate)
    shift.current = Math.abs(next - goal) < 0.001 ? goal : next
    const offset = shift.current ? shift.current * introLensShift(cam.position.x, cam.position.z, cam.getFilmWidth()) : 0
    if (Math.abs(offset - cam.filmOffset) > 1e-4) {
      cam.filmOffset = offset
      cam.updateProjectionMatrix()
    }
    if (shift.current !== goal) invalidate()
  })

  useEffect(() => {
    const c = controls.current
    if (!c) return
    c.mouseButtons.left = ACTION.NONE
    c.mouseButtons.middle = ACTION.NONE
    c.mouseButtons.right = ACTION.NONE
    c.mouseButtons.wheel = ACTION.NONE
    c.touches.one = ACTION.NONE
    c.touches.two = ACTION.NONE
    c.touches.three = ACTION.NONE
  }, [])

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const { setCameraMoving, setSceneReady, send } = useViewStore.getState()
    const pose = poseFor(view, aspect, projects)
    const wide = introWidePose(aspect)
    const first = lastView.current === null
    const previous = lastView.current
    lastView.current = view
    let cancelled = false

    const go = (p: CameraPose, animate: boolean, smoothTime: number) => {
      c.smoothTime = smoothTime
      const done = Promise.all([
        c.setLookAt(...p.position, ...p.target, animate),
        c.setFocalOffset(...p.offset, animate),
      ])
      invalidate()
      return done
    }

    const run = async () => {
      if (holdWide) {
        // Render del fondo de la vista en lista: siempre el plano general.
        await go(wide, false, 0)
      } else if (first) {
        // La primera ubicación es instantánea; en la intro se arranca en el plano general y la
        // cámara se acerca sola a la parte principal.
        const opening = view.name === 'intro' && !reducedMotion
        await go(opening ? wide : pose, false, 0)
        if (opening) {
          // El acercamiento no bloquea el scroll: si se baja antes de que termine, el vuelo a la
          // galería arranca desde donde esté la cámara.
          setSceneReady()
          await new Promise((r) => setTimeout(r, 350))
          if (cancelled) return
          await go(pose, true, 1.1)
        }
      } else if (previous === view || reducedMotion) {
        // Cambio de tamaño de pantalla o movimiento reducido: sin vuelo.
        await go(pose, false, 0)
      } else {
        setCameraMoving(true)
        if (previous?.name === 'gallery' && view.name === 'about') {
          // Hacia "Sobre mí": primero un vistazo al mueble entero (la cámara se corre a la derecha) y,
          // sin detenerse del todo, sigue al compartimento.
          await Promise.race([go(cabinetPose(aspect), true, 0.4), new Promise((r) => setTimeout(r, 850))])
          if (cancelled) return
        }
        await go(pose, true, flightTime(view, previous))
      }
      if (cancelled) return
      setCameraMoving(false)
      setSceneReady()
      if (view.name === 'toGallery') send({ type: 'ARRIVED' })
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [view, aspect, reducedMotion, invalidate, holdWide])

  return <CameraControls ref={controls} makeDefault />
}
