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
- **Nombre, rol y contacto siempre visibles.** Viven en el header, fuera de cualquier canvas. En la galería la escena va dentro de un marco crema con las esquinas redondeadas; el nombre (con el rol arriba) está en una pestaña del mismo crema, pegada a la esquina, con esquinas cóncavas donde se une al marco. Mientras el nombre se ve grande (en la placa de la intro y en el hero de la vista en lista) la pestaña no está: baja desde arriba al salir de la intro o al scrollear más allá del hero. A la derecha, una cápsula clara con la navegación (Sobre mí, la vista en lista, Contacto, GitHub y LinkedIn); el panel de Contacto tiene los canales, "Escribirme" y "Descargar CV". En pantallas angostas Contacto sigue a la vista, los otros links pasan a un menú y las redes quedan en el panel de Contacto.
- **Open Graph con imagen generada.** `scripts/og-image.mjs` renderiza la imagen 1200×630 con el Chromium de Playwright y las mismas fuentes del sitio, así se puede regenerar si cambia el texto.
- **Una sola familia tipográfica, self-hosted** con Fontsource: EB Garamond (variable). Los títulos van como "Proyectos" en la pared (mayúsculas espaciadas, peso 500) y el resto del texto, como en las placas; también los textos dibujados en la escena. Sin pedidos a terceros y el navegador solo descarga los subsets que usa.
- **GitHub Pages + Actions.** Un solo workflow: lint, tipos, tests unitarios, build y e2e; si todo pasa en `main`, publica `dist/`. Los PR corren los mismos chequeos sin publicar.
- **Base configurable.** `BASE_PATH` cambia la base de Vite si el sitio se publica en un subpath; `VITE_SITE_URL` (en `.env`) define las URLs absolutas de Open Graph.

## Cómo funciona la galería (hito 2)

```
intro ──scroll / "Ver los proyectos"──▶ toGallery ──(la cámara llega)──▶ gallery ──scroll arriba──▶ intro
  │                                                                       │
  └──────────────"Saltar intro"──────────────────────────────────────────▶│
                                                                  click / Enter
                                                                          ▼
                    gallery ◀──"Volver a los proyectos" / Esc── project ──scroll / "Ver más información"──▶ projectDetail
                                                                   ▲                                       │
                                                                   └────────scroll arriba / Esc / "Volver"──┘
```

