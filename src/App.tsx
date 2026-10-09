import { lazy, Suspense, useEffect, useState } from 'react'
import { ListView } from './components/ListView'
import { SiteHeader } from './components/SiteHeader'
import { getProject } from './data/projects'
import { profile } from './data/profile'
import { supportsWebGL } from './lib/webgl'
import type { Route } from './state/routes'
import { useViewStore } from './state/store'

const Experience = lazy(() => import('./experience/Experience'))

const BASE_TITLE = `${profile.name} · ${profile.role}`

function titleFor(route: Route): string {
  if (route.name === 'project' || route.name === 'plaque') {
    const project = getProject(route.slug)
    if (project) return `${project.title} · ${profile.name}`
  }
  if (route.name === 'list') return `Proyectos · ${profile.name}`
  return BASE_TITLE
}

export default function App() {
  const route = useViewStore((s) => s.route)
  const syncFromLocation = useViewStore((s) => s.syncFromLocation)
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

  return (
    <>
      <SiteHeader mode={showGallery ? 'gallery' : 'list'} canShowGallery={webgl} />
      {webgl && route.name !== 'list' ? (
        <Suspense fallback={<p className="loading" role="status">Cargando la galería…</p>}>
          <Experience view={route} />
        </Suspense>
      ) : (
        <ListView />
      )}
    </>
  )
}
