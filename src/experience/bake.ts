import { BufferGeometry, Mesh, type Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const ATTRIBUTES = ['position', 'normal', 'uv'] as const

// Une todas las mallas de un grafo en una sola geometría indexada, con sus transformaciones aplicadas.
// Las piezas estáticas (molduras, hojas, volutas) pasan de decenas de draw calls a uno, y al conservar
// los índices los vértices compartidos no se duplican.
export function bake(root: Object3D): BufferGeometry {
  root.updateMatrixWorld(true)
  const parts: BufferGeometry[] = []

  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const part = (node.geometry as BufferGeometry).clone().applyMatrix4(node.matrixWorld)
    for (const name of Object.keys(part.attributes)) {
      if (!(ATTRIBUTES as readonly string[]).includes(name)) part.deleteAttribute(name)
    }
    if (!part.index) part.setIndex([...Array(part.attributes.position.count).keys()])
    // Una escala negativa (espejo) invierte el orden de los vértices: se corrige para no perder caras.
    if (node.matrixWorld.determinant() < 0) flipWinding(part)
    parts.push(part)
  })

  const merged = mergeGeometries(parts)
  if (!merged) throw new Error('No se pudieron unir las geometrías')
  for (const part of parts) part.dispose()
  return merged
}

function flipWinding(geometry: BufferGeometry) {
  const index = geometry.index
  if (!index) return
  const array = index.array
  for (let i = 0; i < array.length; i += 3) {
    const tmp = array[i + 1]
    array[i + 1] = array[i + 2]
    array[i + 2] = tmp
  }
  index.needsUpdate = true
}
