// =============================================================
//  qr-dibujo.js — DIBUJA EL CÓDIGO QR (como texto SVG)
//
//  No toca la página: recibe el texto y el diseño, y devuelve el
//  dibujo SVG listo. qr.js lo usa para la vista previa, las
//  descargas y las miniaturas de las plantillas.
//
//  Medidas en "cuadritos" (módulos): cada cuadrito del QR mide 1 x 1.
//
//  El QR usa corrección de errores ALTA ('H'): aguanta que falte
//  cerca del 30 %. Por eso el logo puede tapar el centro.
//
//  IMPORTA          DE                                  PARA
//  qrcode           /librerias/qrcode/qrcode.mjs        calcular los cuadritos del QR
//  stringToBytes    /librerias/qrcode/qrcode_UTF8.mjs   que funcionen tildes y ñ
//
//  EXPORTA            LO IMPORTA  PARA
//  DISENO_INICIAL     qr.js       el diseño con el que empieza la herramienta
//  PLANTILLAS         qr.js       diseños listos ("Clásico", "UNICAH"…)
//  armarSVG(texto, d) qr.js       el dibujo del QR como texto SVG
// =============================================================
import qrcode from '/librerias/qrcode/qrcode.mjs';
import { stringToBytes } from '/librerias/qrcode/qrcode_UTF8.mjs';

qrcode.stringToBytes = stringToBytes; // el texto se guarda en UTF-8 (tildes, ñ, emojis)

const MARGEN = 4; // cuadritos libres alrededor (lo pide el estándar para que se lea bien)

/**
 * Todo lo que se puede cambiar del diseño.
 * (Los nombres son los mismos que data-ajuste="…" en index.html.)
 */
export const DISENO_INICIAL = {
  puntos: 'redondeados',        // 'cuadrados' | 'redondeados' | 'suaves' | 'puntos'
  colorPuntos: '#141B5B',
  degradado: false,             // true = los puntos pasan de colorPuntos a colorDegradado
  colorDegradado: '#5B2A86',
  esquinaMarco: 'redondeada',   // 'cuadrada' | 'redondeada' | 'circulo'
  esquinaCentro: 'redondeado',  // 'cuadrado' | 'redondeado' | 'punto'
  colorEsquinas: '#141B5B',
  colorFondo: '#FFFFFF',
  fondoTransparente: false,
  logo: null,                   // la imagen como data URL, o null (sin logo)
  tamanoLogo: 22,               // % del ancho del QR (12 a 26)
  fondoLogo: true,              // fondo detrás del logo (se lee mejor)
  formaFondoLogo: 'cuadrado',   // 'cuadrado' | 'circulo'
  marco: 'ninguno',             // 'ninguno' | 'abajo'
  textoMarco: 'ESCANÉAME',
  colorMarco: '#141B5B',
};

/** Diseños listos: cada uno cambia solo lo que dice (el logo y el texto se respetan). */
export const PLANTILLAS = [
  {
    nombre: 'Clásico',
    diseno: { puntos: 'cuadrados', colorPuntos: '#000000', degradado: false, esquinaMarco: 'cuadrada', esquinaCentro: 'cuadrado', colorEsquinas: '#000000', colorFondo: '#FFFFFF', marco: 'ninguno' },
  },
  {
    nombre: 'UNICAH',
    diseno: { puntos: 'redondeados', colorPuntos: '#141B5B', degradado: false, esquinaMarco: 'redondeada', esquinaCentro: 'redondeado', colorEsquinas: '#9A7A16', colorFondo: '#FFFFFF', marco: 'ninguno' },
  },
  {
    nombre: 'Moderno',
    diseno: { puntos: 'puntos', colorPuntos: '#141B5B', degradado: true, colorDegradado: '#5B2A86', esquinaMarco: 'circulo', esquinaCentro: 'punto', colorEsquinas: '#141B5B', colorFondo: '#FFFFFF', marco: 'ninguno' },
  },
  {
    nombre: 'Suave',
    diseno: { puntos: 'suaves', colorPuntos: '#1F5E3B', degradado: false, esquinaMarco: 'redondeada', esquinaCentro: 'punto', colorEsquinas: '#1F5E3B', colorFondo: '#F3FAF5', marco: 'ninguno' },
  },
  {
    nombre: 'Con marco',
    diseno: { puntos: 'redondeados', colorPuntos: '#7A1428', degradado: false, esquinaMarco: 'redondeada', esquinaCentro: 'redondeado', colorEsquinas: '#7A1428', colorFondo: '#FFFFFF', marco: 'abajo', colorMarco: '#7A1428' },
  },
];


