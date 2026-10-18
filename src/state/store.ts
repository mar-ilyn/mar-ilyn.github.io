import { create } from 'zustand'
import { getProject } from '../data/projects'
import { getEntry } from '../data/timeline'
import { transition, type ViewEvent, type ViewState } from './machine'
import { pathToRoute, routeToPath, type Route } from './routes'

const BASE = import.meta.env.BASE_URL

// Zonas de la escena que se descargan aparte (React.lazy). Su sombra está horneada en la pared y el piso:
// hasta que la zona se monta, en su lugar se vería la sombra sola. Por eso la pantalla de carga y los vuelos
// de cámara esperan a la zona de la vista de destino.
export type Zone = 'about' | 'contact'

export function zoneOf(view: ViewState): Zone | null {
  if (view.name === 'about' || view.name === 'aboutEntry') return 'about'
  if (view.name === 'contact' || view.name === 'contactBook') return 'contact'
  return null
}

interface ViewStore {
  route: Route
  cameraMoving: boolean
  sceneReady: boolean
  // Pedestal bajo el mouse o con foco de teclado: enciende su haz de luz.
  highlighted: string | null
  // Canal de contacto recién copiado desde el libro (se imprime "Copiado" en la página).
  copied: string | null
  // Zonas lazy ya montadas en la escena.
  zones: Record<Zone, boolean>
  send: (event: ViewEvent) => void
  navigate: (route: Route) => void
  syncFromLocation: () => void
  setCameraMoving: (moving: boolean) => void
  setSceneReady: () => void
  setHighlighted: (slug: string | null) => void
  setCopied: (id: string | null) => void
  setZoneMounted: (zone: Zone) => void
}

const readLocation = (): Route =>
  pathToRoute(window.location.pathname, (s) => !!getProject(s), BASE, (s) => !!getEntry(s))

function commit(route: Route, mode: 'push' | 'replace') {
  const path = routeToPath(route, BASE)
  if (path === window.location.pathname) return
  if (mode === 'push') window.history.pushState(null, '', path)
  else window.history.replaceState(null, '', path)
}

// La página se recargó (F5, botón de recargar). Abrir un link o escribir la URL no cuenta.
function isReload(): boolean {
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined
  return nav?.type === 'reload'
}

// Al entrar, la URL queda en su forma actual (p. ej. un link viejo a /placa pasa a la cartela, sin
// /placa), conservando los parámetros como ?calidad. Al recargar estando en la galería, el recorrido
// vuelve a empezar en la intro; un link compartido sí abre directo en su vista.
function initialRoute(): Route {
  const read = readLocation()
  const route: Route = read.name !== 'list' && read.name !== 'intro' && isReload() ? { name: 'intro' } : read
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
  zones: { about: false, contact: false },

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
  setZoneMounted: (zone) => set((s) => ({ zones: { ...s.zones, [zone]: true } })),
  setSceneReady: () => set({ sceneReady: true }),
  setHighlighted: (highlighted) => set({ highlighted }),
}))

// Se resuelve cuando la zona está montada, o a los timeoutMs (la cámara no se queda esperando para siempre).
export function whenZoneMounted(zone: Zone, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (useViewStore.getState().zones[zone]) return resolve()
    const done = () => {
      window.clearTimeout(timer)
      unsubscribe()
      resolve()
    }
    const timer = window.setTimeout(done, timeoutMs)
    const unsubscribe = useViewStore.subscribe((state) => {
      if (state.zones[zone]) done()
    })
  })
}
