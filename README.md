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
npm run assets       # descarga las fuentes CC0 y regenera las texturas KTX2
npm run bake:env     # hornea el entorno de reflejos (después de npm run assets)
npm run bake:lightmaps  # hornea la oclusión ambiental con Blender 4.5 LTS (ver abajo)
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

- **Materiales PBR con texturas CC0**: parquet en espiga (color, relieve, AO y rugosidad) y relieve de yeso en las paredes (el color sigue siendo marfil). El dorado usa metalness alto y rugosidad baja y refleja el HDRI de un salón de baile.
- **Sin repetición visible en el piso**: el shader vuelve a muestrear el color a una escala ~14 veces mayor y lo usa como variación de tono.
- **Entorno de reflejos horneado** (`npm run bake:env`): el prefiltrado PMREM del HDRI se calcula en el build y se sirve como PNG RGBE de 122 KB, que three.js usa directo como textura CubeUV. En el navegador no se compila ni se ejecuta el shader de prefiltrado.
- **Calidad adaptativa** (`quality.ts`, con tests):
  - *Alta* (escritorio con 6+ núcleos y 6+ GB): piso con brillo de encerado (menos rugoso, refleja el entorno) y resolución hasta 2×.
  - *Baja* (celulares, pantallas chicas o equipos modestos): piso mate y resolución hasta 1,5×.
  - En las dos: viñeta y grano en CSS, sobre el canvas, sin costo de GPU.
  - `?calidad=alta|baja` fuerza el nivel; `?debug` muestra un medidor de fps y dibuja todos los cuadros para que la medición sea real.
- **Carga en una sola etapa**: la escena espera texturas y entorno dentro de un único `Suspense`, compila todos los shaders con `compileAsync` (fuera del hilo principal) y recién ahí dibuja el primer cuadro. Mientras tanto se muestra una pantalla de carga con progreso. Si una textura o el entorno fallan, esa pieza usa un material liso (`AssetBoundary`).
- **Oclusión ambiental horneada en Blender** (`npm run bake:lightmaps`): piso, pared y techo llevan un lightmap con el contacto de molduras, columnas, cornisa, cuadro y pedestales. Se calcula una vez con Cycles y en tiempo real no cuesta nada (reemplazó a N8AO y a las sombras de contacto en tiempo real).
- **Techo**: una emisión cálida imita la luz que rebota del piso y las paredes (nada lo ilumina de frente).

### Rendimiento de carga: qué pesaba y qué se cambió

Medido con Chromium usando la GPU real de una notebook con **Intel UHD Graphics 620** (integrada, de rango comparable a un celular de gama media), registrando tareas largas y perfilando la CPU. La red no era el problema: todo llegaba en menos de 1 s. El cuello de botella era **compilar shaders de forma sincrónica**: en Windows, cada shader de WebGL se traduce a Direct3D y en una GPU integrada eso tarda 150–550 ms por programa.

| Causa | Costo medido | Cambio |
|---|---|---|
| Prefiltrado del entorno (PMREM), dos veces | ~1,1 s | Horneado en el build |
| Recompilar materiales al llegar cada textura | ~1 s | Un solo `Suspense` + `compileAsync` |
| Postprocesado (EffectComposer) | ~1 s | Viñeta y grano en CSS |
| Reflejo con espejo del piso (MeshReflectorMaterial) | ~0,8 s | Brillo con el entorno |
| Oclusión ambiental en tiempo real (N8AO) | ~0,3 s | Horneada en lightmaps con Blender |
| Sombras de contacto en tiempo real | 4 programas y una pasada extra | Incluidas en el lightmap del piso |

| Calidad alta, Intel UHD 620 | Antes | Después |
|---|---|---|
| Programas de shaders | 31 | 5 |
| Bloqueo por compilación de shaders | 3.073 ms | 38 ms |
| Tareas largas en total | 4.494 ms | 413 ms |
| Mayor congelamiento | 1.182 ms | 201 ms |
| Fps en la galería | 41 | 60 |

### Luz de la intro

