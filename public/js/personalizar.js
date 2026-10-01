// =============================================================
//  personalizar.js — PANEL "PERSONALIZAR DISEÑO"
//
//  Colores (combinaciones y un selector por color), encabezado,
//  título, logo y la vista en miniatura del documento.
//  Todo es opcional: lo elegido se envía junto con cada documento
//  que se genera; si no se toca, el servidor usa el diseño por defecto.
//
//  IMPORTA                           DE             PARA
//  mostrar, ocultar, mostrarMensaje  utilidades.js  mostrar avisos y botones
//  pedirAlServidor, leerFormulario   utilidades.js  pedir la miniatura con los datos escritos
//  SIN_CONEXION                      utilidades.js  reconocer cuándo falló la conexión (para reintentar)
//  urlDelModulo                      estado.js      '/api/<módulo>/miniatura'
//
//  EXPORTA                            LO IMPORTAN              PARA
//  iniciarPersonalizar()              main.js                  arrancar esta parte
//  agregarPersonalizacion(envio)      individual.js, excel.js  enviar colores, textos y logo con cada PDF
//  personalizarAlCambiarDeModulo(id)  navegacion.js            preparar el panel para otro módulo
//  usarComoLogo(archivo)              quitar-fondo.js          poner como logo el que quedó sin fondo
// =============================================================
import { mostrar, ocultar, mostrarMensaje, pedirAlServidor, leerFormulario, SIN_CONEXION } from './utilidades.js';
import { urlDelModulo } from './estado.js';

// ---------- Elementos de la página ----------
const panelPersonalizar = document.getElementById('personalizar');
const selectoresColor = document.querySelectorAll('.selector-color'); // uno por cada color que se puede cambiar
const botonesPaleta = document.querySelectorAll('.paleta');            // combinaciones listas (Placas)
const inputEncabezado1 = document.getElementById('input-encabezado1');
const inputEncabezado2 = document.getElementById('input-encabezado2');
const inputTitulo = document.getElementById('input-titulo');
const inputLogo = document.getElementById('input-logo');
const botonLogo = document.getElementById('boton-logo');
const botonQuitarLogo = document.getElementById('boton-quitar-logo');
const textoNombreLogo = document.getElementById('nombre-logo');
const botonRestablecer = document.getElementById('boton-restablecer');
const mensajePersonalizar = document.getElementById('mensaje-personalizar');
const cajaMiniVista = document.querySelector('.mini-vista');
const imagenMiniVista = document.getElementById('mini-vista-imagen');
const textoMiniVista = document.getElementById('mini-vista-estado');
const formIndividual = document.getElementById('form-individual'); // sus datos se usan en la miniatura

// ---------- Lo elegido ----------
// Colores por nombre de campo: { colorBanda: '#7A1428', colorNombre: '' }.
// '' = el color por defecto (no hace falta enviarlo).
const coloresElegidos = {};
let archivoLogo = null; // el archivo de imagen del logo, o null = logo por defecto
const LOGO_TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB (el mismo límite que el servidor)


// =============================================================
//  ARRANQUE
// =============================================================

/** Conecta todo el panel (se llama una vez, desde main.js). */
export function iniciarPersonalizar() {
  for (const selector of selectoresColor) {
    prepararSelectorColor(selector);
  }
  prepararCombinaciones();
  marcarCombinacionElegida();

  // Al escribir el encabezado o el título, se actualiza la miniatura.
  // (Se envuelve en function () {} para que el evento no llegue como "espera")
  inputEncabezado1.addEventListener('input', function () { programarMiniVista(); });
  inputEncabezado2.addEventListener('input', function () { programarMiniVista(); });
  inputTitulo.addEventListener('input', function () { programarMiniVista(); });

  prepararLogo();
  botonRestablecer.addEventListener('click', restablecerDiseno);

  // Al abrir el panel, se dibuja la miniatura
  panelPersonalizar.addEventListener('toggle', function () {
    if (panelPersonalizar.open) {
      actualizarMiniVista();
    }
  });

  // Si escribes en "Uno a la vez" con el panel abierto, la miniatura también cambia
  formIndividual.addEventListener('input', function () { programarMiniVista(600); });
}

