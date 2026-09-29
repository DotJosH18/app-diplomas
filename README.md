# Generador de Diplomas

Aplicación en Node.js que genera diplomas y documentos en PDF. Tiene **tres módulos**, uno por cada tipo de documento:

| Módulo              | Para qué                                   | Datos propios                                        |
|---------------------|--------------------------------------------|------------------------------------------------------|
| **Reconocimientos** | Reconocimiento académico a una persona     | Nombre, Descripción                                  |
| **Lugares**         | Del 1º al 7º lugar de un concurso o evento | Lugar obtenido, Evento, Descripción. **Sin nombre de persona** |
| **Comunicado de duelo** | Comunicar el fallecimiento de una persona | Nombre, 3 puntos y Despedida (ya vienen escritos). Hoja vertical estilo "COMUNICADO", **sin banda ni firmas** |
| **Agradecimientos** | Agradecer a una persona, familia o institución | Nombre, Descripción, Título (opcional), Campus y Fecha. Hoja **oficio vertical** con fondo de pergamino, **sin firmas** |
| **Placas** | Reconocimiento más formal | Igual que Reconocimientos. Cintas azul y dorada, marco dorado, **logo transparente de fondo** y firmas con rúbrica |

Al abrir la página aparece un **menú** para elegir el tipo de documento. Después de elegir, en todos puedes:

- **Generarlos uno a la vez:** llenas un formulario, ves la vista previa y lo descargas.
- **Generar varios:** arrastras un Excel a la página y se descarga **un solo PDF**, con una página por fila.

## Cómo ejecutarlo

```bash
npm install     # instala las librerías (solo la primera vez)
npm run dev     # enciende el servidor y lo reinicia solo cada vez que guardas un archivo
npm test        # ejecuta las pruebas automáticas
```

Abre **http://localhost:3000** y elige el tipo de diploma en el menú. Para cambiar de tipo, usa **"Cambiar tipo"** arriba a la derecha.

---

## Estructura del proyecto

```
diplomas-app/
├── src/                                  ← BACKEND (el servidor)
│   ├── server.js                         Enciende el servidor
│   ├── app.js                            Arma la aplicación: middlewares, rutas y errores
│   │
│   ├── modulos/                          ⭐ LOS TIPOS DE DIPLOMA
│   │   ├── index.js                      Lista de módulos
│   │   ├── reconocimientos/
│   │   │   ├── reconocimientos.config.js   Textos, límites, posiciones, columnas del Excel
│   │   │   ├── reconocimientos.schema.js   Reglas de sus campos
│   │   │   ├── reconocimientos.pdf.js      Dibuja su parte central
│   │   │   └── reconocimientos.modulo.js   Une las 3 piezas
│   │   ├── lugares/                      (mismas 4 piezas)
│   │   ├── duelo/                        (mismas 4 piezas; su PDF dibuja la página completa)
│   │   ├── agradecimientos/              (igual que duelo: página completa, hoja oficio)
│   │   └── placas/                       (página completa, A4 horizontal)
│   │
│   ├── config/
│   │   ├── app.config.js                 Puerto y límites del Excel
│   │   └── diseno.config.js              ⭐ Diseño COMÚN de los diplomas: colores, encabezado, firmas, valores por defecto
│   ├── schemas/
│   │   ├── campos.schema.js              Campos comunes y tipos de campo (con Zod)
│   │   └── personalizacion.schema.js     Regla del color de la banda
│   ├── routes/
│   │   ├── index.js                      /api/modulos, /api/configuracion y /api/:modulo
│   │   └── diplomas.routes.js            Rutas de cada módulo
│   ├── controllers/diplomas.controller.js   Recibe la petición y responde (sirve para todos los módulos)
│   ├── services/
│   │   ├── pdf.service.js                Dibuja las partes comunes y le pide al módulo lo suyo
│   │   ├── excel.service.js              Lee el Excel y crea el Excel modelo
│   │   └── imagen.service.js             Convierte el PDF en imagen PNG
│   ├── middlewares/
│   │   ├── buscarModulo.middleware.js    Lee el módulo de la URL y lo deja en req.modulo
│   │   ├── validarDiploma.middleware.js  Revisa los datos con el esquema del módulo
│   │   ├── subirArchivos.middleware.js   Recibe el Excel y el logo
│   │   ├── leerPersonalizacion.middleware.js  Revisa el color, el título y el logo elegidos
│   │   ├── permiteImagen.middleware.js   Deja pasar solo los módulos que se descargan como imagen
│   │   ├── registro.middleware.js        Muestra cada petición en la consola
│   │   └── errores.middleware.js         Convierte los errores en respuestas { error: "..." }
│   └── utils/
│       ├── HttpError.js                  Error con código HTTP (400, 404…)
│       ├── texto.js                      Quitar tildes, comparar textos, nombre del PDF
│       └── pdfTexto.js                   Escribir texto centrado con **negritas** en el PDF
│
├── public/                               ← FRONTEND (la página)
│   ├── index.html                        Estructura: menú, generador y formularios (sin estilos ni lógica)
│   ├── css/estilos.css                   Diseño
│   ├── js/app.js                         Comportamiento
│   └── img/                              Muestras del menú y logo por defecto (vista previa)
│
├── assets/                               Fuentes y logo por defecto del diploma (PNG con fondo transparente)
├── tests/diplomas.test.js                Pruebas automáticas
└── ejemplos/                             Un Excel de ejemplo por módulo
```

