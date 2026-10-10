# Marilyn Diaz · Portfolio

Portfolio de Marilyn Diaz, desarrolladora Full Stack. El objetivo final es una galería clásica en 3D navegable en el navegador, donde cada proyecto se exhibe sobre un pedestal. Se construye por hitos y cada hito queda desplegado.

**Sitio:** https://mar-ilyn.github.io

## Hitos

| # | Hito | Estado |
|---|------|--------|
| 1 | Página base en HTML real, Open Graph, CI y despliegue | ✅ |
| 2 | Prototipo con cajas grises: cinco estados y cámara | ✅ |
| 3 | Entorno: galería sin final visible, techo, piso, paredes, luz | ⏳ |
| 4 | Interacciones: hover, zoom, paneles, placa | ⏳ |
| 5 | Rendimiento: Draco/meshopt, KTX2, carga progresiva, Lighthouse | ⏳ |
| 6 | Accesibilidad y calidad: vista lista, teclado, reduced motion, tests | ⏳ |

## Cómo correrlo

Requiere Node 22 (ver `.nvmrc`).

```bash
npm install
npm run dev          # servidor de desarrollo
npm run lint         # oxlint
npm run typecheck    # tsc -b
npm test             # Vitest (unitarios)
npm run build        # build de producción en dist/
npm run test:e2e     # Playwright contra el build (desktop + móvil)
npm run og:image     # regenera public/og-image.png
npm run assets       # descarga las fuentes CC0 y regenera texturas KTX2 y HDRI
```

La primera vez que se corre Playwright hay que instalar Chromium: `npx playwright install chromium`.

## Decisiones técnicas

- **HTML real primero.** La página base es la versión accesible y la que leen buscadores y previews de links. En el hito 6 se convierte en la vista "Ver como lista" de la galería 3D, así que no es descartable.
- **Un único archivo de datos tipado.** `src/data/projects.ts` contiene todo el contenido de cada proyecto (título, stack, textos, links, imagen y vistas de cámara para el detalle y la placa). `src/data/types.ts` define los tipos. Los tests validan slugs aptos para URL, alt descriptivos, links https y vectores de cámara finitos.
- **Nombre, rol y contacto siempre visibles.** Viven en un header fijo, fuera de cualquier canvas.
- **Open Graph con imagen generada.** `scripts/og-image.mjs` renderiza la imagen 1200×630 con el Chromium de Playwright y las mismas fuentes del sitio, así se puede regenerar si cambia el texto.
- **Fuentes self-hosted** con Fontsource (Cormorant Garamond e Inter, variables). Sin pedidos a terceros y el navegador solo descarga los subsets que usa.
- **GitHub Pages + Actions.** Un solo workflow: lint, tipos, tests unitarios, build y e2e; si todo pasa en `main`, publica `dist/`. Los PR corren los mismos chequeos sin publicar.
- **Base configurable.** `BASE_PATH` cambia la base de Vite si el sitio se publica en un subpath; `VITE_SITE_URL` (en `.env`) define las URLs absolutas de Open Graph.

## Cómo funciona la galería (hito 2)

```
intro ──scroll / "Ver los proyectos"──▶ toGallery ──(la cámara llega)──▶ gallery ──scroll arriba──▶ intro
  │                                                                       │
  └──────────────"Saltar intro"──────────────────────────────────────────▶│
                                                                  click / Enter
                                                                          ▼
                    gallery ◀──"Volver a los proyectos" / Esc── project ──scroll / "Ver más información"──▶ plaque
                                                                   ▲                                       │
                                                                   └────────scroll arriba / Esc / "Volver"──┘
```

