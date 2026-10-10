import type { ViewState } from '../state/machine'

// Intensidad del haz de luz de cada pedestal (0 apagado, 1 encendido del todo).
// En la galería se enciende el pedestal bajo el mouse o con foco de teclado; sin hover (táctil)
// todos quedan con un brillo suave constante. El proyecto abierto conserva un haz tenue.
export function beamLevel(view: ViewState, slug: string, highlighted: string | null, noHover: boolean): number {
  if (view.name === 'gallery') return highlighted === slug ? 1 : noHover ? 0.4 : 0
  if ((view.name === 'project' || view.name === 'plaque') && view.slug === slug) return 0.55
  return 0
}