## ¿Para qué sirve cada capa?

| Capa             | Tarea                                                   | Pregunta que responde                          |
|------------------|---------------------------------------------------------|------------------------------------------------|
| **modulos**      | Lo que hace distinto a cada tipo de diploma             | ¿Qué pide y qué dibuja un diploma de Lugares?  |
| **config**       | Lo que comparten todos los diplomas                     | ¿De qué color es? ¿Quién firma por defecto?    |
| **schemas**      | Piezas para armar los esquemas (con Zod)                | ¿Qué es un campo obligatorio?                  |
| **routes**       | Unir cada URL con una función                           | ¿Quién atiende `POST /api/lugares`?            |
| **middlewares**  | Tareas antes o después del controlador                  | ¿Qué módulo es? ¿Los datos son válidos?        |
| **controllers**  | Recibir la petición, coordinar y responder              | ¿Qué hago con esta petición?                   |
| **services**     | El trabajo técnico (PDF, Excel)                         | ¿Cómo se dibuja? ¿Cómo se lee el Excel?        |
| **utils**        | Funciones pequeñas que usan varios archivos             | ¿Cómo quito las tildes?                        |

### Un diploma = partes comunes + partes del módulo

```
┌─────────────────────────────────────────────┐
│  UNIVERSIDAD CATÓLICA DE HONDURAS            │  ← común (pdf.service.js)
│  NUESTRA SEÑORA REINA DE LA PAZ              │
│  CAMPUS …                                    │
│  Diploma otorgado por:                       │  ← saludo del módulo (su config)
│  𝒫𝓇𝒾𝓂ℯ𝓇 𝐿𝓊ℊ𝒶𝓇                                │  ← texto principal del módulo (textoPrincipal):
│ ─────────────────────────────────────────── │     el nombre en Reconocimientos, el lugar en Lugares
│  CONCURSO DE ORATORIA 2026                   │  ← cuerpo del módulo (lugares.pdf.js → dibujarCuerpo)
│  Juticalpa, Olancho, 28 de septiembre de 2026│  ← común (fecha vacía = la de hoy)
│  ____________            ____________        │  ← común (firmas)
└─────────────────────────────────────────────┘
```

Cada módulo decide, en su archivo `<módulo>.modulo.js`:

- `textoPrincipal(diploma)`: qué va en la línea grande en cursiva. En Reconocimientos es `diploma.nombre` y en Lugares es `diploma.puesto`.
- `resumen(diploma)`: qué se muestra en la columna "Detalle" de la tabla del Excel.

### Recorrido de una petición

Esto pasa cuando la página pide un diploma de Lugares (`POST /api/lugares`):

```
public/js/app.js        envía { puesto, evento, ... }
      ▼
routes/index.js         '/:modulo'  →  diplomas.routes.js   (modulo = 'lugares')
      ▼
buscarModulo            busca 'lugares' en src/modulos y lo deja en req.modulo
      ▼
validarDiploma          revisa req.body con el esquema de ESE módulo (req.modulo.esquema):
      │                   - ¿hay errores? responde 400 y se detiene aquí
      │                   - ¿todo bien? deja los datos limpios en req.body
      ▼
generarUno              (controlador) generarPDF(req.modulo, req.body) → res.send(pdf)
      ▼
pdf.service             dibuja las partes comunes y llama a req.modulo.dibujarCuerpo()

Si algo falla → throw new HttpError(400, 'mensaje') → errores.middleware responde { error: 'mensaje' }
```

