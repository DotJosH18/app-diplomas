// =============================================================
//  qr.js — HERRAMIENTA "GENERAR CÓDIGO QR"
//
//  Todo pasa en el navegador: el link y el logo NO se envían al servidor.
//
//  Cómo funciona:
//    1. La librería qrcode-generator calcula los cuadritos del QR
//       (cuáles van oscuros y cuáles claros).
//    2. Con esos cuadritos armamos un dibujo SVG (texto): los cuadritos,
//       las 3 esquinas redondeadas y el logo en el centro.
//    3. Ese mismo SVG se muestra como vista previa, se descarga como .svg
//       y se "pinta" en un <canvas> para descargarlo como .png.
//
//  El QR usa corrección de errores ALTA ('H'): aunque el logo tape el
//  centro, el celular igual lo puede leer (aguanta que falte ~30%).
//  Por eso el logo puede ocupar como máximo el 26% del ancho.
//
//  IMPORTA          DE                                  PARA
//  qrcode           /librerias/qrcode/qrcode.mjs        calcular los cuadritos del QR
//  stringToBytes    /librerias/qrcode/qrcode_UTF8.mjs   que funcionen tildes y ñ
//  mostrarMensaje   utilidades.js                       avisos
//
//  EXPORTA          LO IMPORTA  PARA
//  iniciarQR()      main.js     arrancar esta parte
// =============================================================
import qrcode from '/librerias/qrcode/qrcode.mjs';
import { stringToBytes } from '/librerias/qrcode/qrcode_UTF8.mjs';
import { mostrar, ocultar, mostrarMensaje } from './utilidades.js';

qrcode.stringToBytes = stringToBytes; // el texto se guarda en UTF-8 (tildes, ñ, emojis)

// ---------- Elementos de la página ----------
const campoLink = document.getElementById('qr-link');
const dibujo = document.getElementById('qr-dibujo');
const textoEstado = document.getElementById('qr-estado');
const opcionesLogo = document.querySelectorAll('input[name="qr-logo"]');
const inputArchivoLogo = document.getElementById('qr-archivo-logo');
const textoNombreLogo = document.getElementById('qr-nombre-logo');
const filaLogoPropio = document.getElementById('qr-logo-propio');
const botonCambiarLogo = document.getElementById('qr-cambiar-logo');
const cajaOpcionesLogo = document.getElementById('qr-opciones-logo');
const deslizadorTamano = document.getElementById('qr-tamano-logo');
const textoTamano = document.getElementById('qr-valor-tamano');
const casillaFondoLogo = document.getElementById('qr-fondo-logo');
const botonesColor = document.querySelectorAll('#qr-colores .color[data-color]');
const colorLibre = document.getElementById('qr-color-libre');
const etiquetaColorLibre = colorLibre.closest('.color');
const avisoColor = document.getElementById('qr-aviso-color');
const selectorTamanoPNG = document.getElementById('qr-tamano-png');
const botonPNG = document.getElementById('qr-descargar-png');
const botonSVG = document.getElementById('qr-descargar-svg');
const mensajeQR = document.getElementById('mensaje-qr');

const LOGO_UNICAH = 'img/logo-unicah.png';
const MARGEN = 4; // cuadritos libres alrededor del QR (lo pide el estándar para que se lea bien)

// Lo que eligió el usuario
let colorQR = '#141B5B';
let logoPropio = null;     // el logo subido, como "data URL" (la imagen escrita como texto)
let logoUnicah = null;     // el de UNICAH, también como data URL (se carga una vez)
let svgActual = '';        // el último QR dibujado (para descargarlo)
let temporizador = null;


// =============================================================
//  ARRANQUE
// =============================================================

