/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { copyFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages no tiene rewrites: sirve 404.html para rutas desconocidas
// (/proyecto/turnapp), así que se copia el index para que la app resuelva la ruta.
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      await copyFile(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// Transcodificador de Basis Universal (para las texturas KTX2), servido desde el propio sitio
// y no desde un CDN: misma versión que three y sin dependencias externas en producción.
function basisTranscoder(): Plugin {
  const dir = resolve('node_modules/three/examples/jsm/libs/basis')
  const files = ['basis_transcoder.js', 'basis_transcoder.wasm']
  return {
    name: 'basis-transcoder',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const name = files.find((f) => req.url?.endsWith(`/basis/${f}`))
        if (!name) return next()
        res.setHeader('Content-Type', name.endsWith('.wasm') ? 'application/wasm' : 'text/javascript')
        res.end(await readFile(resolve(dir, name)))
      })
    },
    async generateBundle() {
      for (const name of files) {
        this.emitFile({ type: 'asset', fileName: `basis/${name}`, source: await readFile(resolve(dir, name)) })
      }
    },
  }
}

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), spaFallback(), basisTranscoder()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