---

## Guía para hacer cambios

### 1. Cambios de diseño o textos (sin tocar código)

| Quiero…                                             | Archivo → sección                                     |
|-----------------------------------------------------|-------------------------------------------------------|
| Cambiar firmantes, cargos, lugar o fecha por defecto | `config/diseno.config.js` → `valoresPorDefecto`      |
| Que el campus aparezca siempre                      | `config/diseno.config.js` → `valoresPorDefecto.campus` |
| Cambiar colores o "UNIVERSIDAD CATÓLICA…" por defecto | `config/diseno.config.js` → `colores`, `textosFijos` |
| Mover el encabezado, el texto principal o las firmas | `config/diseno.config.js` → `posiciones`, `firmas`  |
| Cambiar "Reconocimiento a:" u "Otorgado a:"         | `modulos/<módulo>/<módulo>.config.js` → `saludo`     |
| Mover el evento o la descripción                    | `modulos/<módulo>/<módulo>.config.js` → `posiciones` |
| Cambiar la línea bajo el nombre o el lugar          | `config/diseno.config.js` → `lineaPrincipal` (común), o `lineaPrincipal` en la config del módulo |
| Cambiar el límite de la descripción                 | `modulos/<módulo>/<módulo>.config.js` → `limites`, y el `maxlength` en `index.html` |
| Aceptar otro encabezado en el Excel                 | `modulos/<módulo>/<módulo>.config.js` → `columnasExcel` |
| Agregar un lugar válido (ej. "Cuarto Lugar")        | `lugares.config.js` → `puestos`, y su `<option>` en las dos listas de `index.html` |

- **Logo:** reemplaza `assets/imagenes/logo.png`.
- **Colores de la página:** están en `public/css/estilos.css`, al inicio, en `:root`.

### 2. Cambiar una regla de validación

Las reglas de cada módulo están en su archivo **`<módulo>.schema.js`**, una línea por campo:

```js
export const lugaresSchema = z.object({
  puesto: textoObligatorio('Lugar obtenido', config.limites.puesto),     // obligatorio
  evento: textoObligatorio('Evento', config.limites.evento),
  descripcion: textoObligatorio('Descripción', config.limites.descripcion),
  ...camposComunes,                                                        // campus, lugar, fecha, firmas
});
```

- **Cambiar si un campo es obligatorio:** usa `textoObligatorio` o `textoOpcional`. Recuerda también el `required` en `index.html`.
- **Campos comunes:** las reglas de campus, lugar, fecha y firmas están en `schemas/campos.schema.js`.
- **El nombre no es común:** solo lo tiene Reconocimientos, en su propio esquema.

### 3. Crear un módulo nuevo (ejemplo: "Participación")

Hay dos clases de módulo:

- **Diploma** (como Reconocimientos y Lugares): usa la banda, el encabezado y las firmas comunes. Solo dibuja su parte central con `dibujarCuerpo`. Copia la carpeta `lugares`.
- **Diseño propio** (como el Comunicado de duelo): dibuja la página completa con `dibujarPagina`, y puede tener otro tamaño de hoja (`pagina` en su config). Copia la carpeta `duelo`.

1. **Copia la carpeta** `src/modulos/lugares` como `src/modulos/participacion`. Renombra los 4 archivos, por ejemplo `participacion.config.js`.
2. **Edita cada pieza:**
   - `participacion.config.js`: saludo, límites, posiciones, columnas del Excel, `columnaObligatoria` y fila de ejemplo.
   - `participacion.schema.js`: sus campos propios.
   - `participacion.pdf.js`: qué dibuja en el centro (`dibujarCuerpo`) o la página completa (`dibujarPagina`).
   - `participacion.modulo.js`: `id: 'participacion'`, `titulo`, `textoPrincipal` y `resumen`.
3. **Regístralo** en `src/modulos/index.js`:
   ```js
   import participacion from './participacion/participacion.modulo.js';
   export const modulos = [reconocimientos, lugares, participacion];
   ```
4. **En la página** (`public/index.html`):
   - Agrega su tarjeta al menú, copiando una de las que hay dentro de `<section id="menu">`:
     ```html
     <button class="opcion" data-modulo="participacion" data-titulo="Participación">
       <img class="opcion__imagen" src="img/muestra-participacion.png" alt="Ejemplo" />
       <span class="opcion__titulo">Participación</span>
       <span class="opcion__texto">Para qué sirve este diploma.</span>
       <span class="opcion__campos">Pide: …</span>
     </button>
     ```
   - Agrega sus campos propios, marcados con `data-modulos="participacion"`.
   - Si un campo que ya existe también le sirve, agrega el módulo a su lista. Por ejemplo, `data-modulos="reconocimientos duelo participacion"`.
   - Para la imagen de muestra, genera un ejemplo y guarda una captura en `public/img/`.

