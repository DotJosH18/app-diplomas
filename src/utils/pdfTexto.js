// =============================================================
//  UTILIDADES PARA ESCRIBIR TEXTO EN EL PDF
//
//  PDFKit no sabe centrar un párrafo que mezcla texto normal y
//  **negrita**, así que aquí lo hacemos en 3 pasos:
//    1. Partir el texto en palabras, anotando cuáles van en negrita.
//    2. Acomodar las palabras en líneas que quepan en el ancho.
//    3. Dibujar cada línea centrada.
// =============================================================

/**
 * PASO 1: parte el texto en palabras.
 *
 * Ejemplo: 'Primer **lugar**.'  da como resultado
 *   [ { texto: 'Primer', negrita: false, espacioAntes: false },
 *     { texto: 'lugar',  negrita: true,  espacioAntes: true  },
 *     { texto: '.',      negrita: false, espacioAntes: false } ]
 *
 * "espacioAntes" indica si en el texto original había un espacio
 * antes de ese trozo (así el punto queda pegado a 'lugar').
 */
function partirEnPalabras(texto) {
  const palabras = [];
  let habiaEspacio = false;

  // Al separar por '**', las partes en posición impar (1, 3, 5…)
  // son las que estaban entre asteriscos, o sea, las negritas.
  const partes = texto.split('**');

  for (let i = 0; i < partes.length; i++) {
    const esNegrita = i % 2 === 1;

    // Separa la parte en palabras y espacios: 'hola  mundo' -> ['hola', '  ', 'mundo']
    const trozos = partes[i].split(/(\s+)/);

    for (const trozo of trozos) {
      if (trozo === '') {
        continue;
      }
      if (trozo.trim() === '') {
        habiaEspacio = true; // es un espacio: lo anotamos para la siguiente palabra
        continue;
      }
      palabras.push({
        texto: trozo,
        negrita: esNegrita,
        espacioAntes: habiaEspacio && palabras.length > 0,
      });
      habiaEspacio = false;
    }
  }

  return palabras;
}

/** Ancho que ocupa una palabra con su fuente. */
function medirPalabra(doc, palabra, opciones) {
  const fuente = palabra.negrita ? opciones.fuenteNegrita : opciones.fuente;
  doc.font(fuente);
  return doc.widthOfString(palabra.texto, { characterSpacing: opciones.espaciado });
}

/** Ancho de un espacio entre palabras. */
function medirEspacio(doc, opciones) {
  doc.font(opciones.fuente);
  return doc.widthOfString(' ') + opciones.espaciado + opciones.espacioPalabras;
}

/**
 * PASO 2: acomoda las palabras en líneas que no pasen de "opciones.ancho".
 * Solo corta la línea donde había un espacio.
 * @returns {{ palabras: object[], ancho: number }[]}
 */
function armarLineas(doc, palabras, opciones) {
  const espacio = medirEspacio(doc, opciones);
  const lineas = [];
  let lineaActual = { palabras: [], ancho: 0 };

  for (const palabra of palabras) {
    const anchoPalabra = medirPalabra(doc, palabra, opciones);
    const lineaVacia = lineaActual.palabras.length === 0;

    // ¿Cuánto mediría la línea si le agregamos esta palabra?
    let anchoNuevo = lineaActual.ancho + anchoPalabra;
    if (palabra.espacioAntes && !lineaVacia) {
      anchoNuevo = anchoNuevo + espacio;
    }

    // Si no cabe y se puede cortar aquí, empezamos una línea nueva
    const noCabe = anchoNuevo > opciones.ancho;
    if (noCabe && !lineaVacia && palabra.espacioAntes) {
      lineas.push(lineaActual);
      lineaActual = { palabras: [palabra], ancho: anchoPalabra };
    } else {
      lineaActual.palabras.push(palabra);
      lineaActual.ancho = anchoNuevo;
    }
  }

  if (lineaActual.palabras.length > 0) {
    lineas.push(lineaActual);
  }
  return lineas;
}

/** Completa las opciones que no se pasaron con valores normales. */
function opcionesCompletas(opciones) {
  return {
    fuente: opciones.fuente || 'normal',
    fuenteNegrita: opciones.fuenteNegrita || 'negrita', // la de lo que va entre **asteriscos**
    tamano: opciones.tamano || 12,
    ancho: opciones.ancho || 500,
    espaciado: opciones.espaciado || 0,             // espacio extra entre letras
    espacioPalabras: opciones.espacioPalabras || 0, // espacio extra entre palabras
    // Para fuentes que NO tienen negrita: la negrita se hace repasando el borde de
    // cada letra con una línea de este grosor y color (0 = no se usa)
    grosorNegrita: opciones.grosorNegrita || 0,
    colorTexto: opciones.colorTexto || '#000000',
  };
}

