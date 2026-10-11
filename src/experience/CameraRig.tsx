import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { projects } from '../data/projects'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import { introWidePose, poseFor, type CameraPose } from './layout'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const { ACTION } = CameraControlsImpl

interface Props {
  view: ViewState
  // Mantener el plano general de la intro (render del fondo de la vista en lista).
  holdWide?: boolean
}

export function CameraRig({ view, holdWide = false }: Props) {
  const controls = useRef<CameraControlsImpl>(null)
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height))
  const invalidate = useThree((s) => s.invalidate)
  const reducedMotion = usePrefersReducedMotion()
  const lastView = useRef<ViewState | null>(null)

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
        // Hacia la galería es un solo vuelo continuo: al salir del acercamiento la cámara ya se aleja
        // y se desplaza a la derecha a la vez.
        await go(pose, true, view.name === 'toGallery' ? 0.8 : 0.45)
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