No hace falta tocar `app.js`: la página muestra u oculta cada campo según su `data-modulos`. Las rutas, el controlador y el Excel también funcionan solos para el módulo nuevo.

### 4. Agregar un dato nuevo a un módulo (ejemplo: "Categoría" en Lugares)

1. `lugares.config.js`: agrega `categoria: 40` en `limites` y `categoria: ['Categoría']` en `columnasExcel`.
2. `lugares.schema.js`: agrega `categoria: textoOpcional('Categoría', config.limites.categoria),`.
3. `lugares.pdf.js`: dibújalo dentro de `dibujarCuerpo`.
4. `index.html`: agrega en los dos formularios `<label data-modulos="lugares">Categoría <input name="categoria" maxlength="40" /></label>`.

> Si no lo agregas al esquema, el dato se ignora aunque venga en el formulario o en el Excel. El esquema solo deja pasar los campos que conoce.

### 5. Consejos

- Después de cada cambio, ejecuta **`npm test`**. Si algo se rompió, la prueba te dice qué.
- En los textos del diploma, **`**texto**`** pone el texto en negrita.
- Los errores inesperados del servidor aparecen completos en la consola donde corre `npm run dev`.
- En la página, abre las herramientas del navegador (F12) y mira la pestaña **Console** para ver errores del frontend.

---

## Personalizar el diseño (opcional)

En el generador, **"Personalizar diseño"** permite elegir:

- **Color de la banda:**
  - Hay 7 colores rápidos, o puedes elegir cualquier otro con el círculo arcoíris.
  - La vista en miniatura cambia al momento.
- **Encabezado** (Reconocimientos y Lugares): las 2 líneas de arriba del diploma, "UNIVERSIDAD CATÓLICA DE HONDURAS" y "NUESTRA SEÑORA REINA DE LA PAZ".
  - Cada línea acepta máximo 45 caracteres y siempre sale en mayúsculas.
  - Si una línea es larga, su letra se achica para que quepa en una sola línea.
  - Si dejas una línea vacía, se usa el texto de siempre.
- **Título** (Comunicado de duelo): ver la sección del comunicado.
- **Logo:**
  - Se sube un PNG o JPG de máximo 2 MB. Se ajusta solo, sin deformarse, aunque sea ancho o alto.
  - Si no se sube ninguno, se usa el de UNICAH.

Sirve para las dos pestañas, "Desde Excel" y "Uno a la vez". Si no se toca, se usa el diseño por defecto.

**Cómo funciona por dentro:**

```
página → envía colorBanda, encabezado1, encabezado2, titulo y logo junto con los datos
   ▼
subirArchivos          recibe el logo (req.files.logo)
   ▼
leerPersonalizacion    revisa los textos con su esquema y que el logo sea PNG/JPG de verdad
   │                   → deja req.personalizacion = { colorBanda, encabezado1, encabezado2, titulo, logo }
   ▼
pdf.service            dibujarBarraLateral usa el color y el logo, y dibujarEncabezado las 2 líneas;
                       si vienen vacíos, se usan los de diseno.config.js
```

- **Cambiar el encabezado por defecto:** en `textosFijos` de `src/config/diseno.config.js`, y también el `placeholder` de los dos campos en `index.html` (es lo que muestra la miniatura).
- **Cambiar el límite de caracteres de los textos:** en `src/schemas/personalizacion.schema.js`, y el `maxlength` del campo en `index.html`.
- **Cambiar los colores rápidos:** edita los botones `data-color` en `index.html`, y su color en `estilos.css`, en `.color[data-color="…"]`.
- **Cambiar el logo por defecto:** reemplaza `assets/imagenes/logo.png` (el del PDF) y `public/img/logo-unicah.png` (el de la vista en miniatura).

## Comunicado de duelo

- **Hoja:** vertical (612 × 720 puntos), fondo blanco con figuras grises muy suaves a los lados.
  - **Arriba:** el título "COMUNICADO" con una barra de dos tonos debajo, y el logo de UNICAH en blanco y negro a la derecha (`assets/imagenes/logo-duelo.png`).
  - **Abajo a la derecha:** el lugar (en negrita) y la fecha.
