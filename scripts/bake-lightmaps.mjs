// Hornea la oclusión ambiental de piso, pared y techo con Blender (Cycles) a partir de la escena real.
//   1. Levanta la app en modo desarrollo y exporta la geometría estática a GLB (DevSceneExport).
//   2. Corre Blender sin ventana con scripts/blender/bake_lightmaps.py.
//   3. Comprime los lightmaps a KTX2 en public/assets/.
// Requiere Blender 4.5 LTS. Ruta por defecto en Windows; se puede cambiar con la variable BLENDER.
// Uso: npm run bake:lightmaps   (--solo-comprimir reutiliza los PNG ya horneados)
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { encodeToKTX2 } from 'ktx2-encoder'
import { createServer } from 'vite'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WORK = join(ROOT, 'assets-src', 'lightmaps')
const OUT = join(ROOT, 'public', 'assets')
const BLENDER = process.env.BLENDER ?? 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe'
// Resolución final en el sitio. Se hornea más grande y se reduce al comprimir (suaviza el ruido).
// _ao: oclusión ambiental; _light: luz directa horneada (sol por ventanas y luz del retrato).
const MAPS = {
  floor_ao: [2048, 1024],
  wall_ao: [2048, 128],
  wall_ao_bare: [2048, 128],
  ceiling_ao: [512, 256],
  floor_light: [1024, 512],
  wall_light: [2048, 128],
}
const ENCODE_ONLY = process.argv.includes('--solo-comprimir')

if (!ENCODE_ONLY && !existsSync(BLENDER)) {
  console.error(`No se encontró Blender en ${BLENDER}. Instalá Blender 4.5 LTS o definí la variable BLENDER.`)
  process.exit(1)
}
await mkdir(WORK, { recursive: true })

if (!ENCODE_ONLY) await exportAndBake()

async function exportAndBake() {
  // 1. Exportar la escena estática desde la app.
  const server = await createServer({ root: ROOT, server: { port: 5198, strictPort: true }, logLevel: 'error' })
  await server.listen()
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const glbPath = join(WORK, 'scene.glb')
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    await page.goto('http://localhost:5198/proyectos?calidad=baja')
    await page.waitForSelector('.experience[data-ready="true"]', { timeout: 180_000 })
    await page.waitForFunction(() => typeof window.__exportStaticSceneGLB === 'function')
    const base64 = await page.evaluate(() => window.__exportStaticSceneGLB())
    await writeFile(glbPath, Buffer.from(base64, 'base64'))
    console.log(`escena exportada: ${(Buffer.byteLength(base64, 'base64') / 1e6).toFixed(1)} MB`)
  } finally {
    await browser.close()
    await server.close()
}

// 2. Hornear en Blender.
await new Promise((resolve, reject) => {
  const args = ['-b', '--factory-startup', '--python', join(ROOT, 'scripts/blender/bake_lightmaps.py'), '--', glbPath, WORK]
  const child = spawn(BLENDER, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (d) => {
    for (const line of String(d).split('\n')) if (line.startsWith('[bake]') || /Error/.test(line)) console.log(line)
  })
  child.stderr.on('data', (d) => process.stderr.write(d))
  child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`Blender terminó con código ${code}`))))
})
}

// 3. Comprimir a KTX2 ETC1S con calidad máxima: la oclusión es casi toda lisa y comprime muy bien
// (UASTC pesaba ~4 veces más sin diferencia visible a esta escala).
const imageDecoder = async (buffer) => {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data), width: info.width, height: info.height }
}
for (const [name, [width, height]] of Object.entries(MAPS)) {
  const png = await sharp(await readFile(join(WORK, `${name}.png`))).resize(width, height).png().toBuffer()
  const ktx2 = await encodeToKTX2(new Uint8Array(png), {
    isUASTC: false,
    qualityLevel: 255,
    compressionLevel: 4,
    generateMipmap: true,
    isPerceptual: false,
    imageDecoder,
  })
  await writeFile(join(OUT, `${name}.ktx2`), ktx2)
  console.log(`${name}.ktx2: ${(ktx2.length / 1024).toFixed(0)} KB`)
}

// Escala real de los mapas de luz (se guardaron normalizados a 0..1). La app la importa.
const { lightScale } = JSON.parse(await readFile(join(WORK, 'lightmaps.json'), 'utf8'))
await writeFile(join(ROOT, 'src/experience/bakedLighting.json'), `${JSON.stringify({ lightScale }, null, 2)}\n`)
console.log('escalas de luz:', lightScale)
