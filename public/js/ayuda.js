// =============================================================
//  ayuda.js — MANUAL DE USUARIO Y RECORRIDO GUIADO
//
//  1. Manual: la ventana que abre el botón "? Ayuda" (su texto está
//     en index.html, en <dialog id="manual">).
//  2. Recorrido guiado: oscurece la página, resalta un elemento real
//     y lo explica en un globo, paso a paso.
//  3. Bienvenida: la primera vez (en este navegador) ofrece el recorrido.
//
//  PARA CAMBIAR LOS TEXTOS DEL RECORRIDO, O AGREGAR PASOS, solo edita
//  la lista RECORRIDOS de abajo. Cada paso tiene:
//    elemento: qué se resalta (un selector CSS, como '#boton-vista')
//    titulo, texto: lo que dice el globo
//    soloSi (opcional): una función; el paso solo se muestra si devuelve true
//  Los pasos cuyo elemento no se ve en ese momento se saltan solos
//  (por ejemplo, los colores de Placas en otro módulo).
//
//  IMPORTA               DE             PARA
//  mostrar, ocultar      utilidades.js  mostrar el recorrido y la bienvenida
//  cambiarTextoDelBoton  utilidades.js  "Siguiente" / "Terminar" sin borrar el icono
//  pantallaActual        navegacion.js  saber qué pantalla se ve
//  abrirPorId            navegacion.js  abrir el módulo o la herramienta del recorrido
//  volverAlInicio        navegacion.js  ir al menú para su recorrido
//  mostrarPestana        navegacion.js  abrir "Uno a la vez" o "Desde Excel"
//  obtenerModuloActual   estado.js      abrir el último módulo usado
//
//  EXPORTA         LO IMPORTA  PARA
//  iniciarAyuda()  main.js     arrancar esta parte
// =============================================================
import { mostrar, ocultar, cambiarTextoDelBoton } from './utilidades.js';
import { pantallaActual, abrirPorId, volverAlInicio, mostrarPestana } from './navegacion.js';
import { obtenerModuloActual } from './estado.js';

// ---------- Elementos de la página ----------
const botonAyuda = document.getElementById('boton-ayuda');
const ventanaManual = document.getElementById('manual');
const botonCerrarManual = document.getElementById('manual-cerrar');
const capaRecorrido = document.getElementById('recorrido');
const globo = capaRecorrido.querySelector('.recorrido__globo');
const textoNumero = document.getElementById('recorrido-numero');
const textoTitulo = document.getElementById('recorrido-titulo');
const textoExplicacion = document.getElementById('recorrido-texto');
const botonAnterior = document.getElementById('recorrido-anterior');
const botonSiguiente = document.getElementById('recorrido-siguiente');
const botonSalir = document.getElementById('recorrido-salir');
const avisoBienvenida = document.getElementById('bienvenida');
const panelPersonalizar = document.getElementById('personalizar');

const CLAVE_BIENVENIDA = 'diplomas-ayuda-vista'; // se guarda en el navegador para no repetir la bienvenida


// =============================================================
//  LOS RECORRIDOS (edita aquí los textos)
//  pantalla: dónde debe estar el usuario ('menu', 'generador' o 'herramienta')
//  pestana:  (opcional) qué pestaña abrir antes de empezar
//  antes:    (opcional) algo que hacer antes de empezar
// =============================================================

