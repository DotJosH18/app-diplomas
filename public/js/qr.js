// =============================================================
//  qr.js — HERRAMIENTA "GENERAR CÓDIGO QR" (los controles)
//
//  Todo pasa en el navegador: el contenido y el logo NO se envían al servidor.
//
//  Cómo está organizado:
//    1. CONTENIDO: qué guarda el QR (link, WhatsApp, correo, Wi-Fi o texto).
//    2. DISEÑO: un objeto "diseno" con todo lo que se puede cambiar.
//       Cada control de la página con data-ajuste="nombre" cambia
//       diseno.nombre (ej. data-ajuste="colorPuntos"). Así no hace falta
//       una función por cada control.
//    3. DIBUJO: qr-dibujo.js arma el SVG; aquí se muestra y se revisa
//       si se podrá leer bien (contraste, logo…).
//    4. DESCARGAR y COPIAR: PNG (del mismo SVG, pintado en un <canvas>) o SVG.
//
//  IMPORTA                              DE             PARA
//  armarSVG, DISENO_INICIAL, PLANTILLAS  qr-dibujo.js   dibujar el QR y los diseños listos
//  svgDeEsquina, svgDePuntos            qr-dibujo.js   los dibujitos de cada opción de forma
//  mostrar, ocultar, mostrarMensaje     utilidades.js  mostrar partes y avisos
//
//  EXPORTA          LO IMPORTA  PARA
//  iniciarQR()      main.js     arrancar esta parte
// =============================================================
import { armarSVG, svgDeEsquina, svgDePuntos, DISENO_INICIAL, PLANTILLAS } from './qr-dibujo.js';
import { mostrar, ocultar, mostrarMensaje } from './utilidades.js';

// ---------- Elementos de la página ----------
const seccion = document.getElementById('herramienta-qr');
const dibujo = document.getElementById('qr-dibujo');
const textoEstado = document.getElementById('qr-estado');
const avisoLectura = document.getElementById('qr-lectura');
const textoLectura = document.getElementById('qr-lectura-texto');
const pestanas = seccion.querySelectorAll('.pestana-qr');
const paneles = seccion.querySelectorAll('.panel-qr');
const opcionesTipo = seccion.querySelectorAll('input[name="qr-tipo"]');
const camposPorTipo = seccion.querySelectorAll('[data-tipo-qr]');
const controles = seccion.querySelectorAll('[data-ajuste]');
const contenedorPlantillas = document.getElementById('qr-plantillas');
const opcionesLogo = seccion.querySelectorAll('input[name="qr-logo"]');
const inputArchivoLogo = document.getElementById('qr-archivo-logo');
const filaLogoPropio = document.getElementById('qr-logo-propio');
const textoNombreLogo = document.getElementById('qr-nombre-logo');
const botonCambiarLogo = document.getElementById('qr-cambiar-logo');
const cajaOpcionesLogo = document.getElementById('qr-opciones-logo');
const filaDegradado = document.getElementById('qr-fila-degradado');
const cajaOpcionesMarco = document.getElementById('qr-opciones-marco');
const opcionesFormato = seccion.querySelectorAll('input[name="qr-formato"]');
const selectorTamanoPNG = document.getElementById('qr-tamano-png');
const textoAyudaFormato = document.getElementById('qr-ayuda-formato');
const botonDescargar = document.getElementById('qr-descargar');
const botonCopiar = document.getElementById('qr-copiar');
const botonRestablecer = document.getElementById('qr-restablecer');
const mensajeQR = document.getElementById('mensaje-qr');
const dibujosDeFormas = seccion.querySelectorAll('.forma-qr__dibujo');

const LOGO_UNICAH = 'img/logo-qr.png'; // el logo de UNICAH que va al centro del QR (sin fondo)

// El diseño actual (empieza como DISENO_INICIAL; los controles lo cambian)
let diseno = { ...DISENO_INICIAL };
let logoUnicah = null;     // el logo de UNICAH como data URL (la imagen escrita como texto)
let logoPropio = null;     // el logo subido, como data URL
let svgActual = '';        // el último QR dibujado (para descargarlo)
let temporizador = null;


// =============================================================
//  ARRANQUE
// =============================================================

/** Conecta toda la herramienta (se llama una vez, desde main.js). */
export function iniciarQR() {
  prepararPestanas();
  prepararContenido();
  prepararControlesDeDiseno();
  prepararLogo();
  prepararDescargas();
  sincronizarControles();
  cargarLogoUnicah(); // al terminar, dibuja el QR
}

