import { expect, test, type Page } from './fixtures.ts'

// El vuelo de cámara dura ~2 s en un dispositivo real; con WebGL por software va a pocos cuadros
// por segundo, así que el test con movimiento espera la llegada con más margen.
const waitForGallery = async (page: Page, arrivalTimeout = 15_000) => {
  // Al entrar por URL conserva la consulta (?calidad=baja); al navegar dentro de la app, no.
  await expect(page).toHaveURL(/\/proyectos(\?.*)?$/)
  await expect(page.getByRole('heading', { name: 'Elegí un proyecto' })).toBeVisible({ timeout: arrivalTimeout })
}

// Espera a que la cámara termine de volar: con render por software, interactuar en pleno vuelo
// compite con cuadros muy lentos. También verifica que cada vuelo llega a destino.
const waitForCamera = (page: Page) =>
  expect(page.locator('.experience')).toHaveAttribute('data-moving', 'false', { timeout: 45_000 })

test.describe('con movimiento', () => {
  test('recorrido completo: intro → galería → proyecto → placa y vuelta', { tag: '@motion' }, async ({ page, isMobile }) => {
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
    await waitForGallery(page, 45_000)

    // Capa de botones para teclado sobre los pedestales.
    await page.getByRole('button', { name: 'Abrir TurnApp' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/proyecto\/turnapp$/)
    await expect(page.getByRole('heading', { level: 2, name: 'TurnApp' })).toBeVisible()
    await expect(page).toHaveTitle(/^TurnApp/)
    await waitForCamera(page)

    await page.getByRole('button', { name: 'Ver más información' }).click()
    await expect(page).toHaveURL(/\/proyecto\/turnapp\/placa$/)
    await expect(page.getByText('Placa', { exact: true })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Tecnologías de TurnApp' })).toBeVisible()
    await waitForCamera(page)

    await page.goBack({ waitUntil: 'commit' })
    await expect(page).toHaveURL(/\/proyecto\/turnapp$/)
    await expect(page.getByRole('button', { name: 'Ver más información' })).toBeVisible()
    await waitForCamera(page)

    await page.getByRole('button', { name: 'Volver a los proyectos' }).click()
    await waitForGallery(page, 45_000)
  })
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

test('subir desde la galería vuelve a la intro', async ({ page }) => {
  await page.goto('/proyectos')
  await waitForGallery(page)
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true')
  await page.keyboard.press('ArrowUp')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Ver los proyectos' })).toBeVisible()
})

test('la calidad alta carga texturas, entorno y efectos sin errores', async ({ page, isMobile }) => {
  test.skip(isMobile, 'La calidad alta es para escritorio.')
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  const failed: string[] = []
  page.on('requestfailed', (r) => failed.push(r.url()))
  await page.goto('/proyectos?calidad=alta')
  await expect(page.locator('.experience')).toHaveAttribute('data-quality', 'high')
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 })
  await page.waitForLoadState('networkidle')
  expect(failed).toEqual([])
  expect(errors).toEqual([])
})
