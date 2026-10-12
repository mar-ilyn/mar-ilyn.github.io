import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { MeshBasicMaterial, MeshStandardMaterial, ShapeGeometry, type Group } from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader, type FontData } from 'three/examples/jsm/loaders/FontLoader.js'
import { profile } from '../data/profile'
import { INTRO_LAYOUT, INTRO_X, ROOM } from './layout'
import nameFont from './nameFont.json'

// El nombre de la intro en letras de bronce dorado en relieve, montadas sobre la pared. El h1 sigue en
// el HTML (transparente) para lectores de pantalla y buscadores; cada cuadro, las letras se ubican donde
// está ese texto, con su mismo tamaño, así acompañan el acercamiento de la cámara sin desalinearse.
// Contornos: Cormorant Garamond 500 (OFL), solo las letras del nombre (npm run name-font).

const DEPTH = 0.1 // profundidad de las letras, en em
const BEVEL = 0.022

// Línea base desde el borde de arriba del h1 (line-height 1), en em: medio interlineado + ascendente.
const ascent = nameFont.ascender / nameFont.resolution
const descent = -nameFont.descender / nameFont.resolution
const BASELINE = (1 - (ascent + descent)) / 2 + ascent

const bronze = new MeshStandardMaterial({ color: '#b98f48', metalness: 0.88, roughness: 0.3, envMapIntensity: 1.15, transparent: true })
// Sombra suave sobre la pared: tres copias planas del contorno, cada vez más corridas y tenues.
const SHADOW = [
  { dx: 0.012, dy: -0.02, opacity: 0.11 },
  { dx: 0.02, dy: -0.034, opacity: 0.08 },
  { dx: 0.03, dy: -0.05, opacity: 0.05 },
].map((s) => ({ ...s, material: new MeshBasicMaterial({ color: '#2a1a0c', transparent: true, opacity: s.opacity, depthWrite: false }) }))

interface Props {
  // Panel HTML de la intro (IntroText): de ahí sale la posición y el tamaño del h1.
  target: RefObject<HTMLElement | null>
  visible: boolean
  reducedMotion: boolean
}

export function IntroName({ target, visible, reducedMotion }: Props) {
  const group = useRef<Group>(null)
  const opacity = useRef(visible ? 1 : 0)
  const geo = useMemo(() => {
    const font = new FontLoader().parse(nameFont as unknown as FontData)
    const letters = new TextGeometry(profile.name, {
      font,
      size: 1,
      depth: DEPTH,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL * 0.7,
      bevelSegments: 3,
    })
    // La cara de atrás (con su bisel) apoya en z = 0.
    letters.translate(0, 0, BEVEL)
    const flat = new ShapeGeometry(font.generateShapes(profile.name, 1), 10)
    return { letters, flat }
  }, [])

  useFrame(({ invalidate }, delta) => {
    const g = group.current
    const section = target.current
    const name = section?.querySelector<HTMLElement>('.intro-text__name')
    if (!g || !section || !name) return
    const ppm = Number(section.style.getPropertyValue('--ppm'))
    if (!ppm) return
    const em = parseFloat(getComputedStyle(name).fontSize) / ppm
    g.scale.setScalar(em)
    g.position.set(
      INTRO_X + INTRO_LAYOUT.textLeft + name.offsetLeft / ppm,
      INTRO_LAYOUT.textTop - name.offsetTop / ppm - BASELINE * em,
      ROOM.wallZ + 0.003,
    )
    // Aparece y desaparece junto con el resto del texto de la intro.
    const goal = visible ? 1 : 0
    const next = reducedMotion ? goal : opacity.current + (goal - opacity.current) * Math.min(1, delta * 6)
    opacity.current = Math.abs(next - goal) < 0.01 ? goal : next
    bronze.opacity = opacity.current
    for (const s of SHADOW) s.material.opacity = s.opacity * opacity.current
    g.visible = opacity.current > 0
    if (opacity.current !== goal) invalidate()
  })

  return (
    <group ref={group} name="intro-name">
      {SHADOW.map((s) => (
        <mesh key={s.dx} geometry={geo.flat} material={s.material} position={[s.dx, s.dy, 0]} renderOrder={1} />
      ))}
      <mesh geometry={geo.letters} material={bronze} renderOrder={2} />
    </group>
  )
}
