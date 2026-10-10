import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CylinderGeometry,
  DoubleSide,
  type Mesh,
  Object3D,
  ShaderMaterial,
  type SpotLight,
} from 'three'
import type { Vec3 } from '../data/types'
import { ROOM } from './layout'

// Haz de luz del techo al piso: cono abierto más ancho abajo, con brillo que se suma a la escena.
// Se desvanece hacia los bordes (según el ángulo de visión) y hacia el piso. La intensidad sube
// y baja suave; mientras cambia pide cuadros (frameloop="demand"), en reposo no consume.

const TOP_RADIUS = 0.1
const BOTTOM_RADIUS = 0.95
const WARM = [1.0, 0.86, 0.62] as const

const beamVertex = /* glsl */ `
  varying float vHeight;
  varying float vFacing;
  void main() {
    vHeight = uv.y;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix) * normal);
    vec3 toCamera = normalize(cameraPosition - world.xyz);
    vFacing = abs(dot(n, toCamera));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const beamFragment = /* glsl */ `
  uniform float uIntensity;
  uniform vec3 uColor;
  varying float vHeight;
  varying float vFacing;
  void main() {
    // Solo el filo se desvanece, así se lee la forma del cono abriéndose hacia el piso.
    float edge = smoothstep(0.0, 0.55, vFacing);
    float falloff = mix(0.7, 1.0, smoothstep(0.0, 1.0, vHeight));
    float alpha = uIntensity * edge * falloff * 0.3;
    gl_FragColor = vec4(uColor * alpha, alpha);
  }
`

const poolFragment = /* glsl */ `
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0;
    float alpha = uIntensity * (1.0 - smoothstep(0.3, 1.0, d)) * 0.4;
    gl_FragColor = vec4(uColor * alpha, alpha);
  }
`

const poolVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const beamGeometry = new CylinderGeometry(TOP_RADIUS, BOTTOM_RADIUS, ROOM.height, 48, 1, true)

function additive(vertexShader: string, fragmentShader: string) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uIntensity: { value: 0 }, uColor: { value: WARM } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: false,
  })
}

interface Props {
  position: Vec3
  // 0 apagado, 1 encendido del todo.
  target: number
  reducedMotion: boolean
}

export function LightBeam({ position, target, reducedMotion }: Props) {
  const beam = useMemo(() => additive(beamVertex, beamFragment), [])
  const pool = useMemo(() => additive(poolVertex, poolFragment), [])
  const beamMesh = useRef<Mesh>(null)
  const poolMesh = useRef<Mesh>(null)
  const spot = useRef<SpotLight>(null)
  const spotTarget = useMemo(() => {
    const o = new Object3D()
    o.position.set(position[0], 0, position[2])
    return o
  }, [position])
  const level = useRef(0)

  useFrame(({ invalidate }, delta) => {
    const current = level.current
    const next = reducedMotion ? target : current + (target - current) * Math.min(1, delta * 6)
    level.current = Math.abs(next - target) < 0.003 ? target : next
    const visible = level.current > 0.001
    for (const mesh of [beamMesh.current, poolMesh.current]) {
      if (!mesh) continue
      const material = mesh.material as ShaderMaterial
      material.uniforms.uIntensity.value = level.current
      mesh.visible = visible
    }
    if (spot.current) spot.current.intensity = level.current * 28
    if (level.current !== target) invalidate()
  })

  const [x, , z] = position
  return (
    <group>
      <mesh ref={beamMesh} geometry={beamGeometry} material={beam} position={[x, ROOM.height / 2, z]} renderOrder={2} />
      <mesh ref={poolMesh} material={pool} position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[BOTTOM_RADIUS * 2.6, BOTTOM_RADIUS * 2.6]} />
      </mesh>
      <primitive object={spotTarget} />
      <spotLight
        ref={spot}
        position={[x, ROOM.height - 0.05, z]}
        target={spotTarget}
        angle={0.24}
        penumbra={0.7}
        decay={1.6}
        distance={0}
        color="#ffdcae"
        intensity={0}
      />
    </group>
  )
}
