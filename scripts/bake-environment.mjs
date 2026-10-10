// Precalcula el entorno de reflejos (PMREM) del HDRI y lo guarda como PNG en RGBE.
// En el navegador, generar el PMREM compila un shader de forma sincrónica (~0,6 s bloqueando
// la página en GPUs integradas). Con el resultado precalculado, solo se sube una textura.
// Usa el HDRI reducido que genera npm run assets. Uso: npm run bake:env
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { createServer } from 'vite'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({
  root: join(ROOT, 'scripts/bake-env'),
  publicDir: join(ROOT, 'assets-src'),
  server: { port: 5199, strictPort: true },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage()
  await page.goto('http://localhost:5199/')
  await page.waitForFunction(() => typeof window.bake === 'function')
  const { width, height, data } = await page.evaluate(() => window.bake('/ballroom_256.hdr'))
  const out = join(ROOT, 'public/assets/ballroom_pmrem.png')
  await sharp(Buffer.from(data), { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, palette: false })
    .toFile(out)
  console.log(`ballroom_pmrem.png: ${width}×${height}`)
} finally {
  await browser.close()
  await server.close()
}
