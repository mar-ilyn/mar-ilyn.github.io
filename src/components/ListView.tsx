import { ContactSection } from './ContactSection'
import { ListHero } from './ListHero'
import { ProjectList } from './ProjectList'
import { SkillsBand } from './SkillsBand'
import { SiteFooter } from './SiteFooter'
import { TimelineSection } from './TimelineList'

// Vista en lista: el mismo portfolio en HTML, con la estética de un museo clásico. Debajo de la portada,
// los proyectos, las habilidades, la experiencia, los estudios y el contacto.
export function ListView({ canShowGallery }: { canShowGallery: boolean }) {
  return (
    <>
      <main className="list-view">
        <ListHero canShowGallery={canShowGallery} />
        <ProjectList />
        <SkillsBand />
        <TimelineSection row="laboral" id="experiencia" eyebrow="Trayectoria" title="Experiencia" />
        <TimelineSection row="estudios" id="estudios" eyebrow="Formación" title="Estudios" />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  )
}
