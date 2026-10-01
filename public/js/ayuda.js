// =============================================================
//  ayuda.js — MANUAL DE USUARIO Y RECORRIDO GUIADO
//
//  1. Manual: la ventana que abre el botón "? Ayuda" (su texto está
//     en index.html, en <dialog id="manual">).
//  2. Recorrido guiado: oscurece la página, resalta un elemento real
//     y Magnus (la mascota de UNICAH) lo explica en un globo, paso a paso.
//     Magnus aparece como un avatar con su cara (img/magnus/, ver magnus.js).
//     Magnus vuela hasta cada elemento, lo señala y muestra cómo se usa
//     (magnus.js). Además flota, da un saltito
//     al cambiar de paso y "habla": su texto aparece letra por letra.
//  3. Bienvenida: la primera vez (en este navegador) ofrece el recorrido.
//
//  PARA CAMBIAR LOS TEXTOS DEL RECORRIDO, O AGREGAR PASOS, solo edita
//  la lista RECORRIDOS de abajo. Cada paso tiene:
//    elemento: qué se resalta (un selector CSS, como '#boton-vista')
//    titulo, texto: lo que dice el globo
//    soloSi (opcional): una función; el paso solo se muestra si devuelve true
//    demostracion (opcional): qué hace Magnus con el elemento para mostrar
//      cómo se usa (presionar, escribirEjemplo, pasarEncima… de magnus.js)
//  Los pasos cuyo elemento no se ve en ese momento se saltan solos
//  (por ejemplo, los colores de Placas en otro módulo).
//
//  IMPORTA                                   DE             PARA
//  mostrar, ocultar                          utilidades.js  mostrar el recorrido y la bienvenida
//  cambiarTextoDelBoton                      utilidades.js  "Siguiente" / "Terminar" sin borrar el icono
//  pantallaActual                            navegacion.js  saber qué pantalla se ve
//  herramientaAbierta                        navegacion.js  saber cuál herramienta se ve (quitar fondo o QR)
//  abrirPorId                                navegacion.js  abrir el módulo o la herramienta del recorrido
//  volverAlInicio                            navegacion.js  ir al menú para su recorrido
//  mostrarPestana                            navegacion.js  abrir "Uno a la vez" o "Desde Excel"
//  obtenerModuloActual                       estado.js      abrir el último módulo usado
//  dibujarMagnus                             magnus.js      poner la cara de Magnus
//  pasarEncima, presionar, escribirEjemplo,  magnus.js      lo que Magnus hace en cada paso (demostracion)
//  arrastrarArchivo, recorrerOpciones        magnus.js
//  quitarDemostraciones                      magnus.js      dejar todo como estaba al cambiar de paso
//  orientarMagnus                            magnus.js      que Magnus mire hacia el elemento
//
//  EXPORTA         LO IMPORTA  PARA
//  iniciarAyuda()  main.js     arrancar esta parte
// =============================================================
import { mostrar, ocultar, cambiarTextoDelBoton } from './utilidades.js';
import { pantallaActual, herramientaAbierta, abrirPorId, volverAlInicio, mostrarPestana } from './navegacion.js';
import { obtenerModuloActual } from './estado.js';
import {
  pasarEncima, presionar, escribirEjemplo, arrastrarArchivo, recorrerOpciones,
  quitarDemostraciones, orientarMagnus, dibujarMagnus,
} from './magnus.js';

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
//  herramienta: (solo con pantalla 'herramienta') cuál: 'quitar-fondo' o 'qr'
//  pestana:  (opcional) qué pestaña abrir antes de empezar
//  antes:    (opcional) algo que hacer antes de empezar
// =============================================================

