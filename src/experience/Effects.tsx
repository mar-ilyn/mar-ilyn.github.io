import { Bloom, EffectComposer, N8AO, Noise, Vignette } from '@react-three/postprocessing'

// Postprocesado leve, solo en calidad alta: oclusión ambiental (contacto entre piezas y pared),
// un bloom muy suave que solo toca los brillos del dorado, grano sutil y viñeta.
// En calidad baja no hay compositor: la viñeta es CSS (sin costo de GPU).
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={0.5} distanceFalloff={0.8} intensity={1.6} quality="performance" halfRes />
      <Bloom luminanceThreshold={0.92} luminanceSmoothing={0.1} intensity={0.22} mipmapBlur />
      <Noise opacity={0.025} premultiply />
      <Vignette offset={0.32} darkness={0.42} />
    </EffectComposer>
  )
}