/** Espera un poquito después de escribir, para no redibujar con cada tecla. */
function programarDibujo() {
  clearTimeout(temporizador);
  temporizador = setTimeout(dibujarQR, 120);
}

/** Pestañas Contenido / Diseño / Logo / Marco. */
function prepararPestanas() {
  for (const pestana of pestanas) {
    pestana.addEventListener('click', function () {
      for (const otra of pestanas) {
        otra.classList.toggle('activa', otra === pestana);
        otra.setAttribute('aria-selected', otra === pestana ? 'true' : 'false');
      }
      for (const panel of paneles) {
        panel.classList.toggle('activo', panel.dataset.panelQr === pestana.dataset.panelQr);
      }
    });
  }
}


// =============================================================
//  1. CONTENIDO: QUÉ GUARDA EL QR
// =============================================================

function prepararContenido() {
  for (const opcion of opcionesTipo) {
    opcion.addEventListener('change', function () {
      // Solo se ven los campos del tipo elegido
      for (const campos of camposPorTipo) {
        if (campos.dataset.tipoQr === opcion.value) {
          mostrar(campos);
        } else {
          ocultar(campos);
        }
      }
      dibujarQR();
    });
  }
  // Cualquier campo de contenido redibuja el QR al escribir
  for (const campo of seccion.querySelectorAll('[data-tipo-qr] input, [data-tipo-qr] textarea, [data-tipo-qr] select')) {
    campo.addEventListener('input', programarDibujo);
  }
}

function tipoElegido() {
  return seccion.querySelector('input[name="qr-tipo"]:checked').value;
}

function valor(id) {
  return document.getElementById(id).value.trim();
}

/**
 * Lo que va a guardar el QR, según el tipo elegido.
 * Devuelve '' si todavía falta lo principal (ej. el link).
 */
