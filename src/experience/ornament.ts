import { ExtrudeGeometry, Mesh, MeshStandardMaterial, Shape, type BufferGeometry, type Object3D } from 'three'

// Materiales y piezas compartidas por el marco, la pared y los pedestales.
// Paleta: marfil cálido, beige envejecido y oro antiguo (menos saturado y menos brillante).
export const gold = new MeshStandardMaterial({ color: '#c9a35e', metalness: 0.8, roughness: 0.38 })
// Oro envejecido de las columnas: más mate y menos saturado, con reflejos suaves.
export const agedGold = new MeshStandardMaterial({ color: '#b89652', metalness: 0.7, roughness: 0.48 })
export const ivory = new MeshStandardMaterial({ color: '#e8dcc6', roughness: 0.85 })
export const ivoryTrim = new MeshStandardMaterial({ color: '#f0e7d6', roughness: 0.7 })

// Rectángulo con hueco extruido: la base de todas las molduras.
export function ring(outerW: number, outerH: number, innerW: number, innerH: number, depth: number, bevel: number) {
  const shape = new Shape()
  shape.moveTo(-outerW / 2, -outerH / 2)
  shape.lineTo(outerW / 2, -outerH / 2)
  shape.lineTo(outerW / 2, outerH / 2)
  shape.lineTo(-outerW / 2, outerH / 2)
  shape.closePath()
  const hole = new Shape()
  hole.moveTo(-innerW / 2, -innerH / 2)
  hole.lineTo(-innerW / 2, innerH / 2)
  hole.lineTo(innerW / 2, innerH / 2)
  hole.lineTo(innerW / 2, -innerH / 2)
  hole.closePath()
  shape.holes.push(hole)
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 4,
    curveSegments: 1,
  })
}

export interface Placement {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
}

export function place(parent: Object3D, geometry: BufferGeometry, { position, rotation, scale }: Placement) {
  const mesh = new Mesh(geometry)
  mesh.position.set(...position)
  if (rotation) mesh.rotation.set(...rotation)
  if (scale) mesh.scale.set(...scale)
  parent.add(mesh)
}
