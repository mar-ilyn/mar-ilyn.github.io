import { create } from 'zustand'
import { getProject } from '../data/projects'
import { getEntry } from '../data/timeline'
import { transition, type ViewEvent } from './machine'
import { pathToRoute, routeToPath, type Route } from './routes'

const BASE = import.meta.env.BASE_URL

interface ViewStore {
  route: Route
  cameraMoving: boolean
  sceneReady: boolean
  // Pedestal bajo el mouse o con foco de teclado: enciende su haz de luz.
  highlighted: string | null
  // Canal de contacto recién copiado desde el libro (se imprime "Copiado" en la página).
  copied: string | null
  send: (event: ViewEvent) => void
  navigate: (route: Route) => void
  syncFromLocation: () => void
  setCameraMoving: (moving: boolean) => void
  setSceneReady: () => void
  setHighlighted: (slug: string | null) => void
  setCopied: (id: string | null) => void
}

const readLocation = (): Route =>
  pathToRoute(window.location.pathname, (s) => !!getProject(s), BASE, (s) => !!getEntry(s))

function commit(route: Route, mode: 'push' | 'replace') {
  const path = routeToPath(route, BASE)
  if (path === window.location.pathname) return
  if (mode === 'push') window.history.pushState(null, '', path)
  else window.history.replaceState(null, '', path)
}

// Al entrar, la URL queda en su forma actual (p. ej. un link viejo a /placa pasa a la cartela, sin
// /placa), conservando los parámetros como ?calidad.
function initialRoute(): Route {
  const route = readLocation()
  const path = routeToPath(route, BASE)
  if (route.name !== 'list' && path !== window.location.pathname) {
    window.history.replaceState(null, '', path + window.location.search + window.location.hash)
  }
  return route
}

export const useViewStore = create<ViewStore>((set, get) => ({
  route: initialRoute(),
  cameraMoving: false,
  sceneReady: false,
  highlighted: null,
  copied: null,

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
  setCopied: (copied) => set({ copied }),
  setSceneReady: () => set({ sceneReady: true }),
  setHighlighted: (highlighted) => set({ highlighted }),
}))
