import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTACT_EMAIL } from '../config'
import { contact, messageHref } from '../data/contact'
import { ContactChannels } from './ContactChannels'

const writeText = vi.fn()

function mockClipboard(impl: () => Promise<void>) {
  writeText.mockImplementation(impl)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

afterEach(() => {
  writeText.mockReset()
})

describe('canales de contacto', () => {
  it('muestra mail, LinkedIn y GitHub con sus links', () => {
    render(<ContactChannels idPrefix="t" />)
    expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`)
    expect(screen.getByRole('link', { name: /linkedin\.com\/in\/marilyn-d/ })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/marilyn-d/',
    )
    expect(screen.getByRole('link', { name: /github\.com\/mar-ilyn/ })).toHaveAttribute('href', 'https://github.com/mar-ilyn')
  })

  it('"Copiar" copia el valor y lo confirma en una región aria-live', async () => {
    mockClipboard(() => Promise.resolve())
    render(<ContactChannels idPrefix="t" />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copiar GitHub' })))
    expect(writeText).toHaveBeenCalledWith('https://github.com/mar-ilyn')
    expect(screen.getByRole('status')).toHaveTextContent('GitHub copiado al portapapeles')
  })

  it('si el portapapeles falla, lo avisa', async () => {
    mockClipboard(() => Promise.reject(new Error('denegado')))
    render(<ContactChannels idPrefix="t" />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copiar Mail' })))
    expect(screen.getByRole('status')).toHaveTextContent(contact.copy.failed)
  })

  it('"Escribirme" abre el mail con el asunto armado y no hay teléfono en los datos', () => {
    expect(messageHref).toBe(`mailto:${CONTACT_EMAIL}?subject=Contacto%20desde%20tu%20portfolio`)
    expect(JSON.stringify(contact)).not.toMatch(/tel:|whatsapp|\+?\d[\d\s-]{7,}/i)
  })
})
