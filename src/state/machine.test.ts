import { describe, expect, it } from 'vitest'
import { initialView, transition, type ViewEvent, type ViewState } from './machine'

const run = (events: ViewEvent[], from: ViewState = initialView) => events.reduce(transition, from)

describe('máquina de estados de la vista', () => {
  it('recorre intro → galería → proyecto → placa y vuelve', () => {
    expect(run([{ type: 'STEP_DOWN' }])).toEqual({ name: 'toGallery' })
    expect(run([{ type: 'STEP_DOWN' }, { type: 'ARRIVED' }])).toEqual({ name: 'gallery' })

    const atPlaque = run([
      { type: 'STEP_DOWN' },
      { type: 'ARRIVED' },
      { type: 'OPEN', slug: 'turnapp' },
      { type: 'STEP_DOWN' },
    ])
    expect(atPlaque).toEqual({ name: 'plaque', slug: 'turnapp' })
    expect(transition(atPlaque, { type: 'STEP_UP' })).toEqual({ name: 'project', slug: 'turnapp' })
    expect(transition(atPlaque, { type: 'BACK_TO_GALLERY' })).toEqual({ name: 'gallery' })
  })

  it('saltar la intro va directo a la galería, también a mitad del vuelo', () => {
    expect(run([{ type: 'SKIP_INTRO' }])).toEqual({ name: 'gallery' })
    expect(run([{ type: 'STEP_DOWN' }, { type: 'SKIP_INTRO' }])).toEqual({ name: 'gallery' })
  })

  it('en la galería, bajar sigue a Sobre mí y subir vuelve a la intro', () => {
    const gallery: ViewState = { name: 'gallery' }
    expect(transition(gallery, { type: 'STEP_DOWN' })).toEqual({ name: 'about', section: 'laboral' })
    expect(transition(gallery, { type: 'BACK' })).toBe(gallery)
    expect(transition(gallery, { type: 'STEP_UP' })).toEqual({ name: 'intro' })
    expect(transition({ name: 'about', section: 'laboral' }, { type: 'STEP_UP' })).toEqual(gallery)
  })

  it('ignora eventos que no corresponden al estado y devuelve la misma referencia', () => {
    const cases: [ViewState, ViewEvent][] = [
      [{ name: 'intro' }, { type: 'OPEN', slug: 'turnapp' }],
      [{ name: 'intro' }, { type: 'STEP_UP' }],
      [{ name: 'toGallery' }, { type: 'OPEN', slug: 'turnapp' }],
      [{ name: 'gallery' }, { type: 'ARRIVED' }],
      [{ name: 'project', slug: 'turnapp' }, { type: 'OPEN', slug: 'docu-tool' }],
      [{ name: 'plaque', slug: 'turnapp' }, { type: 'STEP_DOWN' }],
    ]
    for (const [state, event] of cases) expect(transition(state, event)).toBe(state)
  })

  it('Sobre mí: bajar recorre los compartimentos del mueble y subir los desanda', () => {
    const laboral: ViewState = { name: 'about', section: 'laboral' }
    const estudios: ViewState = { name: 'about', section: 'estudios' }
    expect(transition(laboral, { type: 'STEP_DOWN' })).toEqual(estudios)
    expect(transition(estudios, { type: 'STEP_DOWN' })).toEqual({ name: 'contact' })
    expect(transition(estudios, { type: 'STEP_UP' })).toEqual(laboral)
    expect(transition(estudios, { type: 'BACK' })).toEqual({ name: 'gallery' })
  })

  it('Sobre mí: abrir entradas, recorrerlas y volver a su compartimento', () => {
    const about: ViewState = { name: 'about', section: 'laboral' }
    const entry = transition(about, { type: 'OPEN_ENTRY', slug: 'forit' })
    expect(entry).toEqual({ name: 'aboutEntry', slug: 'forit' })
    const study = transition(entry, { type: 'OPEN_ENTRY', slug: 'ingles-c1' })
    expect(study).toEqual({ name: 'aboutEntry', slug: 'ingles-c1' })
    expect(transition(entry, { type: 'BACK' })).toEqual(about)
    expect(transition(study, { type: 'BACK_TO_ABOUT' })).toEqual({ name: 'about', section: 'estudios' })
    expect(transition(about, { type: 'BACK' })).toEqual({ name: 'gallery' })
  })

  it('Contacto: bajando desde estudios se llega al escritorio; el libro se abre y se cierra', () => {
    const estudios: ViewState = { name: 'about', section: 'estudios' }
    const desk = transition(estudios, { type: 'STEP_DOWN' })
    expect(desk).toEqual({ name: 'contact' })
    expect(transition(desk, { type: 'STEP_UP' })).toEqual(estudios)
    expect(transition(desk, { type: 'STEP_DOWN' })).toBe(desk)
    const book = transition(desk, { type: 'OPEN_BOOK' })
    expect(book).toEqual({ name: 'contactBook' })
    // Scrollear con el libro de cerca vuelve al escritorio.
    expect(transition(book, { type: 'STEP_DOWN' })).toEqual(desk)
    expect(transition(book, { type: 'STEP_UP' })).toEqual(desk)
    expect(transition(book, { type: 'BACK' })).toEqual(desk)
    expect(transition(desk, { type: 'BACK' })).toEqual({ name: 'gallery' })
  })

  it('Contacto: volver a la galería o reiniciar el recorrido desde el escritorio y desde el libro', () => {
    for (const state of [{ name: 'contact' }, { name: 'contactBook' }] as ViewState[]) {
      expect(transition(state, { type: 'BACK_TO_GALLERY' })).toEqual({ name: 'gallery' })
      expect(transition(state, { type: 'RESTART' })).toEqual({ name: 'intro' })
    }
    expect(transition({ name: 'gallery' }, { type: 'RESTART' })).toEqual({ name: 'gallery' })
  })

  it('Esc (BACK) retrocede un nivel', () => {
    expect(transition({ name: 'plaque', slug: 'a' }, { type: 'BACK' })).toEqual({ name: 'project', slug: 'a' })
    expect(transition({ name: 'project', slug: 'a' }, { type: 'BACK' })).toEqual({ name: 'gallery' })
  })

  it('subir desde un proyecto vuelve a la vista general; desde la placa, al proyecto', () => {
    expect(transition({ name: 'project', slug: 'a' }, { type: 'STEP_UP' })).toEqual({ name: 'gallery' })
    expect(transition({ name: 'plaque', slug: 'a' }, { type: 'STEP_UP' })).toEqual({ name: 'project', slug: 'a' })
  })
})
