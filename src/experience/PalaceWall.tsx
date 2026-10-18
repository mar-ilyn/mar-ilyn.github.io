import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, MeshBasicMaterial, MeshStandardMaterial, type BufferGeometry, type InstancedMesh, type Material } from 'three'
import { createMarbleTexture } from './marbleTexture'
import { shadowBand, sweptRectangle, type Profile } from './moldingGeometry'
import { INTRO_LAYOUT, INTRO_X, ROOM } from './layout'
import { agedGold, ivoryTrim } from './ornament'
import { PlasterSurface } from './PlasterSurface'
import { columnGeometries, lowerPanel, trimGeometry, WALL, wallLayout } from './wallGeometry'
import { ABOUT_BAY } from '../data/timeline'

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
const ORNAMENT_RANGE = { from: -30, to: 30 } as const

// Mármol marfil apenas veteado para los fustes y pedestales de las columnas.
function MarbleColumns({ geometry, xs }: { geometry: BufferGeometry; xs: readonly number[] }) {
  const material = useMemo(
    () => new MeshStandardMaterial({ map: createMarbleTexture(), roughness: 0.42, envMapIntensity: 0.9 }),
    [],
  )
  useEffect(() => () => material.map?.dispose(), [material])
  return <Row geometry={geometry} material={material} xs={xs} name="wall-columns-marble" />
}

interface FrameSize {
  width: number
  height: number
}

// Molduras de los paneles de la pared: de yeso, del mismo marfil, con un filete dorado fino y apagado junto
// al borde interior. El relieve lo da la luz sobre el perfil curvo (sombreado suave): un canto, una garganta
// honda, el toro (el cuerpo de la moldura), el escalón donde va el filete y el filo que baja a la pared.
// Perfil: [distancia hacia adentro desde el borde de afuera, altura], en metros, para 0,09 m de ancho.
const MOLDING: Profile = [
  [0, 0],
  [0, 0.013],
  [0.003, 0.022],
  [0.008, 0.025],
  [0.012, 0.022],
  [0.015, 0.014],
  [0.019, 0.009],
  [0.024, 0.011],
  [0.029, 0.02],
  [0.035, 0.034],
  [0.042, 0.043],
  [0.05, 0.047],
  [0.058, 0.043],
  [0.063, 0.033],
  [0.067, 0.022],
  [0.069, 0.019],
  [0.075, 0.019],
  [0.078, 0.015],
  [0.084, 0.008],
  [0.09, 0],
]
// El filete dorado, sobre el escalón (entre 0,069 y 0,075), apenas levantado para no pelear con el yeso.
const FILLET: Profile = [
  [0.069, 0.0192],
  [0.072, 0.0212],
  [0.0752, 0.0192],
]
const moldingProfile = (scale: number): Profile => MOLDING.map(([d, z]) => [d * scale, z * scale] as const)
const filletProfile = (scale: number): Profile => FILLET.map(([d, z]) => [d * scale, z * scale] as const)

// Yeso marfil, mate, un poco más cálido que la pared; el oro, apagado y satinado.
const plaster = new MeshStandardMaterial({ color: '#efe6d3', roughness: 0.72, envMapIntensity: 0.9 })
const fillet = new MeshStandardMaterial({ color: '#c9a865', metalness: 0.6, roughness: 0.38, envMapIntensity: 1 })
// Sombra que la moldura proyecta sobre la pared, adentro del panel (más ancha) y afuera.
const shade = new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false })
const shadowsFor = (w: number, h: number, scale: number) => [
  shadowBand(w, h, 0.09 * scale, 0.14 * scale, 0.22),
  shadowBand(w, h, 0, -0.035 * scale, 0.14),
]

function PanelMoldings({ wide, intro, wideXs }: { wide: FrameSize; intro: FrameSize; wideXs: readonly number[] }) {
  const geo = useMemo(
    () => ({
      wide: sweptRectangle(wide.width, wide.height, moldingProfile(1), true),
      wideFillet: sweptRectangle(wide.width, wide.height, filletProfile(1), true),
      intro: sweptRectangle(intro.width, intro.height, moldingProfile(1.15), true),
      introFillet: sweptRectangle(intro.width, intro.height, filletProfile(1.15), true),
      wideShadows: shadowsFor(wide.width, wide.height, 1),
      introShadows: shadowsFor(intro.width, intro.height, 1.15),
    }),
    [wide.width, wide.height, intro.width, intro.height],
  )
  useEffect(() => () => Object.values(geo).flat().forEach((g) => g.dispose()), [geo])
  return (
    <>
      <Row geometry={geo.wide} material={plaster} xs={wideXs} y={PANEL_Y} name="gilt-frames" />
      <Row geometry={geo.wideFillet} material={fillet} xs={wideXs} y={PANEL_Y} name="gilt-frames" />
      {geo.wideShadows.map((g, i) => (
        <Row key={i} geometry={g} material={shade} xs={wideXs} y={PANEL_Y} name="gilt-frames" />
      ))}
      <group position={[INTRO_X, PANEL_Y, 0.002]} name="gilt-frame-intro">
        <mesh geometry={geo.intro} material={plaster} />
        <mesh geometry={geo.introFillet} material={fillet} />
        {geo.introShadows.map((g, i) => (
          <mesh key={i} geometry={g} material={shade} renderOrder={1} />
        ))}
      </group>
    </>
  )
}

const PANEL_Y = (WALL.panel.bottom + WALL.panel.top) / 2
const PANEL_H = WALL.panel.top - WALL.panel.bottom

export function PalaceWall({ bare = false }: { bare?: boolean }) {
  const { length, height, wallZ } = ROOM
  const introBay = INTRO_LAYOUT.bay

  const layout = useMemo(
    () =>
      wallLayout(ORNAMENT_RANGE.from, ORNAMENT_RANGE.to, [
        { left: INTRO_X - introBay / 2, right: INTRO_X + introBay / 2 },
        ABOUT_BAY,
      ]),
    [introBay],
  )

  const geo = useMemo(() => {
    const column = columnGeometries()
    return {
      columnIvory: column.ivory,
      columnGold: column.gold,
      trim: trimGeometry(length),
      lowerWide: lowerPanel(WALL.wide - 0.45),
      lowerIntro: lowerPanel(introBay - 0.95),
    }
  }, [length, introBay])

  return (
    <group position={[0, 0, wallZ]} name="palace-wall">
      <PlasterSurface width={length} height={height} position={[0, height / 2, 0]} bare={bare} />
      <mesh geometry={geo.trim} material={ivoryTrim} />

      <MarbleColumns geometry={geo.columnIvory} xs={layout.columns} />
      <Row geometry={geo.columnGold} material={agedGold} xs={layout.columns} name="wall-columns-gold" />

      <PanelMoldings
        wide={{ width: WALL.wide - 0.45, height: PANEL_H }}
        intro={{ width: introBay - 0.95, height: PANEL_H }}
        wideXs={layout.wideBays}
      />

      <Row geometry={geo.lowerWide} material={ivoryTrim} xs={layout.wideBays} y={WALL.lowerPanel.y} />
      <mesh geometry={geo.lowerIntro} material={ivoryTrim} position={[INTRO_X, WALL.lowerPanel.y, 0]} />

    </group>
  )
}