/** Dibuja una palabra en (x, y), con su fuente normal o en negrita. */
function escribirPalabra(doc, palabra, x, y, opciones) {
  const opcionesTexto = { lineBreak: false, characterSpacing: opciones.espaciado };

  if (palabra.negrita && opciones.grosorNegrita > 0) {
    // Negrita "dibujada": relleno + borde, así la letra se ve más gruesa
    doc.font(opciones.fuenteNegrita);
    doc.lineWidth(opciones.grosorNegrita).strokeColor(opciones.colorTexto);
    opcionesTexto.fill = true;
    opcionesTexto.stroke = true;
  } else if (palabra.negrita) {
    doc.font(opciones.fuenteNegrita);
  } else {
    doc.font(opciones.fuente);
  }

  doc.text(palabra.texto, x, y, opcionesTexto);
}

/**
 * Escribe un texto centrado. Si es muy largo, lo parte en varias líneas.
 * Lo que va entre **asteriscos** se escribe en negrita.
 *
 * @param {PDFDocument} doc
 * @param {string} texto
 * @param {number} centroX  posición horizontal del centro del texto
 * @param {number} y        posición vertical de la primera línea
 * @param {object} opcionesRecibidas  { fuente, tamano, ancho, espaciado, espacioPalabras }
 * @returns {number} el alto que ocupó el texto (sirve para saber dónde empieza lo siguiente)
 */
export function escribirCentrado(doc, texto, centroX, y, opcionesRecibidas) {
  const opciones = opcionesCompletas(opcionesRecibidas);
  doc.fontSize(opciones.tamano);

  const palabras = partirEnPalabras(texto);
  const lineas = armarLineas(doc, palabras, opciones);
  const espacio = medirEspacio(doc, opciones);
  doc.font(opciones.fuente);
  const altoLinea = doc.currentLineHeight(true) + 1;

  // PASO 3: dibujar cada línea, empezando donde queda centrada
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const yLinea = y + i * altoLinea;
    let x = centroX - linea.ancho / 2;

    for (let j = 0; j < linea.palabras.length; j++) {
      const palabra = linea.palabras[j];
      if (palabra.espacioAntes && j > 0) {
        x = x + espacio;
      }
      escribirPalabra(doc, palabra, x, yLinea, opciones);
      x = x + medirPalabra(doc, palabra, opciones);
    }
  }

  return lineas.length * altoLinea;
}

/**
 * Escribe un texto JUSTIFICADO (alineado a ambos lados), como en un documento.
 * Igual que escribirCentrado, pero en el paso 3 reparte el espacio que sobra
 * entre las palabras. La última línea del párrafo no se estira.
 *
 * @param {number} x  borde izquierdo del párrafo
 * @param {number} y  posición vertical de la primera línea
 * @returns {number} el alto que ocupó el texto
 */
export function escribirJustificado(doc, texto, x, y, opcionesRecibidas) {
  const opciones = opcionesCompletas(opcionesRecibidas);
  doc.fontSize(opciones.tamano);

  const palabras = partirEnPalabras(texto);
  const lineas = armarLineas(doc, palabras, opciones);
  const espacio = medirEspacio(doc, opciones);
  doc.font(opciones.fuente);
  const altoLinea = doc.currentLineHeight(true) + 1;

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const esUltima = i === lineas.length - 1;

    // ¿Cuántos espacios entre palabras hay en esta línea?
    let huecos = 0;
    for (let j = 1; j < linea.palabras.length; j++) {
      if (linea.palabras[j].espacioAntes) {
        huecos = huecos + 1;
      }
    }

    // Espacio extra por hueco para llegar justo al borde derecho
    let extra = 0;
    if (!esUltima && huecos > 0) {
      extra = (opciones.ancho - linea.ancho) / huecos;
    }

    let xPalabra = x;
    for (let j = 0; j < linea.palabras.length; j++) {
      const palabra = linea.palabras[j];
      if (palabra.espacioAntes && j > 0) {
        xPalabra = xPalabra + espacio + extra;
      }
      escribirPalabra(doc, palabra, xPalabra, y + i * altoLinea, opciones);
      xPalabra = xPalabra + medirPalabra(doc, palabra, opciones);
    }
  }

  return lineas.length * altoLinea;
}

/**
 * Calcula el alto que ocuparía un texto, SIN dibujarlo.
 * Sirve para acomodar varios párrafos antes de escribirlos.
 */
export function altoDeTexto(doc, texto, opcionesRecibidas) {
  const opciones = opcionesCompletas(opcionesRecibidas);
  doc.fontSize(opciones.tamano);
  const lineas = armarLineas(doc, partirEnPalabras(texto), opciones);
  doc.font(opciones.fuente);
  const altoLinea = doc.currentLineHeight(true) + 1;
  return lineas.length * altoLinea;
}

