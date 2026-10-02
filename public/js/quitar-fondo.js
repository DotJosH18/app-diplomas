// =============================================================
//  HERRAMIENTA: QUITAR EL FONDO DE UN LOGO
//
//  Todo pasa en el navegador con <canvas> (viene en todos los
//  navegadores, no hay que instalar nada). La imagen NO se envía
//  al servidor.
//
//  Cómo funciona:
//    1. Se dibuja la imagen en un canvas y se leen sus píxeles.
//       Cada píxel son 4 números: rojo, verde, azul y alfa
//       (alfa = qué tan visible es: 0 transparente, 255 normal).
//    2. Se averigua el color del fondo (el más repetido en los bordes).
//    3. Se marcan como fondo los píxeles parecidos a ese color:
//       - "solo el de afuera": se empieza en los bordes y se avanza
//         a los vecinos parecidos (como el balde de pintura de Paint),
//         siguiendo también los degradados suaves.
//         Así los blancos DENTRO del logo no se borran.
//       - si no: se borran todos los parecidos, estén donde estén.
//    4. Se aplican los "retoques": clic en el resultado para borrar
//       o recuperar una zona (con Deshacer).
//    5. A los píxeles de fondo se les pone alfa 0 (transparentes) y
//       el borde queda semitransparente y SIN halo del color del fondo.
//    6. Se recorta el espacio vacío y se dibuja el resultado.
//
//  (Mostrar u ocultar esta pantalla lo hace navegacion.js.)
//
//  IMPORTA                           DE               PARA
//  mostrar, ocultar, mostrarMensaje  utilidades.js    pasos y avisos
//  usarComoLogo                      personalizar.js  "Usar como logo en los diplomas"
//
//  EXPORTA               LO IMPORTA  PARA
//  iniciarQuitarFondo()  main.js     arrancar esta parte
// =============================================================
import { mostrar, ocultar, mostrarMensaje } from './utilidades.js';
import { usarComoLogo } from './personalizar.js';

// ---------- Elementos de la página ----------
const zonaFondo = document.getElementById('zona-fondo');
const inputFondo = document.getElementById('input-fondo');
const LOGO_UNICAH_CON_FONDO = 'img/logo-unicah-con-fondo.png'; // el logo oficial, para probar la herramienta
const editorFondo = document.getElementById('editor-fondo');
const lienzoOriginal = document.getElementById('lienzo-original');
const lienzoResultado = document.getElementById('lienzo-resultado');
const cajaFondoDetectado = document.querySelector('.fondo-detectado');
const textoCodigoFondo = document.getElementById('codigo-fondo');
const textoOrigenFondo = document.getElementById('origen-fondo');
const deslizadorTolerancia = document.getElementById('tolerancia-fondo');
const textoTolerancia = document.getElementById('valor-tolerancia');
const casillaSoloExterior = document.getElementById('solo-exterior');
const casillaSuavizar = document.getElementById('suavizar-bordes');
const casillaRecortar = document.getElementById('recortar-sobrante');
const botonOtraImagen = document.getElementById('boton-otra-imagen');
const botonDeshacer = document.getElementById('boton-deshacer-retoque');
const botonQuitarRetoques = document.getElementById('boton-quitar-retoques');
const cajaResultado = document.getElementById('caja-resultado');
const opcionesVistaFondo = document.querySelectorAll('input[name="vista-fondo"]');
const botonUsarLogo = document.getElementById('boton-usar-logo');
const botonDescargarPNG = document.getElementById('boton-descargar-png');
const mensajeFondo = document.getElementById('mensaje-fondo');

// ---------- Estado ----------
const LADO_MAXIMO = 1600;       // imágenes más grandes se achican (más rápido y pesa menos)
let pixelesOriginales = null;   // los píxeles de la imagen original (ImageData)
let colorFondo = [255, 255, 255]; // [rojo, verde, azul]
let nombreImagen = 'logo';      // para el nombre del PNG que se descarga
let temporizadorFondo = null;
let retoques = [];              // los clics sobre el resultado: { x, y, accion }
let recorte = { x: 0, y: 0, ancho: 0, alto: 0 }; // qué parte de la imagen se ve en el resultado


// =============================================================
//  ARRANQUE
// =============================================================

/** Conecta la zona de la imagen, los controles y los botones (se llama una vez, desde main.js). */
export function iniciarQuitarFondo() {
  prepararEleccionDeImagen();
  prepararControles();
  prepararBotonesFinales();
}