- **Máquina de estados pura** (`src/state/machine.ts`): `transition(estado, evento)` sin efectos secundarios. Un evento que no corresponde devuelve el mismo estado, así que bajar en la galería no hace nada (el scroll queda bloqueado; subir vuelve a la intro) sin condicionales repartidos por los componentes.
- **La URL es la fuente de verdad compartible** (`src/state/routes.ts`): `/`, `/proyectos`, `/proyecto/:slug`, `/proyecto/:slug/placa` y `/lista`. Cada paso hace `pushState`, así que "atrás" deshace un paso; `popstate` vuelve a leer la URL. Un slug inexistente cae en la galería.
- **Zustand** guarda la ruta y si la cámara se está moviendo. La cámara (`CameraRig`) solo lee el estado y lo traduce a una pose; el estado no conoce a la cámara.
- **Poses calculadas, no fijas** (`src/experience/layout.ts`): la galería se aleja según el aspecto de la pantalla para que entren todos los pedestales; en vertical usa un encuadre en diagonal. En el detalle, un *focal offset* deja el objeto a la derecha (o arriba en vertical) y deja lugar al panel HTML.
- **Scroll por pasos** (`useStepInput`): rueda, gesto táctil y teclado se convierten en un paso discreto, con umbral, enfriamiento y bloqueo mientras la cámara se mueve, para que la inercia del trackpad no saltee estados.
- **Pedestal procedural** (`pedestalGeometry.ts`): columna corintia armada con tornos (`LatheGeometry`) con estrías desplazando vértices, capitel con volutas y ábaco de lados cóncavos (`ExtrudeGeometry`). No hay archivos de modelo que descargar y la geometría se comparte entre los pedestales.
- **Marco barroco procedural** (`OrnateFrame.tsx`): moldura escalonada con `ExtrudeGeometry`, perlas con `InstancedMesh` (una sola llamada de dibujo por fila), volutas con arcos de toro. Un entorno de `Lightformer` generado en la escena le da reflejos al dorado sin descargar un HDR.
- **Pared de palacio modular** (`wallGeometry.ts`, `PalaceWall.tsx`): columnas corintias adosadas, boiserie con molduras doradas, friso y zócalo. Ritmo de 4 m (panel ancho en 4n, detrás de cada pedestal; angosto en 4n + 2) calculado por una función pura con tests. Cada pieza se hornea una vez y se repite con `InstancedMesh`: toda la pared son ~10 draw calls. Los ornamentos solo existen donde la cámara puede verlos; más allá la niebla cubre una pared lisa continua, así nunca se ve un final.
- **Presupuesto de vértices**: la primera versión de la pared dibujaba 2,8 M de vértices por cuadro. Con menos segmentos donde no se notan, ornamentos acotados al rango visible y geometría horneada indexada quedó en ~204 k vértices / ~240 k triángulos para toda la escena, sin cambio visible.
- **Geometría horneada** (`bake.ts`): las piezas fijas del pedestal y del marco se unen en una sola geometría por material; perlas y hojas repetidas van con `InstancedMesh`. Medido con animación: de 2072 a 243 draw calls cada 2 s.
- **La cámara solo vuela cuando cambia la vista**: un cambio de tamaño de pantalla la reubica al instante. Si no, en equipos lentos el primer scroll se perdía mientras la cámara se reacomodaba.
- **Haz de luz al pasar el mouse** (`LightBeam.tsx`): cono abierto del techo al piso con un shader aditivo que desvanece el filo y la base, círculo de luz en el piso y un foco real sobre el pedestal. La intensidad sube y baja suave y solo pide cuadros mientras cambia. También se enciende con el foco de teclado; en pantallas táctiles (sin hover) todos quedan con un brillo suave constante.
- **Render bajo demanda** (`frameloop="demand"`): el canvas solo dibuja cuando la cámara se mueve o un objeto flota. Con `prefers-reduced-motion` la escena queda quieta y no gasta GPU ni batería.
- **Carga diferida**: three.js y la escena viven en un chunk aparte que se pide solo si hay WebGL. Sin WebGL se muestra la lista en HTML.
- **GitHub Pages y rutas profundas**: Pages no tiene rewrites, así que el build copia `index.html` a `404.html` y la app resuelve la ruta al cargar. Contra: esas URLs responden con estado 404 aunque se vean bien.
- **e2e con WebGL en CI**: Playwright corre Chromium con SwiftShader (WebGL por software). `data-ready` en `.experience` indica cuándo la escena está lista para interactuar. Los tests usan `prefers-reduced-motion` salvo los marcados `@motion` (vuelos reales), que corren al final y solos porque una escena animada sin GPU ocupa toda la CPU.

