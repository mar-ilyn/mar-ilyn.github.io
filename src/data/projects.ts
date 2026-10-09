import type { Project } from './types'

const img = (slug: string, alt: string) => ({
  src: `${import.meta.env.BASE_URL}projects/${slug}.svg`,
  alt,
  width: 800,
  height: 600,
})

// Textos de ejemplo: se reemplazan por el contenido final de cada proyecto.
// pedestal: posición en la sala (x a lo largo de la galería). Las vistas de cámara miran al objeto (detail) y a la placa (plaque).
export const projects: readonly Project[] = [
  {
    slug: 'turnapp',
    title: 'TurnApp',
    year: 2026,
    role: 'Diseño y desarrollo full stack',
    stack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Supabase'],
    summary: 'Gestión de turnos y señas online para pequeños negocios, con agenda y recordatorios.',
    details: [
      'Texto de ejemplo: reserva de turnos en tres pasos, con disponibilidad en tiempo real.',
      'Texto de ejemplo: panel para el negocio con agenda semanal, clientes y cobro de señas.',
    ],
    links: {},
    image: img('turnapp', 'Ilustración de una agenda semanal con turnos marcados'),
    pedestal: [-4, 0, 0],
    camera: {
      detail: { position: [-4, 1.65, 2.7], target: [-4, 1.2, 0] },
      plaque: { position: [-4, 1.0, 1.75], target: [-4, 0.78, 0.36] },
    },
  },
  {
    slug: 'panel-logistico',
    title: 'Panel logístico',
    year: 2025,
    role: 'Desarrollo full stack',
    stack: ['Next.js', 'TypeScript', 'Prisma', 'NextAuth', 'REST APIs'],
    summary: 'Seguimiento de envíos con alertas de excepciones, roles de usuario y reportes exportables.',
    details: [
      'Texto de ejemplo: tablero con estados de envío y filtros por fecha, destino y prioridad.',
      'Texto de ejemplo: los datos de la demo son ficticios; no se muestran datos de sistemas reales.',
    ],
    links: {},
    image: img('panel-logistico', 'Ilustración de un tablero con rutas de envío y gráficos de estado'),
    pedestal: [0, 0, 0],
    camera: {
      detail: { position: [0, 1.65, 2.7], target: [0, 1.2, 0] },
      plaque: { position: [0, 1.0, 1.75], target: [0, 0.78, 0.36] },
    },
  },
  {
    slug: 'docu-tool',
    title: 'Docu Tool',
    year: 2025,
    role: 'Desarrollo full stack',
    stack: ['Node.js', 'TypeScript', 'Google Drive API', 'CSV'],
    summary: 'Generación automática de documentación a partir de planillas, con carga a carpetas compartidas.',
    details: [
      'Texto de ejemplo: importa un CSV, valida cada fila y genera los documentos correspondientes.',
      'Texto de ejemplo: sube los archivos a Drive organizados por carpeta y nombre de envío.',
    ],
    links: {},
    image: img('docu-tool', 'Ilustración de documentos apilados saliendo de una planilla'),
    pedestal: [4, 0, 0],
    camera: {
      detail: { position: [4, 1.65, 2.7], target: [4, 1.2, 0] },
      plaque: { position: [4, 1.0, 1.75], target: [4, 0.78, 0.36] },
    },
  },
]

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}