- **Texto (justificado):** una introducción fija, tres puntos numerados y una despedida.
  - **Punto 1 (anuncio), Punto 2 (exhortación), Punto 3 (condolencias) y Despedida** ya vienen escritos; si se dejan vacíos, se usa ese texto.
  - `{nombre}` se reemplaza por el nombre de la persona, y `**texto**` va en negrita.
- **Datos:** solo el Nombre es obligatorio.
- **Tamaño de letra:** se adapta solo, entre 12.5 y 9.5 puntos, para que todo quepa.
- **Personalizar diseño** (sirve para "Desde Excel" y "Uno a la vez"):
  - **Título:** en lugar de "COMUNICADO" se puede poner otro (ej. NOTA DE DUELO), máximo 24 caracteres. Siempre sale en mayúsculas y, si es largo, la letra se achica (de 34 a 12 puntos) para que quepa en una línea junto al logo.
  - **Logo:** se puede subir otro (PNG o JPG). Si no, se usa el de blanco y negro.
  - La miniatura del panel muestra cómo quedan el título y el logo.
  - El color de banda no aplica, porque el comunicado no tiene banda.
  - El título por defecto está en `titulo` de `duelo.config.js`, y el límite de letras en `src/schemas/personalizacion.schema.js`.
- **Descargar como imagen:** en "Uno a la vez" aparece el botón **Descargar imagen (PNG)**.
  - El servidor genera el mismo PDF y lo convierte en PNG (`src/services/imagen.service.js`), así la imagen queda idéntica.
  - Tamaño: 1836 × 2160 píxeles (escala 3). Se cambia con `IMAGEN_ESCALA` en el `.env` o en `src/config/app.config.js`.
  - Para darle esta opción a otro módulo, pon `descargaImagen: true` en su config y agrega el módulo al `data-modulos` del botón `boton-imagen` en `index.html`.
- **Dónde cambiar el título, la introducción, los textos, colores, posiciones y límites:** en `src/modulos/duelo/duelo.config.js`.

## Agradecimientos

- **Hoja:** oficio (legal) vertical, 8.5 × 14 pulgadas (612 × 1008 puntos).
  - **Fondo:** imagen de pergamino (`assets/imagenes/pergamino.jpg`).
  - **Marco:** café, con una línea gruesa, otra delgada por dentro y las esquinas curvas hacia adentro, con un cuadrito en cada una.
  - **Logo:** el de UNICAH en negro, arriba al centro. Se puede cambiar en "Personalizar diseño".
- **Textos, de arriba hacia abajo:**
  - **Título:** "AGRADECIMIENTO" por defecto. Se puede cambiar por otro (ej. RECONOCIMIENTO), máximo 24 caracteres, y la letra se achica si es largo.
  - **"CONCEDIDO A:"** en dorado.
  - **Nombre** (obligatorio), con una línea debajo.
  - **Descripción** (obligatoria, máximo 700 caracteres): en letra caligráfica y justificada. `**texto**` va en negrita. La letra baja de 18 a 12 puntos si el texto es largo.
  - Puede tener **varios párrafos** (ver "Párrafos en la descripción").
  - **Fecha.**
  - **"UNICAH"** y, debajo, el **Campus** (si se escribió).
- **Descargar como imagen:** también tiene el botón "Descargar imagen (PNG)".
- **Dónde cambiar textos fijos, colores, posiciones, tamaños y el marco:** en `src/modulos/agradecimientos/agradecimientos.config.js`.
- **Letras:** Cormorant Garamond (título, nombre y pie), Fondamento (descripción) y Montserrat (CONCEDIDO A y fecha). Fondamento no tiene negrita, por eso la negrita se dibuja repasando el borde de las letras (`grosorNegrita` en `escribirJustificado`).

## Encabezado y pie de la página

- **Encabezado:** el logo de UNICAH va a la par de "Generador de Diplomas". También sale como icono en la pestaña del navegador.
  - El logo es `public/img/logo-unicah.png`; para cambiarlo, reemplaza ese archivo.
  - El tamaño está en `.marca__logo` de `estilos.css`.
