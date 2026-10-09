import { Hero } from './components/Hero'
import { ProjectList } from './components/ProjectList'
import { SiteHeader } from './components/SiteHeader'
import { ContactLinks } from './components/ContactLinks'
import { profile } from './data/profile'

const YEAR = new Date().getFullYear()

export default function App() {
  return (
    <>
      <SiteHeader />
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