const RECORRIDOS = {
  menu: {
    pantalla: 'menu',
    pasos: [
      {
        elemento: '.opcion',
        demostracion: pasarEncima,
        titulo: 'Elige qué vas a generar',
        texto: '¡Hola, soy Magnus! Cada tarjeta es un tipo de documento y dice qué datos pide. Haz clic en la que necesites.',
      },
      {
        elemento: '[data-herramienta="quitar-fondo"]',
        demostracion: pasarEncima,
        titulo: '¿Tu logo tiene fondo blanco?',
        texto: 'Aquí le quito el fondo a tu logo en segundos, ¡y queda listo para tus documentos!',
      },
      {
        elemento: '#boton-ayuda',
        demostracion: presionar,
        titulo: 'La ayuda siempre a mano',
        texto: 'Aquí está el manual. Cuando me necesites, toca "Ayuda" y vuelvo a acompañarte.',
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
        texto: '¡Vamos con este! Desde aquí vuelves al "Inicio", o tocas el nombre del documento para cambiar a otro tipo sin salir.',
      },
      {
        elemento: '#pestanas',
        demostracion: recorrerOpciones,
        titulo: 'Dos formas de trabajar',
        texto: '¿Es solo uno? Quédate en "Uno a la vez". ¿Son muchos? "Desde Excel" los hace todos de un jalón.',
      },
      {
        elemento: '#form-individual .rejilla',
        demostracion: escribirEjemplo,
        titulo: 'Llena los datos',
        texto: 'Llena lo que tiene *, eso sí es obligatorio. Si dejas algo vacío, uso lo que ves en gris (como la fecha de hoy). Tip: escribe **así** para negrita.',
      },
      {
        elemento: '#boton-vista',
        demostracion: presionar,
        titulo: 'Mira cómo queda',
        texto: 'Antes de descargar, revisa cómo queda. ¡Así no hay sorpresas!',
      },
      {
        elemento: '#form-individual .acciones',
        demostracion: presionar,
        titulo: 'Descarga',
        texto: '¡Listo! Descarga tu PDF. En algunos tipos también sale como imagen (PNG), perfecta para redes sociales o WhatsApp.',
      },
      {
        elemento: '#personalizar',
        titulo: 'Opcional: personaliza el diseño',
        texto: '¿Le quieres dar tu toque? Aquí cambias colores, encabezado y logo. Si quieres, te lo enseño en otro recorrido.',
      },
    ],
  },

  excel: {
    pantalla: 'generador',
    pestana: 'panel-excel',
    pasos: [
      {
        elemento: '#enlace-modelo',
        demostracion: presionar,
        titulo: 'Empieza con el Excel modelo',
        texto: '¡Empecemos con el Excel! Descarga este modelo: ya trae las columnas correctas. Llena una fila por persona.',
        soloSi: noHayExcelRevisado,
      },
      {
        elemento: '#zona-excel',
        demostracion: arrastrarArchivo,
        titulo: 'Sube tu Excel',
        texto: 'Ahora suéltalo aquí (o haz clic para buscarlo) y yo reviso cada fila por ti.',
        soloSi: noHayExcelRevisado,
      },
      {
        elemento: '#revision .resumen',
        titulo: 'La revisión',
        texto: 'Ya revisé tu Excel: aquí ves cuántas filas hay, cuántas están listas y cuántas necesitan arreglo.',
      },
      {
        elemento: '#revision .comunes',
        titulo: 'Datos comunes',
        texto: '¿Algo se repite en todas las filas, como el lugar o las firmas? Escríbelo una sola vez aquí y lo uso donde falte.',
      },
      {
        elemento: '#revision .tabla-contenedor',
        demostracion: presionar,
        titulo: 'Cada fila',
        texto: 'Si una fila tiene error, te digo qué le falta. Con "Ver" miras cómo quedará cada documento.',
      },
      {
        elemento: '#boton-generar-excel',
        demostracion: presionar,
        titulo: 'Genera todos',
        texto: '¡El momento final! Te doy un solo PDF con una página por cada fila lista. Las que tienen error las salto.',
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
        texto: '¡Mira! Esta miniatura cambia al momento con todo lo que elijas.',
      },
      {
        elemento: '.paletas',
        demostracion: recorrerOpciones,
        titulo: 'Combinaciones listas',
        texto: 'Sin complicarte: un clic y cambian todos los colores, ya combinados.',
      },
      {
        elemento: '.colores-panel',
        demostracion: recorrerOpciones,
        titulo: 'Colores',
        texto: '¿Prefieres elegir tú? Toca una fila y escoge el color, o escribe su código (por ejemplo #7A1428).',
      },
      {
        elemento: '.campos-encabezado',
        demostracion: escribirEjemplo,
        titulo: 'Encabezado',
        texto: 'Aquí cambias las líneas de arriba. Si las dejas vacías, pongo el texto de siempre.',
      },
      {
        elemento: '#input-titulo',
        demostracion: escribirEjemplo,
        titulo: 'Título',
        texto: 'Puedes cambiar "COMUNICADO" por otro título, como "NOTA DE DUELO".',
      },
      {
        elemento: '.carga-logo',
        demostracion: presionar,
        titulo: 'Logo',
        texto: 'Sube otro logo (PNG o JPG). Consejo de Magnus: sin fondo se ve mucho mejor.',
      },
      {
        elemento: '#boton-restablecer',
        demostracion: presionar,
        titulo: 'Volver a lo original',
        texto: '¿Te arrepentiste? Tranquilo, aquí todo vuelve a como estaba.',
      },
    ],
  },

  herramienta: {
    pantalla: 'herramienta',
    herramienta: 'quitar-fondo',
    pasos: [
      {
        elemento: '#zona-fondo',
        demostracion: arrastrarArchivo,
        titulo: 'Sube la imagen del logo',
        texto: 'Suelta aquí la imagen de tu logo (o haz clic para buscarla) y yo le quito el fondo solito.',
        soloSi: noHayLogoCargado,
      },
      {
        elemento: '.editor-fondo__imagenes',
        titulo: 'Antes y después',
        texto: 'A la izquierda, la original; a la derecha, cómo quedó. Los cuadritos son la parte transparente.',
      },
      {
        elemento: '.control-deslizable',
        titulo: 'Tolerancia',
        texto: '¿Quedaron restos del fondo? Súbela. ¿Se borró parte del logo? Bájala un poco.',
      },
      {
        elemento: '#boton-usar-logo',
        demostracion: presionar,
        titulo: 'Úsalo en los documentos',
        texto: '¡Quedó genial! Úsalo en tus documentos o descárgalo como PNG.',
      },
    ],
  },

  qr: {
    pantalla: 'herramienta',
    herramienta: 'qr',
    pasos: [
      {
        elemento: '.tipos-qr',
        demostracion: recorrerOpciones,
        titulo: '¿Qué abrirá el QR?',
        texto: 'Una página, un chat de WhatsApp, un correo, la clave del Wi-Fi o un texto. ¡Tú eliges!',
      },
      {
        elemento: '#qr-link',
        demostracion: escribirEjemplo,
        titulo: 'Escribe el link',
        texto: 'Pega aquí el link de tu página, formulario o video. El QR aparece al momento.',
        soloSi: noHayLinkEnElQR,
      },
      {
        elemento: '#qr-pestanas',
        demostracion: recorrerOpciones,
        titulo: 'Dale tu estilo',
        texto: 'En Diseño eliges una plantilla, la forma de los puntos y los colores; en Logo, el del centro; y en Marco, un texto como "ESCANÉAME".',
      },
      {
        elemento: '.estudio-qr__botones',
        demostracion: presionar,
        titulo: 'Descárgalo o cópialo',
        texto: 'PNG para redes y documentos, SVG para imprimir en grande. Fíjate en el aviso verde: te dice si se leerá fácil.',
      },
    ],
  },
};

