import { useProgress } from '@react-three/drei'

interface Props {
  done: boolean
}

// Pantalla de carga con progreso real (texturas y entorno) y una etapa final de preparación
// mientras se compilan los shaders. Nombre, rol y contacto siguen visibles en el header.
export function LoadingScreen({ done }: Props) {
  const { progress, active } = useProgress()
  const percent = Math.round(progress)
  const label = active || percent < 100 ? `Cargando la galería… ${percent}%` : 'Preparando la galería…'

  return (
    <div className={`loading-screen ${done ? 'loading-screen--done' : ''}`} aria-hidden={done}>
      <p role="status" aria-live="polite">
        {done ? 'Galería lista' : label}
      </p>
      <div className="loading-screen__bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${done ? 1 : Math.max(0.04, progress / 100)})` }} />
      </div>
    </div>
  )
}
