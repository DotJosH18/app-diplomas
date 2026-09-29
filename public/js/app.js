// =============================================================
//  GENERADOR DE DIPLOMAS - comportamiento de la página
//
//  La estructura está en index.html y el diseño en css/estilos.css.
//  Este archivo solo agrega o quita clases (por ejemplo "oculto"),
//  nunca cambia estilos directamente.
//
//  Secciones:
//    1. Elementos de la página
//    2. Funciones de ayuda
//    3. Menú y módulos (Reconocimientos / Lugares)
//    4. Pestañas ("Uno a la vez" primero, luego "Desde Excel")
//    5. Configuración (valores en gris y contador de caracteres)
//    6. Personalizar (colores, encabezado, título, logo y su vista en miniatura)
//    7. Pestaña "Desde Excel" (con la ventana de vista previa de cada fila)
//    8. Pestaña "Uno a la vez"
//    9. Inicio
//
//  La herramienta "Quitar fondo de logos" está aparte, en quitar-fondo.js.
// =============================================================

// Módulo elegido: 'reconocimientos' o 'lugares' (igual que data-modulo en el HTML)
let moduloActual = 'reconocimientos';

// El Excel que eligió el usuario (se guarda para enviarlo al revisar y al generar)
let archivoExcel = null;

// Personalización (opcional). Vacío / null = diseño por defecto.
// Los colores elegidos, por nombre de campo: { colorBanda: '#7A1428', colorNombre: '' }.
// '' = el color por defecto (no hace falta enviarlo). Ver "Selectores de color".
const coloresElegidos = {};
let archivoLogo = null;  // el archivo de imagen que subió el usuario

/** Dirección de la API del módulo elegido. Ejemplo: '/api/lugares' */
function urlDelModulo() {
  return `/api/${moduloActual}`;
}


// =============================================================
//  1. ELEMENTOS DE LA PÁGINA
//  Se buscan una sola vez y se guardan en constantes.
// =============================================================

// Menú y encabezado
const pantallaMenu = document.getElementById('menu');
const pantallaGenerador = document.getElementById('generador');
const pantallaHerramientaFondo = document.getElementById('herramienta-fondo');
const barraPestanas = document.getElementById('pestanas');
const cajaTipoElegido = document.getElementById('tipo-elegido');
const textoTipoElegido = document.getElementById('tipo-elegido-nombre');
const botonMenu = document.getElementById('boton-menu');

// Personalizar
const panelPersonalizar = document.getElementById('personalizar');
const selectoresColor = document.querySelectorAll('.selector-color'); // uno por cada color que se puede cambiar
const inputLogo = document.getElementById('input-logo');
const botonLogo = document.getElementById('boton-logo');
const botonQuitarLogo = document.getElementById('boton-quitar-logo');
const textoNombreLogo = document.getElementById('nombre-logo');
const inputTitulo = document.getElementById('input-titulo');
const inputEncabezado1 = document.getElementById('input-encabezado1');
const inputEncabezado2 = document.getElementById('input-encabezado2');
const cajaMiniVista = document.querySelector('.mini-vista');
const imagenMiniVista = document.getElementById('mini-vista-imagen');
const textoMiniVista = document.getElementById('mini-vista-estado');
const botonRestablecer = document.getElementById('boton-restablecer');
const mensajePersonalizar = document.getElementById('mensaje-personalizar');

// Pestaña "Desde Excel"
const zonaExcel = document.getElementById('zona-excel');
const enlaceModelo = document.getElementById('enlace-modelo');
const inputExcel = document.getElementById('input-excel');
const cajaArchivoCargado = document.getElementById('archivo-cargado');
const textoNombreArchivo = document.getElementById('archivo-nombre');
const textoTamanoArchivo = document.getElementById('archivo-tamano');
const botonCambiarArchivo = document.getElementById('boton-cambiar');
const seccionRevision = document.getElementById('revision');
const formComunes = document.getElementById('form-comunes');
const cuerpoTabla = document.getElementById('tabla-filas');
const botonGenerarExcel = document.getElementById('boton-generar-excel');

// Ventana de vista previa de las filas del Excel
const ventanaVista = document.getElementById('ventana-vista');
const tituloVentana = document.getElementById('ventana-titulo');
const contadorVentana = document.getElementById('ventana-contador');
const botonAnterior = document.getElementById('ventana-anterior');
const botonSiguiente = document.getElementById('ventana-siguiente');
const botonCerrarVentana = document.getElementById('ventana-cerrar');
const marcoVentana = document.getElementById('ventana-pdf');
const textoCargandoVentana = document.getElementById('ventana-cargando');
const mensajeExcel = document.getElementById('mensaje-excel');