// Condiciones que usan algunos pasos (soloSi)
function noHayExcelRevisado() {
  return document.getElementById('revision').classList.contains('oculto');
}
function noHayLinkEnElQR() {
  return document.getElementById('qr-link').value.trim() === '';
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
  dibujarMagnus(); // pone la cara de Magnus en la bienvenida, el manual y el recorrido

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
  const yaEstabaAbierto = !capaRecorrido.classList.contains('oculto');
  mostrar(capaRecorrido);
  mostrarPaso();
  if (!yaEstabaAbierto) {
    requestAnimationFrame(seguirAlElemento); // empieza a seguir al elemento
  }
  botonSiguiente.focus();
}

/** El recorrido que corresponde a lo que el usuario está viendo. */
function recorridoDeEstaPantalla() {
  const pantalla = pantallaActual();
  if (pantalla === 'herramienta') {
    if (herramientaAbierta() === 'qr') {
      return 'qr';
    }
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
  if (recorrido.pantalla === 'herramienta' && herramientaAbierta() !== recorrido.herramienta) {
    abrirPorId(recorrido.herramienta); // 'quitar-fondo' o 'qr'
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
  escribirPocoAPoco(paso.texto); // Magnus lo "dice" letra por letra
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

  // Lleva el elemento al centro de la pantalla. De resaltarlo se encarga
  // seguirAlElemento(), que revisa su posición todo el tiempo.
  // Si es muy alto (más de la mitad de la pantalla), se muestra desde arriba,
  // para que se vea su principio (ahí es donde Magnus hace la demostración).
  const esMuyAlto = elemento.getBoundingClientRect().height > window.innerHeight * 0.5;
  if (esMuyAlto) {
    elemento.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.scrollBy(0, -24); // un poquito de espacio arriba
  } else {
    elemento.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  // Al cambiar de paso, Magnus "vuela" hasta el elemento (ver estilos.css)…
  quitarDemostraciones(); // (deja como estaba lo que mostró en el paso anterior)
  capaRecorrido.classList.add('cambiando-paso');
  clearTimeout(temporizadorAnimacion);
  temporizadorAnimacion = setTimeout(function () {
    capaRecorrido.classList.remove('cambiando-paso');
  }, DURACION_DEL_VUELO);

  // …y al llegar, muestra cómo se usa (si el paso tiene demostración)
  clearTimeout(temporizadorDemostracion);
  if (paso.demostracion) {
    temporizadorDemostracion = setTimeout(function () {
      paso.demostracion(elemento);
    }, DURACION_DEL_VUELO + 100);
  }
}

const DURACION_DEL_VUELO = 650; // milisegundos (igual que en estilos.css)
let temporizadorDemostracion = null;

// ---------- Magnus "habla": el texto aparece poco a poco ----------
// El texto completo se pone desde el inicio en dos partes:
//   <span>lo que ya dijo</span><span class="por-decir">lo que falta</span>
// "por-decir" es invisible pero ocupa su lugar: así el globo ya tiene su
// tamaño final y no salta mientras aparecen las letras.
let temporizadorEscritura = null;
const LETRAS_POR_VEZ = 2;   // cuántas letras aparecen cada vez
const CADA_MILISEGUNDOS = 18;

function escribirPocoAPoco(texto) {
  clearInterval(temporizadorEscritura);
  textoExplicacion.setAttribute('aria-label', texto); // los lectores de pantalla leen todo de una vez

  const yaDicho = document.createElement('span');
  const porDecir = document.createElement('span');
  porDecir.classList.add('por-decir');
  porDecir.setAttribute('aria-hidden', 'true');
  textoExplicacion.replaceChildren(yaDicho, porDecir);

  // Si la persona pidió menos animaciones en su sistema, todo aparece de una vez
  const sinAnimaciones = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sinAnimaciones) {
    yaDicho.textContent = texto;
    return;
  }

  let letras = 0;
  porDecir.textContent = texto;
  capaRecorrido.classList.add('hablando'); // Magnus se mueve mientras "habla"
  temporizadorEscritura = setInterval(function () {
    letras = letras + LETRAS_POR_VEZ;
    yaDicho.textContent = texto.slice(0, letras);
    porDecir.textContent = texto.slice(letras);
    if (letras >= texto.length) {
      clearInterval(temporizadorEscritura);
      capaRecorrido.classList.remove('hablando');
    }
  }, CADA_MILISEGUNDOS);
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

  // El hueco: el elemento + un margen
  let arriba = caja.top - margen;
  let abajo = caja.bottom + margen;
  // Si el elemento se ve (aunque sea una parte), el hueco no se sale de la
  // pantalla, para que se vea su borde dorado. Si NO se ve (el usuario bajó
  // la página), el hueco se va con él, fuera de la pantalla.
  const seVeAlgo = abajo > 0 && arriba < window.innerHeight;
  if (seVeAlgo) {
    arriba = Math.max(borde / 2, arriba);
    abajo = Math.min(window.innerHeight - borde / 2, abajo);
  }
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

  // Magnus se pone del lado del elemento y lo mira
  orientarMagnus(caja, elegido.x);
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
  clearInterval(temporizadorEscritura);
  clearTimeout(temporizadorDemostracion);
  quitarDemostraciones();
  ocultar(capaRecorrido);
  pasosActuales = [];
}

/** Botones y teclado (flechas y Esc). */
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

}

let temporizadorAnimacion = null;

/**
 * Mantiene el hueco y el globo sobre el elemento del paso actual mientras
 * el recorrido esté abierto. Se repite en cada cuadro de la pantalla
 * (unas 60 veces por segundo) con requestAnimationFrame.
 *
 * Así siguen al elemento pase lo que pase: si se baja la página, si se
 * mueve una tabla o una lista por dentro, si cambia el tamaño de la
 * ventana o si algo carga y empuja el contenido.
 */
function seguirAlElemento() {
  if (capaRecorrido.classList.contains('oculto')) {
    return; // el recorrido terminó: se deja de revisar
  }
  const elemento = document.querySelector(pasosActuales[numeroDePaso].elemento);
  ubicarFocoYGlobo(elemento);
  requestAnimationFrame(seguirAlElemento); // y otra vez en el próximo cuadro
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
