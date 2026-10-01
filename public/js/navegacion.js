// =============================================================
//  navegacion.js — MENÚ, ENCABEZADO, PESTAÑAS Y CAMBIO DE MÓDULO
//
//  Pantallas de la página (solo una se ve a la vez):
//    - Menú (#menu): las tarjetas para elegir qué generar, en 2 lengüetas:
//      "Documentos" (los módulos de diplomas) y "Herramientas".
//    - Generador (#generador): el formulario del módulo elegido.
//    - Herramientas (<section class="herramienta" data-herramienta="…">):
//      quitar el fondo de un logo (#herramienta-fondo) y generar un QR
//      (#herramienta-qr). Para agregar otra: su <section> con
//      data-herramienta="mi-id" + una tarjeta con el mismo data-herramienta.
//
//  En el encabezado:   ⌂ Inicio  ›  Placas ▾
//    - "Inicio" (o el logo) vuelve al menú.
//    - "Placas ▾" abre una lista para cambiar a otro módulo directamente.
//      La lista se arma copiando las tarjetas del menú: si agregas una
//      tarjeta nueva en index.html, aparece aquí sola.
//
//  IMPORTA                                   DE               PARA
//  mostrar, ocultar                          utilidades.js    cambiar de pantalla
//  obtenerModuloActual, cambiarModuloActual  estado.js        recordar qué módulo está abierto
//  personalizarAlCambiarDeModulo             personalizar.js  preparar colores y miniatura del módulo
//  individualAlCambiarDeModulo               individual.js    borrar la vista previa del módulo anterior
//  excelAlCambiarDeModulo                    excel.js         su Excel modelo y volver a revisar
//
//  EXPORTA                 LO IMPORTA  PARA
//  iniciarNavegacion()     main.js     arrancar esta parte
//  pantallaActual()        ayuda.js    saber qué se está viendo ('menu', 'generador', 'herramienta')
//  herramientaAbierta()    ayuda.js    cuál herramienta se ve ('quitar-fondo', 'qr' o null)
//  mostrarGrupoDelMenu(g)  ayuda.js    abrir la lengüeta 'documentos' o 'herramientas' del menú
//  abrirPorId(id)          ayuda.js    llevar al usuario a un módulo o herramienta para el recorrido
//  volverAlInicio()        ayuda.js    llevarlo al menú
//  mostrarPestana(idPanel) ayuda.js    abrir "Uno a la vez" o "Desde Excel"
// =============================================================
import { mostrar, ocultar } from './utilidades.js';
import { obtenerModuloActual, cambiarModuloActual } from './estado.js';
import { personalizarAlCambiarDeModulo } from './personalizar.js';
import { individualAlCambiarDeModulo } from './individual.js';
import { excelAlCambiarDeModulo } from './excel.js';

// ---------- Elementos de la página ----------
const pantallaMenu = document.getElementById('menu');
const pantallaGenerador = document.getElementById('generador');
const pantallasHerramientas = document.querySelectorAll('section.herramienta'); // una por herramienta
const lenguetasMenu = document.querySelectorAll('.lengueta-menu');       // "Documentos" / "Herramientas"
const gruposMenu = document.querySelectorAll('.menu__opciones[data-grupo]');
const tarjetasDelMenu = document.querySelectorAll('.opcion');
const enlaceMarca = document.getElementById('enlace-marca');
const barraNavegacion = document.getElementById('navegacion');
const botonInicio = document.getElementById('boton-inicio');
const selectorModulo = document.getElementById('selector-modulo');
const textoModuloActual = document.getElementById('nombre-modulo-actual');
const listaModulos = document.getElementById('lista-modulos');
const barraPestanas = document.getElementById('pestanas');
const pestanas = document.querySelectorAll('.pestana');
const paneles = document.querySelectorAll('.panel');

// Qué está abierto: el id del módulo ('placas'…) o el de la herramienta ('quitar-fondo')
let abiertoAhora = null;


// =============================================================
//  ARRANQUE
// =============================================================

/** Conecta el menú, el encabezado y las pestañas (se llama una vez, desde main.js). */
export function iniciarNavegacion() {
  // Tarjetas del menú
  for (const tarjeta of tarjetasDelMenu) {
    tarjeta.addEventListener('click', function () {
      abrirTarjeta(tarjeta);
    });
  }

  // Volver al inicio: botón "Inicio" o el logo
  botonInicio.addEventListener('click', volverAlInicio);
  enlaceMarca.addEventListener('click', function (evento) {
    evento.preventDefault(); // no recarga la página (así no se pierde lo que elegiste)
    volverAlInicio();
  });

  prepararLenguetasDelMenu();
  armarListaDeModulos();
  prepararCierreDeLaLista();
  prepararPestanas();
}


// =============================================================
//  ABRIR UN MÓDULO, LA HERRAMIENTA O EL MENÚ
// =============================================================

/**
 * Abre lo que corresponde a una tarjeta del menú.
 * Las tarjetas de diplomas tienen data-modulo; la de "Quitar fondo", data-herramienta.
 */
