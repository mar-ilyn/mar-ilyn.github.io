import { BufferGeometry, Float32BufferAttribute } from 'three'

// Un perfil de moldura recorrido alrededor de un rectángulo: cada punto del perfil, [distancia hacia
// adentro desde el borde de afuera, altura], es un rectángulo metido esa distancia; los rectángulos
// consecutivos se unen con caras. Las esquinas quedan en inglete. Cada lado tiene sus propios vértices: con
// smooth, el sombreado es suave a lo largo del perfil (la luz corre por las curvas) y el inglete se mantiene
// marcado.
export type Profile = readonly (readonly [number, number])[]

export function sweptRectangle(width: number, height: number, profile: Profile, smooth = false): BufferGeometry {
  const corners = profile.map(([d, z]) => {
    const hw = width / 2 - d
    const hh = height / 2 - d
    return [
      [-hw, -hh, z],
      [hw, -hh, z],
      [hw, hh, z],
      [-hw, hh, z],
    ]
  })
  const positions: number[] = []
  const indices: number[] = []
  for (let c = 0; c < 4; c++) {
    const n = (c + 1) % 4
    const base = positions.length / 3
    for (const loop of corners) positions.push(...loop[c], ...loop[n])
    for (let i = 0; i < corners.length - 1; i++) {
      const a = base + i * 2
      const b = a + 2
      // Dos triángulos por tramo, mirando hacia el frente.
      indices.push(a, a + 1, b + 1, a, b + 1, b)
    }
  }
  let g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  if (!smooth) g = g.toNonIndexed()
  g.computeVertexNormals()
  return g
}

// Sombra suave que una moldura proyecta sobre la pared: una franja plana entre las distancias d0 y d1 hacia
// adentro (negativas: hacia afuera), con opacidad alpha en d0 que se desvanece hasta 0 en d1. Para usar con
// un material de vértices de color transparente.
export function shadowBand(width: number, height: number, d0: number, d1: number, alpha: number, z = 0.0006): BufferGeometry {
  const g = sweptRectangle(width, height, [
    [d0, z],
    [d1, z],
  ], true)
  const count = g.getAttribute('position').count
  const colors: number[] = []
  // Por lado: dos vértices en d0 y dos en d1 (ver sweptRectangle).
  for (let i = 0; i < count; i++) colors.push(0.16, 0.11, 0.06, i % 4 < 2 ? alpha : 0)
  g.setAttribute('color', new Float32BufferAttribute(colors, 4))
  return g
}
