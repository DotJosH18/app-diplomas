// =============================================================
//  magnus.js — MAGNUS INTERACTÚA CON LA PÁGINA
//
//  Durante el recorrido guiado, Magnus (la mascota de UNICAH) no solo
//  explica: "usa" la página para mostrar cómo se hace. Por ejemplo:
//    - pasa el mouse por una tarjeta y se levanta,
//    - presiona un botón (con un círculo de "toque"),
//    - escribe un ejemplo en un campo,
//    - arrastra un archivo imaginario a la zona del Excel,
//    - recorre las opciones (pestañas, colores) una por una.
//
//  IMPORTANTE: son solo efectos visuales. Magnus NO cambia los datos
//  del usuario: no hace clic de verdad, y lo que "escribe" va en el
//  texto gris (placeholder) y se borra al cambiar de paso.
//
//  Cada paso del recorrido (en ayuda.js) puede decir qué demostración
//  hacer con "demostracion: presionar", por ejemplo.
//
//  IMPORTA  (nada)
//
//  EXPORTA                       LO IMPORTA  PARA
//  pasarEncima(elemento)         ayuda.js    la tarjeta se levanta, como con el mouse
//  presionar(elemento)           ayuda.js    "toca" un botón
//  escribirEjemplo(elemento)     ayuda.js    escribe un ejemplo en un campo vacío
//  arrastrarArchivo(elemento)    ayuda.js    la zona se pinta como al soltar un archivo
//  recorrerOpciones(elemento)    ayuda.js    resalta las opciones una por una
//  quitarDemostraciones()        ayuda.js    deja todo como estaba (al cambiar de paso)
//  orientarMagnus(caja, globo)   ayuda.js    que Magnus mire y señale hacia el elemento
// =============================================================

const capaRecorrido = document.getElementById('recorrido');
const globo = capaRecorrido.querySelector('.recorrido__globo');

// Los temporizadores de la demostración actual (para poder detenerlos)
let temporizadores = [];

// Ejemplos que Magnus "escribe" en cada campo (por su name o su id)
const EJEMPLOS = {
  nombre: 'María Fernanda López',
  evento: 'Concurso de Oratoria 2026',
  tituloDiploma: 'Agradecimiento',
  'input-encabezado1': 'FACULTAD DE DERECHO',
  'input-titulo': 'NOTA DE DUELO',
};

/** Espera unos milisegundos y luego hace algo (y lo recuerda para poder cancelarlo). */
function despues(milisegundos, accion) {
  temporizadores.push(setTimeout(accion, milisegundos));
}


// =============================================================
//  DEMOSTRACIONES
// =============================================================

/** La tarjeta (o lo que sea) se levanta como si el mouse pasara encima. */
export function pasarEncima(elemento) {
  senalar();
  elemento.classList.add('magnus-encima');
}

/**
 * Magnus "presiona" un botón: se hunde un poquito y sale un círculo de toque.
 * No hace clic de verdad. Si el elemento no es un botón, busca el botón
 * principal que tenga adentro (o el primero).
 */
export function presionar(elemento) {
  let boton = elemento;
  if (!elemento.matches('button, a, summary')) {
    boton = elemento.querySelector('.boton--principal') || elemento.querySelector('.boton, button') || elemento;
  }
  senalar();
  tocar(boton);
  boton.classList.add('magnus-presiona');
  despues(450, function () {
    boton.classList.remove('magnus-presiona');
  });
  // Lo vuelve a presionar cada 2.5 segundos, mientras siga en este paso
  despues(2500, function () {
    presionar(elemento);
  });
}

/**
 * Escribe un ejemplo, letra por letra, en el primer campo vacío.
 * Lo escribe en el texto gris (placeholder), así no cambia lo que el usuario puso.
 */
export function escribirEjemplo(elemento) {
  let campo = elemento;
  if (!elemento.matches('input')) {
    campo = elemento.querySelector('input:not([disabled])');
  }
  if (!campo || campo.value !== '') {
    return; // no hay campo, o el usuario ya escribió algo: no se toca
  }

  const ejemplo = EJEMPLOS[campo.name] || EJEMPLOS[campo.id] || 'Escribe aquí…';
  campo.dataset.placeholderOriginal = campo.placeholder; // para devolverlo después
  campo.classList.add('magnus-escribe');
  campo.placeholder = '';
  senalar();
  tocar(campo);

  for (let letra = 1; letra <= ejemplo.length; letra++) {
    despues(500 + letra * 70, function () {
      campo.placeholder = ejemplo.slice(0, letra) + '|';   // la rayita es el cursor
    });
  }
  despues(500 + ejemplo.length * 70 + 400, function () {
    campo.placeholder = ejemplo;
  });
}