function abrirTarjeta(tarjeta) {
  if (tarjeta.dataset.herramienta) {
    abrirHerramienta(tarjeta.dataset.herramienta, tarjeta.dataset.titulo);
  } else {
    abrirModulo(tarjeta.dataset.modulo, tarjeta.dataset.titulo);
  }
  window.scrollTo(0, 0);
}

/** Muestra el generador de un módulo (ej. 'placas', 'Placas'). */
function abrirModulo(idModulo, titulo) {
  if (idModulo !== obtenerModuloActual() || pantallaGenerador.classList.contains('oculto')) {
    cambiarDeModulo(idModulo);
  }

  ocultar(pantallaMenu);
  ocultarHerramientas();
  mostrar(pantallaGenerador);
  mostrarNavegacion(idModulo, titulo, true);
}

/** Muestra una herramienta: 'quitar-fondo' o 'qr' (la <section> con ese data-herramienta). */
function abrirHerramienta(idHerramienta, titulo) {
  ocultar(pantallaMenu);
  ocultar(pantallaGenerador);
  for (const pantalla of pantallasHerramientas) {
    if (pantalla.dataset.herramienta === idHerramienta) {
      mostrar(pantalla);
    } else {
      ocultar(pantalla);
    }
  }
  mostrarNavegacion(idHerramienta, titulo, false); // las herramientas no tienen pestañas
}

/** Vuelve al menú de tarjetas. */
export function volverAlInicio() {
  mostrar(pantallaMenu);
  ocultar(pantallaGenerador);
  ocultarHerramientas();
  selectorModulo.open = false;

  // Si venía de una herramienta, el menú se abre en "Herramientas"
  if (abiertoAhora !== null && herramientaAbiertaAntes(abiertoAhora)) {
    mostrarGrupoDelMenu('herramientas');
  } else if (abiertoAhora !== null) {
    mostrarGrupoDelMenu('documentos');
  }

  // "invisible" (y no "oculto") para que el encabezado conserve su altura
  barraNavegacion.classList.add('invisible');
  barraPestanas.classList.add('invisible');
  abiertoAhora = null;
  window.scrollTo(0, 0);
}

/** Muestra "⌂ Inicio › <título>" en el encabezado y marca lo abierto en la lista. */
function mostrarNavegacion(idAbierto, titulo, conPestanas) {
  abiertoAhora = idAbierto;
  textoModuloActual.textContent = titulo;
  barraNavegacion.classList.remove('invisible');

  if (conPestanas) {
    barraPestanas.classList.remove('invisible');
  } else {
    barraPestanas.classList.add('invisible');
  }

  for (const opcion of listaModulos.querySelectorAll('.opcion-rapida')) {
    if (opcion.dataset.id === idAbierto) {
      opcion.classList.add('actual');
      opcion.setAttribute('aria-current', 'page');
    } else {
      opcion.classList.remove('actual');
      opcion.removeAttribute('aria-current');
    }
  }
}


/**
 * Abre un módulo o herramienta por su id, como si se hiciera clic en su tarjeta.
 * Ej. abrirPorId('placas'), abrirPorId('quitar-fondo').
 */
export function abrirPorId(id) {
  for (const tarjeta of tarjetasDelMenu) {
    if (tarjeta.dataset.modulo === id || tarjeta.dataset.herramienta === id) {
      abrirTarjeta(tarjeta);
      return;
    }
  }
}

/** Qué pantalla se ve ahora: 'menu', 'generador' o 'herramienta'. */
export function pantallaActual() {
  if (!pantallaGenerador.classList.contains('oculto')) {
    return 'generador';
  }
  if (herramientaAbierta() !== null) {
    return 'herramienta';
  }
  return 'menu';
}

/** El id de la herramienta que se ve ('quitar-fondo', 'qr'), o null si no hay ninguna. */
export function herramientaAbierta() {
  for (const pantalla of pantallasHerramientas) {
    if (!pantalla.classList.contains('oculto')) {
      return pantalla.dataset.herramienta;
    }
  }
  return null;
}

/** Oculta todas las herramientas. */
function ocultarHerramientas() {
  for (const pantalla of pantallasHerramientas) {
    ocultar(pantalla);
  }
}


// =============================================================
//  LENGÜETAS DEL MENÚ ("Documentos" / "Herramientas")
// =============================================================

/** Conecta las lengüetas y pone cuántas tarjetas tiene cada grupo. */
function prepararLenguetasDelMenu() {
  for (const lengueta of lenguetasMenu) {
    lengueta.addEventListener('click', function () {
      mostrarGrupoDelMenu(lengueta.dataset.grupo);
    });
  }
  for (const grupo of gruposMenu) {
    const cantidad = grupo.querySelectorAll('.opcion').length;
    document.querySelector(`[data-cantidad="${grupo.dataset.grupo}"]`).textContent = cantidad;
  }
}

