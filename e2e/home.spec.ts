import { expect, test } from '@playwright/test'

test('la home muestra identidad, contacto y proyectos', async ({ page }) => {
  await page.goto('/lista')
  await expect(page).toHaveTitle(/Marilyn Diaz/)
  await expect(page.getByRole('heading', { level: 1, name: 'Marilyn Diaz' })).toBeVisible()

  const header = page.getByRole('banner')
  for (const name of [/CV/, /GitHub/, /LinkedIn/]) {
    await expect(header.getByRole('link', { name })).toBeVisible()
  }

  await expect(page.locator('.project')).not.toHaveCount(0)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/.+\.png$/)
})

test('el contacto sigue visible al bajar hasta el final', async ({ page }) => {
  await page.goto('/lista')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(page.getByRole('banner').getByRole('link', { name: /LinkedIn/ })).toBeInViewport()
})

test('el CV y las imágenes de proyectos se sirven', async ({ page, request }) => {
  await page.goto('/lista')
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
