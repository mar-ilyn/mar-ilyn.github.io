import { useLayoutEffect, useMemo, useRef } from 'react'
import { Group, InstancedMesh, Object3D, SphereGeometry, TorusGeometry } from 'three'
import { bake } from './bake'
import { gold, goldDeep, place, ring, scroll } from './ornament'

// Marco dorado barroco, procedural: moldura escalonada, filas de perlas,
// relieve de hojas, volutas en las esquinas y cartelas al centro de cada lado.
// Las piezas fijas se hornean en una geometría; perlas y hojas van instanciadas.

interface Props {
  width: number
  height: number
  border?: number
  position?: [number, number, number]
  photoColor?: string
}

const Z_TOP = 0.12

function buildGilding(width: number, height: number, border: number) {
  const k = border / 0.24
  const innerW = width - 2 * border
  const innerH = height - 2 * border
  const g = {
    cScroll: new TorusGeometry(0.075 * k, 0.019 * k, 10, 32, Math.PI * 1.5),
    curl: new TorusGeometry(0.036 * k, 0.013 * k, 8, 24, Math.PI * 1.75),
    shell: new SphereGeometry(0.07 * k, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    leaf: new SphereGeometry(0.045 * k, 12, 8),
    knob: new SphereGeometry(0.024 * k, 12, 8),
  }

  const root = new Group()
  place(root, ring(width - 0.08 * k, height - 0.08 * k, innerW + 0.12 * k, innerH + 0.12 * k, 0.05, 0.045 * k), {
    position: [0, 0, 0.02],
  })
  place(root, ring(innerW + 0.06 * k, innerH + 0.06 * k, innerW, innerH, 0.07, 0.01), { position: [0, 0, 0.01] })

  const corners = [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ] as const
  for (const [sx, sy] of corners) {
    const corner = new Group()
    corner.position.set((sx * (width - border)) / 2, (sy * (height - border)) / 2, Z_TOP)
    root.add(corner)
    const angle = Math.atan2(sy, sx)
    const o = 0.075 * k
    place(corner, g.shell, { position: [0, 0, -0.01], rotation: [Math.PI / 2, angle - Math.PI / 2, 0], scale: [1, 0.5, 1] })
    place(corner, g.cScroll, { position: [sx * o * 1.6, sy * o * 0.4, 0], ...scroll(angle - Math.PI * 0.25) })
    place(corner, g.cScroll, { position: [sx * o * 0.4, sy * o * 1.6, 0], ...scroll(angle + Math.PI * 0.75, 1, true) })
    place(corner, g.curl, { position: [sx * o * 2.6, sy * o * 1.6, 0.01], ...scroll(angle) })
    place(corner, g.curl, { position: [sx * o * 1.6, sy * o * 2.6, 0.01], ...scroll(angle + Math.PI, 1, true) })
    place(corner, g.knob, { position: [sx * o * 2.7, sy * o * 2.7, 0] })
    place(corner, g.leaf, {
      position: [-sx * o * 1.1, -sy * o * 0.2, 0],
      rotation: [0, 0, sy * sx * 0.3],
      scale: [2.2, 0.55, 0.5],
    })
    place(corner, g.leaf, {
      position: [-sx * o * 0.2, -sy * o * 1.1, 0],
      rotation: [0, 0, Math.PI / 2 - sy * sx * 0.3],
      scale: [2.2, 0.55, 0.5],
    })
  }

  const mids: [number, number, number][] = [
    [0, height / 2 - border / 2, 0],
    [0, -height / 2 + border / 2, Math.PI],
    [width / 2 - border / 2, 0, -Math.PI / 2],
    [-width / 2 + border / 2, 0, Math.PI / 2],
  ]
  for (const [x, y, rot] of mids) {
    const mid = new Group()
    mid.position.set(x, y, Z_TOP)
    mid.rotation.set(0, 0, rot)
    root.add(mid)
    place(mid, g.shell, { position: [0, 0, 0], rotation: [Math.PI / 2, 0, 0], scale: [1, 0.55, 0.8] })
    place(mid, g.knob, { position: [0, 0.06 * k, 0.02] })
    place(mid, g.cScroll, { position: [0.11 * k, -0.01, 0], ...scroll(Math.PI * 0.85, 0.85) })
    place(mid, g.cScroll, { position: [-0.11 * k, -0.01, 0], ...scroll(Math.PI * 0.15, 0.85, true) })
    place(mid, g.curl, { position: [0.2 * k, 0.015, 0], ...scroll(Math.PI * 0.2) })
    place(mid, g.curl, { position: [-0.2 * k, 0.015, 0], ...scroll(Math.PI * 0.8, 1, true) })
    place(mid, g.leaf, { position: [0.28 * k, 0, -0.01], scale: [2.2, 0.5, 0.45] })
    place(mid, g.leaf, { position: [-0.28 * k, 0, -0.01], scale: [2.2, 0.5, 0.45] })
  }

  const baked = bake(root)
  for (const geometry of Object.values(g)) geometry.dispose()
  return baked
}

function perimeterPoints(w: number, h: number, spacing: number) {
  const points: [number, number][] = []
  const along = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / spacing))
    for (let i = 0; i < n; i++) points.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n])
  }
  along(-w / 2, -h / 2, w / 2, -h / 2)
  along(w / 2, -h / 2, w / 2, h / 2)
  along(w / 2, h / 2, -w / 2, h / 2)
  along(-w / 2, h / 2, -w / 2, -h / 2)
  return points
}

