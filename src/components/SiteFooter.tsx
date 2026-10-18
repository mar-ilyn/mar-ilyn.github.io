import { CV_URL } from '../config'
import { contact } from '../data/contact'
import { profile } from '../data/profile'
import { routeToPath } from '../state/routes'

const YEAR = new Date().getFullYear()
const BASE = import.meta.env.BASE_URL

// Footer oscuro de la vista en lista: el nombre, el recorrido por la página, la galería 3D y las redes.
export function SiteFooter() {
  const email = contact.channels.find((c) => c.id === 'email')
  const social = profile.contacts.filter((c) => c.external)
  return (
    <footer className="site-footer">
      <div className="site-footer__brand">
        <span className="site-footer__ornament" aria-hidden="true">
          ◆ ◆ ◆
        </span>
        <p className="site-footer__name">{profile.name}</p>
        <p className="site-footer__role">{profile.role}</p>
      </div>
      <div className="site-footer__columns">
        <nav aria-labelledby="footer-page">
          <h2 id="footer-page">Recorrido</h2>
          <ul>
            <li>
              <a href="#sobre-mi">Sobre mí</a>
            </li>
            <li>
              <a href="#proyectos">Proyectos</a>
            </li>
            <li>
              <a href="#experiencia">Experiencia</a>
            </li>
            <li>
              <a href="#estudios">Estudios</a>
            </li>
            <li>
              <a href="#contacto">Contacto</a>
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-gallery">
          <h2 id="footer-gallery">Galería 3D</h2>
          <ul>
            <li>
              <a href={routeToPath({ name: 'gallery' }, BASE)}>Los proyectos</a>
            </li>
            <li>
              <a href={routeToPath({ name: 'about', section: 'laboral' }, BASE)}>El mueble de Sobre mí</a>
            </li>
            <li>
              <a href={routeToPath({ name: 'contact' }, BASE)}>El escritorio de contacto</a>
            </li>
          </ul>
        </nav>
        <div>
          <h2>Redes</h2>
          <ul>
            {social.map((c) => (
              <li key={c.id}>
                <a href={c.href} target="_blank" rel="noopener noreferrer">
                  {c.label}
                  <span className="visually-hidden"> (se abre en una pestaña nueva)</span>
                </a>
              </li>
            ))}
            {email && (
              <li>
                <a href={email.href}>{email.display}</a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h2>Descargas</h2>
          <ul>
            <li>
              <a href={CV_URL} download>
                {contact.cv.accessibleName}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="site-footer__note">
        © {YEAR} {profile.name}. Los textos de los proyectos y de la trayectoria son de ejemplo.
      </p>
    </footer>
  )
}
