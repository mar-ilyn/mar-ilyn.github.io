import type { Profile } from './types'

export const profile: Profile = {
  name: 'Marilyn Diaz',
  role: 'Desarrolladora Full Stack',
  tagline:
    'Construyo aplicaciones web de punta a punta: interfaces cuidadas, APIs sólidas y datos que se pueden confiar.',
  stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  about: 'Mi recorrido, mi forma de trabajar y las tecnologías con las que construyo soluciones.',
  contacts: [
    { id: 'cv', label: 'Descargar CV', href: `${import.meta.env.BASE_URL}cv/marilyn-diaz-cv.pdf`, external: false },
    { id: 'github', label: 'GitHub', href: 'https://github.com/mar-ilyn', external: true },
    { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/marilyn-d/', external: true },
  ],
}
