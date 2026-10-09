import { profile } from '../data/profile'
import { ContactLinks } from './ContactLinks'
import { Hero } from './Hero'
import { ProjectList } from './ProjectList'

const YEAR = new Date().getFullYear()

export function ListView() {
  return (
    <>
      <main>
        <Hero />
        <ProjectList />
      </main>
      <footer className="site-footer">
        <p>¿Hablamos? Escribime por LinkedIn o revisá mi código en GitHub.</p>
        <ContactLinks variant="large" />
        <p className="site-footer__note">
          © {YEAR} {profile.name}. Los textos de los proyectos son de ejemplo.
        </p>
      </footer>
    </>
  )
}