const RECORRIDOS = {
  menu: {
    pantalla: 'menu',
    pasos: [
      {
        elemento: '.opcion',
        titulo: 'Elige qué vas a generar',
        texto: 'Cada tarjeta es un tipo de documento y dice qué datos pide. Haz clic en la que necesites.',
      },
      {
        elemento: '[data-herramienta="quitar-fondo"]',
        titulo: '¿Tu logo tiene fondo blanco?',
        texto: 'Con esta herramienta se lo quitas en segundos y lo usas en los documentos.',
      },
      {
        elemento: '#boton-ayuda',
        titulo: 'La ayuda siempre a mano',
        texto: 'Aquí está el manual, con un recorrido para cada parte. Vuelve cuando quieras.',
      },
    ],
  },

  individual: {
    pantalla: 'generador',
    pestana: 'panel-individual',
    pasos: [
      {
        elemento: '#navegacion',
        titulo: 'Dónde estás',
        texto: '"Inicio" vuelve a las tarjetas. El nombre del documento abre una lista para cambiar a otro tipo sin salir.',
      },
      {
        elemento: '#pestanas',
        titulo: 'Dos formas de trabajar',
        texto: '"Uno a la vez" para un documento, o "Desde Excel" para hacer muchos de una sola vez.',
      },
      {
        elemento: '#form-individual .rejilla',
        titulo: 'Llena los datos',
        texto: 'Los campos con * son obligatorios. Si dejas uno vacío, se usa lo que se ve en gris (como la fecha de hoy). Escribe **así** para negrita y pulsa Enter para otro párrafo.',
      },
      {
        elemento: '#boton-vista',
        titulo: 'Mira cómo queda',
        texto: 'La vista previa aparece al lado, antes de descargar.',
      },
      {
        elemento: '#form-individual .acciones',
        titulo: 'Descarga',
        texto: 'Descarga el PDF. En algunos tipos también puedes descargarlo como imagen (PNG), útil para redes sociales.',
      },
      {
        elemento: '#personalizar',
        titulo: 'Opcional: personaliza el diseño',
        texto: 'Colores, encabezado y logo, con una miniatura que cambia al momento. Tiene su propio recorrido en la Ayuda.',
      },
    ],
  },

  excel: {
    pantalla: 'generador',
    pestana: 'panel-excel',
    pasos: [
      {
        elemento: '#enlace-modelo',
        titulo: 'Empieza con el Excel modelo',
        texto: 'Descárgalo: ya trae las columnas correctas para este tipo de documento. Llena una fila por persona.',
        soloSi: noHayExcelRevisado,
      },
      {
        elemento: '#zona-excel',
        titulo: 'Sube tu Excel',
        texto: 'Arrástralo aquí o haz clic para buscarlo. Enseguida verás una tabla con cómo quedará cada fila.',
        soloSi: noHayExcelRevisado,
      },
      {
        elemento: '#revision .resumen',
        titulo: 'La revisión',
        texto: 'Cuántas filas hay, cuántas están listas y cuántas tienen errores.',
      },
      {
        elemento: '#revision .comunes',
        titulo: 'Datos comunes',
        texto: 'Lo que se repite en todas las filas (lugar, fecha, firmas): escríbelo una vez aquí. Se usa en las filas que lo tengan vacío.',
      },
      {
        elemento: '#revision .tabla-contenedor',
        titulo: 'Cada fila',
        texto: 'Las filas con error dicen qué les falta. Con "Ver" miras cómo quedará cada documento.',
      },
      {
        elemento: '#boton-generar-excel',
        titulo: 'Genera todos',
        texto: 'Se descarga un solo PDF con una página por cada fila lista. Las filas con errores se omiten.',
      },
    ],
  },

  personalizar: {
    pantalla: 'generador',
    pestana: 'panel-individual',
    antes: abrirPanelPersonalizar,
    pasos: [
      {
        elemento: '.mini-vista',
        titulo: 'Vista en miniatura',
        texto: 'Muestra el documento con tus cambios, al momento.',
      },
      {
        elemento: '.paletas',
        titulo: 'Combinaciones listas',
        texto: 'Un clic y cambian todos los colores, ya combinados.',
      },
      {
        elemento: '.colores-panel',
        titulo: 'Colores',
        texto: 'Haz clic en una fila para elegir otro color, o escribe su código (por ejemplo #7A1428).',
      },
      {
        elemento: '.campos-encabezado',
        titulo: 'Encabezado',
        texto: 'Cambia las líneas de arriba del documento. Si las dejas vacías, se usa el texto de siempre.',
      },
      {
        elemento: '#input-titulo',
        titulo: 'Título',
        texto: 'Cambia "COMUNICADO" por otro título, como "NOTA DE DUELO".',
      },
      {
        elemento: '.carga-logo',
        titulo: 'Logo',
        texto: 'Sube otro logo (PNG o JPG). Uno sin fondo se ve mejor: usa la herramienta "Quitar fondo de logos".',
      },
      {
        elemento: '#boton-restablecer',
        titulo: 'Volver a lo original',
        texto: 'Deja colores, textos y logo como estaban.',
      },
    ],
  },

  herramienta: {
    pantalla: 'herramienta',
    pasos: [
      {
        elemento: '#zona-fondo',
        titulo: 'Sube la imagen del logo',
        texto: 'Arrástrala aquí o haz clic para buscarla. El fondo se quita solo.',
        soloSi: noHayLogoCargado,
      },
      {
        elemento: '.editor-fondo__imagenes',
        titulo: 'Antes y después',
        texto: 'A la izquierda la original (haz clic en su fondo si quieres elegir otro color); a la derecha el resultado: los cuadritos son lo transparente.',
      },
      {
        elemento: '.control-deslizable',
        titulo: 'Tolerancia',
        texto: 'Súbela si quedan restos del fondo; bájala si se borra parte del logo.',
      },
      {
        elemento: '#boton-usar-logo',
        titulo: 'Úsalo en los documentos',
        texto: 'Queda como logo en "Personalizar diseño". También puedes descargar el PNG.',
      },
    ],
  },
};

