import { CV_URL } from '../config'
import { contact, messageHref } from '../data/contact'
import { ContactChannels } from './ContactChannels'
import { EnvelopeArt } from './EnvelopeArt'

// "Contacto" en la vista en lista: a la izquierda la invitación y los canales con su ícono (y su botón
// Copiar), con "Escribirme" y el CV debajo; a la derecha, la ilustración del sobre con lacre.
export function ContactSection() {
  return (
    <section id="contacto" className="band band--warm contact-section" aria-labelledby="contact-title" tabIndex={-1}>
      <div className="contact-section__inner">
        <div className="contact-section__text">
          <h2 id="contact-title">{contact.title}</h2>
          <p className="contact-section__lead">
            <span>{contact.lead.title}</span> {contact.lead.text}
          </p>
          <p className="contact-section__note">{contact.channelsIntro}</p>
          <ContactChannels idPrefix="list" icons />
          <div className="contact-section__actions">
            <a className="cta cta--gold" href={messageHref}>
              {contact.message.button}
            </a>
            <a className="cta" href={CV_URL} download>
              {contact.cv.accessibleName}
            </a>
          </div>
        </div>
        <EnvelopeArt />
      </div>
    </section>
  )
}