// =============================================================
//  1. ELEGIR LA IMAGEN (clic o arrastrar y soltar)
// =============================================================

/** Clic, teclado y arrastrar y soltar en la zona; "Otra imagen" vuelve a la zona. */
function prepararEleccionDeImagen() {
  zonaFondo.addEventListener('click', function () {
    inputFondo.click();
  });
  zonaFondo.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
      inputFondo.click();
    }
  });
  inputFondo.addEventListener('change', function () {
    if (inputFondo.files[0]) {
      cargarImagen(inputFondo.files[0]);
    }
    inputFondo.value = ''; // permite volver a elegir el mismo archivo
  });

  // Arrastrar y soltar (igual que la zona del Excel)
  zonaFondo.addEventListener('dragover', function (evento) {
    evento.preventDefault();
    zonaFondo.classList.add('arrastrando'); // mismo estilo que la zona del Excel
  });
  zonaFondo.addEventListener('dragleave', function () {
    zonaFondo.classList.remove('arrastrando');
  });
  zonaFondo.addEventListener('drop', function (evento) {
    evento.preventDefault();
    zonaFondo.classList.remove('arrastrando');
    const archivo = evento.dataTransfer.files[0];
    if (archivo) {
      cargarImagen(archivo);
    }
  });

  // "Probar con el logo de UNICAH": carga el logo oficial (con su fondo blanco)
  document.getElementById('boton-logo-unicah-fondo').addEventListener('click', async function (evento) {
    evento.stopPropagation(); // que no abra también el buscador de archivos de la zona
    const respuesta = await fetch(LOGO_UNICAH_CON_FONDO);
    const imagen = await respuesta.blob();
    cargarImagen(new File([imagen], 'logo-unicah.png', { type: imagen.type }));
  });

  botonOtraImagen.addEventListener('click', function () {
    ocultar(editorFondo);
    mostrar(zonaFondo);
    mostrarMensaje(mensajeFondo, '', 'normal');
  });
}

/** Lee la imagen, la dibuja en el lienzo "Original" y la procesa. */
async function cargarImagen(archivo) {
  if (!archivo.type.startsWith('image/')) {
    mostrarMensaje(mensajeFondo, 'El archivo debe ser una imagen (PNG, JPG o WEBP)', 'error');
    return;
  }

  let imagen;
  try {
    imagen = await createImageBitmap(archivo); // convierte el archivo en una imagen que se puede dibujar
  } catch (error) {
    mostrarMensaje(mensajeFondo, 'No se pudo abrir la imagen', 'error');
    return;
  }

  // Si es muy grande, se achica sin deformarla
  let escala = 1;
  const ladoMayor = Math.max(imagen.width, imagen.height);
  if (ladoMayor > LADO_MAXIMO) {
    escala = LADO_MAXIMO / ladoMayor;
  }
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);

  lienzoOriginal.width = ancho;
  lienzoOriginal.height = alto;
  const contexto = lienzoOriginal.getContext('2d', { willReadFrequently: true });
  contexto.clearRect(0, 0, ancho, alto);
  contexto.drawImage(imagen, 0, 0, ancho, alto);
  pixelesOriginales = contexto.getImageData(0, 0, ancho, alto);

  // "Mi logo.jpg" -> "Mi logo"
  nombreImagen = archivo.name.replace(/\.[^.]+$/, '');
  retoques = []; // imagen nueva: sin retoques

  // Color del fondo: el más repetido en los bordes
  colorFondo = detectarColorDeFondo(pixelesOriginales);
  mostrarColorDeFondo('detectado automáticamente');

  ocultar(zonaFondo);
  mostrar(editorFondo);
  mostrarMensaje(mensajeFondo, '', 'normal');
  procesar();
}


// =============================================================
//  2. COLOR DEL FONDO
// =============================================================

/**
 * El color más repetido en el borde de la imagen (el marco de 1 píxel).
 * Los colores se agrupan en "cajas" (de 32 en 32) para que tonos casi
 * iguales cuenten juntos; luego se promedia la caja con más píxeles.
 */