/**
 * Prepara el panel para otro módulo (lo llama navegacion.js al cambiar de módulo).
 * En Placas (3 colores) las filas de color empiezan cerradas, debajo de las
 * combinaciones; en los diplomas de un solo color, su fila empieza abierta.
 */
export function personalizarAlCambiarDeModulo(idModulo) {
  for (const selector of selectoresColor) {
    selector.open = idModulo !== 'placas' && selector.dataset.campo === 'colorBanda';
  }

  // La miniatura ahora debe mostrar este módulo
  imagenMiniVista.removeAttribute('src');
  programarMiniVista();
}


// =============================================================
//  SELECTORES DE COLOR
//  En el HTML hay un <details class="selector-color"> por cada color
//  (la banda; en Placas también la cinta secundaria y el nombre).
//  Todos funcionan igual, así que se preparan con la misma función.
//
//  En cada uno hay tres formas de elegir: un color rápido, el círculo
//  "Otro color" (el selector del navegador) o escribiendo el código.
//  Las tres terminan en elegirColor().
// =============================================================

/** Conecta los botones, el círculo "Otro color" y el campo del código de un selector. */
function prepararSelectorColor(selector) {
  const campo = selector.dataset.campo;          // ej. 'colorBanda'
  coloresElegidos[campo] = '';                   // empieza con el color por defecto

  // Colores rápidos: cada círculo se pinta con su data-color (variable CSS)
  for (const boton of selector.querySelectorAll('.color[data-color]')) {
    boton.style.setProperty('--fondo-color', boton.dataset.color);
    boton.addEventListener('click', function () {
      elegirColor(selector, boton.dataset.color);
    });
  }

  // "Otro color": cualquier color ('input' se dispara mientras se mueve el selector)
  const selectorLibre = selector.querySelector('.selector-color__libre');
  selectorLibre.addEventListener('input', function () {
    elegirColor(selector, selectorLibre.value);
  });

  // Escribiendo el código: se aplica en cuanto es un color válido (#RRGGBB)
  const campoCodigo = selector.querySelector('.color-elegido__input');
  campoCodigo.addEventListener('input', function () {
    let codigo = campoCodigo.value.trim();
    if (!codigo.startsWith('#')) {
      codigo = '#' + codigo; // se acepta escribirlo sin el #
    }

    if (esCodigoDeColor(codigo)) {
      campoCodigo.classList.remove('invalido');
      elegirColor(selector, codigo);
    } else if (codigo.length >= 7) {
      campoCodigo.classList.add('invalido'); // ya está completo pero no es un color
    }
  });

  // Al salir del campo, si quedó a medias, vuelve a mostrar el color actual
  campoCodigo.addEventListener('blur', function () {
    campoCodigo.classList.remove('invalido');
    campoCodigo.value = colorActual(selector);
  });

  // Muestra el color por defecto (sin pedir miniatura todavía)
  elegirColor(selector, selector.dataset.porDefecto, false);
}

/** true si el texto es un color como '#7A1428' (# y 6 letras/números del 0 al F). */
function esCodigoDeColor(texto) {
  return /^#[0-9a-fA-F]{6}$/.test(texto);
}

/** El color que usa ahora un selector (el de por defecto si no se eligió otro). */
function colorActual(selector) {
  const elegido = coloresElegidos[selector.dataset.campo];
  if (!elegido) {
    return selector.dataset.porDefecto; // '' (por defecto) o todavía sin preparar
  }
  return elegido;
}

/**
 * true si el color es muy claro (casi blanco o amarillo muy pálido).
 * Se calcula el brillo con la fórmula de siempre: el verde pesa más
 * porque el ojo lo ve más brillante.
 */
function esColorClaro(color) {
  const rojo = parseInt(color.substring(1, 3), 16);   // '#7A1428' -> '7A' -> 122
  const verde = parseInt(color.substring(3, 5), 16);
  const azul = parseInt(color.substring(5, 7), 16);
  const brillo = (rojo * 0.299 + verde * 0.587 + azul * 0.114) / 255; // de 0 (negro) a 1 (blanco)
  return brillo > 0.72;
}

