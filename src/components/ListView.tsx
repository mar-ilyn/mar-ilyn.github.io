import { profile } from '../data/profile'
import { ContactLinks } from './ContactLinks'
import { ListHero } from './ListHero'
import { ProjectList } from './ProjectList'

const YEAR = new Date().getFullYear()

// Vista en lista: el mismo portfolio en HTML, con la estética de la galería.
export function ListView() {
  const linkedin = profile.contacts.find((c) => c.id === 'linkedin')
  return (
    <>
      <main className="list-view">
        <ListHero />
        <ProjectList />
        <section className="about" aria-labelledby="about-title">
          <h2 id="about-title">Un poco sobre mí</h2>
          <p>{profile.about}</p>
          {linkedin && (
            <a href={linkedin.href} target="_blank" rel="noopener noreferrer">
              Conocer más sobre mí <span aria-hidden="true">→</span>
              <span className="visually-hidden"> (LinkedIn, se abre en una pestaña nueva)</span>
            </a>
          )}
        </section>
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