/** Muestra un grupo de tarjetas: 'documentos' o 'herramientas'. */
export function mostrarGrupoDelMenu(nombreGrupo) {
  for (const lengueta of lenguetasMenu) {
    const esEsta = lengueta.dataset.grupo === nombreGrupo;
    lengueta.classList.toggle('activa', esEsta);
    lengueta.setAttribute('aria-selected', esEsta ? 'true' : 'false');
  }
  for (const grupo of gruposMenu) {
    if (grupo.dataset.grupo === nombreGrupo) {
      mostrar(grupo);
    } else {
      ocultar(grupo);
    }
  }
}

/** true si el id es de una herramienta ('quitar-fondo', 'qr'), no de un módulo. */
function herramientaAbiertaAntes(id) {
  for (const pantalla of pantallasHerramientas) {
    if (pantalla.dataset.herramienta === id) {
      return true;
    }
  }
  return false;
}


// =============================================================
//  CAMBIAR DE MÓDULO
//  Cada parte de la página se prepara para el nuevo módulo con su
//  función "…AlCambiarDeModulo". Si agregas una parte nueva que
//  dependa del módulo, llámala aquí.
// =============================================================

function cambiarDeModulo(idModulo) {
  cambiarModuloActual(idModulo);
  mostrarCamposDelModulo(idModulo);

  // <body data-modulo="placas">: el CSS lo usa para adaptar el diseño
  // (por ejemplo, la vista previa vertical del comunicado)
  document.body.dataset.modulo = idModulo;

  individualAlCambiarDeModulo();
  excelAlCambiarDeModulo();
  personalizarAlCambiarDeModulo(idModulo);
}

/**
 * Revisa todos los elementos que tienen data-modulos en el HTML.
 * Si el módulo elegido está en su lista, se muestran (y se activan sus campos);
 * si no, se ocultan y se desactivan (disabled): así el navegador no los
 * revisa ni los envía.
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

    const campos = elemento.querySelectorAll('input, textarea, select');
    for (const campo of campos) {
      campo.disabled = !visible;
    }
  }
}


// =============================================================
//  LISTA PARA CAMBIAR DE MÓDULO (en el encabezado)
// =============================================================

/**
 * Crea un botón en la lista por cada tarjeta del menú, con su imagen,
 * su título y lo que pide. Al hacer clic, abre lo mismo que la tarjeta.
 */
function armarListaDeModulos() {
  let grupoAnterior = '';
  for (const tarjeta of tarjetasDelMenu) {
    // Un subtítulo cuando empieza otro grupo: "Documentos", "Herramientas"
    const grupo = tarjeta.closest('[data-grupo]').dataset.grupo;
    if (grupo !== grupoAnterior) {
      const subtitulo = document.createElement('p');
      subtitulo.classList.add('selector-modulo__grupo');
      subtitulo.textContent = document.querySelector(`.lengueta-menu[data-grupo="${grupo}"]`).dataset.nombre;
      listaModulos.appendChild(subtitulo);
      grupoAnterior = grupo;
    }
    const opcion = document.createElement('button');
    opcion.type = 'button';
    opcion.classList.add('opcion-rapida');
    opcion.dataset.id = tarjeta.dataset.modulo || tarjeta.dataset.herramienta;

    const imagen = document.createElement('img');
    imagen.src = tarjeta.querySelector('.opcion__imagen').src;
    imagen.alt = '';

    const textos = document.createElement('span');
    textos.classList.add('opcion-rapida__textos');
    const titulo = document.createElement('strong');
    titulo.textContent = tarjeta.dataset.titulo;
    const detalle = document.createElement('small');
    detalle.textContent = tarjeta.querySelector('.opcion__pide').textContent; // "Pide: …"
    textos.append(titulo, detalle);

    opcion.append(imagen, textos);
    opcion.addEventListener('click', function () {
      selectorModulo.open = false;
      abrirTarjeta(tarjeta);
    });
    listaModulos.appendChild(opcion);
  }
}

/** La lista se cierra al hacer clic fuera de ella o con la tecla Esc. */
function prepararCierreDeLaLista() {
  document.addEventListener('click', function (evento) {
    if (selectorModulo.open && !selectorModulo.contains(evento.target)) {
      selectorModulo.open = false;
    }
  });
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && selectorModulo.open) {
      selectorModulo.open = false;
      selectorModulo.querySelector('summary').focus();
    }
  });
}


// =============================================================
//  PESTAÑAS ("Uno a la vez" / "Desde Excel")
// =============================================================

/** Al hacer clic en una pestaña, se muestra su panel. */
function prepararPestanas() {
  for (const pestana of pestanas) {
    pestana.addEventListener('click', function () {
      mostrarPestana(pestana.dataset.panel); // viene de data-panel="..." en el HTML
    });
  }
}

/** Marca la pestaña de un panel ('panel-individual' o 'panel-excel') y muestra solo ese panel. */
export function mostrarPestana(idPanel) {
  for (const pestana of pestanas) {
    if (pestana.dataset.panel === idPanel) {
      pestana.classList.add('activa');
    } else {
      pestana.classList.remove('activa');
    }
  }
  for (const panel of paneles) {
    if (panel.id === idPanel) {
      panel.classList.add('activo');
    } else {
      panel.classList.remove('activo');
    }
  }
}