// Condiciones que usan algunos pasos (soloSi)
function noHayExcelRevisado() {
  return document.getElementById('revision').classList.contains('oculto');
}
function noHayLogoCargado() {
  return document.getElementById('editor-fondo').classList.contains('oculto');
}
function abrirPanelPersonalizar() {
  panelPersonalizar.open = true;
}


// =============================================================
//  ARRANQUE
// =============================================================

/** Conecta el botón de ayuda, el manual, el recorrido y la bienvenida (se llama una vez, desde main.js). */
export function iniciarAyuda() {
  botonAyuda.addEventListener('click', function () {
    ventanaManual.showModal();
  });
  botonCerrarManual.addEventListener('click', function () {
    ventanaManual.close();
  });
  // Clic en lo oscuro alrededor del manual: se cierra
  ventanaManual.addEventListener('click', function (evento) {
    if (evento.target === ventanaManual) {
      ventanaManual.close();
    }
  });

  // Botones "Muéstrame dónde" y "Recorrido de esta pantalla"
  for (const boton of document.querySelectorAll('[data-recorrido]')) {
    boton.addEventListener('click', function () {
      ventanaManual.close();
      empezarRecorrido(boton.dataset.recorrido);
    });
  }

  prepararControlesDelRecorrido();
  prepararBienvenida();
}


// =============================================================
//  RECORRIDO GUIADO
// =============================================================

let pasosActuales = [];   // los pasos del recorrido que se está mostrando
let numeroDePaso = 0;     // cuál se ve ahora

/**
 * Empieza un recorrido: lleva al usuario a la pantalla correcta,
 * se queda con los pasos que se pueden mostrar y muestra el primero.
 * "automatico" = el de la pantalla en la que está.
 */
function empezarRecorrido(nombre) {
  if (nombre === 'automatico') {
    nombre = recorridoDeEstaPantalla();
  }
  const recorrido = RECORRIDOS[nombre];
  marcarBienvenidaComoVista();

  irALaPantalla(recorrido);

  // Los pasos que se pueden mostrar ahora
  pasosActuales = [];
  for (const paso of recorrido.pasos) {
    const cumple = !paso.soloSi || paso.soloSi();
    if (cumple && seVe(document.querySelector(paso.elemento))) {
      pasosActuales.push(paso);
    }
  }
  if (pasosActuales.length === 0) {
    return;
  }

  numeroDePaso = 0;
  mostrar(capaRecorrido);
  mostrarPaso();
  botonSiguiente.focus();
}

