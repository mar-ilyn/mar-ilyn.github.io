import { test as base, expect } from '@playwright/test'

// Los tests de flujo usan calidad baja: con WebGL por software, el reflejo del piso y el
// postprocesado de la calidad alta harían cada cuadro muy lento. La calidad alta tiene su propio test.
export const test = base.extend({
  page: async ({ page }, provide) => {
    const goto = page.goto.bind(page)
    page.goto = (url, options) => {
      const sep = url.includes('?') ? '&' : '?'
      return goto(url.includes('calidad=') ? url : `${url}${sep}calidad=baja`, options)
    }
    await provide(page)
    // Antes de cerrar, esperar a que el navegador termine los cuadros pendientes: con WebGL por software,
    // volver a una zona pesada (p. ej. "Reiniciar recorrido") deja segundos de trabajo en la GPU, y si la
    // página se cierra antes, ese trabajo bloquea la creación del contexto del test siguiente.
    await page
      .evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
      .catch(() => {})
  },
})

export { expect }
export type { Page } from '@playwright/test'