- **Pie de página:** está en `public/index.html`, en el bloque `PIE DE PÁGINA`, al final. Tiene 3 partes:
  - **Izquierda** (`pie__marca`): logo, nombre de la universidad y campus.
  - **Centro** (`pie__enlaces`): enlaces. Agrega más copiando la línea `<a href="…">…</a>`.
  - **Derecha** (`pie__derechos`): © año y "Desarrollado por". **Cambia "Tu nombre o departamento" por el tuyo.**
  - El año se actualiza solo (`anio-actual` en `app.js`).
  - Los colores y espacios están en `estilos.css`, en la sección "Pie de página".
  - El pie siempre queda al fondo, aunque la página tenga poco contenido.

## Fecha por defecto

En todos los módulos, si la **Fecha** se deja vacía se usa **la fecha de hoy**, así: *28 de septiembre de 2026*.

- **Cuándo se calcula:** en el momento de generar cada documento, no cuando se enciende el servidor. Si el servidor queda encendido varios días, siempre pone la fecha del día.
- **Zona horaria:** se usa la de Honduras (`America/Tegucigalpa`), aunque el servidor esté en otro país. Se cambia con `ZONA_HORARIA` en el `.env`.
- **En la página,** el campo Fecha muestra en gris la fecha de hoy.
- **Si escribes una fecha,** se usa la tuya, tal cual.
- **En el Excel,** si la celda Fecha tiene formato de fecha, se convierte a texto (*9 de abril de 2025*).
- **Dónde está:** `src/utils/fecha.js` (`fechaDeHoy` y `fechaEnTexto`). Se usa en `camposComunes.fecha` (`src/schemas/campos.schema.js`), que comparten los cuatro módulos.

## Placas

- **Hoja:** A4 horizontal, fondo blanco.
  - **Cintas:** azul y dorada, en la esquina de arriba a la izquierda y en la de abajo a la derecha. Es la misma figura, girada 180°.
    - Cada cinta es una franja entre dos curvas suaves (curvas de Bézier) que van del borde de arriba al borde izquierdo.
    - La azul es más gruesa arriba y la dorada más gruesa a la izquierda: así se cruzan como una cinta torcida. Un filete dorado fino acompaña a la azul por fuera.
    - Sus medidas están en `cintas` de `placas.config.js`: dónde toca cada curva los bordes y la `curvatura`.
  - **Marco:** dorado, con una línea gruesa y otra delgada por dentro, y un pequeño adorno (◆ con dos líneas) en las dos esquinas sin cintas, para equilibrar.
  - **Marca de agua:** el logo de UNICAH (`assets/imagenes/logo-placa.png`), **centrado dentro del marco** a lo ancho y a lo alto, detrás del texto.
    - `tamanoLogo` es su tamaño y `transparenciaLogo` su transparencia (0 = invisible, 1 = normal).
- **Textos** (de más a menos importante):
  - Universidad y sede. La sede va en gris, más pequeña.
  - Campus en azul, entre dos líneas doradas con rombos.
  - "RECONOCIMIENTO A" en letras pequeñas y espaciadas.
  - El nombre en cursiva dorada, con una línea dorada que se desvanece en las puntas (`lineaDegradada`).
  - La descripción, que acepta párrafos y se valida para que quepa.
  - Lugar y fecha en gris.
- **Nombre y rúbricas "sentados" en su línea:** se calcula la línea base de la letra (donde se apoyan las letras) con `yParaLineaBase` (`utils/pdfTexto.js`). Así el nombre y cada rúbrica quedan justo encima de su línea, aunque la letra se achique por ser largos. La distancia se cambia con `nombreSobreLinea` y `rubricaSobreLinea`.
- **Firmas:**
  - Encima de cada línea va una **rúbrica** en cursiva, que se arma sola del nombre del firmante: quita los títulos que terminan en punto (Mte., MSc., Dr.) y deja el primer nombre y el último apellido. Por ejemplo, "Mte. Darío Martín Henríquez" → "Darío Henríquez". Ver `rubricaDe` en `placas.pdf.js`.
  - Con 2 firmantes, van a los lados. Con Firmante 3, las 3 van en la misma fila.
- **Personalizar diseño:**
  - El **color** cambia la cinta azul y el texto del campus; la dorada no cambia.
  - El **encabezado** cambia las 2 primeras líneas.
  - El **logo** cambia la marca de agua.
- **Descargar como imagen:** tiene el botón "Descargar imagen (PNG)".
- **Dónde cambiar colores, posiciones, marco, transparencia y firmas:** en `src/modulos/placas/placas.config.js`.
- **Dónde cambiar la forma de las cintas:** en `cintas` de `placas.config.js` (y el dibujo, en `dibujarCintasDeEsquina` de `placas.pdf.js`).

