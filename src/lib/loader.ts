// Puente con la pantalla de carga, que está escrita en index.html (HTML, CSS crítico y SVG en línea) para
// verse desde el primer momento, antes que el JavaScript. Desde acá se le pasa el progreso real de carga
// (--p, de 0 a 1: la llave se vuelve dorada), se anuncia el porcentaje y, al terminar, se abre la puerta. Si la página no tiene la
// pantalla (tests, vista en lista), todo esto no hace nada.

// Si la escena está lista antes de esto desde que apareció la pantalla, no hay animación: entra directo.
const FAST_MS = 1200
// Si tarda más que esto, la pantalla sugiere la vista en lista.
const SLOW_MS = 15_000
// Respaldo por si no llega el fin de la entrada por la puerta (filtro, hojas y avance: unos 2,2 s).
const DOORS_MS = 2600

let shownAt = 0
let finished = false
let lastSpoken = -1
let slowTimer: number | undefined

const loader = () => document.getElementById('loader')
const root = () => document.getElementById('root')
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function setText(selector: string, text: string) {
  const el = loader()?.querySelector(selector)
  if (el && el.textContent !== text) el.textContent = text
}

// Muestra la pantalla (si no se está viendo ya, p. ej. al pasar de la lista a la galería) y la reinicia.
export function startLoader() {
  const el = loader()
  if (!el) return
  const visible = document.documentElement.classList.contains('has-loader') && !el.classList.contains('loader--done')
  if (!visible) {
    shownAt = performance.now()
    finished = false
    lastSpoken = -1
    el.classList.remove('loader--done', 'loader--open', 'loader--slow')
    el.style.setProperty('--p', '0')
    document.documentElement.classList.add('has-loader')
    root()?.setAttribute('inert', '')
  }
  window.clearTimeout(slowTimer)
  slowTimer = window.setTimeout(() => {
    if (finished) return
    loader()?.classList.add('loader--slow')
    setText('.loader__live', 'La galería está tardando: podés verla como lista.')
  }, SLOW_MS)
}

// Progreso real de descarga (0 a 100). Al llegar a 100 queda la preparación (compilar la escena).
export function setLoaderProgress(percent: number, preparing: boolean) {
  const el = loader()
  if (!el || finished) return
  const p = Math.max(0, Math.min(100, percent))
  el.style.setProperty('--p', (p / 100).toFixed(3))
  setText('.loader__status', preparing ? 'Preparando la galería…' : `Cargando la galería · ${p}%`)
  // Para lectores de pantalla, de a 10 %: cada número sería demasiado.
  const step = preparing ? 11 : Math.floor(p / 10)
  if (step !== lastSpoken) {
    lastSpoken = step
    setText('.loader__live', preparing ? 'Preparando la galería…' : `Cargando la galería: ${p}%`)
  }
}

// La escena está lista: se va el filtro, se abre la puerta y la vista entra a la sala (o se entra directo si
// fue rápido o sin animaciones).
export function finishLoader() {
  const el = loader()
  if (!el || finished) return
  finished = true
  window.clearTimeout(slowTimer)
  el.style.setProperty('--p', '1')
  setText('.loader__live', 'La galería está lista.')
  if (reducedMotion() || performance.now() - shownAt < FAST_MS) {
    hideLoader()
    return
  }
  const enter = el.querySelector<HTMLButtonElement>('.loader__enter')
  if (enter) enter.hidden = false
  el.classList.add('loader--open')
  // La galería se puede usar mientras se abre la puerta.
  root()?.removeAttribute('inert')
  const scene = el.querySelector('.loader__scene')
  const done = () => hideLoader()
  scene?.addEventListener('transitionend', (e) => {
    if (e.target === scene && (e as TransitionEvent).propertyName === 'opacity') done()
  })
  window.setTimeout(done, DOORS_MS)
}

// Saca la pantalla del todo. Si el foco estaba en ella, pasa al botón principal de la intro.
export function hideLoader() {
  const el = loader()
  window.clearTimeout(slowTimer)
  finished = true
  root()?.removeAttribute('inert')
  if (!el || el.classList.contains('loader--done')) return
  const hadFocus = el.contains(document.activeElement)
  el.classList.add('loader--done')
  if (hadFocus) document.querySelector<HTMLElement>('.intro-text__cta')?.focus()
}

// "Ver como lista" y "Entrar a la galería" de la pantalla. La lista la abre la app sin recargar.
export function bindLoaderActions(toList: () => void): () => void {
  const el = loader()
  if (!el) return () => {}
  const list = el.querySelector<HTMLAnchorElement>('.loader__list')
  const enter = el.querySelector<HTMLButtonElement>('.loader__enter')
  const onList = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    hideLoader()
    toList()
  }
  list?.addEventListener('click', onList)
  enter?.addEventListener('click', hideLoader)
  return () => {
    list?.removeEventListener('click', onList)
    enter?.removeEventListener('click', hideLoader)
  }
}