/** Conecta los controles de la herramienta (se llama una vez, desde main.js). */
export function iniciarQR() {
  pintarCirculosDeColor();

  campoLink.addEventListener('input', programarDibujo);
  deslizadorTamano.addEventListener('input', function () {
    textoTamano.textContent = `${deslizadorTamano.value}%`;
    programarDibujo();
  });
  casillaFondoLogo.addEventListener('change', programarDibujo);

  for (const opcion of opcionesLogo) {
    opcion.addEventListener('change', alCambiarLogo);
  }
  botonCambiarLogo.addEventListener('click', function () { inputArchivoLogo.click(); });
  inputArchivoLogo.addEventListener('change', leerLogoSubido);

  for (const boton of botonesColor) {
    boton.addEventListener('click', function () {
      elegirColor(boton.dataset.color, boton);
    });
  }
  colorLibre.addEventListener('input', function () {
    elegirColor(colorLibre.value, etiquetaColorLibre);
  });

  botonPNG.addEventListener('click', descargarPNG);
  botonSVG.addEventListener('click', descargarSVG);

  cargarLogoUnicah();
}

/** Cada círculo de color toma su color de data-color (variable CSS --fondo-color). */
function pintarCirculosDeColor() {
  for (const boton of botonesColor) {
    boton.style.setProperty('--fondo-color', boton.dataset.color);
  }
}

/** Espera un poquito después de escribir, para no redibujar con cada tecla. */
function programarDibujo() {
  clearTimeout(temporizador);
  temporizador = setTimeout(dibujarQR, 120);
}


// =============================================================
//  OPCIONES: LOGO Y COLOR
// =============================================================

/** UNICAH / Otro logo / Sin logo. */
function alCambiarLogo() {
  const elegido = logoElegido();
  if (elegido === 'propio' && logoPropio === null) {
    inputArchivoLogo.click(); // todavía no hay logo propio: que lo busque
  }
  if (elegido === 'propio' && logoPropio !== null) {
    mostrar(filaLogoPropio);
  } else {
    ocultar(filaLogoPropio);
  }
  if (elegido === 'ninguno') {
    ocultar(cajaOpcionesLogo); // sin logo no hacen falta tamaño ni fondo
  } else {
    mostrar(cajaOpcionesLogo);
  }
  dibujarQR();
}

/** 'unicah', 'propio' o 'ninguno'. */
function logoElegido() {
  return document.querySelector('input[name="qr-logo"]:checked').value;
}

/** Lee el logo que subió el usuario y lo guarda como data URL. */
function leerLogoSubido() {
  const archivo = inputArchivoLogo.files[0];
  inputArchivoLogo.value = ''; // permite elegir el mismo archivo otra vez
  if (!archivo) {
    if (logoPropio === null) {
      volverALogoUnicah(); // canceló sin elegir nada
    }
    return;
  }
  if (!archivo.type.startsWith('image/')) {
    mostrarMensaje(mensajeQR, 'El logo debe ser una imagen (PNG, JPG o WEBP)', 'error');
    return;
  }
  const lector = new FileReader();
  lector.addEventListener('load', function () {
    logoPropio = lector.result;
    textoNombreLogo.textContent = archivo.name;
    mostrar(filaLogoPropio);
    mostrarMensaje(mensajeQR, '', 'normal');
    dibujarQR();
  });
  lector.readAsDataURL(archivo);
}

function volverALogoUnicah() {
  document.querySelector('input[name="qr-logo"][value="unicah"]').checked = true;
  ocultar(filaLogoPropio);
  mostrar(cajaOpcionesLogo);
  dibujarQR();
}

/**
 * Carga el logo de UNICAH como data URL. Así queda DENTRO del SVG
 * (si el SVG solo dijera "img/logo-unicah.png", al descargarlo o
 * convertirlo en PNG el logo no aparecería).
 */
async function cargarLogoUnicah() {
  try {
    const respuesta = await fetch(LOGO_UNICAH);
    const imagen = await respuesta.blob();
    logoUnicah = await comoDataURL(imagen);
  } catch (error) {
    logoUnicah = null; // sin logo, pero el QR igual funciona
  }
  dibujarQR();
}

function comoDataURL(archivo) {
  return new Promise(function (resolver, fallar) {
    const lector = new FileReader();
    lector.addEventListener('load', function () { resolver(lector.result); });
    lector.addEventListener('error', fallar);
    lector.readAsDataURL(archivo);
  });
}

/** Marca el color elegido y avisa si es tan claro que el QR no se leería. */
function elegirColor(color, botonElegido) {
  colorQR = color;
  for (const boton of document.querySelectorAll('#qr-colores .color')) {
    boton.classList.toggle('activo', boton === botonElegido);
  }
  etiquetaColorLibre.style.setProperty('--color-elegido', color);
  if (esMuyClaro(color)) {
    mostrar(avisoColor);
  } else {
    ocultar(avisoColor);
  }
  dibujarQR();
}