- **Máquina de estados pura** (`src/state/machine.ts`): `transition(estado, evento)` sin efectos secundarios. Un evento que no corresponde devuelve el mismo estado, así que bajar en la galería no hace nada (el scroll queda bloqueado; subir vuelve a la intro) sin condicionales repartidos por los componentes.
- **La URL es la fuente de verdad compartible** (`src/state/routes.ts`): `/`, `/proyectos`, `/proyecto/:slug` (la cartela del pedestal, con los datos generales), `/proyecto/:slug/detalle` (el objeto de arriba, con la información ampliada; los links viejos a `/placa` abren la cartela) y `/lista`. Cada paso hace `pushState`, así que "atrás" deshace un paso; `popstate` vuelve a leer la URL. Un slug inexistente cae en la galería.
- **Zustand** guarda la ruta y si la cámara se está moviendo. La cámara (`CameraRig`) solo lee el estado y lo traduce a una pose; el estado no conoce a la cámara.
- **Poses calculadas, no fijas** (`src/experience/layout.ts`): la galería se aleja según el aspecto de la pantalla para que entren todos los pedestales; en vertical usa un encuadre en diagonal. En el detalle, un *focal offset* deja el objeto a la derecha (o arriba en vertical) y deja lugar al panel HTML.
- **Scroll por pasos** (`useStepInput`): rueda, gesto táctil y teclado se convierten en un paso discreto, con umbral, enfriamiento y bloqueo mientras la cámara se mueve, para que la inercia del trackpad no saltee estados.
- **Pedestal procedural** (`pedestalGeometry.ts`): columna corintia armada con tornos (`LatheGeometry`) con estrías desplazando vértices, capitel con volutas y ábaco de lados cóncavos (`ExtrudeGeometry`). No hay archivos de modelo que descargar y la geometría se comparte entre los pedestales.
- **Cartela de cada proyecto** (`ProjectLabel.tsx`, `museumLabel.ts`): al abrir un proyecto, la cámara se acerca de frente a la cartela de museo montada en el fuste del pedestal, con el nombre, el rol, "Proyecto" con el año, las tecnologías y el resumen impresos (mismo estilo y mismo código que la cartela de la intro). Los botones van abajo; el texto también está en el HTML, oculto a la vista. "Ver más información" sube al objeto de arriba del pedestal, con la información ampliada en un panel a la izquierda. En calidad baja las texturas de las cartelas van a menor resolución.
- **Marco barroco procedural** (`OrnateFrame.tsx`): moldura escalonada con `ExtrudeGeometry`, perlas con `InstancedMesh` (una sola llamada de dibujo por fila), volutas con arcos de toro. Un entorno de `Lightformer` generado en la escena le da reflejos al dorado sin descargar un HDR.
- **Pared de palacio modular** (`wallGeometry.ts`, `PalaceWall.tsx`): columnas corintias adosadas (pedestal de mármol con panel rehundido, base dorada, fuste estriado de mármol marfil con veteado procedural y capitel dorado con acanto y volutas), boiserie con molduras doradas, friso y zócalo. Ritmo de 4 m: un panel en 4n, detrás de cada pedestal, y una sola columna en 4n + 2 calculado por una función pura con tests. Cada pieza se hornea una vez y se repite con `InstancedMesh`: toda la pared son ~10 draw calls. Los ornamentos solo existen donde la cámara puede verlos; más allá la niebla cubre una pared lisa continua, así nunca se ve un final.
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
- **Carga en una sola etapa**: la escena espera texturas y entorno dentro de un único `Suspense`, compila todos los shaders con `compileAsync` (fuera del hilo principal) y recién ahí dibuja el primer cuadro. Mientras tanto se ve la pantalla de carga, escrita en `index.html` (HTML, CSS crítico y SVG en línea, unos 3,7 KB comprimidos) para que aparezca antes que el JavaScript: la fachada plana de un museo con un filtro oscuro y, al frente, una llave antigua que se vuelve dorada de abajo hacia arriba con el progreso real (`useProgress`, vía `src/lib/loader.ts`). Al terminar se quita el filtro, se abre la puerta (su hueco es transparente: detrás se ve la sala) y la vista entra a la intro. Nombre, rol, CV, GitHub, LinkedIn y "Ver como lista" se ven desde el principio; si la carga es rápida o hay movimiento reducido, se entra directo. Si una textura o el entorno fallan, esa pieza usa un material liso (`AssetBoundary`).
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
- **Segunda luz**: ventanas altas en la pared de enfrente (solo en el horneado, detrás de la cámara) con un sol de tarde que deja dos manchas de luz en el piso entre los pedestales, sin tocar la pared.
- **Lámpara de cuadro** (`PictureLamp.tsx`): barra de bronce con brazo, sobre el marco. Un foco cerrado y de alcance corto (1,25 m) ilumina solo la parte superior del cuadro.
- **Cartela de museo** (`IntroLabel.tsx`): junto al retrato, la misma placa de museo que las plaquitas del friso cronológico (`plaque.ts`: placa crema con filete dorado, esquinas recortadas y tornillos), montada en la pared con sombra suave. El nombre va en letras de bronce en relieve, mayúsculas espaciadas como el título "Proyectos" de la pared; debajo, impresos en EB Garamond, el rol en mayúsculas, "Portfolio" en negrita con el año, el stack y la frase. El texto se redibuja cuando termina de cargar la tipografía. El mismo contenido está en el HTML (`IntroText.tsx`), oculto a la vista, para lectores de pantalla y buscadores; los botones "Explorar proyectos" y "Saltar intro" van abajo, junto a la pista. En pantallas verticales la cartela es angosta, con el nombre en dos líneas y el texto más grande en proporción, y va pegada al retrato: la cámara termina mostrando los dos juntos de lado a lado, con un margen chico a los costados.
- **Títulos de las zonas en letras 3D** (`Lettering.tsx`): "PROYECTOS" en el centro de la pared de los pedestales, dentro del panel del medio, y "EXPERIENCIA" y "ESTUDIOS" arriba de cada compartimento del mueble, en un bronce más oscuro sobre el fondo claro. Son mayúsculas espaciadas, como una placa grabada, y no tienen texto HTML: cada zona ya tiene su encabezado accesible en la capa de botones.
- **Tipografía de las letras 3D** (`letteringGeometry.ts`): los contornos salen de EB Garamond 500, la misma tipografía del sitio (de la versión estática en woff, `@fontsource/eb-garamond`, solo en desarrollo: fontkit no lee los glifos compuestos de la variable en woff2). `npm run lettering-font` (con `fontkit`, solo en desarrollo) exporta a `letteringFont.json` (18 KB, ~6 KB comprimido) solo las mayúsculas que usan los títulos y el nombre. Si cambia un texto, un test avisa que falta regenerarla.

