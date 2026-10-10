// Ganancia de la luz horneada sobre su intensidad física (escala del horneado). three.js trata el
// lightmap como irradiancia indirecta: la divide por π (reflexión difusa) y la atenúa con la
// oclusión, así que hace falta compensar para que el sol por las ventanas se lea con fuerza.
export const SUN_GAIN = 4.2
// El parquet es oscuro (albedo bajo): los haces sobre el piso necesitan más ganancia para leerse.
export const FLOOR_SUN_GAIN = 9

// Sol en tiempo real, débil y sin sombras, con la misma dirección que el horneado: da la luz lateral
// cálida a las piezas que no tienen lightmap (columnas, marco, ornamentos, pedestales).
// Dirección de viaje de la luz, en coordenadas de la escena (igual que SUN_DIR en bake_lightmaps.py).
export const SUN_DIRECTION = [1, -0.18, -0.55] as const
export const SUN_COLOR = '#ffd2a0'
