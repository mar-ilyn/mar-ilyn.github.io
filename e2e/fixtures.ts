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
  },
})

export { expect }
export type { Page } from '@playwright/test'
