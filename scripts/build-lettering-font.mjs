// Genera src/experience/letteringFont.json: los contornos de Cormorant Garamond peso 500 en el formato de
// fuente de three.js (typeface), para las letras 3D de bronce: el nombre de la intro y los títulos en
// mayúsculas de las zonas (Proyectos, Experiencia, Estudios). Solo entran los caracteres que se usan: el
// archivo pesa unos pocos KB. Un test (letteringGeometry.test.ts) avisa si un texto pide una letra que falta.
// Tipografía: Cormorant Garamond (Christian Thalmann), SIL Open Font License 1.1, desde el paquete
// @fontsource-variable/cormorant-garamond que ya usa el sitio.
//
// Uso: npm run lettering-font (volver a correrlo si cambia el nombre o un título).

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fontkit from 'fontkit'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FONT = join(ROOT, 'node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2')
const OUT = join(ROOT, 'src/experience/letteringFont.json')
const WEIGHT = 500

const read = (file) => readFile(join(ROOT, file), 'utf8')
const match = (source, re, what) => {
  const found = re.exec(source)?.[1]
  if (!found) throw new Error(`No se encontró ${what}`)
  return found
}
const profile = await read('src/data/profile.ts')
const projects = await read('src/data/projects.ts')
const timeline = await read('src/data/timeline.ts')
const name = match(profile, /name:\s*'([^']+)'/, 'el nombre en src/data/profile.ts')
const titles = [
  match(projects, /PROJECTS_TITLE\s*=\s*'([^']+)'/, 'PROJECTS_TITLE en src/data/projects.ts'),
  ...[...match(timeline, /SECTION_LABEL[^{]*\{([^}]+)\}/, 'SECTION_LABEL en src/data/timeline.ts').matchAll(/'([^']+)'/g)].map((m) => m[1]),
]
// Los títulos van en mayúsculas.
const text = name + titles.join('').toLocaleUpperCase('es')

// getVariation() de fontkit no funciona con woff2 (pierde la tabla de caracteres): el peso se fija en
// la fuente original, antes de leer cualquier glifo (el procesador de variaciones se calcula una vez).
const font = fontkit.create(await readFile(FONT))
font.variationCoords = font.fvar.axis.map((axis) => (axis.axisTag.trim() === 'wght' ? WEIGHT : axis.defaultValue))
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
for (const char of [...new Set(text)].sort()) {
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
  familyName: font.familyName,
  ascender: round(font.ascent),
  descender: round(font.descent),
  // Altura de las mayúsculas (para centrar los títulos en vertical).
  capHeight: round(font.capHeight),
  underlinePosition: round(font.underlinePosition),
  underlineThickness: round(font.underlineThickness),
  boundingBox: { xMin: round(font.bbox.minX), yMin: round(font.bbox.minY), xMax: round(font.bbox.maxX), yMax: round(font.bbox.maxY) },
  resolution: font.unitsPerEm,
  original_font_information: { format: 0, fontFamily: font.familyName, weight: WEIGHT, license: 'SIL Open Font License 1.1' },
  cssFontWeight: 'normal',
  cssFontStyle: 'normal',
}

await writeFile(OUT, JSON.stringify(json))
console.log(`${OUT}: ${Object.keys(glyphs).length} glifos (${Object.keys(glyphs).join('')}), ${(JSON.stringify(json).length / 1024).toFixed(1)} KB`)