function detectarColorDeFondo(pixeles) {
  const ancho = pixeles.width;
  const alto = pixeles.height;
  const datos = pixeles.data;
  const cajas = {}; // { 'r,g,b': { cantidad, sumaRojo, sumaVerde, sumaAzul } }

  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const esBorde = x === 0 || y === 0 || x === ancho - 1 || y === alto - 1;
      if (!esBorde) {
        continue;
      }
      const i = (y * ancho + x) * 4;
      if (datos[i + 3] < 10) {
        continue; // ya es transparente: no cuenta
      }
      const clave = `${datos[i] >> 5},${datos[i + 1] >> 5},${datos[i + 2] >> 5}`; // >> 5 = dividir entre 32
      if (!cajas[clave]) {
        cajas[clave] = { cantidad: 0, sumaRojo: 0, sumaVerde: 0, sumaAzul: 0 };
      }
      cajas[clave].cantidad++;
      cajas[clave].sumaRojo += datos[i];
      cajas[clave].sumaVerde += datos[i + 1];
      cajas[clave].sumaAzul += datos[i + 2];
    }
  }

  let mejor = null;
  for (const clave in cajas) {
    if (mejor === null || cajas[clave].cantidad > mejor.cantidad) {
      mejor = cajas[clave];
    }
  }
  if (mejor === null) {
    return [255, 255, 255]; // el borde ya era transparente
  }
  return [
    Math.round(mejor.sumaRojo / mejor.cantidad),
    Math.round(mejor.sumaVerde / mejor.cantidad),
    Math.round(mejor.sumaAzul / mejor.cantidad),
  ];
}

/** [255, 136, 0] -> '#FF8800' */
function aCodigo(color) {
  let codigo = '#';
  for (const valor of color) {
    codigo = codigo + valor.toString(16).padStart(2, '0');
  }
  return codigo.toUpperCase();
}

function mostrarColorDeFondo(origen) {
  const codigo = aCodigo(colorFondo);
  textoCodigoFondo.textContent = codigo;
  textoOrigenFondo.textContent = origen;
  cajaFondoDetectado.style.setProperty('--color-fondo', codigo); // variable CSS de la muestra
}

/** Clic en la imagen original: ese es el color del fondo. */
function elegirFondoConClic(evento) {
  if (pixelesOriginales === null) {
    return;
  }
  // El lienzo se ve más pequeño que su tamaño real: se convierte la posición
  const rectangulo = lienzoOriginal.getBoundingClientRect();
  const x = Math.floor((evento.clientX - rectangulo.left) * (lienzoOriginal.width / rectangulo.width));
  const y = Math.floor((evento.clientY - rectangulo.top) * (lienzoOriginal.height / rectangulo.height));
  const i = (y * pixelesOriginales.width + x) * 4;
  const datos = pixelesOriginales.data;

  colorFondo = [datos[i], datos[i + 1], datos[i + 2]];
  mostrarColorDeFondo('elegido por ti');
  procesar();
}


// =============================================================
//  3. QUITAR EL FONDO
// =============================================================

/**
 * Cada control vuelve a procesar la imagen (con una pequeña espera
 * mientras se mueve el deslizador). Clic en el original = color del fondo.
 */
function prepararControles() {
  deslizadorTolerancia.addEventListener('input', function () {
    textoTolerancia.textContent = deslizadorTolerancia.value;
    clearTimeout(temporizadorFondo);
    temporizadorFondo = setTimeout(procesar, 120);
  });
  casillaSoloExterior.addEventListener('change', procesar);
  casillaSuavizar.addEventListener('change', procesar);
  casillaRecortar.addEventListener('change', procesar);
  lienzoOriginal.addEventListener('click', elegirFondoConClic);
  lienzoResultado.addEventListener('click', retocarConClic);
  botonDeshacer.addEventListener('click', function () {
    retoques.pop();
    procesar();
  });
  botonQuitarRetoques.addEventListener('click', function () {
    retoques = [];
    procesar();
  });

  // Ver el resultado sobre otro fondo (cuadritos, blanco, negro, azul) para revisar los bordes
  for (const opcion of opcionesVistaFondo) {
    opcion.addEventListener('change', function () {
      cajaResultado.dataset.vista = opcion.value; // el CSS pinta el fondo según data-vista
    });
  }
}

/**
 * Clic sobre el resultado:
 *   sobre algo visible      -> se borra esa zona (ej. el blanco dentro de una letra "O")
 *   sobre algo transparente -> se recupera esa zona (algo que se borró de más)
 */
