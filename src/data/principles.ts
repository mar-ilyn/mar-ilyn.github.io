// "Cómo trabajo" en la vista en lista: tres principios, uno por cada parte de la frase del perfil
// ("interfaces cuidadas, APIs sólidas y datos que se pueden confiar"). Textos de ejemplo: revisarlos.

export interface Principle {
  title: string
  // Subtítulo en itálica, como el lema de cada principio.
  motto: string
  text: string
  stack: string
}

export const principles: Principle[] = [
  {
    title: 'Interfaces',
    motto: 'Cuidadas',
    text: 'Pantallas claras, accesibles y rápidas, pensadas para quien las usa todos los días.',
    stack: 'React · TypeScript',
  },
  {
    title: 'APIs',
    motto: 'Sólidas',
    text: 'Servicios bien definidos, validados y probados, que se pueden mantener y hacer crecer.',
    stack: 'Node.js',
  },
  {
    title: 'Datos',
    motto: 'Confiables',
    text: 'Modelos y consultas cuidados para que la información sea consistente de punta a punta.',
    stack: 'PostgreSQL',
  },
]

// Números romanos para los principios y las listas (1 a 39 alcanza de sobra).
export function roman(n: number): string {
  const units = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
  return 'X'.repeat(Math.floor(n / 10)) + units[n % 10]
}
