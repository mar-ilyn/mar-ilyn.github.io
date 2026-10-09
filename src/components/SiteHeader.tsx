import { profile } from '../data/profile'
import { ContactLinks } from './ContactLinks'

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#proyectos">
        Saltar a los proyectos
      </a>
      <div className="site-header__inner">
        <p className="site-header__id">
          <span className="site-header__name">{profile.name}</span>
          <span className="site-header__role">{profile.role}</span>
        </p>
        <ContactLinks />
      </div>
    </header>
  )
}