/**
 * Elige un color en un selector: lo guarda, marca el círculo, actualiza
 * la fila (nombre y código) y pide la miniatura.
 * "actualizarVista" = false cuando no hace falta pedir la miniatura todavía.
 */
function elegirColor(selector, color, actualizarVista = true) {
  color = color.toUpperCase();
  const campo = selector.dataset.campo;
  const porDefecto = selector.dataset.porDefecto.toUpperCase();

  coloresElegidos[campo] = color;
  if (color === porDefecto) {
    coloresElegidos[campo] = ''; // es el de siempre: no hace falta enviarlo
  }

  // Lo único que cambia JavaScript en el estilo: variables CSS.
  // --color-elegido pinta la muestra de la fila y el círculo "Otro color" de este selector.
  selector.style.setProperty('--color-elegido', color);
  if (campo === 'colorBanda') {
    panelPersonalizar.style.setProperty('--color-banda', color); // la muestra del título del panel
  }

  const campoCodigo = selector.querySelector('.color-elegido__input');
  selector.querySelector('.selector-color__libre').value = color.toLowerCase();
  if (document.activeElement !== campoCodigo) {
    campoCodigo.value = color; // (si lo está escribiendo, no se le cambia)
  }

  // 1. Marca el color rápido elegido; si no es ninguno, se marca "Otro color"
  const botonLibre = selector.querySelector('.color--libre');
  let botonElegido = null;
  for (const boton of selector.querySelectorAll('.color[data-color]')) {
    if (boton.dataset.color.toUpperCase() === color) {
      boton.classList.add('activo');
      botonElegido = boton;
    } else {
      boton.classList.remove('activo');
    }
  }
  if (botonElegido === null) {
    botonLibre.classList.add('activo');
  } else {
    botonLibre.classList.remove('activo');
  }

  // 2. La fila: nombre del color, "· por defecto" y el código
  const textoNombre = selector.querySelector('.color-elegido__nombre');
  const textoDetalle = selector.querySelector('.color-elegido__detalle');
  if (botonElegido !== null) {
    textoNombre.textContent = botonElegido.dataset.nombre;
  } else {
    textoNombre.textContent = 'Color personalizado';
  }
  if (color === porDefecto) {
    textoDetalle.textContent = '· por defecto';
  } else {
    textoDetalle.textContent = '';
  }
  selector.querySelector('.selector-color__codigo').textContent = color;

  // 3. Colores muy claros: la ✓ del círculo va oscura, y un aviso
  //    (solo en los selectores que pintan texto: data-aviso-claro="si")
  const aviso = selector.querySelector('.color-elegido__aviso');
  const circuloElegido = botonElegido || botonLibre;
  for (const boton of selector.querySelectorAll('.color')) {
    boton.classList.remove('color--claro');
  }
  if (esColorClaro(color)) {
    circuloElegido.classList.add('color--claro');
  }
  if (esColorClaro(color) && selector.dataset.avisoClaro === 'si') {
    mostrar(aviso);
  } else {
    ocultar(aviso);
  }

  marcarCombinacionElegida();

  if (actualizarVista) {
    programarMiniVista(120); // un clic en un color: la miniatura responde rápido
  }
}

/** Vuelve todos los selectores a su color por defecto. */
function restablecerColores() {
  for (const selector of selectoresColor) {
    elegirColor(selector, selector.dataset.porDefecto);
  }
}


// =============================================================
//  COMBINACIONES LISTAS (Placas)
//  Cada botón .paleta trae sus colores en data-color-banda,
//  data-color-secundario y data-color-nombre. En JavaScript se leen
//  como dataset.colorBanda, etc.: ¡el mismo nombre que el data-campo
//  de cada selector! Así no hacen falta casos especiales.
// =============================================================

/** Pinta las franjas de cada combinación y conecta su clic. */
function prepararCombinaciones() {
  for (const paleta of botonesPaleta) {
    const franjas = paleta.querySelectorAll('.paleta__franjas span');
    franjas[0].style.setProperty('--fondo-color', paleta.dataset.colorBanda);
    franjas[1].style.setProperty('--fondo-color', paleta.dataset.colorSecundario);
    franjas[2].style.setProperty('--fondo-color', paleta.dataset.colorNombre);

    paleta.addEventListener('click', function () {
      aplicarCombinacion(paleta);
    });
  }
}

