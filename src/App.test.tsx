import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { projects } from './data/projects'

describe('<App />', () => {
  it('muestra nombre, rol y un único h1', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Marilyn Diaz' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByText('Desarrolladora Full Stack').length).toBeGreaterThan(0)
  })

  it('tiene los enlaces de contacto en el header', () => {
    render(<App />)
    const header = within(screen.getByRole('banner'))
    expect(header.getByRole('link', { name: /CV/ })).toHaveAttribute('href', '/cv/marilyn-diaz-cv.pdf')
    expect(header.getByRole('link', { name: /GitHub/ })).toHaveAttribute('href', 'https://github.com/mar-ilyn')
    expect(header.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/marilyn-d/',
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