/** true si el color es claro (los lectores de QR necesitan contraste con el blanco). */
function esMuyClaro(colorHex) {
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);
  const brillo = (r * 299 + g * 587 + b * 114) / 1000; // 0 = negro, 255 = blanco
  return brillo > 150;
}


// =============================================================
//  DIBUJAR EL QR
// =============================================================

/** Lee lo elegido, arma el SVG y lo muestra. */
function dibujarQR() {
  const texto = campoLink.value.trim();
  if (texto === '') {
    svgActual = '';
    dibujo.replaceChildren();
    textoEstado.textContent = 'Escribe un link para ver tu QR';
    activarDescargas(false);
    return;
  }

  let logo = null;
  if (logoElegido() === 'unicah') {
    logo = logoUnicah;
  } else if (logoElegido() === 'propio') {
    logo = logoPropio;
  }

  try {
    svgActual = armarSVG(texto, {
      color: colorQR,
      logo: logo,
      tamanoLogo: Number(deslizadorTamano.value) / 100,
      fondoLogo: casillaFondoLogo.checked,
    });
  } catch (error) {
    // La librería falla si el texto es demasiado largo para un QR
    svgActual = '';
    dibujo.replaceChildren();
    textoEstado.textContent = 'El link es demasiado largo para un QR. Usa uno más corto.';
    activarDescargas(false);
    return;
  }

  // Se muestra como imagen (el SVG lo armamos nosotros, no viene de afuera)
  const vista = new Image();
  vista.alt = 'Vista previa del código QR';
  vista.src = svgComoDataURL(svgActual);
  dibujo.replaceChildren(vista);
  textoEstado.textContent = `QR para: ${acortar(texto, 60)}`;
  activarDescargas(true);
  mostrarMensaje(mensajeQR, '', 'normal');
}

function activarDescargas(activas) {
  botonPNG.disabled = !activas;
  botonSVG.disabled = !activas;
}

function acortar(texto, maximo) {
  if (texto.length <= maximo) {
    return texto;
  }
  return texto.slice(0, maximo - 1) + '…';
}

/**
 * Arma el código QR como texto SVG.
 * Medidas en "cuadritos": cada cuadrito del QR mide 1 x 1.
 *
 * @param {string} texto     lo que guarda el QR (el link)
 * @param {object} opciones  { color, logo (data URL o null), tamanoLogo (0.12 a 0.26), fondoLogo }
 */