/** Pone los colores de la combinación en cada selector y pide la miniatura una sola vez. */
function aplicarCombinacion(paleta) {
  for (const selector of selectoresColor) {
    const color = paleta.dataset[selector.dataset.campo]; // ej. paleta.dataset['colorBanda']
    if (color) {
      elegirColor(selector, color, false);
    }
  }
  programarMiniVista(120);
}

/**
 * Marca la combinación que coincide con los colores actuales.
 * Si se cambió un color a mano y ya no coincide ninguna, no se marca ninguna.
 */
function marcarCombinacionElegida() {
  for (const paleta of botonesPaleta) {
    let coincide = true;
    for (const selector of selectoresColor) {
      const colorDePaleta = paleta.dataset[selector.dataset.campo];
      if (colorDePaleta && colorDePaleta.toUpperCase() !== colorActual(selector).toUpperCase()) {
        coincide = false;
      }
    }
    if (coincide) {
      paleta.classList.add('activo');
    } else {
      paleta.classList.remove('activo');
    }
  }
}


// =============================================================
//  LOGO
// =============================================================

/** Conecta "Subir logo" y "Quitar". */
function prepararLogo() {
  botonLogo.addEventListener('click', function () {
    inputLogo.click();
  });

  inputLogo.addEventListener('change', function () {
    const archivo = inputLogo.files[0];
    inputLogo.value = ''; // permite volver a elegir el mismo archivo después
    if (!archivo) {
      return;
    }

    const nombre = archivo.name.toLowerCase();
    const esImagen = nombre.endsWith('.png') || nombre.endsWith('.jpg') || nombre.endsWith('.jpeg');
    if (!esImagen) {
      mostrarMensaje(mensajePersonalizar, 'El logo debe ser una imagen PNG o JPG', 'error');
      return;
    }
    usarComoLogo(archivo);
  });

  botonQuitarLogo.addEventListener('click', quitarLogo);
}

/**
 * Usa un archivo como logo de los documentos.
 * La llaman "Subir logo" (aquí) y "Usar como logo" (quitar-fondo.js).
 * Devuelve false si el archivo pesa demasiado.
 */
export function usarComoLogo(archivo) {
  if (archivo.size > LOGO_TAMANO_MAXIMO) {
    mostrarMensaje(mensajePersonalizar, 'El logo no puede pesar más de 2 MB', 'error');
    return false;
  }

  archivoLogo = archivo;
  textoNombreLogo.textContent = archivo.name;
  mostrar(botonQuitarLogo);
  mostrarMensaje(mensajePersonalizar, '', 'normal');
  programarMiniVista();
  return true;
}

/** Vuelve al logo por defecto. */
function quitarLogo() {
  archivoLogo = null;
  textoNombreLogo.textContent = 'Logo de UNICAH (por defecto)';
  ocultar(botonQuitarLogo);
  programarMiniVista();
}

/** "Restablecer diseño por defecto": borra textos, colores y logo elegidos. */
function restablecerDiseno() {
  inputTitulo.value = '';
  inputEncabezado1.value = '';
  inputEncabezado2.value = '';
  restablecerColores();
  quitarLogo();
  mostrarMensaje(mensajePersonalizar, '', 'normal');
}


// =============================================================
//  LO QUE SE ENVÍA AL SERVIDOR
// =============================================================

/**
 * Agrega a un FormData los colores, el encabezado, el título y el logo elegidos.
 * Solo lo que se cambió y lo que aplica al módulo abierto (los campos de otros
 * módulos están desactivados). Si no se eligió nada, no agrega nada.
 */
