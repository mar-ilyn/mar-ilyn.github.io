import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import type { Group } from 'three'
import { profile } from '../data/profile'
import { INTRO_LAYOUT, INTRO_X, ROOM } from './layout'
import { ASCENT, bronze, buildLettering, DESCENT, SHADOW, shadowMaterial } from './letteringGeometry'

// El nombre de la intro en letras de bronce dorado en relieve, montadas sobre la pared. El h1 sigue en
// el HTML (transparente) para lectores de pantalla y buscadores; cada cuadro, las letras se ubican donde
// está ese texto, con su mismo tamaño, así acompañan el acercamiento de la cámara sin desalinearse.

// Línea base desde el borde de arriba del h1 (line-height 1), en em: medio interlineado + ascendente.
const BASELINE = (1 - (ASCENT + DESCENT)) / 2 + ASCENT

// Materiales propios: la opacidad acompaña la aparición del resto del texto de la intro.
const material = bronze()
const shadows = SHADOW.map((s) => ({ ...s, material: shadowMaterial(s.opacity) }))

interface Props {
  // Panel HTML de la intro (IntroText): de ahí sale la posición y el tamaño del h1.
  target: RefObject<HTMLElement | null>
  visible: boolean
  reducedMotion: boolean
}

export function IntroName({ target, visible, reducedMotion }: Props) {
  const group = useRef<Group>(null)
  const opacity = useRef(visible ? 1 : 0)
  const geo = useMemo(() => buildLettering(profile.name), [])

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
    material.opacity = opacity.current
    for (const s of shadows) s.material.opacity = s.opacity * opacity.current
    g.visible = opacity.current > 0
    if (opacity.current !== goal) invalidate()
  })

  return (
    <group ref={group} name="intro-name">
      {shadows.map((s) => (
        <mesh key={s.dx} geometry={geo.flat} material={s.material} position={[s.dx, s.dy, 0]} renderOrder={1} />
      ))}
      <mesh geometry={geo.letters} material={material} renderOrder={2} />
    </group>
  )
}