function textoDelQR() {
  const tipo = tipoElegido();

  if (tipo === 'link') {
    const link = valor('qr-link');
    // "unicah.edu" -> "https://unicah.edu" (si parece una página y no trae http)
    const pareceDominio = /^[^\s/]+\.[^\s]+$/.test(link);
    if (pareceDominio && !/^[a-z]+:/i.test(link)) {
      return `https://${link}`;
    }
    return link;
  }

  if (tipo === 'whatsapp') {
    const numero = valor('qr-wa-numero').replace(/\D/g, ''); // solo los dígitos
    if (numero === '') {
      return '';
    }
    const mensaje = valor('qr-wa-mensaje');
    if (mensaje === '') {
      return `https://wa.me/${numero}`;
    }
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  }

  if (tipo === 'correo') {
    const correo = valor('qr-correo');
    if (correo === '') {
      return '';
    }
    const partes = [];
    if (valor('qr-correo-asunto') !== '') {
      partes.push(`subject=${encodeURIComponent(valor('qr-correo-asunto'))}`);
    }
    if (valor('qr-correo-mensaje') !== '') {
      partes.push(`body=${encodeURIComponent(valor('qr-correo-mensaje'))}`);
    }
    if (partes.length === 0) {
      return `mailto:${correo}`;
    }
    return `mailto:${correo}?${partes.join('&')}`;
  }

  if (tipo === 'wifi') {
    const red = valor('qr-wifi-red');
    if (red === '') {
      return '';
    }
    const seguridad = document.getElementById('qr-wifi-seguridad').value;
    // Formato que entienden los celulares: WIFI:T:WPA;S:red;P:clave;;
    // (los caracteres \ ; , : " se escriben con una \ antes)
    const escapar = function (texto) { return texto.replace(/([\\;,:"])/g, '\\$1'); };
    if (seguridad === 'nopass') {
      return `WIFI:T:nopass;S:${escapar(red)};;`;
    }
    return `WIFI:T:${seguridad};S:${escapar(red)};P:${escapar(valor('qr-wifi-clave'))};;`;
  }

  return valor('qr-texto');
}

/** Qué decir debajo del QR si todavía falta algo. */
function queFalta() {
  const mensajes = {
    link: 'Escribe un link para ver tu QR',
    whatsapp: 'Escribe el número de WhatsApp',
    correo: 'Escribe el correo',
    wifi: 'Escribe el nombre de la red Wi-Fi',
    texto: 'Escribe el texto',
  };
  return mensajes[tipoElegido()];
}


// =============================================================
//  2. DISEÑO
// =============================================================

/**
 * Todos los controles con data-ajuste="nombre" cambian diseno.nombre:
 *   casillas -> true / false, deslizadores -> número, lo demás -> su valor.
 */
function prepararControlesDeDiseno() {
  for (const control of controles) {
    control.addEventListener('input', function () {
      if (control.type === 'radio' && !control.checked) {
        return;
      }
      diseno[control.dataset.ajuste] = leerControl(control);
      // El color de las esquinas sigue al de los puntos, salvo que lo cambien aparte
      if (control.dataset.ajuste === 'colorPuntos' && !esquinasConColorPropio) {
        diseno.colorEsquinas = diseno.colorPuntos;
      }
      if (control.dataset.ajuste === 'colorEsquinas') {
        esquinasConColorPropio = true;
      }
      sincronizarControles();
      programarDibujo();
    });
  }

  dibujarPlantillas();
  prepararPruebaAlPasarElMouse();

  botonRestablecer.addEventListener('click', function () {
    const logo = diseno.logo;
    diseno = { ...DISENO_INICIAL, logo: logo };
    esquinasConColorPropio = false;
    sincronizarControles();
    dibujarQR();
  });
}

let esquinasConColorPropio = false;

function leerControl(control) {
  if (control.type === 'checkbox') {
    return control.checked;
  }
  if (control.type === 'range') {
    return Number(control.value);
  }
  if (control.type === 'color') {
    return control.value.toUpperCase();
  }
  return control.value;
}

/**
 * Pone cada control como dice "diseno" (al empezar, al elegir una
 * plantilla o al restablecer), y muestra u oculta las opciones que dependen de otras.
 */
function sincronizarControles() {
  // Un centro cuadrado dentro de un marco redondo casi toca el marco y algunos
  // celulares no lo leen: con el marco "Círculo", el centro cuadrado no se ofrece.
  const centroCuadrado = seccion.querySelector('input[name="qr-esquina-centro"][value="cuadrado"]');
  const marcoRedondo = diseno.esquinaMarco === 'circulo';
  if (marcoRedondo && diseno.esquinaCentro === 'cuadrado') {
    diseno.esquinaCentro = 'redondeado';
  }
  centroCuadrado.disabled = marcoRedondo;
  centroCuadrado.closest('label').classList.toggle('apagado', marcoRedondo);
  centroCuadrado.closest('label').title = marcoRedondo ? 'Con el marco círculo, el centro cuadrado no se leería bien' : '';

  for (const control of controles) {
    const valorActual = diseno[control.dataset.ajuste];
    if (control.type === 'radio') {
      control.checked = control.value === valorActual;
    } else if (control.type === 'checkbox') {
      control.checked = valorActual;
    } else if (document.activeElement !== control) {
      control.value = valorActual;
    }
    // El círculo de color muestra el color (variable CSS --color-elegido)
    if (control.type === 'color') {
      control.closest('.muestra-color-qr').style.setProperty('--color-elegido', valorActual);
    }
  }
  // Los textos que acompañan: "#141B5B", "22 %"…
  for (const texto of seccion.querySelectorAll('[data-codigo]')) {
    const valorActual = diseno[texto.dataset.codigo];
    texto.textContent = typeof valorActual === 'number' ? `${valorActual}%` : valorActual;
  }
  filaDegradado.classList.toggle('apagado', !diseno.degradado);
  cajaOpcionesMarco.classList.toggle('apagado', diseno.marco === 'ninguno');
  marcarPlantillaElegida();
  dibujarFormas();
}

/**
 * Los dibujitos de cada opción de forma, con el color y el diseño actuales:
 *   puntos  -> un pedacito de QR con ese estilo de puntos
 *   esquina -> una esquina con ese marco (o ese centro) y lo demás como está
 */
function dibujarFormas() {
  for (const lugar of dibujosDeFormas) {
    const opcion = lugar.closest('label').querySelector('input');
    const conEstaOpcion = { ...diseno, [opcion.dataset.ajuste]: opcion.value };
    if (lugar.dataset.dibujo === 'puntos') {
      lugar.innerHTML = svgDePuntos(conEstaOpcion);   // SVG armado por nosotros (no viene de afuera)
    } else {
      lugar.innerHTML = svgDeEsquina(conEstaOpcion);
    }
  }
}

/**
 * "Probar antes de elegir": al pasar el mouse por una forma o una plantilla,
 * el QR grande la muestra. Al salir, vuelve a lo elegido.
 */
function prepararPruebaAlPasarElMouse() {
  for (const opcion of seccion.querySelectorAll('.forma-qr')) {
    const input = opcion.querySelector('input');
    opcion.addEventListener('mouseenter', function () {
      probarDiseno({ [input.dataset.ajuste]: input.value });
    });
    opcion.addEventListener('mouseleave', dejarDeProbar);
  }
}

/** Muestra el QR con unos cambios, sin guardarlos en "diseno". */
function probarDiseno(cambios) {
  dibujarQR({ ...diseno, ...cambios });
}

function dejarDeProbar() {
  dibujarQR();
}

/** Botones con una mini vista de cada plantilla (se dibujan con el mismo armarSVG). */
function dibujarPlantillas() {
  for (const plantilla of PLANTILLAS) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.classList.add('plantilla-qr');
    boton.dataset.nombre = plantilla.nombre;

    const vista = new Image();
    vista.alt = '';
    const nombre = document.createElement('span');
    nombre.textContent = plantilla.nombre;
    boton.append(vista, nombre);

    boton.addEventListener('mouseenter', function () { probarDiseno(plantilla.diseno); });
    boton.addEventListener('mouseleave', dejarDeProbar);
    boton.addEventListener('click', function () {
      diseno = { ...diseno, ...plantilla.diseno }; // el logo y el texto del marco se respetan
      esquinasConColorPropio = diseno.colorEsquinas !== diseno.colorPuntos;
      sincronizarControles();
      dibujarQR();
    });
    contenedorPlantillas.appendChild(boton);
  }
  dibujarMiniaturasDePlantillas();
}

/** La mini vista de cada plantilla, con el logo elegido (el de UNICAH, por defecto). */
function dibujarMiniaturasDePlantillas() {
  for (const boton of contenedorPlantillas.children) {
    const plantilla = PLANTILLAS.find(function (p) { return p.nombre === boton.dataset.nombre; });
    const disenoMini = { ...DISENO_INICIAL, ...plantilla.diseno, logo: diseno.logo, tamanoLogo: 26, textoMarco: 'QR' };
    boton.querySelector('img').src = svgComoDataURL(armarSVG('https://www.unicah.edu', disenoMini));
  }
}

/** Marca la plantilla que coincide con el diseño actual (si alguna coincide). */
function marcarPlantillaElegida() {
  for (const boton of contenedorPlantillas.children) {
    const plantilla = PLANTILLAS.find(function (p) { return p.nombre === boton.dataset.nombre; });
    let coincide = true;
    for (const clave in plantilla.diseno) {
      if (diseno[clave] !== plantilla.diseno[clave]) {
        coincide = false;
      }
    }
    boton.classList.toggle('activo', coincide);
  }
}


// =============================================================
//  LOGO
// =============================================================

function prepararLogo() {
  for (const opcion of opcionesLogo) {
    opcion.addEventListener('change', alCambiarLogo);
  }
  inputArchivoLogo.addEventListener('change', leerLogoSubido);
  botonCambiarLogo.addEventListener('click', function () { inputArchivoLogo.click(); });
}

/** UNICAH / Otro logo / Sin logo. */
function alCambiarLogo() {
  const elegido = logoElegido();
  if (elegido === 'propio' && logoPropio === null) {
    inputArchivoLogo.click(); // todavía no hay logo propio: que lo busque
  }
  actualizarLogo();
}

function logoElegido() {
  return seccion.querySelector('input[name="qr-logo"]:checked').value;
}

/** Pone en el diseño el logo que corresponde y muestra u oculta sus opciones. */
function actualizarLogo() {
  const elegido = logoElegido();
  if (elegido === 'unicah') {
    diseno.logo = logoUnicah;
  } else if (elegido === 'propio') {
    diseno.logo = logoPropio;
  } else {
    diseno.logo = null;
  }
  dibujarMiniaturasDePlantillas(); // las plantillas muestran el mismo logo
  filaLogoPropio.classList.toggle('oculto', !(elegido === 'propio' && logoPropio !== null));
  cajaOpcionesLogo.classList.toggle('apagado', elegido === 'ninguno');
  dibujarQR();
}

/** Lee el logo que subió el usuario y lo guarda como data URL. */
function leerLogoSubido() {
  const archivo = inputArchivoLogo.files[0];
  inputArchivoLogo.value = ''; // permite elegir el mismo archivo otra vez
  if (!archivo) {
    if (logoPropio === null) {
      seccion.querySelector('input[name="qr-logo"][value="unicah"]').checked = true; // canceló
      actualizarLogo();
    }
    return;
  }
  if (!archivo.type.startsWith('image/')) {
    mostrarMensaje(mensajeQR, 'El logo debe ser una imagen (PNG, JPG o WEBP)', 'error');
    return;
  }
  comoDataURL(archivo).then(function (dataURL) {
    logoPropio = dataURL;
    textoNombreLogo.textContent = archivo.name;
    mostrarMensaje(mensajeQR, '', 'normal');
    actualizarLogo();
  });
}

/**
 * Carga el logo de UNICAH como data URL, para que quede DENTRO del SVG
 * (si el SVG solo dijera "img/logo-unicah.png", al descargarlo o
 * convertirlo en PNG el logo no aparecería).
 */
async function cargarLogoUnicah() {
  try {
    const respuesta = await fetch(LOGO_UNICAH);
    logoUnicah = await comoDataURL(await respuesta.blob());
  } catch (error) {
    logoUnicah = null; // sin logo, pero el QR igual funciona
  }
  actualizarLogo();
}

function comoDataURL(archivo) {
  return new Promise(function (resolver, fallar) {
    const lector = new FileReader();
    lector.addEventListener('load', function () { resolver(lector.result); });
    lector.addEventListener('error', fallar);
    lector.readAsDataURL(archivo);
  });
}


// =============================================================
//  3. DIBUJAR Y REVISAR QUE SE PUEDA LEER
// =============================================================

/**
 * Dibuja el QR grande. Normalmente con "diseno"; al pasar el mouse por una
 * opción, con un diseño de prueba (ver probarDiseno).
 */
function dibujarQR(disenoAUsar = diseno) {
  const texto = textoDelQR();
  if (texto === '') {
    svgActual = '';
    dibujo.replaceChildren();
    textoEstado.textContent = queFalta();
    ocultar(avisoLectura);
    activarDescargas(false);
    return;
  }

  try {
    svgActual = armarSVG(texto, disenoAUsar);
  } catch (error) {
    // La librería falla si el contenido es demasiado largo para un QR
    svgActual = '';
    dibujo.replaceChildren();
    textoEstado.textContent = 'Es demasiado largo para un QR. Usa un texto o link más corto.';
    ocultar(avisoLectura);
    activarDescargas(false);
    return;
  }

  // Se muestra como imagen (el SVG lo armamos nosotros, no viene de afuera)
  const vista = new Image();
  vista.alt = 'Vista previa del código QR';
  vista.src = svgComoDataURL(svgActual);
  dibujo.replaceChildren(vista);
  dibujo.classList.toggle('transparente', disenoAUsar.fondoTransparente);
  dibujo.classList.toggle('probando', disenoAUsar !== diseno);
  textoEstado.textContent = acortar(texto, 70);
  mostrarAvisoDeLectura();
  activarDescargas(true);
}

function activarDescargas(activas) {
  botonDescargar.disabled = !activas;
  botonCopiar.disabled = !activas;
}

/**
 * Revisa si el QR se podrá leer bien y lo dice debajo:
 * verde "Fácil de leer", o amarillo con lo que hay que mejorar.
 */
function mostrarAvisoDeLectura() {
  const problema = problemaDeLectura();
  mostrar(avisoLectura);
  if (problema === '') {
    avisoLectura.classList.remove('lectura-qr--cuidado');
    avisoLectura.querySelector('.icono').textContent = 'check_circle';
    textoLectura.textContent = 'Fácil de leer';
  } else {
    avisoLectura.classList.add('lectura-qr--cuidado');
    avisoLectura.querySelector('.icono').textContent = 'warning';
    textoLectura.textContent = problema;
  }
}

/** '' si todo está bien; si no, el primer problema encontrado. */
function problemaDeLectura() {
  const fondo = diseno.fondoTransparente ? '#FFFFFF' : diseno.colorFondo;
  const coloresOscuros = [diseno.colorPuntos, diseno.colorEsquinas];
  if (diseno.degradado) {
    coloresOscuros.push(diseno.colorDegradado);
  }
  for (const color of coloresOscuros) {
    if (luminosidad(color) > luminosidad(fondo)) {
      return 'Los puntos deben ser más oscuros que el fondo: así lo leen todos los celulares.';
    }
    if (contraste(color, fondo) < 4) {
      return 'Poco contraste entre los puntos y el fondo. Usa colores más diferentes.';
    }
  }
  if (diseno.logo && !diseno.fondoLogo && diseno.tamanoLogo > 22) {
    return 'Logo grande y sin fondo: actívale el fondo o hazlo más pequeño.';
  }
  if (diseno.fondoTransparente) {
    return 'Fondo transparente: ponlo siempre sobre un fondo claro.';
  }
  return '';
}

/** Qué tan claro es un color: 0 (negro) a 1 (blanco), como lo mide la norma de accesibilidad. */
function luminosidad(colorHex) {
  const canales = [1, 3, 5].map(function (inicio) {
    const c = parseInt(colorHex.slice(inicio, inicio + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
}

/** Contraste entre dos colores: de 1 (iguales) a 21 (negro y blanco). */
function contraste(color1, color2) {
  const a = luminosidad(color1);
  const b = luminosidad(color2);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function acortar(texto, maximo) {
  if (texto.length <= maximo) {
    return texto;
  }
  return texto.slice(0, maximo - 1) + '…';
}

function svgComoDataURL(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}


// =============================================================
//  4. DESCARGAR Y COPIAR
// =============================================================

function prepararDescargas() {
  for (const opcion of opcionesFormato) {
    opcion.addEventListener('change', function () {
      const esPNG = formatoElegido() === 'png';
      selectorTamanoPNG.disabled = !esPNG;
      if (esPNG) {
        textoAyudaFormato.textContent = 'PNG: una imagen para redes, WhatsApp o documentos.';
      } else {
        textoAyudaFormato.textContent = 'SVG: para imprenta o lonas; se agranda sin verse borroso.';
      }
    });
  }
  botonDescargar.addEventListener('click', descargar);
  botonCopiar.addEventListener('click', copiarImagen);
}

function formatoElegido() {
  return seccion.querySelector('input[name="qr-formato"]:checked').value;
}

async function descargar() {
  if (svgActual === '') {
    return;
  }
  if (formatoElegido() === 'svg') {
    bajar(new Blob([svgActual], { type: 'image/svg+xml' }), 'codigo-qr.svg');
    mostrarMensaje(mensajeQR, 'Listo. Revísalo con la cámara de tu celular antes de imprimirlo.', 'ok');
    return;
  }
  const lado = Number(selectorTamanoPNG.value);
  try {
    const png = await svgComoPNG(svgActual, lado);
    bajar(png, `codigo-qr-${lado}px.png`);
    mostrarMensaje(mensajeQR, 'Listo. Revísalo con la cámara de tu celular antes de imprimirlo.', 'ok');
  } catch (error) {
    mostrarMensaje(mensajeQR, 'No se pudo crear la imagen. Prueba con otro logo.', 'error');
  }
}

/** Copia el QR (PNG de 1024 px) para pegarlo en WhatsApp, Word, correo… */
async function copiarImagen() {
  if (svgActual === '') {
    return;
  }
  try {
    const png = await svgComoPNG(svgActual, 1024);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    mostrarMensaje(mensajeQR, 'Copiado. Ya puedes pegarlo (Ctrl + V) donde quieras.', 'ok');
  } catch (error) {
    mostrarMensaje(mensajeQR, 'Tu navegador no deja copiar imágenes. Usa "Descargar".', 'error');
  }
}

/** Pinta el SVG en un <canvas> (el ancho que se pida) y lo devuelve como PNG. */
function svgComoPNG(svg, ancho) {
  return new Promise(function (resolver, fallar) {
    const imagen = new Image();
    imagen.addEventListener('load', function () {
      const proporcion = imagen.naturalHeight / imagen.naturalWidth; // con marco, es más alto que ancho
      const lienzo = document.createElement('canvas');
      lienzo.width = ancho;
      lienzo.height = Math.round(ancho * proporcion);
      lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      lienzo.toBlob(function (png) {
        if (png) {
          resolver(png);
        } else {
          fallar(new Error('sin imagen'));
        }
      }, 'image/png');
    });
    imagen.addEventListener('error', fallar);
    imagen.src = svgComoDataURL(svg);
  });
}

function bajar(archivo, nombre) {
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = nombre;
  enlace.click();
  setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1000);
}