/** La zona para soltar archivos se pinta como cuando arrastras uno encima. */
export function arrastrarArchivo(elemento) {
  senalar();
  elemento.classList.add('arrastrando', 'magnus-arrastra');
}

/** Resalta una por una las opciones de adentro (pestañas, colores…), y vuelve a empezar. */
export function recorrerOpciones(elemento) {
  const opciones = elemento.querySelectorAll('button, summary');
  if (opciones.length === 0) {
    return;
  }
  senalar();
  let posicion = 0;

  function resaltarSiguiente() {
    for (const opcion of opciones) {
      opcion.classList.remove('magnus-encima');
    }
    opciones[posicion].classList.add('magnus-encima');
    posicion = (posicion + 1) % opciones.length; // al llegar al final, vuelve a la primera
    despues(700, resaltarSiguiente);
  }
  resaltarSiguiente();
}

/** Deja la página como estaba: quita los efectos y devuelve los textos grises. */
export function quitarDemostraciones() {
  for (const temporizador of temporizadores) {
    clearTimeout(temporizador);
  }
  temporizadores = [];

  for (const elemento of document.querySelectorAll('.magnus-encima, .magnus-presiona')) {
    elemento.classList.remove('magnus-encima', 'magnus-presiona');
  }
  for (const elemento of document.querySelectorAll('.magnus-arrastra')) {
    elemento.classList.remove('arrastrando', 'magnus-arrastra');
  }
  for (const campo of document.querySelectorAll('.magnus-escribe')) {
    campo.placeholder = campo.dataset.placeholderOriginal;
    campo.classList.remove('magnus-escribe');
  }
  capaRecorrido.classList.remove('senalando', 'tocando');
}


// =============================================================
//  MAGNUS SE MUEVE
// =============================================================

/** Magnus estira el brazo hacia el elemento (animación "magnus-senala" en el CSS). */
function senalar() {
  capaRecorrido.classList.remove('senalando');
  void capaRecorrido.offsetWidth; // truco para que la animación vuelva a empezar
  capaRecorrido.classList.add('senalando');
}

/** Un círculo que se agranda donde Magnus "toca" (el centro del elemento). */
function tocar(elemento) {
  const caja = elemento.getBoundingClientRect();
  capaRecorrido.style.setProperty('--toque-x', `${caja.left + caja.width / 2}px`);
  capaRecorrido.style.setProperty('--toque-y', `${caja.top + caja.height / 2}px`);
  capaRecorrido.classList.remove('tocando');
  void capaRecorrido.offsetWidth;
  capaRecorrido.classList.add('tocando');
}

/**
 * Pone a Magnus del lado del globo que da hacia el elemento, mirándolo.
 * Su brazo estirado (en la imagen) apunta a la derecha; si el elemento
 * está a la izquierda, se voltea como en un espejo.
 *
 * @param {DOMRect} cajaElemento  dónde está el elemento
 * @param {number} xGlobo         dónde quedó el globo (izquierda)
 */
export function orientarMagnus(cajaElemento, xGlobo) {
  const anchoGlobo = globo.offsetWidth;
  const centroGlobo = xGlobo + anchoGlobo / 2;

  // El punto del elemento más cercano al globo (en horizontal).
  // Si el elemento está justo arriba o abajo del globo, ese punto es el
  // centro del globo y Magnus se queda como está.
  const puntoCercano = Math.min(Math.max(centroGlobo, cajaElemento.left), cajaElemento.right);
  const diferencia = puntoCercano - centroGlobo;

  // Con diferencias pequeñas no se voltea (así no "tiembla")
  if (diferencia > anchoGlobo / 4) {
    globo.classList.add('mira-derecha');
  } else if (diferencia < -anchoGlobo / 4) {
    globo.classList.remove('mira-derecha');
  }
}