// Pestaña "Uno a la vez"
const formIndividual = document.getElementById('form-individual');
const botonVistaPrevia = document.getElementById('boton-vista');
const botonDescargar = formIndividual.querySelector('button[type="submit"]');
const botonImagen = document.getElementById('boton-imagen');
const marcoVistaPrevia = document.getElementById('vista-pdf');
const textoVistaVacia = document.getElementById('vista-vacia');
const mensajeIndividual = document.getElementById('mensaje-individual');


// =============================================================
//  2. FUNCIONES DE AYUDA
// =============================================================

/**
 * Lee un formulario y devuelve solo los campos que tienen texto.
 * Ejemplo: { nombre: 'Ana', lugar: 'Catacamas' }
 */
function leerFormulario(formulario) {
  const datos = {};
  const campos = new FormData(formulario);

  for (const [nombreCampo, valor] of campos) {
    if (valor.trim() !== '') {
      datos[nombreCampo] = valor;
    }
  }
  return datos;
}

/**
 * Muestra un mensaje en la página.
 * tipo puede ser: 'normal', 'ok' (verde) o 'error' (rojo).
 */
function mostrarMensaje(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.classList.remove('mensaje--ok', 'mensaje--error');

  if (tipo === 'ok') {
    elemento.classList.add('mensaje--ok');
  }
  if (tipo === 'error') {
    elemento.classList.add('mensaje--error');
  }
}

/**
 * Hace una petición al servidor.
 * Si el servidor responde con error, lanza ese error con su mensaje
 * para que lo atrape el try/catch de quien llamó a esta función.
 */
async function pedirAlServidor(url, opciones) {
  const respuesta = await fetch(url, opciones);

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json(); // el servidor responde { error: '...' }
      mensaje = cuerpo.error;
    } catch (error) {
      // la respuesta no era JSON: se queda el mensaje genérico
    }
    throw new Error(mensaje);
  }

  return respuesta;
}

/**
 * Descarga el archivo que envió el servidor (un PDF).
 * Crea un enlace invisible, le hace clic y lo elimina.
 */