## Párrafos en la descripción

En **Reconocimientos**, **Lugares**, **Agradecimientos** y **Placas** la descripción puede tener varios párrafos:

- **Cómo se escriben:** cada Enter empieza un párrafo nuevo (en el Excel, Alt + Enter dentro de la celda).
- **Líneas vacías:** dos Enter seguidos cuentan como uno solo, así no quedan huecos.
- **Espacio entre párrafos:** queda un pequeño espacio entre uno y otro.
- **Si el texto es largo:** la letra se achica para que quepa (10.5 → 9 puntos en los diplomas, 18 → 12 en Agradecimientos).

**Nunca se genera un diploma roto.** El esquema de cada módulo MIDE la descripción antes de generar el PDF:

```
esquema (descripcionQueCabe)                    PDF (dibujarCuerpo / dibujarPagina)
        │                                                │
        └──────► acomodarDescripcion(doc, texto) ◄───────┘   (en <módulo>.pdf.js)
                        │
                        ▼
      acomodarParrafos → { parrafos, tamano, cabe }          (en utils/pdfTexto.js)
```

- **Una sola función de cálculo:** la validación y el dibujo usan la misma función, así que siempre calculan lo mismo.
- **Para medir sin generar el PDF,** el esquema usa un documento "medidor" que nunca se guarda (`utils/pdfFuentes.js`).
- **Si ni con la letra mínima cabe,** da el error *"Descripción no cabe en el diploma: acorta el texto o usa menos párrafos"*.
  - En "Uno a la vez" aparece al generar.
  - En el Excel, la fila queda marcada con ese error.
- **Máximo aproximado de párrafos cortos:** 5 en Reconocimientos, 3 en Lugares y 12 en Agradecimientos. Los largos cuentan más, porque ocupan varias líneas.
- **Dónde se cambia el espacio:** en `posiciones.descripcion` y `posiciones.finDescripcion` del config de cada módulo.
- **Dónde se cambia la letra:** en `descripcion.tamano` y `descripcion.tamanoMinimo` (en Agradecimientos, `tamanos.descripcion`).

## Firmas

- **Sin Firmante 3:** firma 1 a la izquierda y firma 2 a la derecha.
- **Con Firmante 3 (opcional):** la 1 va a la izquierda, la 2 a la derecha y la 3 **al centro, más arriba**.

## Excel

- Se lee la primera hoja. La primera fila lleva los encabezados.
- Cada módulo tiene su **Excel modelo**, que se descarga desde la página.
- **Reconocimientos:** una fila por persona. Son obligatorias Nombre y Descripción.
- **Lugares:** una fila por lugar (Primer, Segundo, Tercer…). Son obligatorias Lugar obtenido, Evento y Descripción, y no lleva nombre.
  - **Lugar obtenido** solo acepta del Primer al Séptimo Lugar, o Mención Honorífica. También entiende formas cortas como `1`, `2do`, `4to lugar` o `7mo`.
  - Para agregar otro lugar: añádelo en `puestos` de `src/modulos/lugares/lugares.config.js` y como `<option>` en las dos listas de `index.html`.
  - También reconoce formas comunes, como "1er lugar", "2do", "3°" o "primero", y las escribe con su nombre correcto en el diploma.
  - Cualquier otro valor marca la fila con error.
  - Ojo: la columna **"Lugar"** es la ciudad y **"Lugar obtenido"** es el puesto.
- **Columnas comunes opcionales:** Campus, Lugar, Fecha, Firmante 1, Cargo 1, Firmante 2, Cargo 2, Firmante 3 y Cargo 3.
- **Prioridad de cada dato:** celda del Excel → "Datos comunes" de la página → valor por defecto.
  - Así, por ejemplo, el mismo evento para todos se escribe una sola vez en "Datos comunes".
- Las filas con errores se saltan, y la página te dice cuántas fueron.

## API

| Método | URL                                  | Qué hace                                              |
|--------|--------------------------------------|-------------------------------------------------------|
| GET    | `/api/modulos`                       | Lista de módulos                                      |
| GET    | `/api/configuracion`                 | Valores por defecto de los campos comunes             |
| POST   | `/api/:modulo`                       | Datos (JSON o formulario) → PDF (`?vista=1` para verlo en el navegador) |
| POST   | `/api/:modulo/imagen`                | Datos → imagen PNG (solo módulos con `descargaImagen: true`, como `duelo`) |
| GET    | `/api/:modulo/excel/modelo`          | Descarga el Excel modelo del módulo                   |
| POST   | `/api/:modulo/excel/revisar`         | Excel → cómo quedará cada fila (sin generar PDF)      |
| POST   | `/api/:modulo/excel`                 | Excel → un solo PDF con todos los diplomas            |

