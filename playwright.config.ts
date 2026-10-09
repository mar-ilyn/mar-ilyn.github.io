import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // La escena corre con WebGL por software: menos workers y más margen por aserción.
  workers: process.env.CI ? 2 : 3,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Sin animaciones decorativas: los tests no dependen de su ritmo. El recorrido completo lo reactiva.
    reducedMotion: 'reduce',
    // WebGL por software para correr la escena en CI sin GPU.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  // Los tests @motion (vuelos de cámara reales) corren al final y solos: con WebGL por software
  // una escena animada ocupa toda la CPU y frenaría a los demás tests.
  projects: [
    { name: 'desktop', grepInvert: /@motion/, use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', grepInvert: /@motion/, use: { ...devices['Pixel 7'] } },
    {
      name: 'motion-desktop',
      grep: /@motion/,
      timeout: 90_000,
      dependencies: ['desktop', 'mobile'],
      use: { ...devices['Desktop Chrome'], reducedMotion: 'no-preference' },
    },
    {
      name: 'motion-mobile',
      grep: /@motion/,
      timeout: 90_000,
      dependencies: ['motion-desktop'],
      // Densidad 1: con render por software el costo es por píxel y el flujo no depende de la nitidez.
      use: { ...devices['Pixel 7'], deviceScaleFactor: 1, reducedMotion: 'no-preference' },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
})
