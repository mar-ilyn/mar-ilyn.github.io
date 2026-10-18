import { CV_URL } from '../config'
import { contact, messageHref } from '../data/contact'
import { ContactChannels } from './ContactChannels'
import { SectionHeading } from './SectionHeading'

// "Contacto" en la vista en lista: una banda con la invitación a escribir, "Escribirme" y el CV, y debajo
// los canales con su botón Copiar (los mismos del libro del escritorio).
export function ContactSection() {
  return (
    <section id="contacto" className="band band--warm contact-section" aria-labelledby="contact-title" tabIndex={-1}>
      <SectionHeading id="contact-title" eyebrow="Hablemos" title={contact.title} intro={contact.message.text} />
      <div className="contact-section__actions">
        <a className="cta cta--gold" href={messageHref}>
          {contact.message.button}
        </a>
        <a className="cta" href={CV_URL} download>
          {contact.cv.accessibleName}
        </a>
      </div>
      <div className="contact-section__channels">
        <p className="contact-section__note">{contact.channelsIntro}</p>
        <ContactChannels idPrefix="list" />
      </div>
    </section>
  )
}
