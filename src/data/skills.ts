import type { SkillGroup } from './types'

// Habilidades de la vista en lista, en cuatro grupos. Salen de los proyectos y del propio portfolio.
export const skills = {
  eyebrow: 'Mis habilidades',
  title: 'Herramientas y tecnologías',
  intro: 'Estas son algunas de las tecnologías con las que trabajo y que me permiten construir soluciones escalables y de calidad.',
  groups: [
    { id: 'frontend', title: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML y CSS', 'Three.js'] },
    { id: 'backend', title: 'Backend', items: ['Node.js', 'REST APIs', 'Prisma', 'NextAuth'] },
    { id: 'datos', title: 'Bases de datos', items: ['PostgreSQL', 'Supabase'] },
    { id: 'herramientas', title: 'Herramientas', items: ['Git y GitHub', 'Vercel', 'Vite', 'Vitest', 'Playwright'] },
  ] satisfies readonly SkillGroup[],
}
