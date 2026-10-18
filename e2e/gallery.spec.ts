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
// El texto de la intro aparece recién cuando la escena está lista y la cámara terminó de acercarse.
const waitForCamera = (page: Page) =>
  expect(page.locator('.experience')).toHaveAttribute('data-moving', 'false', { timeout: 45_000 })

test.describe('con movimiento', () => {
  test('recorrido completo: intro → galería → cartela → detalle y vuelta', { tag: '@motion' }, async ({ page, isMobile }) => {
    await page.goto('/')
    await expect(page.locator('canvas')).toBeVisible()
    const verProyectos = page.getByRole('button', { name: 'Explorar proyectos' })
    // El texto aparece cuando termina el acercamiento inicial.
    await expect(verProyectos).toBeVisible({ timeout: 45_000 })

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

    // La cartela muestra los datos generales; "Más información" sube al objeto con el detalle.
    await expect(page.getByRole('list', { name: 'Tecnologías de TurnApp' })).toBeVisible()
    await page.getByRole('button', { name: 'Ver más información' }).click()
    await expect(page).toHaveURL(/\/proyecto\/turnapp\/detalle$/)
    await expect(page.getByText('Más información', { exact: true })).toBeVisible()
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
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 })
  const box = await page.locator('canvas').boundingBox()
  if (!box) throw new Error('Canvas sin tamaño')
  // El pedestal central queda en el centro horizontal, algo por debajo de la mitad.
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.57)
  await expect(page).toHaveURL(/\/proyecto\/panel-logistico$/)
})