function retocarConClic(evento) {
  if (pixelesOriginales === null) {
    return;
  }
  const rectangulo = lienzoResultado.getBoundingClientRect();
  const xEnResultado = Math.floor((evento.clientX - rectangulo.left) * (lienzoResultado.width / rectangulo.width));
  const yEnResultado = Math.floor((evento.clientY - rectangulo.top) * (lienzoResultado.height / rectangulo.height));
  const alfaAhi = lienzoResultado.getContext('2d').getImageData(xEnResultado, yEnResultado, 1, 1).data[3];

  retoques.push({
    x: xEnResultado + recorte.x, // el resultado puede estar recortado: se pasa a la imagen original
    y: yEnResultado + recorte.y,
    accion: alfaAhi > 127 ? 'borrar' : 'recuperar',
  });
  procesar();
}

/**
 * Distancia entre dos colores, de 0 (iguales) a 100 (lo más distinto posible:
 * negro contra blanco). "a" y "b" son posiciones dentro de los datos (r, g, b, a…).
 */
function distanciaEntre(datosA, a, datosB, b) {
  const rojo = datosA[a] - datosB[b];
  const verde = datosA[a + 1] - datosB[b + 1];
  const azul = datosA[a + 2] - datosB[b + 2];
  return (Math.sqrt(rojo * rojo + verde * verde + azul * azul) / 441.7) * 100; // 441.7 = de negro a blanco
}

/**
 * Quita el fondo y dibuja el resultado. Son 4 pasos:
 *   1. marcarFondo        qué píxeles son fondo (balde de pintura o todos los parecidos)
 *   2. aplicarRetoques    los clics del usuario sobre el resultado (borrar o recuperar zonas)
 *   3. suavizarBordes     el borde del logo queda semitransparente y sin halo
 *   4. recortar y dibujar
 */
function procesar() {
  if (pixelesOriginales === null) {
    return;
  }
  const ancho = pixelesOriginales.width;
  const alto = pixelesOriginales.height;
  const tolerancia = Number(deslizadorTolerancia.value);

  const esFondo = marcarFondo(pixelesOriginales, tolerancia);
  aplicarRetoques(esFondo, pixelesOriginales, tolerancia);

  // Copia de la imagen: el fondo queda transparente (alfa 0)
  const resultado = new ImageData(new Uint8ClampedArray(pixelesOriginales.data), ancho, alto);
  for (let p = 0; p < ancho * alto; p++) {
    if (esFondo[p] === 1) {
      resultado.data[p * 4 + 3] = 0;
    }
  }
  if (casillaSuavizar.checked) {
    suavizarBordes(resultado, pixelesOriginales, esFondo);
  }

  // Recortar el espacio vacío (se deja un margen de 2 píxeles)
  recorte = { x: 0, y: 0, ancho: ancho, alto: alto };
  if (casillaRecortar.checked) {
    recorte = areaVisible(resultado.data, ancho, alto, 2);
  }
  lienzoResultado.width = recorte.ancho;
  lienzoResultado.height = recorte.alto;
  lienzoResultado.getContext('2d').putImageData(resultado, -recorte.x, -recorte.y);
  botonDeshacer.disabled = retoques.length === 0;
}

/**
 * Paso 1. Devuelve esFondo: un 1 por cada píxel que es fondo, un 0 si es logo.
 *
 * "Solo el de afuera" = balde de pintura: empieza en los bordes de la imagen y
 * avanza a los vecinos. Un vecino es fondo si:
 *   - se parece al color del fondo (según la tolerancia), o
 *   - se parece al "fondo de por aquí": un color que va cambiando POCO A POCO
 *     mientras el balde avanza. Así sigue los degradados y sombras suaves,
 *     pero no se mete en el logo (en un borde el color cambia de golpe y el
 *     "fondo de por aquí" no alcanza a cambiar tan rápido).
 */
