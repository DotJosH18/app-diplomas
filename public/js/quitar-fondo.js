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
//         a los vecinos parecidos (como el balde de pintura de Paint).
//         Así los blancos DENTRO del logo no se borran.
//       - si no: se borran todos los parecidos, estén donde estén.
//    4. A los píxeles de fondo se les pone alfa 0 (transparentes).
//    5. Se recorta el espacio vacío y se dibuja el resultado.
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
const botonUsarLogo = document.getElementById('boton-usar-logo');
const botonDescargarPNG = document.getElementById('boton-descargar-png');
const mensajeFondo = document.getElementById('mensaje-fondo');

// ---------- Estado ----------
const LADO_MAXIMO = 1600;       // imágenes más grandes se achican (más rápido y pesa menos)
let pixelesOriginales = null;   // los píxeles de la imagen original (ImageData)
let colorFondo = [255, 255, 255]; // [rojo, verde, azul]
let nombreImagen = 'logo';      // para el nombre del PNG que se descarga
let temporizadorFondo = null;


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
    temporizadorFondo = setTimeout(procesar, 60);
  });
  casillaSoloExterior.addEventListener('change', procesar);
  casillaSuavizar.addEventListener('change', procesar);
  casillaRecortar.addEventListener('change', procesar);
  lienzoOriginal.addEventListener('click', elegirFondoConClic);
}

/**
 * Distancia entre el color de un píxel y el del fondo, de 0 (igual) a 100
 * (lo más distinto posible: negro contra blanco).
 */
function distanciaAlFondo(datos, i) {
  const rojo = datos[i] - colorFondo[0];
  const verde = datos[i + 1] - colorFondo[1];
  const azul = datos[i + 2] - colorFondo[2];
  return (Math.sqrt(rojo * rojo + verde * verde + azul * azul) / 441.7) * 100; // 441.7 = distancia de negro a blanco
}

function procesar() {
  if (pixelesOriginales === null) {
    return;
  }
  const ancho = pixelesOriginales.width;
  const alto = pixelesOriginales.height;
  const origen = pixelesOriginales.data;
  const tolerancia = Number(deslizadorTolerancia.value);
  const total = ancho * alto;

  // Distancia de cada píxel al color del fondo (se calcula una vez)
  const distancias = new Float32Array(total);
  for (let p = 0; p < total; p++) {
    distancias[p] = distanciaAlFondo(origen, p * 4);
  }

  // ¿Este píxel se parece al fondo? (o ya era transparente)
  function pareceFondo(p) {
    return origen[p * 4 + 3] < 10 || distancias[p] <= tolerancia;
  }

  // esFondo[p] = 1 si el píxel p es fondo
  const esFondo = new Uint8Array(total);

  if (casillaSoloExterior.checked) {
    // "Balde de pintura": empieza en los bordes y avanza a los vecinos parecidos
    const pendientes = new Int32Array(total); // lista de píxeles por revisar
    let cantidad = 0;
    for (let x = 0; x < ancho; x++) {
      pendientes[cantidad++] = x;                        // borde de arriba
      pendientes[cantidad++] = (alto - 1) * ancho + x;   // borde de abajo
    }
    for (let y = 0; y < alto; y++) {
      pendientes[cantidad++] = y * ancho;                // borde izquierdo
      pendientes[cantidad++] = y * ancho + ancho - 1;    // borde derecho
    }

    while (cantidad > 0) {
      cantidad--;
      const p = pendientes[cantidad];
      if (esFondo[p] === 1 || !pareceFondo(p)) {
        continue;
      }
      esFondo[p] = 1;
      const x = p % ancho;
      const y = Math.floor(p / ancho);
      // Los 4 vecinos: arriba, abajo, izquierda, derecha
      if (y > 0) { pendientes[cantidad++] = p - ancho; }
      if (y < alto - 1) { pendientes[cantidad++] = p + ancho; }
      if (x > 0) { pendientes[cantidad++] = p - 1; }
      if (x < ancho - 1) { pendientes[cantidad++] = p + 1; }
    }
  } else {
    // Todos los píxeles parecidos al fondo, estén donde estén
    for (let p = 0; p < total; p++) {
      if (pareceFondo(p)) {
        esFondo[p] = 1;
      }
    }
  }

  // Resultado: copia de la imagen con el fondo transparente
  const resultado = new ImageData(new Uint8ClampedArray(origen), ancho, alto);
  const datos = resultado.data;
  for (let p = 0; p < total; p++) {
    if (esFondo[p] === 1) {
      datos[p * 4 + 3] = 0;
    }
  }

  // Bordes suaves: los píxeles del logo que tocan el fondo y se le parecen un poco
  // quedan semitransparentes (así no se ve el "serrucho" ni un halo del color del fondo)
  if (casillaSuavizar.checked) {
    const margen = 18; // qué tan lejos de la tolerancia todavía se suaviza
    for (let p = 0; p < total; p++) {
      if (esFondo[p] === 1) {
        continue;
      }
      const x = p % ancho;
      const y = Math.floor(p / ancho);
      const tocaFondo =
        (x > 0 && esFondo[p - 1] === 1) || (x < ancho - 1 && esFondo[p + 1] === 1) ||
        (y > 0 && esFondo[p - ancho] === 1) || (y < alto - 1 && esFondo[p + ancho] === 1);
      if (tocaFondo) {
        const cuanto = Math.min(1, Math.max(0, (distancias[p] - tolerancia) / margen)); // 0 = casi fondo, 1 = logo
        datos[p * 4 + 3] = Math.round(datos[p * 4 + 3] * cuanto);
      }
    }
  }

  // Recortar el espacio vacío (se deja un margen de 2 píxeles)
  let recorte = { x: 0, y: 0, ancho: ancho, alto: alto };
  if (casillaRecortar.checked) {
    recorte = areaVisible(datos, ancho, alto, 2);
  }

  // Dibuja el resultado
  lienzoResultado.width = recorte.ancho;
  lienzoResultado.height = recorte.alto;
  lienzoResultado.getContext('2d').putImageData(resultado, -recorte.x, -recorte.y);
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
