import { create } from 'zustand'
import { getProject } from '../data/projects'
import { transition, type ViewEvent } from './machine'
import { pathToRoute, routeToPath, type Route } from './routes'

const BASE = import.meta.env.BASE_URL

interface ViewStore {
  route: Route
  cameraMoving: boolean
  sceneReady: boolean
  // Pedestal bajo el mouse o con foco de teclado: enciende su haz de luz.
  highlighted: string | null
  send: (event: ViewEvent) => void
  navigate: (route: Route) => void
  syncFromLocation: () => void
  setCameraMoving: (moving: boolean) => void
  setSceneReady: () => void
  setHighlighted: (slug: string | null) => void
}

const readLocation = (): Route => pathToRoute(window.location.pathname, (s) => !!getProject(s), BASE)

function commit(route: Route, mode: 'push' | 'replace') {
  const path = routeToPath(route, BASE)
  if (path === window.location.pathname) return
  if (mode === 'push') window.history.pushState(null, '', path)
  else window.history.replaceState(null, '', path)
}

export const useViewStore = create<ViewStore>((set, get) => ({
  route: readLocation(),
  cameraMoving: false,
  sceneReady: false,
  highlighted: null,

  send: (event) => {
    const { route } = get()
    if (route.name === 'list') return
    const next = transition(route, event)
    if (next === route) return
    commit(next, 'push')
    set({ route: next, highlighted: null })
  },

  navigate: (route) => {
    commit(route, 'push')
    set({ route })
  },

  syncFromLocation: () => {
    const route = readLocation()
    commit(route, 'replace')
    set({ route })
  },

  setCameraMoving: (cameraMoving) => set({ cameraMoving }),
  setSceneReady: () => set({ sceneReady: true }),
  setHighlighted: (highlighted) => set({ highlighted }),
}))