export function agregarPersonalizacion(envio) {
  for (const selector of selectoresColor) {
    const campo = selector.dataset.campo;
    const seVe = !selector.querySelector('.color-elegido__input').disabled;
    if (seVe && coloresElegidos[campo] !== '') {
      envio.append(campo, coloresElegidos[campo]);
    }
  }
  agregarTextoSiTiene(envio, 'titulo', inputTitulo);           // comunicado de duelo
  agregarTextoSiTiene(envio, 'encabezado1', inputEncabezado1); // diplomas y placas
  agregarTextoSiTiene(envio, 'encabezado2', inputEncabezado2);
  if (archivoLogo !== null) {
    envio.append('logo', archivoLogo);
  }
}

/** Agrega un campo de texto al envío, si está activo y no está vacío. */
function agregarTextoSiTiene(envio, nombre, campo) {
  const texto = campo.value.trim();
  if (!campo.disabled && texto !== '') {
    envio.append(nombre, texto);
  }
}


// =============================================================
//  VISTA EN MINIATURA
//  El servidor dibuja el documento real (con datos de ejemplo, o con
//  lo que ya escribiste en "Uno a la vez") y devuelve una imagen
//  pequeña: POST /api/<módulo>/miniatura.
//  Solo se pide cuando el panel está abierto.
// =============================================================

let temporizadorMiniVista = null;
let numeroDePeticion = 0; // para ignorar respuestas viejas si llegan tarde
let peticionEnCurso = null; // para cancelar la miniatura anterior si se pide otra (AbortController)
let reintentos = 0;         // si falla la conexión, se vuelve a intentar UNA vez

/**
 * Pide la miniatura dentro de un momento. Si hay otro cambio antes
 * (por ejemplo, mientras se escribe), se espera de nuevo: así no se
 * hace una petición por cada tecla.
 */
function programarMiniVista(espera = 350) {
  if (!panelPersonalizar.open) {
    return; // el panel está cerrado: no hace falta
  }
  clearTimeout(temporizadorMiniVista);
  temporizadorMiniVista = setTimeout(actualizarMiniVista, espera); // espera en milisegundos
}

/**
 * Pide la miniatura al servidor y la muestra.
 * Si todavía se estaba generando una anterior (por ejemplo, al hacer clic
 * en varios colores seguidos), esa se cancela: solo importa la última.
 */
async function actualizarMiniVista() {
  numeroDePeticion = numeroDePeticion + 1;
  const estaPeticion = numeroDePeticion;

  if (peticionEnCurso !== null) {
    peticionEnCurso.abort(); // cancela la anterior
  }
  peticionEnCurso = new AbortController();

  cajaMiniVista.classList.add('cargando');
  textoMiniVista.textContent = 'Generando vista previa…';

  // Lo que ya se escribió en "Uno a la vez" + la personalización
  const envio = new FormData();
  const datos = leerFormulario(formIndividual);
  for (const nombreCampo in datos) {
    envio.append(nombreCampo, datos[nombreCampo]);
  }
  agregarPersonalizacion(envio);

  try {
    const respuesta = await pedirAlServidor(`${urlDelModulo()}/miniatura`, {
      method: 'POST',
      body: envio,
      signal: peticionEnCurso.signal, // permite cancelarla
    });
    const imagen = await respuesta.blob();

    if (estaPeticion !== numeroDePeticion) {
      return; // mientras tanto se pidió otra más nueva: esta ya no sirve
    }
    if (imagenMiniVista.src.startsWith('blob:')) {
      URL.revokeObjectURL(imagenMiniVista.src); // libera la imagen anterior
    }
    imagenMiniVista.src = URL.createObjectURL(imagen);
    textoMiniVista.textContent = '';
    reintentos = 0;
  } catch (error) {
    if (error.name === 'AbortError' || estaPeticion !== numeroDePeticion) {
      return; // se canceló porque hay una más nueva: no es un error
    }
    if (error.message === SIN_CONEXION && reintentos === 0) {
      // Sin conexión: se espera un poco y se intenta otra vez, sola
      reintentos = 1;
      textoMiniVista.textContent = 'Sin conexión, reintentando…';
      programarMiniVista(2500);
      return;
    }
    reintentos = 0;
    textoMiniVista.textContent = error.message;
  }
  if (estaPeticion === numeroDePeticion) {
    cajaMiniVista.classList.remove('cargando');
  }
}
