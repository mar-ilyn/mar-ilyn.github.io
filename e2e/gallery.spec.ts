import { expect, test, type Page } from '@playwright/test'

const waitForGallery = async (page: Page) => {
  await expect(page).toHaveURL(/\/proyectos$/)
  // El vuelo de cámara dura ~2 s; con WebGL por software y tests en paralelo puede tardar bastante más.
  await expect(page.getByRole('heading', { name: 'Elegí un proyecto' })).toBeVisible({ timeout: 15_000 })
}

test('recorrido completo: intro → galería → proyecto → placa y vuelta', async ({ page, isMobile }) => {
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  const verProyectos = page.getByRole('button', { name: 'Ver los proyectos' })
  await expect(verProyectos).toBeVisible()

  if (isMobile) {
    await verProyectos.tap()
  } else {
    await page.mouse.move(400, 400)
    await page.mouse.wheel(0, 200)
  }
  await waitForGallery(page)

  // Capa de botones para teclado sobre los pedestales.
  await page.getByRole('button', { name: 'Abrir TurnApp' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/proyecto\/turnapp$/)
  await expect(page.getByRole('heading', { level: 2, name: 'TurnApp' })).toBeVisible()
  await expect(page).toHaveTitle(/^TurnApp/)

  await page.getByRole('button', { name: 'Ver más información' }).click()
  await expect(page).toHaveURL(/\/proyecto\/turnapp\/placa$/)
  await expect(page.getByText('Placa', { exact: true })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Tecnologías de TurnApp' })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/proyecto\/turnapp$/)
  await expect(page.getByRole('button', { name: 'Ver más información' })).toBeVisible()

  await page.getByRole('button', { name: 'Volver a los proyectos' }).click()
  await waitForGallery(page)
})

test('click en un pedestal abre su proyecto', async ({ page, isMobile }) => {
  test.skip(isMobile, 'El encuadre vertical es en diagonal; el toque se prueba a mano en el celular.')
  await page.goto('/proyectos')
  await waitForGallery(page)
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true')
  const box = await page.locator('canvas').boundingBox()
  if (!box) throw new Error('Canvas sin tamaño')
  // El pedestal central queda en el centro horizontal, algo por debajo de la mitad.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.57)
  await expect(page).toHaveURL(/\/proyecto\/panel-logistico$/)
})

test('un link compartido abre directo en la placa', async ({ page }) => {
  await page.goto('/proyecto/docu-tool/placa')
  await expect(page.getByRole('heading', { level: 2, name: 'Docu Tool' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Volver al proyecto' })).toBeVisible()
})

test('Esc vuelve un nivel', async ({ page }) => {
  await page.goto('/proyecto/turnapp/placa')
  await expect(page.getByRole('button', { name: 'Volver al proyecto' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/proyecto\/turnapp$/)
  await page.keyboard.press('Escape')
  await waitForGallery(page)
})

test('"Ver como lista" muestra el HTML y "atrás" vuelve a la galería', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Ver como lista' }).click()
  await expect(page).toHaveURL(/\/lista$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Marilyn Diaz' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Ver los proyectos' })).toBeVisible()
})

test('nombre, rol y contacto visibles en la galería', async ({ page }) => {
  await page.goto('/proyecto/turnapp')
  const header = page.getByRole('banner')
  await expect(header.getByText('Marilyn Diaz')).toBeInViewport()
  await expect(header.getByText('Desarrolladora Full Stack')).toBeInViewport()
  for (const name of [/CV/, /GitHub/, /LinkedIn/]) {
    await expect(header.getByRole('link', { name })).toBeInViewport()
  }
})
