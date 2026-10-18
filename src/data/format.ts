// Formatos de texto compartidos por la escena y la vista en lista (sin dependencias de three).

// "React, TypeScript, Node.js y PostgreSQL".
export const listWithY = (items: readonly string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}` : (items[0] ?? '')

// Números romanos para las listas numeradas (1 a 39 alcanza de sobra).
export function roman(n: number): string {
  const units = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
  return 'X'.repeat(Math.floor(n / 10)) + units[n % 10]
}