async function descargarArchivo(respuesta, nombreArchivo) {
  const archivo = await respuesta.blob();
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

/**
 * Saca el nombre del archivo de la cabecera Content-Disposition.
 * Ejemplo: 'attachment; filename="Reconocimiento_Ana.pdf"' -> 'Reconocimiento_Ana.pdf'
 */
function nombreDelArchivo(respuesta, nombrePorDefecto) {
  const cabecera = respuesta.headers.get('Content-Disposition');
  if (!cabecera || !cabecera.includes('filename="')) {
    return nombrePorDefecto;
  }
  const inicio = cabecera.indexOf('filename="') + 'filename="'.length;
  const fin = cabecera.indexOf('"', inicio);
  return cabecera.substring(inicio, fin);
}

/** Desactiva un botón y cambia su texto (mientras se genera algo). */
function ponerBotonOcupado(boton, texto) {
  boton.dataset.textoOriginal = boton.textContent; // guarda el texto para después
  boton.textContent = texto;
  boton.disabled = true;
}

/** Vuelve a activar el botón con su texto original. */
function liberarBoton(boton) {
  boton.textContent = boton.dataset.textoOriginal;
  boton.disabled = false;
}

function mostrar(elemento) {
  elemento.classList.remove('oculto');
}

function ocultar(elemento) {
  elemento.classList.add('oculto');
}


// =============================================================
//  3. MENÚ Y MÓDULOS
//  Al entrar, la página muestra el menú para elegir el tipo de
//  diploma. Al elegir uno se abre el generador con sus campos.
//
//  Los campos del otro módulo se ocultan y se desactivan
//  (disabled): así el navegador no los revisa ni los envía.
// =============================================================

const opcionesMenu = document.querySelectorAll('.opcion');

for (const opcion of opcionesMenu) {
  opcion.addEventListener('click', function () {
    // La tarjeta de "Quitar fondo" es una herramienta, no un diploma (ver quitar-fondo.js)
    if (opcion.dataset.herramienta === 'quitar-fondo') {
      abrirQuitarFondo(opcion.dataset.titulo);
      return;
    }
    // data-modulo y data-titulo vienen del HTML
    abrirGenerador(opcion.dataset.modulo, opcion.dataset.titulo);
  });
}

botonMenu.addEventListener('click', volverAlMenu);

/** Oculta el menú y muestra el generador del tipo de diploma elegido. */
function abrirGenerador(idModulo, titulo) {
  cambiarModulo(idModulo);
  textoTipoElegido.textContent = titulo;

  ocultar(pantallaMenu);
  mostrar(pantallaGenerador);
  cajaTipoElegido.classList.remove('invisible');
  barraPestanas.classList.remove('invisible');
}

/** Vuelve al menú para elegir otro tipo de diploma. */
function volverAlMenu() {
  mostrar(pantallaMenu);
  ocultar(pantallaGenerador);
  ocultar(pantallaHerramientaFondo);
  // "invisible" (y no "oculto") para que el encabezado conserve su altura
  cajaTipoElegido.classList.add('invisible');
  barraPestanas.classList.add('invisible');
}

/** Prepara la página para un módulo: sus campos, su Excel modelo, etc. */
function cambiarModulo(idModulo) {
  moduloActual = idModulo;

  // Muestra los campos de este módulo y oculta los de los otros
  mostrarCamposDelModulo(idModulo);

  // Marca el módulo en <body data-modulo="...">: el CSS lo usa para adaptar
  // el diseño (por ejemplo, la vista previa vertical de la nota de duelo)
  document.body.dataset.modulo = idModulo;

  // El Excel modelo es distinto en cada módulo
  enlaceModelo.href = `${urlDelModulo()}/excel/modelo`;

  // Borra la vista previa anterior
  marcoVistaPrevia.src = 'about:blank';
  mostrar(textoVistaVacia);

  // Si ya había un Excel, se revisa otra vez con las reglas del nuevo módulo
  if (archivoExcel !== null) {
    revisarExcel();
  }

  // La miniatura de "Personalizar" ahora debe mostrar este módulo
  imagenMiniVista.removeAttribute('src');
  programarMiniVista();
}

/**
 * Revisa todos los elementos que tienen data-modulos en el HTML.
 * Si el módulo elegido está en su lista, se muestran (y se activan sus campos);
 * si no, se ocultan (y se desactivan).
 *
 * Ejemplo: <label data-modulos="reconocimientos duelo"> se ve en esos dos módulos.
 */
function mostrarCamposDelModulo(idModulo) {
  const elementos = document.querySelectorAll('[data-modulos]');

  for (const elemento of elementos) {
    // 'reconocimientos duelo' -> ['reconocimientos', 'duelo']
    const modulosDelElemento = elemento.dataset.modulos.split(' ');
    const visible = modulosDelElemento.includes(idModulo);

    if (visible) {
      mostrar(elemento);
    } else {
      ocultar(elemento);
    }

    // Los campos dentro de ese elemento: activos solo si se ven
    const campos = elemento.querySelectorAll('input, textarea, select');
    for (const campo of campos) {
      campo.disabled = !visible;
    }
  }
}


// =============================================================
//  4. PESTAÑAS
// =============================================================

const pestanas = document.querySelectorAll('.pestana');
const paneles = document.querySelectorAll('.panel');

for (const pestana of pestanas) {
  pestana.addEventListener('click', function () {
    const idPanel = pestana.dataset.panel; // viene de data-panel="..." en el HTML

    // Marca la pestaña elegida
    for (const otra of pestanas) {
      otra.classList.remove('activa');
    }
    pestana.classList.add('activa');

    // Muestra solo su panel
    for (const panel of paneles) {
      if (panel.id === idPanel) {
        panel.classList.add('activo');
      } else {
        panel.classList.remove('activo');
      }
    }

  });
}


// =============================================================
//  5. CONFIGURACIÓN
//  Pide al servidor los valores por defecto para mostrarlos en
//  gris, y conecta los contadores de caracteres.
// =============================================================

async function cargarConfiguracion() {
  const respuesta = await pedirAlServidor('/api/configuracion');
  const configuracion = await respuesta.json();

  // Valores por defecto como texto gris (placeholder) en los campos vacíos
  const valores = configuracion.valoresPorDefecto;
  for (const nombreCampo in valores) {
    const valor = valores[nombreCampo];
    if (valor === '') {
      continue; // sin valor por defecto: se deja el placeholder del HTML
    }
    const campos = document.querySelectorAll(`[name="${nombreCampo}"]`);
    for (const campo of campos) {
      campo.placeholder = valor;
    }
  }

}

/**
 * Muestra "65 / 400" debajo de cada texto largo.
 * Busca todos los <small class="contador"> y los conecta con el <textarea>
 * que está en el mismo <label>. El límite es su maxlength del HTML.
 */
function conectarContadores() {
  const contadores = document.querySelectorAll('.contador');
  for (const contador of contadores) {
    const areaTexto = contador.parentElement.querySelector('textarea');
    conectarContador(areaTexto, contador);
  }
}

function conectarContador(areaTexto, contador) {
  const limite = areaTexto.maxLength;

  function actualizar() {
    const usados = areaTexto.value.length;
    contador.textContent = `${usados} / ${limite}`;

    if (usados >= limite) {
      contador.classList.add('contador--limite'); // en rojo
    } else {
      contador.classList.remove('contador--limite');
    }
  }

  areaTexto.addEventListener('input', actualizar);
  actualizar();
}


// =============================================================
//  6. PERSONALIZAR (color de la banda, encabezado, título y logo)
//  Es opcional. Lo elegido se envía junto con cada PDF que se genera
//  (ver agregarPersonalizacion). Si no se toca, el servidor usa el
//  diseño por defecto.
// =============================================================

// ---------- Selectores de color ----------
// En el HTML hay un bloque .selector-color por cada color que se puede cambiar
// (la banda; en Placas también la cinta secundaria y el nombre). Todos funcionan
// igual, así que se preparan con la misma función.
//
// En cada uno hay tres formas de elegir: un color rápido, el círculo "Otro…"
// (el selector del navegador) o escribiendo el código. Las tres terminan en elegirColor().

for (const selector of selectoresColor) {
  prepararSelectorColor(selector);
}

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

  // "Otro…": cualquier color ('input' se dispara mientras se mueve el selector)
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
  if (elegido === '') {
    return selector.dataset.porDefecto;
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
 * la línea del color elegido y pide la miniatura.
 * "actualizarVista" = false solo al preparar la página.
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
  // --color-elegido pinta la muestra grande y el círculo "Otro…" de este selector.
  selector.style.setProperty('--color-elegido', color);
  if (campo === 'colorBanda') {
    panelPersonalizar.style.setProperty('--color-banda', color); // la muestra del título del panel
  }

  const campoCodigo = selector.querySelector('.color-elegido__input');
  selector.querySelector('.selector-color__libre').value = color.toLowerCase();
  if (document.activeElement !== campoCodigo) {
    campoCodigo.value = color; // (si lo está escribiendo, no se le cambia)
  }

  // 1. Marca el color rápido elegido; si no es ninguno, se marca "Otro…"
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

  // 2. Nombre y detalle del color elegido
  const textoNombre = selector.querySelector('.color-elegido__nombre');
  const textoDetalle = selector.querySelector('.color-elegido__detalle');
  if (botonElegido !== null) {
    textoNombre.textContent = botonElegido.dataset.nombre;
  } else {
    textoNombre.textContent = 'Color personalizado';
  }
  if (color === porDefecto) {
    textoDetalle.textContent = 'Color por defecto';
  } else {
    textoDetalle.textContent = 'Así saldrá en el documento';
  }

  // 3. Aviso si es muy claro (y la ✓ del círculo elegido se pone oscura para que se vea)
  const aviso = selector.querySelector('.color-elegido__aviso');
  const circuloElegido = botonElegido || botonLibre;
  for (const boton of selector.querySelectorAll('.color')) {
    boton.classList.remove('color--claro');
  }
  if (esColorClaro(color)) {
    circuloElegido.classList.add('color--claro');
  }
  // El aviso solo en los selectores que pintan texto (data-aviso-claro="si")
  if (esColorClaro(color) && selector.dataset.avisoClaro === 'si') {
    mostrar(aviso);
  } else {
    ocultar(aviso);
  }

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

// ---------- Encabezado y título ----------
// Al escribir, se actualiza la miniatura (ver "Vista en miniatura" más abajo)

// (Se envuelve en function () {} para que el evento no llegue como "espera")
inputEncabezado1.addEventListener('input', function () { programarMiniVista(); });
inputEncabezado2.addEventListener('input', function () { programarMiniVista(); });
inputTitulo.addEventListener('input', function () { programarMiniVista(); });

// ---------- Logo ----------

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
  if (archivo.size > 2 * 1024 * 1024) {
    mostrarMensaje(mensajePersonalizar, 'El logo no puede pesar más de 2 MB', 'error');
    return;
  }

  archivoLogo = archivo;
  textoNombreLogo.textContent = archivo.name;
  mostrar(botonQuitarLogo);
  mostrarMensaje(mensajePersonalizar, '', 'normal');
  programarMiniVista();
});

