import { ContactSection } from './ContactSection'
import { ListHero } from './ListHero'
import { Principles } from './Principles'
import { ProjectList } from './ProjectList'
import { QuoteBand } from './QuoteBand'
import { SiteFooter } from './SiteFooter'
import { TimelineSection } from './TimelineList'

// Vista en lista: el mismo portfolio en HTML, con la estética de un museo clásico. Debajo de la portada,
// los principios, los proyectos, una cita, la experiencia, los estudios y el contacto.
export function ListView({ canShowGallery }: { canShowGallery: boolean }) {
  return (
    <>
      <main className="list-view">
        <ListHero canShowGallery={canShowGallery} />
        <Principles />
        <ProjectList />
        <QuoteBand />
        <TimelineSection row="laboral" id="sobre-mi" eyebrow="Trayectoria" title="Experiencia" />
        <TimelineSection row="estudios" id="estudios" eyebrow="Formación" title="Estudios" />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  )
}