### Zona "Sobre mí"

A la derecha de los pedestales, entre dos columnas de la pared: un mueble vitrina alto y angosto (1,8 × 3,1 m) con base de nogal y puertas macizas, cuerpo vidriado con marco fino de latón, fondo claro y tira de luz bajo el techo. Tiene dos compartimentos separados por un estante de vidrio, cada uno con su título: arriba "Experiencia", abajo "Estudios" (estudios y certificaciones). Cada uno lleva su propio friso cronológico (eje de 2022 a hoy, una barra de duración por entrada y una línea guía en ángulo recto hasta su plaquita) y sus objetos en el estante, repartidos a distancias iguales para que no se pisen aunque las fechas estén cerca.

Cada entrada tiene una plaquita 3D (`timelinePlaque.ts`, sobre la placa de `plaque.ts`): placa crema con filete dorado, esquinas recortadas en cuarto de círculo y un tornillo en cada esquina, con el título en EB Garamond (en una o dos líneas parejas; si no entra, se achica) y la fecha en mayúsculas espaciadas. Las entradas sin fecha llevan solo el título, en una plaquita más chica. Las plaquitas miden 53 cm de ancho (están cada 56 cm). Los años del eje van en la misma tipografía.

Recorrido: al bajar desde la galería la cámara se corre a la derecha y muestra el mueble entero un instante (`cabinetPose`), y sin detenerse sigue al compartimento de experiencia (`/sobre-mi`). Bajando otra vez va al de estudios (`/sobre-mi/estudios`); subir desanda el camino. Cada entrada abre su panel (`/sobre-mi/<entrada>`) y Esc vuelve a su compartimento. Con teclado, cada compartimento tiene botones para sus entradas y uno para pasar al otro.

Los datos están en `src/data/timeline.ts`. El mueble y los objetos (teclado, caja de envío con su documentación, libros, cartelas y pedestales) están modelados por código, salvo la madera y el marco de los certificados (ver la tabla de assets). La luz interior, las sombras de contacto y los reflejos del vidrio son degradés sobre planos, sin luces en tiempo real.

### Zona "Contacto"

El cierre del recorrido: bajando desde el compartimento de estudios, la cámara viaja a un escritorio antiguo en el tramo siguiente (`/contacto`). Es un escritorio Luis XV modelado por código (`deskGeometry.ts`): palisandro lustrado, tapa de cuero gris pizarra con filete dorado y una banda de enchapado más oscura, canto de cuentas de bronce dorado, cajones enmarcados con tiradores rococó, apliques en las esquinas y patas con zapatas doradas. El palisandro es el enchapado de nogal de la vitrina (CC0) teñido, y el grano del cuero sale del normal map del yeso (CC0): el escritorio no suma descargas.

Encima, también modelados por código (`DeskObjects.tsx`): un libro grande encuadernado en cuero bordó, siempre abierto (las hojas se arquean desde el pliegue central, con su sombra, las hojas de abajo asoman en escalones por los costados y abajo, con la cabeza pareja, y en los extremos del lomo va la cabezada), una pluma fuente de laca negra, un tintero de bronce (bandeja, cuerpo octogonal con molduras y tapa abovedada) y un sobre con sello de lacre de borde irregular y brillo suave. El libro y el sobre responden al hover como los pedestales (se agrandan y brillan; en táctiles, brillo suave constante), con una sola zona de hover invisible por objeto (`HitBox`), y la pluma, decorativa (no se selecciona), se mueve apenas cuando el libro está bajo el mouse. La luz cálida de lámpara es un degradé sobre la tapa, 4 mm por encima del cuero: en el mismo plano, la GPU alternaba cuál dibujar mientras la cámara se movía y aparecían manchas claras.