/**
 * Busca el tamaño de letra más grande (empezando en opciones.tamano)
 * con el que el texto cabe en UNA sola línea. Nunca baja de "minimo".
 * Se usa para textos que no deben partirse en dos líneas, como el nombre.
 */
export function tamanoParaUnaLinea(doc, texto, opcionesRecibidas, minimo = 14) {
  const opciones = opcionesCompletas(opcionesRecibidas);
  const palabras = partirEnPalabras(texto);
  let tamano = opciones.tamano;

  while (tamano > minimo) {
    doc.fontSize(tamano);
    const lineas = armarLineas(doc, palabras, opciones);
    if (lineas.length <= 1) {
      break; // cabe en una línea
    }
    tamano = tamano - 1;
  }
  return tamano;
}


// =============================================================
//  PÁRRAFOS
//  Un texto puede tener varios párrafos: cada salto de línea
//  (Enter) empieza uno nuevo.
// =============================================================

/**
 * Parte el texto en párrafos, uno por cada salto de línea.
 * Las líneas vacías se ignoran (dos Enter seguidos = un solo párrafo nuevo).
 * Ej. 'Hola\n\nGracias' -> ['Hola', 'Gracias']
 */
export function partirEnParrafos(texto) {
  const parrafos = [];
  const lineas = texto.split(/\r?\n/); // \r\n = salto de línea de Windows
  for (const linea of lineas) {
    const limpia = linea.trim();
    if (limpia !== '') {
      parrafos.push(limpia);
    }
  }
  return parrafos;
}

/** Espacio entre un párrafo y el siguiente: un poco más de media línea. */
export function espacioEntreParrafos(tamano) {
  return tamano * 0.6;
}

/** Alto de todos los párrafos juntos, sin dibujarlos. */
export function altoDeParrafos(doc, parrafos, opciones) {
  let total = 0;
  for (let i = 0; i < parrafos.length; i++) {
    total = total + altoDeTexto(doc, parrafos[i], opciones);
    if (i < parrafos.length - 1) {
      total = total + espacioEntreParrafos(opciones.tamano); // el último no lleva espacio después
    }
  }
  return total;
}

/**
 * Busca cómo acomodar un texto (con uno o varios párrafos) en un espacio
 * de "altoMaximo" puntos: empieza con opciones.tamano y achica la letra
 * de 0.5 en 0.5 hasta "tamanoMinimo".
 *
 * Devuelve { parrafos, tamano, cabe }:
 *   cabe = false  → ni con la letra más pequeña entra (el texto es muy largo).
 *
 * La usan el PDF (para dibujar) Y los esquemas (para validar), así las dos
 * partes siempre calculan lo mismo.
 */
export function acomodarParrafos(doc, texto, opciones, altoMaximo, tamanoMinimo) {
  const parrafos = partirEnParrafos(texto);
  const opcionesDePrueba = { ...opciones };

  while (opcionesDePrueba.tamano >= tamanoMinimo) {
    if (altoDeParrafos(doc, parrafos, opcionesDePrueba) <= altoMaximo) {
      return { parrafos: parrafos, tamano: opcionesDePrueba.tamano, cabe: true };
    }
    opcionesDePrueba.tamano = opcionesDePrueba.tamano - 0.5;
  }
  return { parrafos: parrafos, tamano: tamanoMinimo, cabe: false };
}

/**
 * Escribe los párrafos uno debajo del otro.
 * "alineacion" puede ser 'centrado' (x = centro) o 'justificado' (x = borde izquierdo).
 * @returns {number} el alto que ocupó todo
 */
export function escribirParrafos(doc, parrafos, x, y, opciones, alineacion) {
  let yActual = y;
  for (let i = 0; i < parrafos.length; i++) {
    let alto = 0;
    if (alineacion === 'justificado') {
      alto = escribirJustificado(doc, parrafos[i], x, yActual, opciones);
    } else {
      alto = escribirCentrado(doc, parrafos[i], x, yActual, opciones);
    }
    yActual = yActual + alto;
    if (i < parrafos.length - 1) {
      yActual = yActual + espacioEntreParrafos(opciones.tamano);
    }
  }
  return yActual - y;
}

/**
 * PDFKit escribe el texto desde ARRIBA de las letras, pero para que un texto
 * quede "sentado" sobre una línea (como una firma) hay que ubicar su LÍNEA
 * BASE: la línea imaginaria donde se apoyan las letras (la "g" y la "j"
 * bajan de ella).
 *
 * Devuelve la "y" donde hay que escribir para que la línea base quede en "yBase".
 * (doc._font.ascender es cuánto sube la letra más alta, en milésimas del tamaño)
 */
export function yParaLineaBase(doc, fuente, tamano, yBase) {
  doc.font(fuente);
  const alturaSobreLaBase = (doc._font.ascender / 1000) * tamano;
  return yBase - alturaSobreLaBase;
}
