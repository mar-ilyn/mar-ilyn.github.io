import { lazy, Suspense, useEffect, useState } from 'react'
import { ListView } from './components/ListView'
import { SiteHeader } from './components/SiteHeader'
import { getProject } from './data/projects'
import { getEntry } from './data/timeline'
import { profile } from './data/profile'
import { bindLoaderActions, hideLoader, startLoader } from './lib/loader'
import { supportsWebGL } from './lib/webgl'
import type { Route } from './state/routes'
import { useViewStore } from './state/store'

const Experience = lazy(() => import('./experience/Experience'))
const FrameStudio = lazy(() => import('./experience/FrameStudio'))
// ?render=marco: solo el marco tallado, para scripts/render-images.mjs.
const RENDER_FRAME = new URLSearchParams(window.location.search).get('render') === 'marco'
// Cualquier ?render (imágenes generadas por scripts) va sin pantalla de carga.
const RENDER = new URLSearchParams(window.location.search).has('render')

const BASE_TITLE = `${profile.name} · ${profile.role}`

function titleFor(route: Route): string {
  if (route.name === 'project' || route.name === 'projectDetail') {
    const project = getProject(route.slug)
    if (project) return `${project.title} · ${profile.name}`
  }
  if (route.name === 'list') return `Proyectos · ${profile.name}`
  if (route.name === 'about') return `Sobre mí · ${profile.name}`
  if (route.name === 'contact' || route.name === 'contactBook') return `Contacto · ${profile.name}`
  if (route.name === 'aboutEntry') {
    const entry = getEntry(route.slug)
    if (entry) return `${entry.title} · ${profile.name}`
  }
  return BASE_TITLE
}

export default function App() {
  const route = useViewStore((s) => s.route)
  const syncFromLocation = useViewStore((s) => s.syncFromLocation)
  const navigate = useViewStore((s) => s.navigate)
  const [webgl] = useState(supportsWebGL)
  const showGallery = webgl && route.name !== 'list'

  useEffect(() => {
    window.addEventListener('popstate', syncFromLocation)
    return () => window.removeEventListener('popstate', syncFromLocation)
  }, [syncFromLocation])

  useEffect(() => {
    document.title = titleFor(route)
  }, [route])

  useEffect(() => {
    document.documentElement.classList.toggle('is-gallery', showGallery)
  }, [showGallery])

  // Pantalla de carga (index.html): mientras carga la galería; sin WebGL o en la lista, no está.
  useEffect(() => {
    if (showGallery && !RENDER) startLoader()
    else hideLoader()
  }, [showGallery])
  useEffect(() => bindLoaderActions(() => navigate({ name: 'list' })), [navigate])

  if (RENDER_FRAME) {
    return (
      <Suspense fallback={null}>
        <FrameStudio />
      </Suspense>
    )
  }

  return (
    <>
      <SiteHeader mode={showGallery ? 'gallery' : 'list'} canShowGallery={webgl} />
      {webgl && route.name !== 'list' ? (
        <Suspense
          fallback={
            <p className="loading" role="status">
              Cargando la galería…
            </p>
          }
        >
          <Experience view={route} />
        </Suspense>
      ) : (
        <ListView canShowGallery={webgl} />
      )}
    </>
  )
}