- **Sol de tarde horneado**: `bake_lightmaps.py` agrega, solo para el horneado, una pared con dos ventanas fuera de cuadro a la izquierda y un sol bajo y cálido. Cycles hornea la luz directa (`*_light.ktx2`, ~12 KB): los dos haces entran en diagonal sobre la franja de piso que se ve en la intro, y en la pared solo llegan al zócalo, sin tocar el panel del texto. Los centros de las ventanas se calculan a partir de la dirección del sol (ver el comentario en el script). Fuera de la sala, la luz se anula en el propio mapa. En tiempo real hay un sol débil con la misma dirección, para las piezas sin lightmap.
- **Lámpara de cuadro** (`PictureLamp.tsx`): barra de bronce con brazo, sobre el marco. Un foco cerrado y de alcance corto (1,25 m) ilumina solo la parte superior del cuadro.
- **Texto en HTML anclado a la pared** (`IntroText.tsx`): nombre, rol, frase, botones y stack son HTML real (accesible y nítido). Cada cuadro se proyecta el panel a la pantalla y se escalan las tipografías según cuántos píxeles mide un metro, así parece pintado en la pared. En pantallas verticales pasa a una tarjeta abajo.

### Horneado de la oclusión ambiental

`npm run bake:lightmaps` levanta la app en modo desarrollo y exporta la geometría estática real a GLB (`DevSceneExport`, que no llega al build de producción). Después corre Blender sin ventana con `scripts/blender/bake_lightmaps.py`, hornea la oclusión con Cycles sobre piso, pared y techo, y comprime los resultados a KTX2. Así el horneado siempre coincide con lo que se ve y no hay una segunda copia de la escena. Tarda unos 4 minutos en un i7 de 4 núcleos sin GPU compatible. `--solo-comprimir` reutiliza los PNG ya horneados.

| Superficie | Horneado | En el sitio |
|---|---|---|
| Piso (80 × 40 m) | 2048 × 1024 | KTX2 ETC1S, 43 KB |
| Pared (80 × 4,2 m) | 4096 × 256 | 2048 × 128, KTX2 ETC1S, 47 KB |
| Techo | 1024 × 512 | 512 × 256, KTX2 ETC1S, 2 KB |

### Assets y licencias

Todos de [Poly Haven](https://polyhaven.com), licencia **CC0** (dominio público). `npm run assets` los descarga de URLs fijas y genera las versiones optimizadas en `public/assets/`; las fuentes quedan en `assets-src/` (fuera de git).

| Asset | Origen | Fuente | Optimizado |
|---|---|---|---|
| Parquet en espiga (color, normal, AO+rugosidad) | [herringbone_parquet](https://polyhaven.com/a/herringbone_parquet) | 3 JPG 1k, 1,75 MB | KTX2 ETC1S, 374 KB |
| Yeso (normal, AO+rugosidad) | [painted_plaster_wall](https://polyhaven.com/a/painted_plaster_wall) | 2 JPG 1k, 1,41 MB | KTX2 ETC1S, 311 KB |
| Mármol de las columnas (color, normal, AO+rugosidad) | [marble_01](https://polyhaven.com/a/marble_01), de Rob Tuytel | 3 JPG 1k, 0,47 MB | KTX2 ETC1S, 258 KB |
| Marco tallado del retrato (sin la pintura original) | [fancy_picture_frame_02](https://polyhaven.com/a/fancy_picture_frame_02), de Rob Tuytel y Rico Cilliers | glTF 1k, 1,73 MB, 35 k triángulos | GLB meshopt simplificado al 35 % + texturas KTX2 512 px, 288 KB |
| HDRI para reflejos | [ballroom](https://polyhaven.com/a/ballroom), de Sergej Majboroda | HDR 1k, 1,67 MB | PMREM horneado, PNG RGBE 336×256, 119 KB |

### Peso de la carga inicial

Medido con `vite preview` registrando cada pedido hasta que la escena está lista; tamaños comprimidos con gzip, como los sirve GitHub Pages.

| Escenario | Comprimido | Sin comprimir |
|---|---|---|
| Vista lista (solo HTML) | 160 KB | 328 KB |
| Galería, cualquier calidad | 2,19 MB | 3,57 MB |

Lo más pesado: el chunk de three.js con la escena (~300 KB), el transcodificador de Basis (~240 KB), las texturas (~950 KB), el marco tallado (~270 KB), el entorno (~120 KB) y los lightmaps (~110 KB). Los fps en un celular de gama media están pendientes de medir en un dispositivo real con `?debug`.

## Contenido

Los textos de los proyectos son de ejemplo. No se muestran datos reales de sistemas internos de empresas: las demos usan datos ficticios.

## Lighthouse

Las mediciones se agregan en el hito 5.
