import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, MeshStandardMaterial, type BufferGeometry, type InstancedMesh, type Material } from 'three'
import { createMarbleTexture } from './marbleTexture'
import { INTRO_LAYOUT, INTRO_X, ROOM } from './layout'
import { agedGold, gold, ivoryTrim } from './ornament'
import { PlasterSurface } from './PlasterSurface'
import { columnGeometries, goldPanel, lowerPanel, trimGeometry, WALL, wallLayout } from './wallGeometry'

interface RowProps {
  geometry: BufferGeometry
  material: Material
  xs: readonly number[]
  y?: number
  name?: string
}

// Una pieza repetida a lo largo de la pared: un solo draw call para todas sus copias.
function Row({ geometry, material, xs, y = 0, name }: RowProps) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new Matrix4()
    xs.forEach((x, i) => mesh.setMatrixAt(i, m.makeTranslation(x, y, 0)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [xs, y])
  return <instancedMesh ref={ref} name={name} args={[geometry, material, xs.length]} />
}

// Las cámaras recorren x ∈ [-10, 4] y la niebla cierra a ~30 m: más allá la pared sigue lisa
// (con zócalo y cornisa continuos), así nunca se ve un final pero no se dibujan ornamentos invisibles.
const ORNAMENT_RANGE = { from: -30, to: 22 } as const

// Mármol marfil apenas veteado para los fustes y pedestales de las columnas.
function MarbleColumns({ geometry, xs }: { geometry: BufferGeometry; xs: readonly number[] }) {
  const material = useMemo(
    () => new MeshStandardMaterial({ map: createMarbleTexture(), roughness: 0.42, envMapIntensity: 0.9 }),
    [],
  )
  useEffect(() => () => material.map?.dispose(), [material])
  return <Row geometry={geometry} material={material} xs={xs} name="wall-columns-marble" />
}

const PANEL_Y = (WALL.panel.bottom + WALL.panel.top) / 2
const PANEL_H = WALL.panel.top - WALL.panel.bottom

export function PalaceWall() {
  const { length, height, wallZ } = ROOM
  const introBay = INTRO_LAYOUT.bay

  const layout = useMemo(
    () =>
      wallLayout(ORNAMENT_RANGE.from, ORNAMENT_RANGE.to, {
        left: INTRO_X - introBay / 2,
        right: INTRO_X + introBay / 2,
      }),
    [introBay],
  )

  const geo = useMemo(() => {
    const column = columnGeometries()
    return {
      columnIvory: column.ivory,
      columnGold: column.gold,
      wide: goldPanel(WALL.wide - 0.45, PANEL_H),
      intro: goldPanel(introBay - 0.95, PANEL_H, 1.15),
      trim: trimGeometry(length),
      lowerWide: lowerPanel(WALL.wide - 0.45),
      lowerIntro: lowerPanel(introBay - 0.95),
    }
  }, [length, introBay])

  return (
    <group position={[0, 0, wallZ]} name="palace-wall">
      <PlasterSurface width={length} height={height} position={[0, height / 2, 0]} />
      <mesh geometry={geo.trim} material={ivoryTrim} />

      <MarbleColumns geometry={geo.columnIvory} xs={layout.columns} />
      <Row geometry={geo.columnGold} material={agedGold} xs={layout.columns} name="wall-columns-gold" />

      <Row geometry={geo.wide} material={gold} xs={layout.wideBays} y={PANEL_Y} />
      <mesh geometry={geo.intro} material={gold} position={[INTRO_X, PANEL_Y, 0]} />

      <Row geometry={geo.lowerWide} material={ivoryTrim} xs={layout.wideBays} y={WALL.lowerPanel.y} />
      <mesh geometry={geo.lowerIntro} material={ivoryTrim} position={[INTRO_X, WALL.lowerPanel.y, 0]} />

    </group>
  )
}
