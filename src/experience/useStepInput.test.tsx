import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useViewStore } from '../state/store'
import { useStepInput } from './useStepInput'

function Probe() {
  useStepInput()
  return null
}

const wheel = (deltaY: number) => window.dispatchEvent(new WheelEvent('wheel', { deltaY }))

describe('useStepInput', () => {
  let now = 0

  beforeEach(() => {
    now = 50
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    window.history.replaceState(null, '', '/')
    useViewStore.setState({ route: { name: 'intro' }, cameraMoving: false })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('el primer scroll cuenta aunque llegue apenas cargó la página', () => {
    render(<Probe />)
    wheel(120)
    expect(useViewStore.getState().route).toEqual({ name: 'toGallery' })
  })

  it('un gesto con inercia da un solo paso', () => {
    useViewStore.setState({ route: { name: 'project', slug: 'turnapp' } })
    render(<Probe />)
    wheel(120)
    now += 100
    wheel(120)
    now += 100
    wheel(120)
    expect(useViewStore.getState().route).toEqual({ name: 'projectDetail', slug: 'turnapp' })
  })

  it('ignora el scroll mientras la cámara se mueve', () => {
    useViewStore.setState({ cameraMoving: true })
    render(<Probe />)
    wheel(120)
    expect(useViewStore.getState().route).toEqual({ name: 'intro' })
  })
})
