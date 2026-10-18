// Formatos de texto compartidos por la escena y la vista en lista (sin dependencias de three).

// "React, TypeScript, Node.js y PostgreSQL".
export const listWithY = (items: readonly string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}` : (items[0] ?? '')