botonQuitarLogo.addEventListener('click', quitarLogo);

function quitarLogo() {
  archivoLogo = null;
  textoNombreLogo.textContent = 'Logo de UNICAH (por defecto)';
  ocultar(botonQuitarLogo);
  programarMiniVista();
}

// ---------- Restablecer ----------

botonRestablecer.addEventListener('click', function () {
  inputTitulo.value = '';
  inputEncabezado1.value = '';
  inputEncabezado2.value = '';
  restablecerColores();
  quitarLogo();
  mostrarMensaje(mensajePersonalizar, '', 'normal');
});

/** Agrega un campo de texto al envío, si está activo y no está vacío. */
function agregarTexto(envio, nombre, campo) {
  const texto = campo.value.trim();
  if (!campo.disabled && texto !== '') {
    envio.append(nombre, texto);
  }
}

/**
 * Agrega el color, el encabezado, el título y el logo elegidos a lo que se envía al servidor.
 * Si no se eligió nada, no agrega nada (el servidor usa el diseño por defecto).
 */
function agregarPersonalizacion(envio) {
  // Colores: solo los que se cambiaron y cuyo selector se ve en este módulo
  for (const selector of selectoresColor) {
    const campo = selector.dataset.campo;
    const seVe = !selector.querySelector('.color-elegido__input').disabled;
    if (seVe && coloresElegidos[campo] !== '') {
      envio.append(campo, coloresElegidos[campo]);
    }
  }
  // Los textos solo se envían si su campo está activo (según el módulo) y tiene algo
  agregarTexto(envio, 'titulo', inputTitulo);           // comunicado de duelo
  agregarTexto(envio, 'encabezado1', inputEncabezado1); // diplomas
  agregarTexto(envio, 'encabezado2', inputEncabezado2);
  if (archivoLogo !== null) {
    envio.append('logo', archivoLogo);
  }
}

