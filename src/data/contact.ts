import { CONTACT_EMAIL } from '../config'
import type { ContactContent } from './types'

// Zona "Contacto": textos y links del escritorio, del menú fijo y de la vista en lista.
// El email sale de src/config.ts. No se publica ningún número de teléfono.

const LINKEDIN = 'https://www.linkedin.com/in/marilyn-d/'
const GITHUB = 'https://github.com/mar-ilyn'

export const mailto = (email: string, subject: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}`

export const contact: ContactContent = {
  title: 'Contacto',
  lead: { title: '¿Hablamos?', text: 'Estoy abierta a nuevas oportunidades, proyectos y colaboraciones.' },
  hint: 'Acercate al libro para escribirme o tomá el sobre para llevarte mi CV',
  channelsTitle: 'Mis canales',
  channelsIntro: 'Respondo por cualquiera de estos medios.',
  channels: [
    { id: 'email', label: 'Mail', display: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, copyValue: CONTACT_EMAIL, external: false },
    { id: 'linkedin', label: 'LinkedIn', display: 'linkedin.com/in/marilyn-d', href: LINKEDIN, copyValue: LINKEDIN, external: true },
    { id: 'github', label: 'GitHub', display: 'github.com/mar-ilyn', href: GITHUB, copyValue: GITHUB, external: true },
  ],
  message: {
    title: 'Dejá un mensaje',
    text: 'Contame en qué estás trabajando o qué necesitás: te respondo por mail.',
    button: 'Escribirme',
    subject: 'Contacto desde tu portfolio',
  },
  cv: { label: 'Descargar CV', accessibleName: 'Descargar mi CV en PDF' },
  copy: { button: 'Copiar', done: (label) => `${label} copiado al portapapeles`, failed: 'No se pudo copiar: seleccioná el texto y copialo a mano.' },
  actions: {
    openBook: 'Leer el libro de contacto',
    closeBook: 'Volver al escritorio',
    backToGallery: 'Volver a la galería',
    restart: 'Reiniciar recorrido',
  },
}

export const messageHref = mailto(CONTACT_EMAIL, contact.message.subject)
