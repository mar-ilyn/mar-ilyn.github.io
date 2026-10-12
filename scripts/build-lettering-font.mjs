// Genera src/experience/nameFont.json: los contornos de las letras del nombre (profile.name) en Cormorant
// Garamond peso 500, en el formato de fuente de three.js (typeface), para las letras 3D de la intro.
// Solo entran los caracteres del nombre: el archivo pesa unos pocos KB.
// Tipografía: Cormorant Garamond (Christian Thalmann), SIL Open Font License 1.1, desde el paquete
// @fontsource-variable/cormorant-garamond que ya usa el sitio.
//
// Uso: npm run name-font (volver a correrlo si cambia el nombre en src/data/profile.ts).

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fontkit from 'fontkit'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FONT = join(ROOT, 'node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2')
const OUT = join(ROOT, 'src/experience/nameFont.json')
const WEIGHT = 500

const profile = await readFile(join(ROOT, 'src/data/profile.ts'), 'utf8')
const name = /name:\s*'([^']+)'/.exec(profile)?.[1]
if (!name) throw new Error('No se encontró el nombre en src/data/profile.ts')

// getVariation() de fontkit no funciona con woff2 (pierde la tabla de caracteres): el peso se fija en
// la fuente original, antes de leer cualquier glifo (el procesador de variaciones se calcula una vez).
const base = fontkit.create(await readFile(FONT))
const axes = base.fvar.axis.map((axis) => (axis.axisTag.trim() === 'wght' ? WEIGHT : axis.defaultValue))
base.variationCoords = axes
const font = base
const round = (v) => Math.round(v)

// Contorno en la notación de typeface.js: m/l x y, q x y cx cy (punto final y control),
// b x y c1x c1y c2x c2y (punto final y los dos controles).
function outline(path) {
  const out = []
  for (const { command, args } of path.commands) {
    const a = args.map(round)
    if (command === 'moveTo') out.push('m', a[0], a[1])
    else if (command === 'lineTo') out.push('l', a[0], a[1])
    else if (command === 'quadraticCurveTo') out.push('q', a[2], a[3], a[0], a[1])
    else if (command === 'bezierCurveTo') out.push('b', a[4], a[5], a[0], a[1], a[2], a[3])
  }
  return out.join(' ')
}

const glyphs = {}
for (const char of new Set(name)) {
  const glyph = font.glyphForCodePoint(char.codePointAt(0))
  const { minX, maxX } = glyph.bbox
  glyphs[char] = {
    ha: round(glyph.advanceWidth),
    x_min: round(Number.isFinite(minX) ? minX : 0),
    x_max: round(Number.isFinite(maxX) ? maxX : glyph.advanceWidth),
    o: outline(glyph.path),
  }
}

const json = {
  glyphs,
  familyName: base.familyName,
  ascender: round(base.ascent),
  descender: round(base.descent),
  underlinePosition: round(base.underlinePosition),
  underlineThickness: round(base.underlineThickness),
  boundingBox: { xMin: round(base.bbox.minX), yMin: round(base.bbox.minY), xMax: round(base.bbox.maxX), yMax: round(base.bbox.maxY) },
  resolution: base.unitsPerEm,
  original_font_information: { format: 0, fontFamily: base.familyName, weight: WEIGHT, license: 'SIL Open Font License 1.1' },
  cssFontWeight: 'normal',
  cssFontStyle: 'normal',
}

await writeFile(OUT, JSON.stringify(json))
console.log(`${OUT}: ${Object.keys(glyphs).length} glifos (${[...new Set(name)].join('')}), ${(JSON.stringify(json).length / 1024).toFixed(1)} KB`)