function marcarFondo(pixeles, tolerancia) {
  const ancho = pixeles.width;
  const alto = pixeles.height;
  const datos = pixeles.data;
  const total = ancho * alto;
  const fondo = new Uint8ClampedArray([colorFondo[0], colorFondo[1], colorFondo[2], 255]);
  const esFondo = new Uint8Array(total);

  function pareceFondo(p) {
    return datos[p * 4 + 3] < 10 || distanciaEntre(datos, p * 4, fondo, 0) <= tolerancia;
  }

  if (!casillaSoloExterior.checked) {
    // Todos los píxeles parecidos al fondo, estén donde estén
    for (let p = 0; p < total; p++) {
      if (pareceFondo(p)) {
        esFondo[p] = 1;
      }
    }
    return esFondo;
  }

  const RAPIDEZ = 0.15;                       // qué tanto se acerca el "fondo de por aquí" a cada píxel nuevo
  const parecidoAlDeAqui = tolerancia * 0.6;
  // Límite: el "fondo de por aquí" no puede alejarse mucho del fondo de verdad.
  // (Sin esto, en un borde difuso el balde iría "trepando" poco a poco hasta el logo.)
  const alejamientoMaximo = tolerancia * 1.5;
  const fondoDeAqui = new Float32Array(total * 4); // r, g, b, (sin usar) de cada píxel ya visto
  const yaVisto = new Uint8Array(total);
  const desdeDonde = new Int32Array(total);   // de qué vecino llegó el balde a cada píxel
  const pendientes = new Int32Array(total);   // pila de píxeles por revisar (cada uno entra una vez)
  let cantidad = 0;

  function agregar(p, desde) {
    if (yaVisto[p] === 0) {
      yaVisto[p] = 1;
      desdeDonde[p] = desde;
      pendientes[cantidad++] = p;
    }
  }
  // Empieza por los bordes de la imagen
  for (let x = 0; x < ancho; x++) {
    agregar(x, -1);
    agregar((alto - 1) * ancho + x, -1);
  }
  for (let y = 0; y < alto; y++) {
    agregar(y * ancho, -1);
    agregar(y * ancho + ancho - 1, -1);
  }

  while (cantidad > 0) {
    const p = pendientes[--cantidad];
    const desde = desdeDonde[p];
    let entra = pareceFondo(p);
    if (!entra && desde !== -1) {
      entra = distanciaEntre(datos, p * 4, fondoDeAqui, desde * 4) <= parecidoAlDeAqui
        && distanciaEntre(datos, p * 4, fondo, 0) <= alejamientoMaximo;
    }
    if (!entra) {
      continue;
    }
    esFondo[p] = 1;

    // El "fondo de por aquí" se acerca un poco al color de este píxel
    for (let canal = 0; canal < 3; canal++) {
      const anterior = desde === -1 ? datos[p * 4 + canal] : fondoDeAqui[desde * 4 + canal];
      fondoDeAqui[p * 4 + canal] = anterior + (datos[p * 4 + canal] - anterior) * RAPIDEZ;
    }

    const x = p % ancho;
    const y = Math.floor(p / ancho);
    // Los 4 vecinos: arriba, abajo, izquierda, derecha
    if (y > 0) { agregar(p - ancho, p); }
    if (y < alto - 1) { agregar(p + ancho, p); }
    if (x > 0) { agregar(p - 1, p); }
    if (x < ancho - 1) { agregar(p + 1, p); }
  }
  return esFondo;
}

/**
 * Paso 2. Cada clic del usuario sobre el resultado es un "retoque":
 *   { x, y, accion: 'borrar' | 'recuperar' }   (x, y en píxeles de la imagen original)
 * Desde ese punto se pinta con balde la zona de colores parecidos:
 *   borrar    -> esa zona del logo pasa a ser fondo (ej. el blanco dentro de una letra)
 *   recuperar -> esa zona de fondo vuelve a ser logo (ej. algo que se borró de más)
 */
function aplicarRetoques(esFondo, pixeles, tolerancia) {
  const ancho = pixeles.width;
  const alto = pixeles.height;
  const datos = pixeles.data;
  const parecido = Math.max(12, tolerancia);

  for (const retoque of retoques) {
    const inicio = retoque.y * ancho + retoque.x;
    const valorQueBusca = retoque.accion === 'borrar' ? 0 : 1; // borrar: recorre lo visible; recuperar: lo transparente
    const valorNuevo = 1 - valorQueBusca;
    const pendientes = [inicio];
    while (pendientes.length > 0) {
      const p = pendientes.pop();
      if (esFondo[p] !== valorQueBusca) {
        continue;
      }
      if (distanciaEntre(datos, p * 4, datos, inicio * 4) > parecido) {
        continue;
      }
      esFondo[p] = valorNuevo;
      const x = p % ancho;
      const y = Math.floor(p / ancho);
      if (y > 0) { pendientes.push(p - ancho); }
      if (y < alto - 1) { pendientes.push(p + ancho); }
      if (x > 0) { pendientes.push(p - 1); }
      if (x < ancho - 1) { pendientes.push(p + 1); }
    }
  }
}