// =============================================================
//  EL DIBUJO COMPLETO
// =============================================================

/**
 * Arma el código QR como texto SVG.
 * Lanza un error si el texto es demasiado largo para un QR.
 *
 * @param {string} texto  lo que guarda el QR
 * @param {object} d      el diseño (ver DISENO_INICIAL)
 */
export function armarSVG(texto, d) {
  const qr = qrcode(0, 'H');   // 0 = el tamaño lo elige la librería; 'H' = corrección alta
  qr.addData(texto, 'Byte');
  qr.make();

  const n = qr.getModuleCount();           // cuadritos por lado (ej. 33)
  const lado = n + MARGEN * 2;             // con el margen

  // Zona del logo, en cuadritos (impar, para que quede justo al centro)
  let ladoLogo = 0;
  if (d.logo) {
    ladoLogo = Math.round(n * d.tamanoLogo / 100);
    if (ladoLogo % 2 === 0) {
      ladoLogo = ladoLogo + 1;
    }
  }
  const inicioLogo = (n - ladoLogo) / 2;

  /** true si en esa fila y columna hay un cuadrito oscuro que se dibuja como "punto". */
  function hayPunto(fila, columna) {
    if (fila < 0 || columna < 0 || fila >= n || columna >= n) {
      return false;
    }
    if (!qr.isDark(fila, columna) || esEsquina(fila, columna, n)) {
      return false;
    }
    if (d.logo && dentroDelLogo(fila, columna, inicioLogo, ladoLogo)) {
      return false;
    }
    return true;
  }

  // 1. Los puntos
  let puntos = '';
  for (let fila = 0; fila < n; fila++) {
    for (let columna = 0; columna < n; columna++) {
      if (hayPunto(fila, columna)) {
        puntos += dibujarPunto(d.puntos, columna + MARGEN, fila + MARGEN, fila, columna, hayPunto);
      }
    }
  }

  // 2. Las 3 esquinas (los "ojos" del QR)
  let esquinas = '';
  for (const [fila, columna] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    esquinas += dibujarEsquina(d, columna + MARGEN, fila + MARGEN);
  }

  // 3. Colores: un color o un degradado (en diagonal)
  let definiciones = '';
  let rellenoPuntos = d.colorPuntos;
  if (d.degradado) {
    definiciones = `<defs><linearGradient id="degradado" x1="0" y1="0" x2="1" y2="1">`
      + `<stop offset="0" stop-color="${d.colorPuntos}"/><stop offset="1" stop-color="${d.colorDegradado}"/>`
      + `</linearGradient></defs>`;
    rellenoPuntos = 'url(#degradado)';
  }

  // 4. Fondo y logo
  let fondo = '';
  if (!d.fondoTransparente) {
    fondo = `<rect width="${lado}" height="${lado}" fill="${d.colorFondo}"/>`;
  }
  const logo = dibujarLogo(d, inicioLogo + MARGEN, ladoLogo);

  const dibujoQR = fondo
    + `<path d="${puntos}" fill="${rellenoPuntos}"/>`
    + `<g fill="${d.colorEsquinas}">${esquinas}</g>`
    + logo;

  if (d.marco === 'abajo') {
    return conMarco(dibujoQR, definiciones, lado, d);
  }
  return abrirSVG(lado, lado) + definiciones + dibujoQR + '</svg>';
}