/** El recorrido que corresponde a lo que el usuario está viendo. */
function recorridoDeEstaPantalla() {
  const pantalla = pantallaActual();
  if (pantalla === 'herramienta') {
    return 'herramienta';
  }
  if (pantalla === 'generador') {
    const enExcel = document.getElementById('panel-excel').classList.contains('activo');
    if (enExcel) {
      return 'excel';
    }
    return 'individual';
  }
  return 'menu';
}

/** Lleva al usuario a la pantalla (y pestaña) del recorrido, si no está ahí. */
function irALaPantalla(recorrido) {
  const pantalla = pantallaActual();

  if (recorrido.pantalla === 'menu' && pantalla !== 'menu') {
    volverAlInicio();
  }
  if (recorrido.pantalla === 'generador' && pantalla !== 'generador') {
    abrirPorId(obtenerModuloActual()); // el último módulo usado (o el primero)
  }
  if (recorrido.pantalla === 'herramienta' && pantalla !== 'herramienta') {
    abrirPorId('quitar-fondo');
  }
  if (recorrido.pestana) {
    mostrarPestana(recorrido.pestana);
  }
  if (recorrido.antes) {
    recorrido.antes();
  }
}

/** true si el elemento existe y se ve (no está oculto ni dentro de algo oculto). */
function seVe(elemento) {
  return elemento !== null && elemento.getClientRects().length > 0;
}

/** Muestra el paso actual: mueve el "hueco" y el globo sobre su elemento. */
function mostrarPaso() {
  const paso = pasosActuales[numeroDePaso];
  const elemento = document.querySelector(paso.elemento);

  textoNumero.textContent = `Paso ${numeroDePaso + 1} de ${pasosActuales.length}`;
  textoTitulo.textContent = paso.titulo;
  textoExplicacion.textContent = paso.texto;
  botonAnterior.disabled = numeroDePaso === 0;
  // En el último paso, "Siguiente →" se convierte en "Terminar ✓"
  const iconoSiguiente = botonSiguiente.querySelector('.icono');
  if (numeroDePaso === pasosActuales.length - 1) {
    cambiarTextoDelBoton(botonSiguiente, 'Terminar');
    iconoSiguiente.textContent = 'check';
  } else {
    cambiarTextoDelBoton(botonSiguiente, 'Siguiente');
    iconoSiguiente.textContent = 'arrow_forward';
  }

  // Lleva el elemento al centro de la pantalla y, ya quieto, lo resalta
  elemento.scrollIntoView({ block: 'center', behavior: 'instant' });
  requestAnimationFrame(function () {
    ubicarFocoYGlobo(elemento);
  });
}

/**
 * Pone el "hueco" sobre el elemento y el globo debajo (o arriba, si no
 * cabe). Las posiciones se pasan al CSS como variables.
 */