// ---------- Vista en miniatura ----------
// El servidor dibuja el documento real (con datos de ejemplo, o con lo que ya
// escribiste en "Uno a la vez") y devuelve una imagen pequeña.
// Solo se pide cuando el panel "Personalizar" está abierto.

let temporizadorMiniVista = null;
let numeroDePeticion = 0; // para ignorar respuestas viejas si llegan tarde

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

async function actualizarMiniVista() {
  numeroDePeticion = numeroDePeticion + 1;
  const estaPeticion = numeroDePeticion;

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
    const respuesta = await pedirAlServidor(`${urlDelModulo()}/miniatura`, { method: 'POST', body: envio });
    const imagen = await respuesta.blob();

    if (estaPeticion !== numeroDePeticion) {
      return; // mientras tanto se pidió otra más nueva: esta ya no sirve
    }
    if (imagenMiniVista.src.startsWith('blob:')) {
      URL.revokeObjectURL(imagenMiniVista.src); // libera la imagen anterior
    }
    imagenMiniVista.src = URL.createObjectURL(imagen);
    textoMiniVista.textContent = '';
  } catch (error) {
    if (estaPeticion === numeroDePeticion) {
      textoMiniVista.textContent = error.message;
    }
  }
  if (estaPeticion === numeroDePeticion) {
    cajaMiniVista.classList.remove('cargando');
  }
}

// Al abrir el panel, se dibuja la miniatura
panelPersonalizar.addEventListener('toggle', function () {
  if (panelPersonalizar.open) {
    actualizarMiniVista();
  }
});

// Si escribes en "Uno a la vez" con el panel abierto, la miniatura también cambia
formIndividual.addEventListener('input', function () { programarMiniVista(600); });


// =============================================================
//  7. PESTAÑA "DESDE EXCEL"
// =============================================================

// ---------- Elegir el archivo ----------

// Clic en la zona: abre el buscador de archivos (menos si hizo clic en el enlace del modelo)
zonaExcel.addEventListener('click', function (evento) {
  if (evento.target.tagName !== 'A') {
    inputExcel.click();
  }
});

// Enter en la zona (para usarla con teclado)
zonaExcel.addEventListener('keydown', function (evento) {
  if (evento.key === 'Enter') {
    inputExcel.click();
  }
});

// Eligió un archivo con el buscador
inputExcel.addEventListener('change', function () {
  usarArchivo(inputExcel.files[0]);
});