/**
 * La etiqueta <svg> de inicio. width y height (10 px por cuadrito) le dan
 * al dibujo su tamaño y su proporción al convertirlo en PNG.
 */
function abrirSVG(ancho, alto) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" width="${ancho * 10}" height="${alto * 10}">`;
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


// =============================================================
//  LOS PUNTOS (cada cuadrito oscuro)
// =============================================================

/**
 * Un cuadrito, según el estilo:
 *   cuadrados   ■  el clásico
 *   redondeados    se unen con sus vecinos; solo se redondean las puntas sueltas
 *   suaves      ▢  cada uno con las puntas redondeadas, un poquito separados
 *   puntos      ●  círculos
 */
function dibujarPunto(estilo, x, y, fila, columna, hayPunto) {
  if (estilo === 'puntos') {
    return circulo(x + 0.5, y + 0.5, 0.45);
  }
  if (estilo === 'suaves') {
    return rectanguloRedondeado(x + 0.06, y + 0.06, 0.88, 0.88, 0.3, 0.3, 0.3, 0.3);
  }
  if (estilo === 'redondeados') {
    // Una punta se redondea solo si no tiene vecino ni arriba/abajo ni al lado
    const arriba = hayPunto(fila - 1, columna);
    const abajo = hayPunto(fila + 1, columna);
    const izquierda = hayPunto(fila, columna - 1);
    const derecha = hayPunto(fila, columna + 1);
    const r = 0.5;
    return rectanguloRedondeado(x, y, 1, 1,
      (!arriba && !izquierda) ? r : 0,
      (!arriba && !derecha) ? r : 0,
      (!abajo && !derecha) ? r : 0,
      (!abajo && !izquierda) ? r : 0);
  }
  return `M${x} ${y}h1v1h-1z`; // cuadrados
}


// =============================================================
//  LAS ESQUINAS ("ojos")
//  Un marco de 7 x 7 con un centro de 3 x 3.
// =============================================================

function dibujarEsquina(d, x, y) {
  // El marco: la forma de 7 a la que se le "recorta" una de 5 (fill-rule="evenodd")
  let marco;
  if (d.esquinaMarco === 'circulo') {
    marco = circulo(x + 3.5, y + 3.5, 3.5) + circulo(x + 3.5, y + 3.5, 2.5);
  } else if (d.esquinaMarco === 'redondeada') {
    marco = cuadradoRedondeado(x, y, 7, 2) + cuadradoRedondeado(x + 1, y + 1, 5, 1.2);
  } else {
    marco = cuadradoRedondeado(x, y, 7, 0) + cuadradoRedondeado(x + 1, y + 1, 5, 0);
  }

  // Un centro cuadrado dentro de un marco redondo: sus puntas quedan casi
  // pegadas al marco (en diagonal) y algunos lectores no lo reconocen
  // cuando el QR se ve pequeño. En ese caso el centro se redondea un poco.
  let estiloCentro = d.esquinaCentro;
  if (d.esquinaMarco === 'circulo' && estiloCentro === 'cuadrado') {
    estiloCentro = 'redondeado';
  }

  let centro;
  if (estiloCentro === 'punto') {
    centro = circulo(x + 3.5, y + 3.5, 1.5);
  } else if (estiloCentro === 'redondeado') {
    centro = cuadradoRedondeado(x + 2, y + 2, 3, 0.9);
  } else {
    centro = cuadradoRedondeado(x + 2, y + 2, 3, 0);
  }
  return `<path fill-rule="evenodd" d="${marco}"/><path d="${centro}"/>`;
}


// =============================================================
//  EL LOGO Y EL MARCO
// =============================================================