- **Libro** (`/contacto/libro`): la cámara se acerca casi cenital al libro abierto. El contenido está impreso en las hojas, en EB Garamond (`bookPages.ts`): a la izquierda los canales (mail, LinkedIn, GitHub), cada uno con "Copiar"; a la derecha "Dejá un mensaje" con "Escribirme", un `mailto:` con el asunto armado. Encima, en el mismo lugar, van las zonas clickeables en HTML, transparentes (`ContactBook.tsx`): `BookAnchor` proyecta en cada cuadro las esquinas de cada una sobre la hoja curva, así siguen a lo impreso con la perspectiva. Responden al mouse con un sombreado suave y al teclado con el contorno de foco. Al copiar, la hoja imprime "Copiado" un momento y una región `aria-live` lo anuncia; el resto del texto está en el HTML, oculto a la vista, para lectores de pantalla. En vertical la cámara se acerca hasta que las dos hojas ocupan el ancho. Esc, atrás del navegador o scrollear vuelven al escritorio.
- **Sobre**: cuando la cámara se acomoda frente al escritorio, la solapa se abre y la hoja del CV sale dos tercios, con la parte que asoma curvada hacia la cámara y "CV" escrito (textura de lienzo con la proporción de la hoja); con movimiento reducido aparece ya abierto. Se cierra al acercarse al libro y se vuelve a abrir al regresar al escritorio. Al hacer clic descarga el CV en PDF. Queda fuera del cuadro del libro: en el borde de la pantalla la perspectiva lo estiraba.
- "Volver a la galería" y "Reiniciar recorrido" en el escritorio y con el libro abierto.

Fuera de la escena, el header tiene un botón "Contacto" fijo en todas las zonas (también en la vista en lista) que abre los mismos canales en HTML y lleva al escritorio. La vista en lista tiene su sección "Contacto". Textos y links en `src/data/contact.ts`; el email y el archivo del CV se configuran en un solo lugar, `src/config.ts`. No se publica ningún número de teléfono.

Pendiente: el formulario real con función serverless (etapa 2).

### Molduras doradas de la pared

Se arman con el tallado real del marco `fancy_picture_frame_02` (Poly Haven, CC0, Rob Tuytel y Rico Cilliers), no con ornamentos generados por código:

1. `scripts/blender/render_frame_kit.py` renderiza el marco de frente en Blender: color, normal map, oclusión, rugosidad y altura del relieve.
2. `npm run frame-kit` recorta el contorno, abre el hueco y genera `giltframe_albedo/normal/orm.ktx2` (~500 KB), con lados múltiplos de 4 (las texturas comprimidas lo exigen; si no, la GPU las rechaza y salen negras).
3. `giltFrameGeometry.ts` las usa "en 9 partes": esquinas talladas reales y tramos rectos repetidos a lo largo de cada lado, sin deformar las esquinas.