// ---------- Arrastrar y soltar ----------

// El archivo está encima de la zona
zonaExcel.addEventListener('dragover', function (evento) {
  evento.preventDefault(); // necesario para que se permita soltar
  zonaExcel.classList.add('arrastrando');
});

// El archivo salió de la zona sin soltarse
zonaExcel.addEventListener('dragleave', function () {
  zonaExcel.classList.remove('arrastrando');
});

// Soltó el archivo en la zona
zonaExcel.addEventListener('drop', function (evento) {
  evento.preventDefault(); // evita que el navegador abra el archivo
  zonaExcel.classList.remove('arrastrando');
  usarArchivo(evento.dataTransfer.files[0]);
});

// Si suelta el archivo fuera de la zona, que el navegador no lo abra
window.addEventListener('dragover', function (evento) {
  evento.preventDefault();
});
window.addEventListener('drop', function (evento) {
  evento.preventDefault();
});

// ---------- Usar el archivo ----------

function usarArchivo(archivo) {
  if (!archivo) {
    return;
  }
  if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
    mostrarMensaje(mensajeExcel, 'Solo se aceptan archivos .xlsx', 'error');
    return;
  }

  archivoExcel = archivo;
  textoNombreArchivo.textContent = archivo.name;
  textoTamanoArchivo.textContent = `${Math.ceil(archivo.size / 1024)} KB`;

  ocultar(zonaExcel);
  mostrar(cajaArchivoCargado);
  revisarExcel();
}

botonCambiarArchivo.addEventListener('click', function () {
  archivoExcel = null;
  inputExcel.value = '';
  mostrar(zonaExcel);
  ocultar(cajaArchivoCargado);
  ocultar(seccionRevision);
  mostrarMensaje(mensajeExcel, '', 'normal');
});

/** Arma lo que se envía al servidor: el Excel + los datos comunes. */
function prepararEnvioExcel() {
  const envio = new FormData();
  envio.append('archivo', archivoExcel);

  const datosComunes = leerFormulario(formComunes);
  for (const nombreCampo in datosComunes) {
    envio.append(nombreCampo, datosComunes[nombreCampo]);
  }
  return envio;
}

// ---------- Revisar (tabla) ----------

/** Envía el Excel al servidor para saber cómo quedará cada fila. */
async function revisarExcel() {
  mostrarMensaje(mensajeExcel, 'Revisando el Excel…', 'normal');

  try {
    const respuesta = await pedirAlServidor(`${urlDelModulo()}/excel/revisar`, {
      method: 'POST',
      body: prepararEnvioExcel(),
    });
    const resultado = await respuesta.json();
    mostrarRevision(resultado);
    mostrarMensaje(mensajeExcel, '', 'normal');
  } catch (error) {
    ocultar(seccionRevision);
    mostrarMensaje(mensajeExcel, error.message, 'error');
  }
}

/** Llena el resumen y la tabla con lo que respondió el servidor. */
function mostrarRevision(resultado) {
  mostrar(seccionRevision);
  document.getElementById('total-filas').textContent = resultado.total;
  document.getElementById('total-validas').textContent = resultado.validas;
  document.getElementById('total-errores').textContent = resultado.conErrores;

  cuerpoTabla.innerHTML = ''; // borra la tabla anterior

  // Las filas sin errores: son las que se pueden ver en la ventana de vista previa
  filasParaVer = [];
  for (const fila of resultado.filas) {
    if (fila.errores.length === 0) {
      filasParaVer.push(fila);
    }
  }

  for (const fila of resultado.filas) {
    const tr = document.createElement('tr');
    const tieneErrores = fila.errores.length > 0;
    if (tieneErrores) {
      tr.classList.add('fila-error');
    }

    agregarCelda(tr, fila.fila);
    agregarCelda(tr, fila.principal);              // nombre, o el lugar obtenido en Lugares
    agregarCelda(tr, fila.resumen, 'celda-larga'); // texto corto que arma el servidor según el módulo
    agregarCelda(tr, fila.datos.lugar);
    agregarCelda(tr, fila.datos.fecha);

    if (tieneErrores) {
      agregarCelda(tr, fila.errores.join('; '), 'estado-error');
      agregarCelda(tr, '');
    } else {
      agregarCelda(tr, 'Lista', 'estado-ok');
      agregarBotonVer(tr, filasParaVer.indexOf(fila));
    }

    cuerpoTabla.appendChild(tr);
  }

  botonGenerarExcel.disabled = resultado.validas === 0;
  botonGenerarExcel.textContent = `Generar PDF con ${resultado.validas} diploma(s)`;
}

