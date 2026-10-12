import { getEntry, rowOf, type Row } from '../data/timeline'

export type ViewState =
  | { name: 'intro' }
  | { name: 'toGallery' }
  | { name: 'gallery' }
  | { name: 'project'; slug: string }
  | { name: 'plaque'; slug: string }
  | { name: 'about'; section: Row }
  | { name: 'aboutEntry'; slug: string }
  | { name: 'contact' }
  | { name: 'contactBook' }

export type ViewEvent =
  | { type: 'STEP_DOWN' }
  | { type: 'STEP_UP' }
  | { type: 'SKIP_INTRO' }
  | { type: 'ARRIVED' }
  | { type: 'OPEN'; slug: string }
  | { type: 'MORE_INFO' }
  | { type: 'BACK' }
  | { type: 'BACK_TO_GALLERY' }
  | { type: 'OPEN_ENTRY'; slug: string }
  | { type: 'BACK_TO_ABOUT' }
  | { type: 'OPEN_BOOK' }
  | { type: 'RESTART' }

export const initialView: ViewState = { name: 'intro' }

export function transition(state: ViewState, event: ViewEvent): ViewState {
  switch (state.name) {
    case 'intro':
      if (event.type === 'STEP_DOWN') return { name: 'toGallery' }
      if (event.type === 'SKIP_INTRO') return { name: 'gallery' }
      return state

    case 'toGallery':
      if (event.type === 'ARRIVED' || event.type === 'SKIP_INTRO') return { name: 'gallery' }
      return state

    case 'gallery':
      if (event.type === 'OPEN') return { name: 'project', slug: event.slug }
      if (event.type === 'STEP_UP') return { name: 'intro' }
      // Bajando se sigue hacia la derecha, a "Sobre mí".
      if (event.type === 'STEP_DOWN') return { name: 'about', section: 'laboral' }
      return state

    case 'project':
      if (event.type === 'STEP_DOWN' || event.type === 'MORE_INFO') return { name: 'plaque', slug: state.slug }
      // Subir vuelve a la vista general de los proyectos, como Esc.
      if (event.type === 'STEP_UP' || event.type === 'BACK' || event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      return state

    case 'plaque':
      if (event.type === 'STEP_UP' || event.type === 'BACK') return { name: 'project', slug: state.slug }
      if (event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      return state

    // "Sobre mí", a la derecha de los pedestales: un mueble con dos compartimentos. Bajando desde la
    // galería se llega al de experiencia, bajando otra vez al de estudios y después al escritorio de
    // contacto; subir desanda el camino.
    // Esc vuelve a la galería; desde una entrada, Esc vuelve a su compartimento.
    case 'about':
      if (event.type === 'OPEN_ENTRY') return { name: 'aboutEntry', slug: event.slug }
      if (event.type === 'STEP_DOWN') return state.section === 'laboral' ? { name: 'about', section: 'estudios' } : { name: 'contact' }
      if (event.type === 'STEP_UP') return state.section === 'estudios' ? { name: 'about', section: 'laboral' } : { name: 'gallery' }
      if (event.type === 'BACK' || event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      return state

    case 'aboutEntry':
      if (event.type === 'OPEN_ENTRY' && event.slug !== state.slug) return { name: 'aboutEntry', slug: event.slug }
      if (event.type === 'BACK' || event.type === 'BACK_TO_ABOUT') return { name: 'about', section: sectionOf(state.slug) }
      return state

    // "Contacto", el cierre del recorrido: un escritorio. Acercarse al libro muestra los canales y el
    // mensaje; Esc o scrollear vuelven al escritorio y, desde ahí, Esc vuelve a la galería. Desde ambos se
    // puede reiniciar.
    case 'contact':
      if (event.type === 'OPEN_BOOK') return { name: 'contactBook' }
      if (event.type === 'STEP_UP') return { name: 'about', section: 'estudios' }
      if (event.type === 'BACK' || event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      if (event.type === 'RESTART') return { name: 'intro' }
      return state

    case 'contactBook':
      if (event.type === 'BACK' || event.type === 'STEP_DOWN' || event.type === 'STEP_UP') return { name: 'contact' }
      if (event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      if (event.type === 'RESTART') return { name: 'intro' }
      return state
  }
}

export function sectionOf(slug: string): Row {
  const entry = getEntry(slug)
  return entry ? rowOf(entry.kind) : 'laboral'
}