El material lleva la luminancia del render a una paleta de oro envejecido (recovecos #4A3118, altos #A67C3D, desgaste #D6B56C), con rugosidad de 0,35 a 0,55 y metal moderado. **Sin crestería**: la banda superior de este marco es un rectángulo macizo, sin silueta propia, y recortarla quedaba como un bloque. Para tener una haría falta otro modelo.

### Vista en lista (`/lista`)

Mismo contenido en HTML con la estética de un museo clásico. La portada es plana, sin imágenes: fondo oscuro liso, una línea chica con el rol, el nombre en mayúsculas grandes (el apellido en dorado), la frase en itálica, "Ver proyectos" y "Recorrer la galería 3D" (solo si hay WebGL) y abajo una franja con las tecnologías. El header flota encima.

Debajo de la portada, la página sigue la estética de un museo clásico: bandas que alternan crema claro y cálido, encabezados centrados con un filete dorado y un rombo (`SectionHeading`), números romanos y una banda oscura con la frase del perfil como cita. Las secciones: **Cómo trabajo** (tres principios, uno por cada parte de la frase: interfaces, APIs y datos, en `src/data/principles.ts`, textos de ejemplo), **Proyectos** (grilla de obras: título en versalitas, año y rol en itálica dorada, tecnologías y enlaces), **Experiencia** y **Estudios** (listas numeradas, como las exposiciones de un museo), **Contacto** ("Escribirme" en dorado, el CV y los canales con Copiar) y un footer oscuro en columnas: recorrido, galería 3D, redes y descargas.

### Horneado de la oclusión ambiental

`npm run bake:lightmaps` levanta la app en modo desarrollo y exporta la geometría estática real a GLB (`DevSceneExport`, que no llega al build de producción). Después corre Blender sin ventana con `scripts/blender/bake_lightmaps.py`, hornea la oclusión con Cycles sobre piso, pared y techo, y comprime los resultados a KTX2. Así el horneado siempre coincide con lo que se ve y no hay una segunda copia de la escena. Tarda unos 4 minutos en un i7 de 4 núcleos sin GPU compatible. `--solo-comprimir` reutiliza los PNG ya horneados.

El mueble de "Sobre mí" y el escritorio de contacto se descargan aparte (`React.lazy`), pero su sombra está horneada en la pared y el piso: sin ellos se vería la sombra sola. Por eso sus módulos se precargan apenas la escena está lista, aparecen con la madera lisa sin esperar sus texturas, la pantalla de carga espera a la zona si se entra directo a ella y la cámara espera a la zona de destino (hasta 8 s) antes de volar.

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
| Marco tallado del retrato (sin la pintura original) | [fancy_picture_frame_02](https://polyhaven.com/a/fancy_picture_frame_02), de Rob Tuytel y Rico Cilliers | glTF 1k, 1,73 MB, 35 k triángulos | GLB meshopt simplificado al 35 % + texturas KTX2 512 px, 288 KB |
| Nogal del mueble "Sobre mí" | [black_walnut_veneer_01](https://polyhaven.com/a/black_walnut_veneer_01), de Jenelle van Heerden | 3 JPG 1k, 1,81 MB | KTX2 ETC1S, 427 KB |
| Marco con atril de los certificados (la obra se reemplaza por papel en blanco) | [standing_picture_frame_02](https://polyhaven.com/a/standing_picture_frame_02), de James Ray Cock | glTF 1k, 0,57 MB | GLB meshopt + KTX2 256 px, 87 KB |
| HDRI para reflejos | [ballroom](https://polyhaven.com/a/ballroom), de Sergej Majboroda | HDR 1k, 1,67 MB | PMREM horneado, PNG RGBE 336×256, 119 KB |
| Letras 3D de los títulos | EB Garamond, de Georg Duffner y Octavio Pardo (SIL Open Font License 1.1), vía `@fontsource/eb-garamond` | woff estático, peso 500 | Contornos de las 17 mayúsculas que se usan, JSON de 18 KB |

### Peso de la carga inicial

Medido con `vite preview` registrando cada pedido hasta que la escena está lista; tamaños comprimidos con gzip, como los sirve GitHub Pages.

| Escenario | Comprimido |
|---|---|
| Vista lista (solo HTML) | 250 KB |
| Galería, cualquier calidad (hasta la intro lista) | 2,39 MB |
| "Sobre mí", aparte, al llegar a la galería | 520 KB |

Lo más pesado de la galería: las texturas KTX2 (~1,23 MB: parquet, yeso, molduras doradas y lightmaps), el chunk de three.js con la escena (~310 KB), el marco tallado (~275 KB), el transcodificador de Basis (~260 KB) y el entorno (~120 KB). En "Sobre mí", el nogal (~430 KB) y el marco de los certificados (~90 KB).

Todas las texturas KTX2, sueltas o dentro de un GLB, pasan por un único `KTX2Loader` (`ktx2.ts`): cada instancia descarga su propio transcodificador, y con dos se bajaba dos veces (~245 KB de más). Los fps en un celular de gama media están pendientes de medir en un dispositivo real con `?debug`.

## Contenido

Los textos de los proyectos son de ejemplo. No se muestran datos reales de sistemas internos de empresas: las demos usan datos ficticios.

## Lighthouse

Las mediciones se agregan en el hito 5.