test('un link compartido abre directo en el detalle, y uno viejo a /placa en la cartela', async ({ page }) => {
  await page.goto('/proyecto/docu-tool/detalle')
  await expect(page.getByRole('heading', { level: 2, name: 'Docu Tool' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Volver a la cartela' })).toBeVisible()
  await page.goto('/proyecto/docu-tool/placa')
  // La URL pasa a la forma nueva y conserva los parámetros (?calidad=baja de los tests).
  await expect(page).toHaveURL(/\/proyecto\/docu-tool(\?.*)?$/)
  await expect(page.getByRole('button', { name: 'Ver más información' })).toBeVisible()
})

test('Esc vuelve un nivel', async ({ page }) => {
  await page.goto('/proyecto/turnapp/detalle')
  await expect(page.getByRole('button', { name: 'Volver a la cartela' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/proyecto\/turnapp$/)
  await page.keyboard.press('Escape')
  await waitForGallery(page)
})

test('subir desde el detalle vuelve a la cartela y desde la cartela a los proyectos', async ({ page }) => {
  await page.goto('/proyecto/turnapp/detalle')
  await expect(page.getByRole('button', { name: 'Volver a la cartela' })).toBeVisible()
  // Mientras la cámara se ubica, las teclas de paso se ignoran.
  const experience = page.locator('.experience')
  await expect(experience).toHaveAttribute('data-ready', 'true', { timeout: 30_000 })
  await expect(experience).toHaveAttribute('data-moving', 'false')
  await page.keyboard.press('ArrowUp')
  await expect(page).toHaveURL(/\/proyecto\/turnapp$/)
  // Pausa entre pasos: el scroll se toma de a un gesto (700 ms).
  await page.waitForTimeout(800)
  await expect(experience).toHaveAttribute('data-moving', 'false')
  await page.keyboard.press('ArrowUp')
  await expect(page).toHaveURL(/\/proyectos$/)
})

test('"Ver como lista" muestra el HTML y "atrás" vuelve a la galería', async ({ page }) => {
  await page.goto('/')
  // El del header (la pantalla de carga tiene su propio "Ver como lista" mientras está a la vista).
  await page.getByRole('banner').getByRole('link', { name: 'Ver como lista' }).click()
  await expect(page).toHaveURL(/\/lista$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Marilyn Diaz' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Explorar proyectos' })).toBeVisible({ timeout: 30_000 })
})

test('nombre, rol y contacto visibles en la galería', async ({ page }) => {
  await page.goto('/proyecto/turnapp')
  const header = page.getByRole('banner')
  await expect(header.getByText('Marilyn Diaz')).toBeInViewport()
  await expect(header.getByText('Desarrolladora Full Stack')).toBeInViewport()
  await expect(header.getByRole('button', { name: 'Contacto' })).toBeInViewport()
  // El CV se descarga desde el panel de Contacto.
  await header.getByRole('button', { name: 'Contacto' }).click()
  await expect(header.getByRole('link', { name: /CV/ })).toBeInViewport()
})

test('subir desde la galería vuelve a la intro', async ({ page }) => {
  await page.goto('/proyectos')
  await waitForGallery(page)
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 })
  await page.keyboard.press('ArrowUp')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Explorar proyectos' })).toBeVisible({ timeout: 30_000 })
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

test('Sobre mí: bajar por los compartimentos del mueble, abrir con teclado, recorrer y volver', async ({ page }) => {
  // Al llegar a la galería se descarga y monta la zona Sobre mí: con WebGL por software tarda.
  test.setTimeout(90_000)
  await page.goto('/proyectos')
  await waitForGallery(page)
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 })
  await page.keyboard.press('ArrowDown')
  await expect(page).toHaveURL(/\/sobre-mi$/)
  await expect(page.getByRole('heading', { name: /Sobre mí · Experiencia/ })).toBeVisible({ timeout: 30_000 })

  await page.getByRole('button', { name: 'Ir a Estudios' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/sobre-mi\/estudios$/)
  await expect(page.getByRole('heading', { name: /Sobre mí · Estudios/ })).toBeVisible()

  await page.getByRole('button', { name: /Abrir Estudio: Tecnicatura/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/sobre-mi\/tecnicatura-ifts-24$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Tecnicatura en Desarrollo de Software' })).toBeVisible()

  await page.getByRole('button', { name: /Siguiente: Desarrollo Full Stack MERN/ }).click()
  await expect(page).toHaveURL(/\/sobre-mi\/full-stack-mern$/)
  await page.goBack({ waitUntil: 'commit' })
  await expect(page).toHaveURL(/\/sobre-mi\/tecnicatura-ifts-24$/)

  // Esc vuelve al compartimento de la entrada; subir vuelve al de experiencia.
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/sobre-mi\/estudios$/)
  await page.getByRole('button', { name: 'Ir a Experiencia' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/sobre-mi$/)
})

test('la vista en lista incluye la línea de tiempo como lista ordenada', async ({ page }) => {
  await page.goto('/lista')
  const section = page.getByRole('region', { name: 'Sobre mí' })
  await expect(section.getByRole('list')).toBeVisible()
  await expect(section.getByRole('listitem')).toHaveCount(5)
  await expect(section.getByRole('heading', { level: 3 }).first()).toHaveText('Asistente de Documentación Internacional')
})

test('Contacto: desde el menú fijo al escritorio, acercarse al libro con teclado, volver y reiniciar', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/proyectos')
  await waitForGallery(page)
  await expect(page.locator('.experience')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 })
  await page.getByRole('banner').getByRole('button', { name: 'Contacto' }).click()
  await page.getByRole('link', { name: 'Ir al escritorio de contacto' }).click()
  await expect(page).toHaveURL(/\/contacto$/)
  await expect(page.getByRole('heading', { name: /^Contacto · / })).toBeVisible({ timeout: 30_000 })

  await page.getByRole('button', { name: 'Leer el libro de contacto' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/contacto\/libro$/)
  const book = page.getByRole('region', { name: 'Contacto' })
  await expect(book.getByRole('heading', { name: 'Mis canales' })).toBeVisible()
  await expect(book.getByRole('heading', { name: 'Dejá un mensaje' })).toBeVisible()
  await expect(book.getByRole('link', { name: 'Escribirme' })).toHaveAttribute('href', /^mailto:/)

  // Atrás del navegador vuelve al escritorio, y scrollear con el libro de cerca también.
  await page.goBack({ waitUntil: 'commit' })
  await expect(page).toHaveURL(/\/contacto$/)
  await page.getByRole('button', { name: 'Leer el libro de contacto' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/contacto\/libro$/)
  await page.mouse.move(20, 400)
  await page.mouse.wheel(0, 120)
  await expect(page).toHaveURL(/\/contacto$/)
  await page.getByRole('button', { name: 'Reiniciar recorrido' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('el sobre del escritorio descarga el CV', async ({ page }) => {
  // Entrar directo al escritorio carga toda la escena: con WebGL por software tarda.
  test.setTimeout(90_000)
  // Solo el HTML: la escena se espera abajo (la carga completa de los assets superaba los 30 s en paralelo).
  await page.goto('/contacto', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /^Contacto · / })).toBeVisible({ timeout: 60_000 })
  const download = page.waitForEvent('download', { timeout: 60_000 })
  await page.getByRole('link', { name: /Descargar mi CV en PDF \(el sobre\)/ }).focus()
  await page.keyboard.press('Enter')
  const file = await download
  expect(file.suggestedFilename()).toMatch(/\.pdf$/)
  // Esperar a que termine: cerrar el contexto con la descarga en curso deja al navegador inestable.
  expect(await file.path()).toBeTruthy()
})
