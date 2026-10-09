// Genera public/og-image.png (1200x630) con Chromium de Playwright.
// Uso: npm run og:image
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const font = (pkg, file) =>
  readFileSync(fileURLToPath(import.meta.resolve(`${pkg}/files/${file}`))).toString('base64')

const serif = font('@fontsource-variable/cormorant-garamond', 'cormorant-garamond-latin-wght-normal.woff2')
const sans = font('@fontsource-variable/inter', 'inter-latin-wght-normal.woff2')

const html = `<!doctype html><html><head><style>
@font-face{font-family:S;src:url(data:font/woff2;base64,${serif}) format('woff2');font-weight:300 700}
@font-face{font-family:I;src:url(data:font/woff2;base64,${sans}) format('woff2');font-weight:100 900}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#f4efe6;color:#2a2420;font-family:I;display:flex;align-items:center;gap:72px;padding:0 96px;position:relative;overflow:hidden}
body::after{content:'';position:absolute;left:0;right:0;bottom:0;height:70px;background:repeating-linear-gradient(90deg,#9a6a42 0 120px,#8a5a35 120px 240px);border-top:10px solid #e2dacb}
.f{width:300px;height:375px;border:20px solid #8a5a35;outline:1px solid #d9cfbf;outline-offset:8px;display:grid;place-items:center;background:linear-gradient(160deg,#fbf8f2,#ebe3d5);font-family:S;font-size:110px;color:#8a5a35;flex:none;margin-bottom:40px}
.t{margin-bottom:40px}
.e{font-size:22px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#9c4a2b}
h1{font-family:S;font-weight:500;font-size:118px;line-height:1;margin:18px 0 22px}
p{font-size:26px;color:#5d534b;max-width:620px;line-height:1.4}
</style></head><body><div class="f">MD</div><div class="t"><div class="e">Desarrolladora Full Stack</div><h1>Marilyn Diaz</h1><p>Proyectos web de punta a punta, exhibidos en una galería 3D.</p></div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: 'public/og-image.png' })
await browser.close()
console.log('public/og-image.png generado')