interface Instance {
  x: number
  y: number
  rot: number
}

function useInstances(ref: React.RefObject<InstancedMesh | null>, items: Instance[], z: number, scale: [number, number, number]) {
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new Object3D()
    items.forEach(({ x, y, rot }, i) => {
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, 0, rot)
      dummy.scale.set(...scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [ref, items, z, scale])
}

const BEAD_SCALE: [number, number, number] = [1, 1, 0.7]
const LEAF_SCALE: [number, number, number] = [1.7, 0.6, 0.55]

function Beads({ w, h, z, radius, spacing }: { w: number; h: number; z: number; radius: number; spacing: number }) {
  const ref = useRef<InstancedMesh>(null)
  const items = useMemo(() => perimeterPoints(w, h, spacing).map(([x, y]) => ({ x, y, rot: 0 })), [w, h, spacing])
  const geometry = useMemo(() => new SphereGeometry(radius, 8, 6), [radius])
  useInstances(ref, items, z, BEAD_SCALE)
  return <instancedMesh ref={ref} args={[geometry, gold, items.length]} />
}

// Relieve de hojas a lo largo de la moldura, alternando la inclinación como en una guirnalda.
function LeafRun({ w, h, z, size, spacing, gap }: { w: number; h: number; z: number; size: number; spacing: number; gap: number }) {
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new SphereGeometry(size, 10, 6), [size])
  const items = useMemo(() => {
    const out: Instance[] = []
    const side = (len: number, fixed: number, vertical: boolean, sign: number) => {
      const n = Math.floor((len - 2 * gap) / spacing)
      for (let i = 0; i <= n; i++) {
        const t = -len / 2 + gap + i * spacing
        if (Math.abs(t) < gap * 0.9) continue
        const rot = (i % 2 === 0 ? 0.6 : -0.6) + (vertical ? Math.PI / 2 : 0)
        out.push(vertical ? { x: fixed * sign, y: t, rot } : { x: t, y: fixed * sign, rot })
      }
    }
    side(w, h / 2, false, 1)
    side(w, h / 2, false, -1)
    side(h, w / 2, true, 1)
    side(h, w / 2, true, -1)
    return out
  }, [w, h, spacing, gap])
  useInstances(ref, items, z, LEAF_SCALE)
  return <instancedMesh ref={ref} args={[geometry, gold, items.length]} />
}

export function OrnateFrame({ width, height, border = 0.24, position = [0, 0, 0], photoColor = '#d8d0c0' }: Props) {
  const k = border / 0.24
  const innerW = width - 2 * border
  const innerH = height - 2 * border
  const back = useMemo(() => ring(width, height, innerW, innerH, 0.03, 0.012), [width, height, innerW, innerH])
  const gilding = useMemo(() => buildGilding(width, height, border), [width, height, border])

  return (
    <group position={position} name="ornate-frame">
      <mesh geometry={back} material={goldDeep} />
      <mesh geometry={gilding} material={gold} />
      <Beads w={innerW + 0.04 * k} h={innerH + 0.04 * k} z={0.1} radius={0.009 * k} spacing={0.024 * k} />
      <Beads w={width - 0.03 * k} h={height - 0.03 * k} z={0.05} radius={0.008 * k} spacing={0.022 * k} />
      <LeafRun w={width - border} h={height - border} z={0.105} size={0.03 * k} spacing={0.06 * k} gap={0.24 * k} />

      <mesh position={[0, 0, 0.005]} name="photo">
        <planeGeometry args={[innerW + 0.01, innerH + 0.01]} />
        <meshStandardMaterial color={photoColor} roughness={0.9} />
      </mesh>
    </group>
  )
}
