export type ViewState =
  | { name: 'intro' }
  | { name: 'toGallery' }
  | { name: 'gallery' }
  | { name: 'project'; slug: string }
  | { name: 'plaque'; slug: string }

export type ViewEvent =
  | { type: 'STEP_DOWN' }
  | { type: 'STEP_UP' }
  | { type: 'SKIP_INTRO' }
  | { type: 'ARRIVED' }
  | { type: 'OPEN'; slug: string }
  | { type: 'MORE_INFO' }
  | { type: 'BACK' }
  | { type: 'BACK_TO_GALLERY' }

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
      return state

    case 'project':
      if (event.type === 'STEP_DOWN' || event.type === 'MORE_INFO') return { name: 'plaque', slug: state.slug }
      if (event.type === 'BACK' || event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      return state

    case 'plaque':
      if (event.type === 'STEP_UP' || event.type === 'BACK') return { name: 'project', slug: state.slug }
      if (event.type === 'BACK_TO_GALLERY') return { name: 'gallery' }
      return state
  }
}