function ubicarFocoYGlobo(elemento) {
  const margen = 8;      // espacio alrededor del elemento resaltado
  const separacion = 14; // entre el elemento y el globo
  const borde = 16;      // distancia mínima a los bordes de la pantalla
  const caja = elemento.getBoundingClientRect();

  // El hueco: el elemento + un margen, sin salirse de la pantalla
  const arriba = Math.max(borde / 2, caja.top - margen);
  const abajo = Math.min(window.innerHeight - borde / 2, caja.bottom + margen);
  capaRecorrido.style.setProperty('--foco-x', `${caja.left - margen}px`);
  capaRecorrido.style.setProperty('--foco-y', `${arriba}px`);
  capaRecorrido.style.setProperty('--foco-ancho', `${caja.width + margen * 2}px`);
  capaRecorrido.style.setProperty('--foco-alto', `${abajo - arriba}px`);

  // El globo: se prueba debajo, arriba, a la derecha y a la izquierda del
  // elemento, y se usa el primer lugar donde cabe completo.
  const anchoGlobo = globo.offsetWidth;
  const altoGlobo = globo.offsetHeight;
  const izquierda = caja.left - margen;
  const derecha = caja.right + margen;
  const lugares = [
    { x: izquierda, y: abajo + separacion },                     // debajo
    { x: izquierda, y: arriba - separacion - altoGlobo },        // arriba
    { x: derecha + separacion, y: arriba },                      // a la derecha
    { x: izquierda - separacion - anchoGlobo, y: arriba },       // a la izquierda
  ];

  // Si el elemento es muy grande y no cabe en ningún lado, va abajo a la derecha
  let elegido = {
    x: window.innerWidth - anchoGlobo - borde,
    y: window.innerHeight - altoGlobo - borde,
  };
  for (const lugar of lugares) {
    // Se mete dentro de la pantalla y se revisa que no tape el elemento
    const x = Math.min(Math.max(lugar.x, borde), window.innerWidth - anchoGlobo - borde);
    const y = Math.min(Math.max(lugar.y, borde), window.innerHeight - altoGlobo - borde);
    const tapaElElemento = x < derecha && x + anchoGlobo > izquierda && y < abajo && y + altoGlobo > arriba;
    if (!tapaElElemento) {
      elegido = { x: x, y: y };
      break;
    }
  }
  capaRecorrido.style.setProperty('--globo-x', `${elegido.x}px`);
  capaRecorrido.style.setProperty('--globo-y', `${elegido.y}px`);
}

function pasoSiguiente() {
  if (numeroDePaso < pasosActuales.length - 1) {
    numeroDePaso = numeroDePaso + 1;
    mostrarPaso();
  } else {
    terminarRecorrido();
  }
}

function pasoAnterior() {
  if (numeroDePaso > 0) {
    numeroDePaso = numeroDePaso - 1;
    mostrarPaso();
  }
}

function terminarRecorrido() {
  ocultar(capaRecorrido);
  pasosActuales = [];
}

/** Botones, teclado (flechas y Esc) y reacomodo si cambia el tamaño de la ventana. */
function prepararControlesDelRecorrido() {
  botonSiguiente.addEventListener('click', pasoSiguiente);
  botonAnterior.addEventListener('click', pasoAnterior);
  botonSalir.addEventListener('click', terminarRecorrido);

  document.addEventListener('keydown', function (evento) {
    if (capaRecorrido.classList.contains('oculto')) {
      return;
    }
    if (evento.key === 'ArrowRight') {
      pasoSiguiente();
    } else if (evento.key === 'ArrowLeft') {
      pasoAnterior();
    } else if (evento.key === 'Escape') {
      terminarRecorrido();
    }
  });

  window.addEventListener('resize', function () {
    if (!capaRecorrido.classList.contains('oculto')) {
      ubicarFocoYGlobo(document.querySelector(pasosActuales[numeroDePaso].elemento));
    }
  });
}


// =============================================================
//  BIENVENIDA (solo la primera vez en este navegador)
//  Se recuerda con localStorage. Si el navegador no lo permite
//  (modo privado, por ejemplo), simplemente se muestra cada vez.
// =============================================================

function prepararBienvenida() {
  document.getElementById('bienvenida-si').addEventListener('click', function () {
    ocultar(avisoBienvenida);
    empezarRecorrido('automatico');
  });
  document.getElementById('bienvenida-no').addEventListener('click', function () {
    ocultar(avisoBienvenida);
    marcarBienvenidaComoVista();
  });

  if (!yaVioLaBienvenida()) {
    setTimeout(function () {
      mostrar(avisoBienvenida);
    }, 800);
  }
}

function yaVioLaBienvenida() {
  try {
    return localStorage.getItem(CLAVE_BIENVENIDA) === 'si';
  } catch (error) {
    return false;
  }
}

function marcarBienvenidaComoVista() {
  ocultar(avisoBienvenida);
  try {
    localStorage.setItem(CLAVE_BIENVENIDA, 'si');
  } catch (error) {
    // el navegador no deja guardar: no pasa nada
  }
}