`:modulo` es `reconocimientos` o `lugares`.

Opcional en los POST que generan PDF: `colorBanda` (por ejemplo `#7A1428`) y `logo` (archivo PNG o JPG). Ejemplos:

```bash
# Sin personalizar (JSON)
curl -X POST http://localhost:3000/api/lugares \
  -H "Content-Type: application/json" \
  -d '{"puesto":"Primer Lugar","evento":"Concurso de Oratoria 2026","descripcion":"Por su destacada participación."}' \
  -o diploma.pdf

# Con color y logo propios (formulario)
curl -X POST http://localhost:3000/api/lugares \
  -F puesto="Primer Lugar" -F evento="Concurso de Oratoria 2026" -F descripcion="Por su destacada participación." \
  -F colorBanda="#7A1428" -F logo=@mi-logo.png \
  -o diploma.pdf
```

## `import` / `export`

El proyecto usa módulos modernos de JavaScript (`"type": "module"` en `package.json`):

```js
// Exportar desde un archivo
export default app;                        // lo principal del archivo
export function generarPDF() { ... }       // funciones sueltas

// Importar en otro archivo (siempre con la extensión .js)
import app from './app.js';
import { generarPDF } from './services/pdf.service.js';
```

## Librerías

| Librería  | Para qué                                     |
|-----------|----------------------------------------------|
| express   | El servidor web y las rutas                  |
| zod       | Los esquemas de validación                   |
| multer    | Recibir el archivo Excel                     |
| exceljs   | Leer y crear archivos Excel                  |
| pdfkit    | Crear los PDF                                |
| pdf-to-img | Convertir el PDF en imagen PNG (comunicado y agradecimientos) |
| dotenv    | Leer la configuración del archivo `.env`     |
| supertest | Solo para las pruebas                        |


## Subir a GitHub y publicar gratis en Render (sin tarjeta)

El proyecto ya viene listo:

- **`render.yaml`:** Render lo lee y configura el servicio solo.
- **`package.json`:** dice que se use Node 22.
- **`.gitignore`:** evita subir `node_modules` y `.env`.

### 1. Subir el código a GitHub

1. Entra a [github.com/new](https://github.com/new) y crea un repositorio, por ejemplo `diplomas-unicah`. **No** marques "Add a README" (el proyecto ya trae uno).
2. En una terminal, dentro de la carpeta del proyecto:

```bash
git remote add origin https://github.com/TU-USUARIO/diplomas-unicah.git
git push -u origin main
```

El proyecto ya tiene un primer commit. Si prefieres empezar de cero: `git init`, `git add .`, `git commit -m "Primer commit"`, `git branch -M main`, y luego los dos comandos de arriba.

### 2. Publicar en Render

1. Entra a [render.com](https://render.com) y regístrate con **"Sign in with GitHub"**. No pide tarjeta.
2. Arriba a la derecha: **New → Blueprint**. Elige el repositorio `diplomas-unicah` y conecta GitHub si te lo pide.
3. Render lee `render.yaml` y muestra el servicio `diplomas-unicah` con el plan **Free**. Pulsa **Apply** (o **Deploy Blueprint**).
4. Espera a que termine (2 a 4 minutos). Te dará una dirección como `https://diplomas-unicah.onrender.com`.

**Otra forma, sin Blueprint:** New → Web Service → elige el repositorio. Luego:

- **Build Command:** `npm ci --omit=dev`
- **Start Command:** `npm start`
- **Instance Type:** Free

### 3. Actualizar la app

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Describe el cambio"
git push
```

Render detecta el `push` y vuelve a publicar solo, en unos minutos.

### Lo que hay que saber del plan gratis

- **Se duerme:** si nadie la usa por **15 minutos**, se apaga. La siguiente visita tarda **cerca de 1 minuto** en cargar; después va normal.
- **Horas al mes:** trae **750 horas al mes**, suficientes para tener la app encendida todo el mes.
- **Sin tarjeta:** si alguna vez se pasa del uso gratis, la app se pausa hasta el mes siguiente. **No te cobra**, porque no hay tarjeta.
- **No guarda archivos:** la app no guarda nada en disco (genera los PDF y los envía), así que esto no le afecta.
