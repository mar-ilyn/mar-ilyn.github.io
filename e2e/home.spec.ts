import { expect, test } from '@playwright/test'

test('la home muestra identidad, contacto y proyectos', async ({ page }) => {
  await page.goto('/lista')
  await expect(page).toHaveTitle(/Marilyn Diaz/)
  await expect(page.getByRole('heading', { level: 1, name: 'Marilyn Diaz' })).toBeVisible()

  // El panel de Contacto del header tiene los canales y la descarga del CV.
  const header = page.getByRole('banner')
  await header.getByRole('button', { name: 'Contacto' }).click()
  await expect(header.getByRole('link', { name: /CV/ })).toBeVisible()
  for (const name of [/github\.com\/mar-ilyn/, /linkedin\.com\/in\/marilyn-d/]) {
    await expect(header.getByRole('link', { name })).toBeVisible()
  }

  await expect(page.locator('.project')).not.toHaveCount(0)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/.+\.png$/)
})

test('el contacto sigue visible al bajar hasta el final', async ({ page }) => {
  await page.goto('/lista')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(page.getByRole('banner').getByRole('button', { name: 'Contacto' })).toBeInViewport()
})

test('el CV y las imágenes de proyectos se sirven', async ({ page, request }) => {
  await page.goto('/lista')
  await page.getByRole('banner').getByRole('button', { name: 'Contacto' }).click()
  const cv = await page.getByRole('banner').getByRole('link', { name: /CV/ }).getAttribute('href')
  expect((await request.get(cv ?? '')).status()).toBe(200)

  const images = page.locator('.project__image')
  for (const src of await images.evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src))) {
    expect((await request.get(src)).status()).toBe(200)
  }
})

test('sin desbordamiento horizontal', async ({ page }) => {
  await page.goto('/lista')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('la vista en lista incluye el contacto y copiar lo confirma', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'permisos de portapapeles solo en Chromium')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/lista')
  const section = page.getByRole('region', { name: 'Contacto' })
  await expect(section.getByRole('link', { name: 'Escribirme' })).toHaveAttribute('href', /^mailto:.+subject=Contacto/)
  await section.getByRole('button', { name: 'Copiar GitHub' }).click()
  await expect(section.getByRole('status')).toHaveText('GitHub copiado al portapapeles')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://github.com/mar-ilyn')
})
