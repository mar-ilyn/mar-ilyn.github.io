import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { projects } from './data/projects'

// jsdom no tiene WebGL: la app cae en la vista de lista, que es el contenido HTML completo.
describe('<App /> sin WebGL', () => {
  it('muestra nombre, rol y un único h1', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Marilyn Diaz' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByText('Desarrolladora Full Stack').length).toBeGreaterThan(0)
  })

  it('el header tiene un botón de contacto fijo con los canales y el CV', () => {
    render(<App />)
    const header = within(screen.getByRole('banner'))
    const toggle = header.getByRole('button', { name: 'Contacto' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(header.getByRole('link', { name: /CV/ })).toHaveAttribute('href', '/cv/marilyn-diaz-cv.pdf')
    expect(header.getByRole('link', { name: /github\.com\/mar-ilyn/ })).toHaveAttribute('href', 'https://github.com/mar-ilyn')
    expect(header.getByRole('link', { name: /linkedin\.com\/in\/marilyn-d/ })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/marilyn-d/',
    )
    expect(header.getByRole('link', { name: 'Escribirme' })).toHaveAttribute('href', expect.stringMatching(/^mailto:/))
    fireEvent.keyDown(toggle, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('la vista en lista incluye la sección de contacto', () => {
    render(<App />)
    const section = within(screen.getByRole('region', { name: 'Contacto' }))
    expect(section.getByRole('heading', { level: 3, name: 'Mis canales' })).toBeInTheDocument()
    expect(section.getAllByRole('button', { name: /^Copiar / })).toHaveLength(3)
    expect(section.getByRole('link', { name: 'Escribirme' })).toHaveAttribute(
      'href',
      expect.stringContaining('subject=Contacto%20desde%20tu%20portfolio'),
    )
  })

  it('lista todos los proyectos con imagen descrita', () => {
    render(<App />)
    for (const p of projects) {
      expect(screen.getByRole('heading', { level: 3, name: p.title })).toBeInTheDocument()
      expect(screen.getByAltText(p.image.alt)).toBeInTheDocument()
    }
  })
})
