export type ViewState =
  | { name: 'intro' }
  | { name: 'toGallery' }
  | { name: 'gallery' }
  | { name: 'project'; slug: string }
  | { name: 'plaque'; slug: string }
  | { name: 'about' }
  | { name: 'aboutEntry'; slug: string }

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
      if (event.type === 'STEP_DOWN') return { name: 'about' }
      return state

    case 'project':
      if (event.type === 'STEP_DOWN' || event.type === 'MORE_INFO') return { name: 'plaque', slug: state.slug }
      if (event.type === 'BACK' || event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      return state

    case 'plaque':
      if (event.type === 'STEP_UP' || event.type === 'BACK') return { name: 'project', slug: state.slug }
      if (event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      return state

    // "Sobre mí", a la derecha de los pedestales: se llega bajando desde la galería o desde el menú.
    // Subir o Esc vuelven a la galería; desde una entrada, Esc vuelve a la zona.
    case 'about':
      if (event.type === 'OPEN_ENTRY') return { name: 'aboutEntry', slug: event.slug }
      if (event.type === 'STEP_UP' || event.type === 'BACK' || event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      return state

    case 'aboutEntry':
      if (event.type === 'OPEN_ENTRY' && event.slug !== state.slug) return { name: 'aboutEntry', slug: event.slug }
      if (event.type === 'BACK' || event.type === 'BACK_TO_ABOUT') return { name: 'about' }
      return state
  }
}