/** Agrega la celda con el botón "Ver", que abre la vista previa de esa fila. */
function agregarBotonVer(tr, posicion) {
  const celda = document.createElement('td');
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = 'Ver';
  boton.classList.add('boton', 'boton--chico');
  boton.addEventListener('click', function () {
    abrirVentanaVista(posicion);
  });
  celda.appendChild(boton);
  tr.appendChild(celda);
}

/** Agrega una celda <td> con texto a una fila de la tabla. */
function agregarCelda(fila, texto, clase) {
  const celda = document.createElement('td');
  if (texto === undefined) {
    texto = '—'; // el módulo no usa ese dato (ej. Agradecimientos no lleva lugar)
  }
  celda.textContent = texto;
  if (clase) {
    celda.classList.add(clase);
  }
  fila.appendChild(celda);
}

// ---------- Ventana de vista previa de las filas ----------
// Muestra el PDF de una fila del Excel, tal como quedará (con los datos
// comunes y la personalización). Con Anterior / Siguiente se recorren
// las filas sin errores.

let filasParaVer = [];  // las filas sin errores de la última revisión
let posicionEnVentana = 0;

function abrirVentanaVista(posicion) {
  posicionEnVentana = posicion;
  ventanaVista.showModal(); // abre la ventana encima de la página
  mostrarFilaEnVentana();
}

async function mostrarFilaEnVentana() {
  const fila = filasParaVer[posicionEnVentana];
  tituloVentana.textContent = `Fila ${fila.fila} · ${fila.principal}`;
  contadorVentana.textContent = `${posicionEnVentana + 1} de ${filasParaVer.length}`;
  botonAnterior.disabled = posicionEnVentana === 0;
  botonSiguiente.disabled = posicionEnVentana === filasParaVer.length - 1;

  marcoVentana.src = 'about:blank';
  textoCargandoVentana.textContent = 'Generando vista previa…';

  // Se envían los datos de la fila (ya revisados) y la personalización
  const envio = new FormData();
  for (const nombreCampo in fila.datos) {
    envio.append(nombreCampo, fila.datos[nombreCampo]);
  }
  agregarPersonalizacion(envio);

  try {
    const respuesta = await pedirAlServidor(`${urlDelModulo()}?vista=1`, { method: 'POST', body: envio });
    const pdf = await respuesta.blob();
    marcoVentana.src = URL.createObjectURL(pdf) + '#toolbar=0&navpanes=0&view=Fit';
  } catch (error) {
    textoCargandoVentana.textContent = error.message;
  }
}

botonAnterior.addEventListener('click', function () {
  if (posicionEnVentana > 0) {
    posicionEnVentana = posicionEnVentana - 1;
    mostrarFilaEnVentana();
  }
});

botonSiguiente.addEventListener('click', function () {
  if (posicionEnVentana < filasParaVer.length - 1) {
    posicionEnVentana = posicionEnVentana + 1;
    mostrarFilaEnVentana();
  }
});

botonCerrarVentana.addEventListener('click', function () {
  ventanaVista.close();
});

// Con el teclado: flechas para moverse (Esc ya cierra la ventana solo).
// Se escucha en toda la página porque el foco puede estar en cualquier parte.
document.addEventListener('keydown', function (evento) {
  if (!ventanaVista.open) {
    return;
  }
  if (evento.key === 'ArrowLeft') {
    botonAnterior.click();
  } else if (evento.key === 'ArrowRight') {
    botonSiguiente.click();
  }
});

// Si cambian los datos comunes, se revisa de nuevo.
// Se espera medio segundo sin escribir para no enviar una petición por cada tecla.
let temporizador = null;
formComunes.addEventListener('input', function () {
  clearTimeout(temporizador);
  temporizador = setTimeout(revisarExcel, 600);
});

// ---------- Generar el PDF con todos ----------

