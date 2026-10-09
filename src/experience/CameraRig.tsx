import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { projects } from '../data/projects'
import type { ViewState } from '../state/machine'
import { useViewStore } from '../state/store'
import { poseFor } from './layout'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const { ACTION } = CameraControlsImpl

interface Props {
  view: ViewState
}

export function CameraRig({ view }: Props) {
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
    // Solo vuela cuando cambia la vista: la primera ubicación y los cambios de tamaño de pantalla
    // reubican la cámara al instante, así no bloquean el primer scroll mientras se acomoda.
    const animate = lastView.current !== null && lastView.current !== view && !reducedMotion
    lastView.current = view
    c.smoothTime = view.name === 'toGallery' ? 0.7 : 0.45

    let cancelled = false
    setCameraMoving(animate)
    const transitions = Promise.all([
      c.setLookAt(...pose.position, ...pose.target, animate),
      c.setFocalOffset(...pose.offset, animate),
    ])
    invalidate()
    void transitions.then(() => {
      if (cancelled) return
      setCameraMoving(false)
      setSceneReady()
      if (view.name === 'toGallery') send({ type: 'ARRIVED' })
    })
    return () => {
      cancelled = true
    }
  }, [view, aspect, reducedMotion, invalidate])

  return <CameraControls ref={controls} makeDefault />
}