/**
 * Paso 3. Bordes suaves y sin halo.
 * En el borde, un píxel suele ser una MEZCLA del color del logo y del fondo
 * (por eso al quitar un fondo blanco queda una "rayita" clara alrededor).
 * Para cada píxel de la orilla (el borde y 2 píxeles a cada lado):
 *   - fondoCerca = el promedio de los píxeles de fondo de alrededor
 *   - logoCerca  = el píxel del logo de alrededor más distinto al fondo
 *   - visibilidad (alfa) = qué tan lejos está del fondo, comparado con logoCerca
 *     (igual al fondo -> 0 transparente;  igual al logo -> 1 visible)
 *   - y se le quita el fondo a su color:  color = fondo + (color - fondo) / alfa
 */
function suavizarBordes(resultado, pixeles, esFondo) {
  const ancho = pixeles.width;
  const alto = pixeles.height;
  const original = pixeles.data;
  const datos = resultado.data;
  const RADIO = 2; // la orilla y 2 píxeles a cada lado (los bordes difusos son anchos)

  // Qué píxeles revisar: los que están cerca de la orilla entre fondo y logo
  const enLaOrilla = new Uint8Array(ancho * alto);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const p = y * ancho + x;
      const vecinoDistinto =
        (x > 0 && esFondo[p - 1] !== esFondo[p]) || (x < ancho - 1 && esFondo[p + 1] !== esFondo[p]) ||
        (y > 0 && esFondo[p - ancho] !== esFondo[p]) || (y < alto - 1 && esFondo[p + ancho] !== esFondo[p]);
      if (vecinoDistinto) {
        // marca la orilla y lo que está a RADIO píxeles de ella, del lado del logo
        for (let dy = -RADIO; dy <= RADIO; dy++) {
          for (let dx = -RADIO; dx <= RADIO; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < ancho && ny < alto) {
              enLaOrilla[ny * ancho + nx] = 1;
            }
          }
        }
      }
    }
  }

  const fondoCerca = new Float32Array(4);
  for (let p = 0; p < ancho * alto; p++) {
    if (enLaOrilla[p] === 0 || original[p * 4 + 3] < 10) {
      continue;
    }
    const x = p % ancho;
    const y = Math.floor(p / ancho);

    // Promedio del fondo de alrededor (en una ventana de 7 x 7)
    let cantidadFondo = 0;
    fondoCerca[0] = 0; fondoCerca[1] = 0; fondoCerca[2] = 0;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= ancho || ny >= alto) { continue; }
        const q = ny * ancho + nx;
        if (esFondo[q] === 1 && original[q * 4 + 3] > 200) {
          fondoCerca[0] += original[q * 4];
          fondoCerca[1] += original[q * 4 + 1];
          fondoCerca[2] += original[q * 4 + 2];
          cantidadFondo++;
        }
      }
    }
    if (cantidadFondo === 0) {
      continue; // el fondo de aquí ya era transparente: no hay nada que mezclar
    }
    fondoCerca[0] /= cantidadFondo; fondoCerca[1] /= cantidadFondo; fondoCerca[2] /= cantidadFondo;

    // ¿Con qué color del logo está mezclado? Se prueba con cada píxel del logo de
    // alrededor: si este píxel queda "en el camino" entre el fondo y ese color,
    // es una mezcla de los dos. Se queda el color más intenso que cumpla.
    let alfa = 1;
    let mejorLargo = 0;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= ancho || ny >= alto) { continue; }
        const q = ny * ancho + nx;
        if (esFondo[q] === 1 || q === p) { continue; }
        const mezcla = mezclaEntre(fondoCerca, original, q * 4, original, p * 4);
        if (mezcla !== null && mezcla.largo > mejorLargo) {
          mejorLargo = mezcla.largo;
          alfa = mezcla.cuanto;
        }
      }
    }
    if (mejorLargo === 0) {
      continue; // no se parece a ninguna mezcla: se deja como está
    }

    if (esFondo[p] === 1 && alfa < 0.25) {
      continue; // es fondo de verdad: sigue transparente
    }
    if (alfa > 0.9) {
      continue; // es logo de verdad: no se toca
    }
    // Se le quita el fondo a su color
    for (let canal = 0; canal < 3; canal++) {
      const limpio = fondoCerca[canal] + (original[p * 4 + canal] - fondoCerca[canal]) / Math.max(alfa, 0.05);
      datos[p * 4 + canal] = Math.round(limpio); // Uint8ClampedArray lo deja entre 0 y 255
    }
    datos[p * 4 + 3] = Math.round(original[p * 4 + 3] * alfa);
  }
}

