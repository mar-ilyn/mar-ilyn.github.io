// Descarga las fuentes CC0 (Poly Haven) y genera los assets optimizados en public/.
//   - Texturas JPG → KTX2 (Basis Universal ETC1S con mipmaps): mucho más livianas en GPU y en red.
//   - HDRI 1k → 256×128 en assets-src/: base para hornear el entorno (npm run bake:env).
// Las fuentes quedan en assets-src/ (ignorado por git); en el repo solo viven los resultados.
// Uso: npm run assets
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'
import { encodeToKTX2 } from 'ktx2-encoder'

const ROOT = join(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..')
const SRC = join(ROOT, 'assets-src')
const OUT = join(ROOT, 'public', 'assets')
const PH = 'https://dl.polyhaven.org/file/ph-assets'

// kind: color (sRGB), linear (rugosidad/AO), normal (mapa normal OpenGL).
const TEXTURES = [
  { file: 'herringbone_parquet_diff_1k.jpg', path: 'Textures/jpg/1k/herringbone_parquet', out: 'parquet_color.ktx2', kind: 'color' },
  { file: 'herringbone_parquet_nor_gl_1k.jpg', path: 'Textures/jpg/1k/herringbone_parquet', out: 'parquet_normal.ktx2', kind: 'normal' },
  { file: 'herringbone_parquet_arm_1k.jpg', path: 'Textures/jpg/1k/herringbone_parquet', out: 'parquet_arm.ktx2', kind: 'linear' },
  { file: 'painted_plaster_wall_nor_gl_1k.jpg', path: 'Textures/jpg/1k/painted_plaster_wall', out: 'plaster_normal.ktx2', kind: 'normal' },
  { file: 'painted_plaster_wall_arm_1k.jpg', path: 'Textures/jpg/1k/painted_plaster_wall', out: 'plaster_arm.ktx2', kind: 'linear' },
]
const HDRI = { file: 'ballroom_1k.hdr', path: 'HDRIs/hdr/1k', out: 'ballroom_256.hdr', width: 256 }

async function fetchSource({ file, path }) {
  const dest = join(SRC, file)
  if (existsSync(dest)) return readFile(dest)
  const res = await fetch(`${PH}/${path}/${file}`)
  if (!res.ok) throw new Error(`No se pudo descargar ${file}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  console.log(`descargado ${file} (${(buf.length / 1e6).toFixed(2)} MB)`)
  return buf
}

const imageDecoder = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data), width: info.width, height: info.height }
}

async function encodeTexture(source, kind) {
  return encodeToKTX2(new Uint8Array(source), {
    isUASTC: false,
    qualityLevel: kind === 'normal' ? 200 : 160,
    compressionLevel: 2,
    generateMipmap: true,
    isNormalMap: kind === 'normal',
    isPerceptual: kind === 'color',
    imageDecoder,
  })
}

// --- Radiance HDR (RGBE): lectura con RLE y escritura plana, para reducir el HDRI ---
function readHDR(buf) {
  let pos = 0
  const line = () => {
    let s = ''
    while (buf[pos] !== 0x0a) s += String.fromCharCode(buf[pos++])
    pos++
    return s
  }
  let l
  while ((l = line()) !== '') if (!l.startsWith('#') && !l.includes('=') && !l.startsWith('?')) break
  const [, h, , w] = line().split(' ')
  const width = Number(w)
  const height = Number(h)
  const data = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    if (buf[pos] !== 2 || buf[pos + 1] !== 2) throw new Error('HDR sin RLE no soportado')
    pos += 4
    const row = new Uint8Array(width * 4)
    for (let c = 0; c < 4; c++) {
      let x = 0
      while (x < width) {
        let count = buf[pos++]
        if (count > 128) {
          count -= 128
          const v = buf[pos++]
          for (let i = 0; i < count; i++) row[(x++) * 4 + c] = v
        } else {
          for (let i = 0; i < count; i++) row[(x++) * 4 + c] = buf[pos++]
        }
      }
    }
    data.set(row, y * width * 4)
  }
  return { width, height, data }
}

const rgbeToFloat = (r, g, b, e) => {
  if (e === 0) return [0, 0, 0]
  const f = Math.pow(2, e - 136)
  return [r * f, g * f, b * f]
}

function floatToRgbe(r, g, b) {
  const m = Math.max(r, g, b)
  if (m < 1e-32) return [0, 0, 0, 0]
  const e = Math.ceil(Math.log2(m)) + 1
  const f = 256 / Math.pow(2, e)
  return [Math.min(255, r * f), Math.min(255, g * f), Math.min(255, b * f), e + 128]
}

function downsampleHDR(img, width) {
  const scale = img.width / width
  const height = Math.round(img.height / scale)
  const out = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0
      let g = 0
      let b = 0
      let n = 0
      for (let sy = Math.floor(y * scale); sy < Math.floor((y + 1) * scale); sy++) {
        for (let sx = Math.floor(x * scale); sx < Math.floor((x + 1) * scale); sx++) {
          const i = (sy * img.width + sx) * 4
          const [fr, fg, fb] = rgbeToFloat(img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3])
          r += fr
          g += fg
          b += fb
          n++
        }
      }
      out.set(floatToRgbe(r / n, g / n, b / n), (y * width + x) * 4)
    }
  }
  const header = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`, 'ascii')
  return Buffer.concat([header, Buffer.from(out)])
}

await mkdir(SRC, { recursive: true })
await mkdir(OUT, { recursive: true })

for (const t of TEXTURES) {
  const ktx2 = await encodeTexture(await fetchSource(t), t.kind)
  await writeFile(join(OUT, t.out), ktx2)
  console.log(`${t.out}: ${(ktx2.length / 1024).toFixed(0)} KB`)
}

const hdr = downsampleHDR(readHDR(await fetchSource(HDRI)), HDRI.width)
await writeFile(join(SRC, HDRI.out), hdr)
console.log(`${HDRI.out}: ${(hdr.length / 1024).toFixed(0)} KB`)
