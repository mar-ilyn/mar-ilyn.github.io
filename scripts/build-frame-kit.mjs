// Arma las texturas de las molduras doradas de la pared a partir del marco tallado
// fancy_picture_frame_02 (Poly Haven, CC0), renderizado de frente por
// scripts/blender/render_frame_kit.py. El marco se usa "en 9 partes": esquinas reales, tramos rectos
// de cada lado y el ornamento central superior como crestería (ver GiltFrame.tsx).
//   giltframe_albedo.ktx2  color con alfa (el hueco del marco es transparente)
//   giltframe_normal.ktx2  relieve tallado
//   giltframe_orm.ktx2     R = oclusión, G = rugosidad, B = máscara metálica
//   src/experience/giltFrameKit.json  medidas de las piezas en coordenadas de textura
// Uso: npm run frame-kit (después de render_frame_kit.py)
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { encodeToKTX2 } from 'ktx2-encoder'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const KIT = join(ROOT, 'assets-src', 'frame-kit')
const OUT = join(ROOT, 'public', 'assets')
const SIZE = 1024

const load = async (name, channels) => {
  const { data, info } = await sharp(join(KIT, `${name}.png`))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height, channels }
}

const albedo = await load('kit_albedo')
const normal = await load('kit_normal')
const ao = await load('kit_ao')
const rough = await load('kit_rough')
const height = await load('kit_height')
const { w, h } = albedo
const px = (img, x, y, c) => img.data[(y * w + x) * 4 + c]

// Contorno exterior (alfa) y apertura interior (relieve casi nulo en el centro).
let x0 = w, y0 = h, x1 = 0, y1 = 0
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++)
    if (px(albedo, x, y, 3) > 128) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    }
const cx = Math.round((x0 + x1) / 2)
const cy = Math.round((y0 + y1) / 2)
const flat = (x, y) => px(height, x, y, 0) < 26
let ix0 = cx, ix1 = cx, iy0 = cy, iy1 = cy
while (flat(ix0 - 1, cy)) ix0--
while (flat(ix1 + 1, cy)) ix1++
while (flat(cx, iy0 - 1)) iy0--
while (flat(cx, iy1 + 1)) iy1++
// La apertura se agranda un 2,2 % del ancho (ix0 -= lip) para sacar el filete crema interior y
// quedarse con el oro, hasta la cuerda tallada.
const lip = Math.round((x1 - x0) * 0.022)
ix0 -= lip; ix1 += lip; iy0 -= lip; iy1 += lip
const W = x1 - x0 + 1
const H = y1 - y0 + 1
console.log(`marco ${W}×${H} px, apertura ${ix1 - ix0}×${iy1 - iy0} px`)

// Recorta al contorno, vuelve transparente la apertura y reduce a SIZE de ancho.
// Las texturas comprimidas (ETC1S → BC/ETC en la GPU) exigen lados múltiplos de 4.
const outH = Math.round((SIZE * H) / W / 4) * 4
async function crop(img, transform) {
  const out = Buffer.alloc(W * H * 4)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const sx = x + x0, sy = y + y0
      const i = (sy * w + sx) * 4
      const o = (y * W + x) * 4
      const inside = sx > ix0 && sx < ix1 && sy > iy0 && sy < iy1
      const [r, g, b, a] = transform(img.data, i, sx, sy)
      out[o] = r; out[o + 1] = g; out[o + 2] = b
      out[o + 3] = inside ? 0 : a
    }
  return sharp(out, { raw: { width: W, height: H, channels: 4 } }).resize(SIZE, outH).png().toBuffer()
}

const albedoPng = await crop(albedo, (d, i) => [d[i], d[i + 1], d[i + 2], d[i + 3]])
const normalPng = await crop(normal, (d, i) => [d[i], d[i + 1], d[i + 2], 255])
// ORM: oclusión contrastada (el render tiene poco alcance), rugosidad original, metal en todo el tallado.
const ormPng = await crop(ao, (d, i, sx, sy) => {
  const occ = Math.max(0, Math.min(255, (d[i] - 150) * 2.4))
  return [occ, px(rough, sx, sy, 0), 255, 255]
})

const imageDecoder = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data), width: info.width, height: info.height }
}
const encode = (png, opts) =>
  encodeToKTX2(new Uint8Array(png), { isUASTC: false, compressionLevel: 2, generateMipmap: true, imageDecoder, ...opts })

for (const [name, png, opts] of [
  ['giltframe_albedo', albedoPng, { qualityLevel: 200, isPerceptual: true }],
  ['giltframe_normal', normalPng, { qualityLevel: 220, isNormalMap: true }],
  ['giltframe_orm', ormPng, { qualityLevel: 180 }],
]) {
  await writeFile(join(KIT, `${name}.png`), png)
  const ktx2 = await encode(png, opts)
  await writeFile(join(OUT, `${name}.ktx2`), ktx2)
  console.log(`${name}.ktx2: ${(ktx2.length / 1024).toFixed(0)} KB`)
}

// Medidas de las piezas, normalizadas al recorte (u hacia la derecha, v hacia abajo desde arriba).
const u = (x) => +((x - x0) / W).toFixed(4)
const v = (y) => +((y - y0) / H).toFixed(4)
const borderX = u(ix0) // ancho del lado izquierdo
const borderY = v(iy0)
// Medidas tomadas sobre el render (fracciones del ancho u y del alto v del marco): hasta dónde llega
// el ornamento de cada esquina y dónde está el tramo recto de moldura antes del ornamento central.
const kit = {
  source: 'fancy_picture_frame_02 (Poly Haven, CC0) — Rob Tuytel, Rico Cilliers',
  aspect: +(W / H).toFixed(4),
  widthMeters: 0.661,
  border: { u: borderX, v: borderY },
  corner: { u: 0.33, v: 0.29 },
  straight: {
    top: [0.36, 0.44],
    bottom: [0.36, 0.44],
    left: [0.3, 0.42],
    right: [0.3, 0.42],
  },
  // Crestería: el ornamento central superior del marco, un motivo cerrado que se apoya sobre la moldura.
  crest: { u: [0.4, 0.6], v: [0, borderY] },
}
await writeFile(join(ROOT, 'src/experience/giltFrameKit.json'), `${JSON.stringify(kit, null, 2)}\n`)
console.log(kit)