function armarSVG(texto, opciones) {
  const qr = qrcode(0, 'H');   // 0 = el tamaño lo elige la librería; 'H' = corrección alta
  qr.addData(texto, 'Byte');
  qr.make();

  const n = qr.getModuleCount();           // cuadritos por lado (ej. 33)
  const total = n + MARGEN * 2;            // con el margen blanco

  // Zona del logo, en cuadritos (impar, para que quede justo al centro)
  let ladoLogo = 0;
  if (opciones.logo) {
    ladoLogo = Math.round(n * opciones.tamanoLogo);
    if (ladoLogo % 2 === 0) {
      ladoLogo = ladoLogo + 1;
    }
  }
  const inicioLogo = (n - ladoLogo) / 2;   // dónde empieza (en cuadritos)

  // 1. Los cuadritos (sin las 3 esquinas, que se dibujan redondeadas, ni la zona del logo)
  let cuadritos = '';
  for (let fila = 0; fila < n; fila++) {
    for (let columna = 0; columna < n; columna++) {
      if (!qr.isDark(fila, columna)) {
        continue;
      }
      if (esEsquina(fila, columna, n)) {
        continue;
      }
      if (opciones.logo && dentroDelLogo(fila, columna, inicioLogo, ladoLogo)) {
        continue;
      }
      cuadritos += `M${columna + MARGEN} ${fila + MARGEN}h1v1h-1z`; // un cuadrito de 1 x 1
    }
  }

  // 2. Las 3 esquinas (los "ojos" del QR), con bordes redondeados
  let esquinas = '';
  for (const [fila, columna] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    esquinas += dibujarEsquina(columna + MARGEN, fila + MARGEN);
  }

  // 3. El logo en el centro
  let logo = '';
  if (opciones.logo) {
    const x = inicioLogo + MARGEN;
    const espacio = 0.6; // separación entre el logo y los cuadritos
    if (opciones.fondoLogo) {
      logo += `<rect x="${x}" y="${x}" width="${ladoLogo}" height="${ladoLogo}" rx="${ladoLogo * 0.18}" fill="#ffffff"/>`;
    }
    logo += `<image href="${opciones.logo}" x="${x + espacio}" y="${x + espacio}" `
      + `width="${ladoLogo - espacio * 2}" height="${ladoLogo - espacio * 2}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`
    + `<rect width="${total}" height="${total}" fill="#ffffff"/>`
    + `<path d="${cuadritos}" fill="${opciones.color}"/>`
    + `<g fill="${opciones.color}" shape-rendering="geometricPrecision">${esquinas}</g>`
    + logo
    + '</svg>';
}

/** true si el cuadrito es parte de una de las 3 esquinas grandes (7 x 7). */
function esEsquina(fila, columna, n) {
  const arriba = fila < 7;
  const abajo = fila >= n - 7;
  const izquierda = columna < 7;
  const derecha = columna >= n - 7;
  return (arriba && izquierda) || (arriba && derecha) || (abajo && izquierda);
}

/** true si el cuadrito queda debajo del logo. */
function dentroDelLogo(fila, columna, inicio, lado) {
  return fila >= inicio && fila < inicio + lado && columna >= inicio && columna < inicio + lado;
}

/**
 * Una esquina del QR: un marco de 7 x 7 y un cuadrado de 3 x 3 en medio,
 * los dos con las puntas redondeadas.
 * (El marco se hace con un cuadrado de 7 al que se le "recorta" uno de 5:
 *  fill-rule="evenodd" deja hueco donde se enciman.)
 */
function dibujarEsquina(x, y) {
  return `<path fill-rule="evenodd" d="${rectanguloRedondeado(x, y, 7, 1.6)}${rectanguloRedondeado(x + 1, y + 1, 5, 1)}"/>`
    + `<path d="${rectanguloRedondeado(x + 2, y + 2, 3, 0.8)}"/>`;
}

/** Un cuadrado con las puntas redondeadas, como instrucciones de SVG (path). */
function rectanguloRedondeado(x, y, lado, radio) {
  const r = radio;
  const l = lado;
  return `M${x + r} ${y}h${l - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${l - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}`
    + `h-${l - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${l - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;
}

function svgComoDataURL(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}


// =============================================================
//  DESCARGAR
// =============================================================

/** El SVG tal cual: se puede agrandar sin que se vea borroso (ideal para imprimir). */
function descargarSVG() {
  if (svgActual === '') {
    return;
  }
  bajar(new Blob([svgActual], { type: 'image/svg+xml' }), 'codigo-qr.svg');
}

/** Pinta el SVG en un <canvas> del tamaño elegido y lo guarda como PNG. */
function descargarPNG() {
  if (svgActual === '') {
    return;
  }
  const lado = Number(selectorTamanoPNG.value);
  const imagen = new Image();
  imagen.addEventListener('load', function () {
    const lienzo = document.createElement('canvas');
    lienzo.width = lado;
    lienzo.height = lado;
    const pincel = lienzo.getContext('2d');
    pincel.imageSmoothingEnabled = false; // cuadritos con bordes nítidos
    pincel.drawImage(imagen, 0, 0, lado, lado);
    lienzo.toBlob(function (png) {
      bajar(png, `codigo-qr-${lado}px.png`);
      mostrarMensaje(mensajeQR, 'Listo. Revísalo con la cámara de tu celular antes de imprimirlo.', 'ok');
    }, 'image/png');
  });
  imagen.addEventListener('error', function () {
    mostrarMensaje(mensajeQR, 'No se pudo crear la imagen. Prueba con otro logo.', 'error');
  });
  imagen.src = svgComoDataURL(svgActual);
}

function bajar(archivo, nombre) {
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = nombre;
  enlace.click();
  setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1000);
}