botonGenerarExcel.addEventListener('click', async function () {
  ponerBotonOcupado(botonGenerarExcel, 'Generando…');

  try {
    const envio = prepararEnvioExcel();
    agregarPersonalizacion(envio); // color, encabezado, título y logo, si se eligieron

    const respuesta = await pedirAlServidor(`${urlDelModulo()}/excel`, {
      method: 'POST',
      body: envio,
    });

    const nombre = nombreDelArchivo(respuesta, 'Diplomas.pdf');
    const omitidas = Number(respuesta.headers.get('X-Filas-Omitidas'));
    await descargarArchivo(respuesta, nombre);

    let texto = `¡Listo! Se descargó ${nombre}.`;
    if (omitidas > 0) {
      texto = texto + ` Se omitieron ${omitidas} fila(s) con errores.`;
    }
    mostrarMensaje(mensajeExcel, texto, 'ok');
  } catch (error) {
    mostrarMensaje(mensajeExcel, error.message, 'error');
  }

  liberarBoton(botonGenerarExcel);
});


// =============================================================
//  8. PESTAÑA "UNO A LA VEZ"
// =============================================================

/**
 * Pide al servidor el PDF con los datos del formulario.
 * Si "paraVistaPrevia" es true, el servidor lo prepara para verse en la página.
 */
function pedirPDFIndividual(paraVistaPrevia) {
  let url = urlDelModulo();
  if (paraVistaPrevia) {
    url = url + '?vista=1';
  }
  return enviarFormularioIndividual(url);
}

/** Pide al servidor la imagen PNG con los datos del formulario. */
function pedirImagenIndividual() {
  return enviarFormularioIndividual(urlDelModulo() + '/imagen');
}

/** Envía los datos del formulario (y la personalización) a la URL indicada. */
function enviarFormularioIndividual(url) {
  // Se envía como FormData (igual que un formulario) porque puede llevar el logo
  const envio = new FormData();
  const datos = leerFormulario(formIndividual);
  for (const nombreCampo in datos) {
    envio.append(nombreCampo, datos[nombreCampo]);
  }
  agregarPersonalizacion(envio); // color, encabezado, título y logo, si se eligieron

  return pedirAlServidor(url, {
    method: 'POST',
    body: envio,
  });
}

// Vista previa
botonVistaPrevia.addEventListener('click', async function () {
  // reportValidity() revisa los campos "required" y muestra el aviso del navegador
  if (!formIndividual.reportValidity()) {
    return;
  }

  ponerBotonOcupado(botonVistaPrevia, 'Generando…');
  try {
    const respuesta = await pedirPDFIndividual(true);
    const pdf = await respuesta.blob();
    // "#toolbar=0&view=Fit" le pide al visor que oculte su barra y ajuste la página
    marcoVistaPrevia.src = URL.createObjectURL(pdf) + '#toolbar=0&navpanes=0&view=Fit';
    ocultar(textoVistaVacia);
    mostrarMensaje(mensajeIndividual, '', 'normal');
  } catch (error) {
    mostrarMensaje(mensajeIndividual, error.message, 'error');
  }
  liberarBoton(botonVistaPrevia);
});

// Descargar
formIndividual.addEventListener('submit', async function (evento) {
  evento.preventDefault(); // evita que el formulario recargue la página

  ponerBotonOcupado(botonDescargar, 'Generando…');
  try {
    const respuesta = await pedirPDFIndividual(false);
    const nombre = nombreDelArchivo(respuesta, 'diploma.pdf');
    await descargarArchivo(respuesta, nombre);
    mostrarMensaje(mensajeIndividual, '¡Listo!', 'ok');
  } catch (error) {
    mostrarMensaje(mensajeIndividual, error.message, 'error');
  }
  liberarBoton(botonDescargar);
});

// Descargar como imagen (el botón solo se ve en los módulos que lo permiten)
botonImagen.addEventListener('click', async function () {
  if (!formIndividual.reportValidity()) {
    return;
  }

  ponerBotonOcupado(botonImagen, 'Generando…');
  try {
    const respuesta = await pedirImagenIndividual();
    const nombre = nombreDelArchivo(respuesta, 'imagen.png');
    await descargarArchivo(respuesta, nombre);
    mostrarMensaje(mensajeIndividual, '¡Listo!', 'ok');
  } catch (error) {
    mostrarMensaje(mensajeIndividual, error.message, 'error');
  }
  liberarBoton(botonImagen);
});


// =============================================================
//  9. INICIO
// =============================================================

// Contadores de caracteres de todos los textos largos
conectarContadores();

// Año actual en el pie de página: © 2026, © 2027…
document.getElementById('anio-actual').textContent = new Date().getFullYear();

// La página empieza en el menú (el generador está oculto en el HTML)

cargarConfiguracion().catch(function () {
  mostrarMensaje(mensajeExcel, 'No se pudo conectar con el servidor', 'error');
});