function dibujarLogo(d, x, ladoLogo) {
  if (!d.logo) {
    return '';
  }
  let dibujo = '';
  const espacio = 0.6; // separación entre el logo y su fondo
  if (d.fondoLogo) {
    let colorFondoLogo = d.colorFondo;
    if (d.fondoTransparente) {
      colorFondoLogo = '#FFFFFF';
    }
    if (d.formaFondoLogo === 'circulo') {
      dibujo += `<circle cx="${x + ladoLogo / 2}" cy="${x + ladoLogo / 2}" r="${ladoLogo / 2 + 0.3}" fill="${colorFondoLogo}"/>`;
    } else {
      dibujo += `<rect x="${x}" y="${x}" width="${ladoLogo}" height="${ladoLogo}" rx="${ladoLogo * 0.2}" fill="${colorFondoLogo}"/>`;
    }
  }
  // En un círculo, el logo va un poco más chico para no salirse
  let margenLogo = espacio;
  if (d.fondoLogo && d.formaFondoLogo === 'circulo') {
    margenLogo = ladoLogo * 0.15;
  }
  dibujo += `<image href="${escaparAtributo(d.logo)}" x="${x + margenLogo}" y="${x + margenLogo}" `
    + `width="${ladoLogo - margenLogo * 2}" height="${ladoLogo - margenLogo * 2}" preserveAspectRatio="xMidYMid meet"/>`;
  return dibujo;
}

/**
 * El QR dentro de un marco de color, con un texto abajo (ej. "ESCANÉAME").
 * El dibujo crece: el QR queda arriba, sobre una tarjeta blanca.
 */
function conMarco(dibujoQR, definiciones, lado, d) {
  const borde = 1.6;                 // grosor del marco alrededor del QR
  const altoTexto = lado * 0.2;      // la franja de abajo, con el texto
  const ancho = lado + borde * 2;
  const alto = lado + borde * 2 + altoTexto;
  const radio = lado * 0.06;
  const texto = escaparTexto(d.textoMarco.trim().toUpperCase());
  const tamanoLetra = Math.min(altoTexto * 0.5, (ancho * 0.85) / Math.max(texto.length, 1) * 1.6);

  return abrirSVG(ancho, alto) + definiciones
    + `<rect width="${ancho}" height="${alto}" rx="${radio}" fill="${d.colorMarco}"/>`
    + `<rect x="${borde}" y="${borde}" width="${lado}" height="${lado}" rx="${radio * 0.6}" fill="${d.fondoTransparente ? '#FFFFFF' : d.colorFondo}"/>`
    + `<g transform="translate(${borde} ${borde})">${dibujoQR}</g>`
    + `<text x="${ancho / 2}" y="${lado + borde * 2 + altoTexto * 0.62}" text-anchor="middle" `
    + `font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${tamanoLetra}" `
    + `letter-spacing="${tamanoLetra * 0.12}" fill="#FFFFFF">${texto}</text>`
    + '</svg>';
}


// =============================================================
//  FIGURAS (instrucciones de SVG para un <path>)
// =============================================================

function circulo(cx, cy, r) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 -${r * 2} 0z`;
}

function cuadradoRedondeado(x, y, l, r) {
  return rectanguloRedondeado(x, y, l, l, r, r, r, r);
}

/**
 * Un rectángulo con cada punta redondeada a su gusto
 * (sup. izquierda, sup. derecha, inf. derecha, inf. izquierda).
 */
function rectanguloRedondeado(x, y, ancho, alto, r1, r2, r3, r4) {
  return `M${x + r1} ${y}`
    + `H${x + ancho - r2}` + (r2 ? `A${r2} ${r2} 0 0 1 ${x + ancho} ${y + r2}` : '')
    + `V${y + alto - r3}` + (r3 ? `A${r3} ${r3} 0 0 1 ${x + ancho - r3} ${y + alto}` : '')
    + `H${x + r4}` + (r4 ? `A${r4} ${r4} 0 0 1 ${x} ${y + alto - r4}` : '')
    + `V${y + r1}` + (r1 ? `A${r1} ${r1} 0 0 1 ${x + r1} ${y}` : '')
    + 'Z';
}

/** Para poner texto del usuario dentro del SVG sin romperlo (<, >, &). */
function escaparTexto(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escaparAtributo(texto) {
  return escaparTexto(texto).replace(/"/g, '&quot;');
}
