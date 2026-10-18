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
import { ktx2 } from 'ktx2-encoder/gltf-transform'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, simplify, weld } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'

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
  // Nogal de la vitrina "Sobre mí" (black_walnut_veneer_01).
  { file: 'black_walnut_veneer_01_diff_1k.jpg', path: 'Textures/jpg/1k/black_walnut_veneer_01', out: 'walnut_color.ktx2', kind: 'color' },
  { file: 'black_walnut_veneer_01_nor_gl_1k.jpg', path: 'Textures/jpg/1k/black_walnut_veneer_01', out: 'walnut_normal.ktx2', kind: 'normal' },
  { file: 'black_walnut_veneer_01_arm_1k.jpg', path: 'Textures/jpg/1k/black_walnut_veneer_01', out: 'walnut_arm.ktx2', kind: 'linear' },
]

// Marco con atril para los certificados de la vitrina (standing_picture_frame_02).
const CERT_FRAME = {
  dir: 'standing_picture_frame_02',
  gltf: 'standing_picture_frame_02_1k.gltf',
  out: 'cert_frame.glb',
}
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

async function fetchModel({ dir, gltf }) {
  const folder = join(SRC, dir)
  if (existsSync(join(folder, gltf))) return join(folder, gltf)
  const res = await fetch('https://api.polyhaven.com/files/' + dir)
  const entry = (await res.json()).gltf['1k'].gltf
  const files = [[gltf, entry.url], ...Object.entries(entry.include).map(([rel, inc]) => [rel, inc.url])]
  for (const [rel, url] of files) {
    const r = await fetch(url)
    if (!r.ok) throw new Error(`No se pudo descargar ${url}: ${r.status}`)
    await mkdir(dirname(join(folder, rel)), { recursive: true })
    await writeFile(join(folder, rel), Buffer.from(await r.arrayBuffer()))
  }
  console.log(`descargado ${dir}`)
  return join(folder, gltf)
}

// Geometría comprimida con meshopt y texturas en KTX2 (el mapa normal con su modo específico).
async function buildFrame(model, { ratio = 1, texSize = 512 } = {}) {
  await MeshoptEncoder.ready
  await MeshoptSimplifier.ready
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
  const doc = await io.read(await fetchModel(model))
  // Sin la pintura del marco tallado ni el vidrio: el contenido lo pone la escena. En el marco del
  // certificado la "obra" queda como superficie y la escena le pone papel en blanco.
  const drop = /canvas|glass/i
  for (const node of doc.getRoot().listNodes()) if (drop.test(node.getName())) node.dispose()
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) if (drop.test(prim.getMaterial()?.getName() ?? '')) prim.dispose()
  // 512 px alcanzan: en la intro el cuadro ocupa ~250 px de alto; el relieve lo da la geometría.
  const frameDecoder = async (buffer) => {
    const { data, info } = await sharp(buffer).resize(texSize, texSize).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { data: new Uint8Array(data), width: info.width, height: info.height }
  }
  const common = { isUASTC: false, compressionLevel: 2, generateMipmap: true, imageDecoder: frameDecoder }
  await doc.transform(
    prune(),
    dedup(),
    weld(),
    // Desde la cámara de la intro no se distinguen 35 mil triángulos: se conserva la silueta y el
    // relieve grande; el detalle fino lo aporta el mapa normal.
    ...(ratio < 1 ? [simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002 })] : []),
    ktx2({ ...common, slots: /normalTexture/, isNormalMap: true, qualityLevel: 200 }),
    ktx2({ ...common, slots: /baseColorTexture/, isPerceptual: true, qualityLevel: 180 }),
    ktx2({ ...common, slots: /metallicRoughnessTexture/, qualityLevel: 160 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await io.write(join(OUT, model.out), doc)
  const size = (await readFile(join(OUT, model.out))).length
  console.log(`${model.out}: ${(size / 1024).toFixed(0)} KB`)
}

await mkdir(SRC, { recursive: true })
await mkdir(OUT, { recursive: true })

for (const t of TEXTURES) {
  const ktx2 = await encodeTexture(await fetchSource(t), t.kind)
  await writeFile(join(OUT, t.out), ktx2)
  console.log(`${t.out}: ${(ktx2.length / 1024).toFixed(0)} KB`)
}

// Marcos de los certificados de la vitrina: chicos, sin simplificar, texturas de 256 px.
await buildFrame(CERT_FRAME, { ratio: 1, texSize: 256 })

const hdr = downsampleHDR(readHDR(await fetchSource(HDRI)), HDRI.width)
await writeFile(join(SRC, HDRI.out), hdr)
console.log(`${HDRI.out}: ${(hdr.length / 1024).toFixed(0)} KB`)