/**
 * ¿El color "c" es una mezcla del fondo "f" y del color del logo "l"?
 * Piensa en una línea recta (en colores) que va del fondo al logo:
 *   cuanto = en qué parte de la línea cae c (0 = fondo, 1 = logo)
 *   si c queda lejos de la línea, NO es una mezcla de esos dos -> null
 *   largo  = qué tan distinto es el logo del fondo (más largo = más confiable)
 */
function mezclaEntre(f, datosL, l, datosC, c) {
  const lineaR = datosL[l] - f[0];
  const lineaG = datosL[l + 1] - f[1];
  const lineaB = datosL[l + 2] - f[2];
  const largo2 = lineaR * lineaR + lineaG * lineaG + lineaB * lineaB;
  if (largo2 < 900) {
    return null; // ese "logo" es casi igual al fondo (menos de 30 de diferencia)
  }
  const colorR = datosC[c] - f[0];
  const colorG = datosC[c + 1] - f[1];
  const colorB = datosC[c + 2] - f[2];
  let cuanto = (colorR * lineaR + colorG * lineaG + colorB * lineaB) / largo2;
  cuanto = Math.min(1, Math.max(0, cuanto));
  // Qué tan lejos de la línea queda el color
  const fueraR = colorR - cuanto * lineaR;
  const fueraG = colorG - cuanto * lineaG;
  const fueraB = colorB - cuanto * lineaB;
  if (Math.sqrt(fueraR * fueraR + fueraG * fueraG + fueraB * fueraB) > 24) {
    return null;
  }
  return { cuanto: cuanto, largo: Math.sqrt(largo2) };
}

/** El rectángulo donde hay algo visible (alfa > 8), con un margen. */
function areaVisible(datos, ancho, alto, margen) {
  let izquierda = ancho;
  let arriba = alto;
  let derecha = -1;
  let abajo = -1;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (datos[(y * ancho + x) * 4 + 3] > 8) {
        if (x < izquierda) { izquierda = x; }
        if (x > derecha) { derecha = x; }
        if (y < arriba) { arriba = y; }
        if (y > abajo) { abajo = y; }
      }
    }
  }
  if (derecha === -1) {
    return { x: 0, y: 0, ancho: ancho, alto: alto }; // todo quedó transparente: no se recorta
  }
  izquierda = Math.max(0, izquierda - margen);
  arriba = Math.max(0, arriba - margen);
  derecha = Math.min(ancho - 1, derecha + margen);
  abajo = Math.min(alto - 1, abajo + margen);
  return { x: izquierda, y: arriba, ancho: derecha - izquierda + 1, alto: abajo - arriba + 1 };
}


// =============================================================
//  4. DESCARGAR O USAR COMO LOGO
// =============================================================

/** El resultado como archivo PNG (Blob). */
function resultadoComoPNG() {
  return new Promise(function (resolver) {
    lienzoResultado.toBlob(resolver, 'image/png');
  });
}

/** "Descargar PNG" y "Usar como logo en los diplomas". */
function prepararBotonesFinales() {
  botonDescargarPNG.addEventListener('click', descargarPNG);
  botonUsarLogo.addEventListener('click', usarResultadoComoLogo);
}

/** Descarga el resultado como "<nombre>-sin-fondo.png". */
async function descargarPNG() {
  const png = await resultadoComoPNG();
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(png);
  enlace.download = `${nombreImagen}-sin-fondo.png`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

/** Deja el resultado como el logo de "Personalizar diseño" (como "Subir logo"). */
async function usarResultadoComoLogo() {
  const png = await resultadoComoPNG();
  const archivo = new File([png], `${nombreImagen}-sin-fondo.png`, { type: 'image/png' });

  if (usarComoLogo(archivo)) {
    mostrarMensaje(mensajeFondo, 'Listo: se usará como logo. Pulsa "Inicio" (o el nombre de arriba) y elige un diploma.', 'ok');
  } else {
    mostrarMensaje(mensajeFondo, 'El logo sin fondo pesa más de 2 MB: usa una imagen más pequeña', 'error');
  }
}
