import { ExtrudeGeometry, MeshBasicMaterial, MeshStandardMaterial, ShapeGeometry, type BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { FontLoader, type FontData } from 'three/examples/jsm/loaders/FontLoader.js'
import fontData from './letteringFont.json'

// Letras de bronce en relieve (los títulos de las zonas), con los contornos de
// EB Garamond 500 (letteringFont.json, npm run lettering-font). Medidas en em: el componente
// escala el grupo al tamaño de letra en metros. El origen es la línea base, al comienzo del texto.

export const font = new FontLoader().parse(fontData as unknown as FontData)
const res = fontData.resolution
export const CAP_HEIGHT = fontData.capHeight / res

const DEPTH = 0.1
const BEVEL = 0.022

export const hasGlyphs = (text: string) => [...text].every((c) => c in fontData.glyphs)

export interface LetteringGeometry {
  // Letras extruidas con bisel; la cara de atrás apoya en z = 0.
  letters: BufferGeometry
  // Contorno plano, para la sombra sobre la pared.
  flat: BufferGeometry
  width: number
}

// Cada letra se arma por separado para poder espaciarlas (tracking, en em): las mayúsculas de los títulos
// van espaciadas, como en una placa grabada.
export function buildLettering(text: string, tracking = 0): LetteringGeometry {
  const letters: BufferGeometry[] = []
  const flat: BufferGeometry[] = []
  let pen = 0
  for (const char of text) {
    const glyph = fontData.glyphs[char as keyof typeof fontData.glyphs]
    if (!glyph) throw new Error(`Falta la letra "${char}" en letteringFont.json (npm run lettering-font)`)
    const shapes = font.generateShapes(char, 1)
    if (shapes.length) {
      const solid = new ExtrudeGeometry(shapes, {
        depth: DEPTH,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: BEVEL,
        bevelSize: BEVEL * 0.7,
        bevelSegments: 3,
      })
      solid.translate(pen, 0, BEVEL)
      letters.push(solid)
      flat.push(new ShapeGeometry(shapes, 10).translate(pen, 0, 0))
    }
    pen += glyph.ha / res + tracking
  }
  const width = pen - tracking
  const merged = { letters: mergeGeometries(letters), flat: mergeGeometries(flat), width }
  for (const g of [...letters, ...flat]) g.dispose()
  return merged
}

// Bronce dorado de las letras (más oscuro en los títulos sobre el fondo claro del mueble).
export const bronze = (color = '#b98f48') =>
  new MeshStandardMaterial({ color, metalness: 0.88, roughness: 0.3, envMapIntensity: 1.15, transparent: true })

// Sombra suave sobre la pared: tres copias planas del contorno, cada vez más corridas y tenues (en em).
export const SHADOW = [
  { dx: 0.012, dy: -0.02, opacity: 0.11 },
  { dx: 0.02, dy: -0.034, opacity: 0.08 },
  { dx: 0.03, dy: -0.05, opacity: 0.05 },
]
export const shadowMaterial = (opacity: number) => new MeshBasicMaterial({ color: '#2a1a0c', transparent: true, opacity, depthWrite: false })