## Realismo

- **Materiales PBR con texturas CC0**: parquet en espiga (color, relieve, AO y rugosidad) y relieve de yeso en las paredes (el color sigue siendo marfil). El dorado usa metalness alto y rugosidad baja, y refleja un HDRI de un salón de baile.
- **Sin repetición visible en el piso**: el shader vuelve a muestrear el color a una escala ~14 veces mayor y lo usa como variación de tono.
- **Calidad adaptativa** (`quality.ts`, con tests):
  - *Alta* (escritorio con 6+ núcleos y 6+ GB): HDRI, reflejo suave del piso, oclusión ambiental (N8AO), bloom muy leve en los dorados, grano y viñeta. Resolución hasta 2×.
  - *Baja* (celulares, pantallas chicas o equipos modestos): sin postprocesado (la viñeta es CSS), sin HDRI (entorno generado en la escena) y resolución hasta 1,5×. El chunk de efectos ni se descarga.
  - `?calidad=alta|baja` fuerza el nivel; `?debug` muestra un medidor de fps y dibuja todos los cuadros para que la medición sea real.
- **Carga progresiva**: la escena aparece con materiales lisos y se mejora cuando llegan las texturas (`Suspense` por pieza). El transcodificador de Basis se sirve desde el propio sitio.
- **Sombras de contacto** bajo los pedestales, calculadas una sola vez: la escena es estática.
- **Techo**: una emisión cálida imita la luz que rebota del piso y las paredes (nada lo ilumina de frente).

### Assets y licencias

Todos de [Poly Haven](https://polyhaven.com), licencia **CC0** (dominio público). `npm run assets` los descarga de URLs fijas y genera las versiones optimizadas en `public/assets/`; las fuentes quedan en `assets-src/` (fuera de git).

| Asset | Origen | Fuente | Optimizado |
|---|---|---|---|
| Parquet en espiga (color, normal, AO+rugosidad) | [herringbone_parquet](https://polyhaven.com/a/herringbone_parquet) | 3 JPG 1k, 1,75 MB | KTX2 ETC1S, 374 KB |
| Yeso (normal, AO+rugosidad) | [painted_plaster_wall](https://polyhaven.com/a/painted_plaster_wall) | 2 JPG 1k, 1,41 MB | KTX2 ETC1S, 311 KB |
| HDRI para reflejos | [ballroom](https://polyhaven.com/a/ballroom), de Sergej Majboroda | HDR 1k, 1,67 MB | HDR 512×256, 512 KB (317 KB con gzip) |

### Peso de la carga inicial

Medido con `vite preview` registrando cada pedido hasta que la escena está lista; tamaños comprimidos con gzip, como los sirve GitHub Pages.

| Escenario | Comprimido | Sin comprimir |
|---|---|---|
| Vista lista (solo HTML) | 159 KB | 327 KB |
| Celular (calidad baja) | 1,40 MB | 2,68 MB |
| Escritorio (calidad alta) | 1,82 MB | 3,42 MB |

Lo más pesado: el chunk de three.js con la escena (~300 KB), el transcodificador de Basis (~240 KB) y las texturas (~690 KB). Los fps en un celular de gama media están pendientes de medir en un dispositivo real con `?debug`.

## Contenido

Los textos de los proyectos son de ejemplo. No se muestran datos reales de sistemas internos de empresas: las demos usan datos ficticios.

## Lighthouse

Las mediciones se agregan en el hito 5.
