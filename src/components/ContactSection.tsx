import { CV_URL } from '../config'
import { contact, messageHref } from '../data/contact'
import { ContactChannels } from './ContactChannels'

// "Contacto" en la vista en lista: los mismos canales y el mensaje del libro del escritorio.
export function ContactSection() {
  return (
    <section id="contacto" className="contact-section" aria-labelledby="contact-title" tabIndex={-1}>
      <p className="works__eyebrow">Hablemos</p>
      <h2 id="contact-title">{contact.title}</h2>
      <div className="contact-section__grid">
        <div>
          <h3>{contact.channelsTitle}</h3>
          <p>{contact.channelsIntro}</p>
          <ContactChannels idPrefix="list" />
        </div>
        <div>
          <h3>{contact.message.title}</h3>
          <p>{contact.message.text}</p>
          <div className="contact-section__actions">
            <a className="button button--primary" href={messageHref}>
              {contact.message.button}
            </a>
            <a className="button" href={CV_URL} download>
              {contact.cv.accessibleName}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
