// Imágenes de la vista en lista, renderizadas desde la propia escena 3D (no generadas con IA):
//   - hero-{h,v}.{avif,webp}: la sala de la intro sin cuadro, lámpara ni texto (16:9 y 9:16).
//   - frame.webp: el marco tallado con su lámpara, de frente y con fondo transparente; el hueco
//     del lienzo queda abierto para poner la foto en HTML.
// Usa la GPU del equipo (Chromium con ANGLE/D3D11) sobre el build de producción.
// Uso: npm run build && npm run render:images
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { preview } from 'vite'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'lista')
const PORT = 4299

// Oculta todo lo que no es la escena: header, textos, pistas y pantalla de carga.
const HIDE_UI = `
  .site-header, .intro-text, .overlay, .loading-screen, .panel { display: none !important; }
  .experience::after { display: none !important; }
`

await mkdir(OUT, { recursive: true })
const server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true }, logLevel: 'error' })
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] })

async function renderHero(name, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  await page.goto(`http://localhost:${PORT}/?render=fondo`)
  await page.addStyleTag({ content: HIDE_UI })
  await page.waitForSelector('.experience[data-ready="true"]', { timeout: 120_000 })
  await page.waitForTimeout(1500)
  const png = await page.locator('canvas').screenshot()
  await page.close()
  const image = sharp(png)
  await image.clone().avif({ quality: 52, effort: 6 }).toFile(join(OUT, `${name}.avif`))
  await image.clone().webp({ quality: 78 }).toFile(join(OUT, `${name}.webp`))
  console.log(`${name}: ${width}×${height}`)
}

async function renderFrame() {
  const page = await browser.newPage({ viewport: { width: 760, height: 960 }, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:${PORT}/?render=marco`)
  await page.addStyleTag({ content: 'html, body, #root { background: transparent !important; }' })
  await page.waitForSelector('.frame-studio[data-ready="true"]', { timeout: 120_000 })
  await page.waitForTimeout(1500)
  const png = await page.locator('canvas').screenshot({ omitBackground: true })
  await page.close()
  // Recorta el margen transparente y deja la imagen lista para superponer.
  await sharp(png).trim({ threshold: 0 }).webp({ quality: 82, alphaQuality: 90 }).toFile(join(OUT, 'frame.webp'))
  const meta = await sharp(join(OUT, 'frame.webp')).metadata()
  console.log(`frame: ${meta.width}×${meta.height}`)
}

try {
  await renderHero('hero-h', 1920, 1080)
  await renderHero('hero-v', 1080, 1920)
  await renderFrame()
} finally {
  await browser.close()
  server.httpServer.close()
}
