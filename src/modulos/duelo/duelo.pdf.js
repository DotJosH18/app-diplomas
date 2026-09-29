// =============================================================
//  MÓDULO COMUNICADO DE DUELO - PDF
//  Dibuja la página COMPLETA (no usa el diseño de diploma):
//
//    COMUNICADO                         [logo]
//    ▬▬▬▬▬▬▬▬▬▬▬▬
//
//    La Universidad Católica de Honduras… que:     ← introducción (fija)
//
//    1. Con el corazón entristecido… **Nombre**.   ← anuncio
//    2. Exhortamos a la comunidad…                 ← exhortación
//    3. Enviamos nuestras muestras… **Nombre**.    ← condolencias
//
//    Que el Divino Redentor…                       ← despedida
//
//                                   Lugar          ← en negrita
//                                   fecha
//
//  El texto va justificado. {nombre} se reemplaza por el nombre y
//  **texto** va en negrita.
// =============================================================
import { escribirJustificado, altoDeTexto } from '../../utils/pdfTexto.js';
import config from './duelo.config.js';

const colores = config.colores;
const y = config.posiciones;

/**
 * @param {PDFDocument} doc
 * @param {object} nota             datos ya validados por el esquema
 * @param {object} personalizacion  { titulo, logo } opcionales (el color de banda no se usa aquí)
 */
export function dibujarPagina(doc, nota, personalizacion) {
  dibujarFondo(doc);
  dibujarTitulo(doc, personalizacion);
  dibujarLogo(doc, personalizacion);
  dibujarTexto(doc, nota);
  dibujarPie(doc, nota);
}

// -------------------------------------------------------------

/** Fondo blanco con figuras grises muy suaves en los costados. */
function dibujarFondo(doc) {
  const ancho = doc.page.width;
  const alto = doc.page.height;

  doc.rect(0, 0, ancho, alto).fill(colores.fondo);

  doc.fillColor(colores.figurasFondo);
  // Triángulo a la izquierda, a media altura
  doc.polygon([0, alto * 0.42], [70, alto * 0.52], [0, alto * 0.62]).fill();
  // Figura en forma de flecha a la derecha
  doc.polygon([ancho, alto * 0.30], [ancho - 110, alto * 0.47], [ancho, alto * 0.64], [ancho, alto * 0.56], [ancho - 55, alto * 0.47], [ancho, alto * 0.38]).fill();
  // Triángulo abajo a la izquierda
  doc.polygon([0, alto * 0.80], [95, alto], [0, alto]).fill();
}

/** El título ("COMUNICADO" u otro) con la barra de dos tonos debajo. */
function dibujarTitulo(doc, personalizacion) {
  const x = config.margenLateral;

  // Título: el que escribió el usuario o el de por defecto, siempre en mayúsculas
  let titulo = config.titulo;
  if (personalizacion.titulo) {
    titulo = personalizacion.titulo;
  }
  titulo = titulo.toUpperCase();

  // Espacio para el título: desde el margen hasta un poco antes del logo
  const anchoDisponible = doc.page.width - 2 * config.margenLateral - config.logoCaja.ancho - 20;

  // Tamaño: empieza grande y se achica de 1 en 1 hasta que el título cabe
  const tamanoMaximo = config.tamanoTitulo.maximo;
  let tamano = tamanoMaximo;
  doc.font('titular');
  while (tamano > config.tamanoTitulo.minimo) {
    doc.fontSize(tamano);
    const anchoDelTitulo = doc.widthOfString(titulo, { characterSpacing: 0.5 });
    if (anchoDelTitulo <= anchoDisponible) {
      break; // ya cabe
    }
    tamano = tamano - 1;
  }

  // Si la letra es más pequeña, se baja un poco para que quede pegada a la barra
  const yTitulo = y.titulo + (tamanoMaximo - tamano) * 0.75;

  doc.font('titular').fontSize(tamano).fillColor(colores.texto);
  doc.text(titulo, x, yTitulo, { lineBreak: false, characterSpacing: 0.5 });

  // Barra: tramo oscuro y, a continuación, tramo claro
  doc.rect(x, y.barra, 78, 6).fill(colores.barraOscura);
  doc.rect(x + 78, y.barra, 46, 6).fill(colores.barraClara);
}

/** Logo arriba a la derecha. */
function dibujarLogo(doc, personalizacion) {
  let logo = config.logo;
  if (personalizacion.logo) {
    logo = personalizacion.logo; // el que subió el usuario
  }

  const caja = config.logoCaja;
  const x = doc.page.width - config.margenLateral - caja.ancho;
  doc.image(logo, x, y.logo, {
    fit: [caja.ancho, caja.alto],
    align: 'right',
    valign: 'center',
  });
}

/**
 * Arma los párrafos en orden. Los 3 puntos llevan su número al inicio.
 * También reemplaza {nombre} por el nombre de la persona.
 */
function armarParrafos(nota) {
  const conNombre = (texto) => texto.replaceAll('{nombre}', nota.nombre);

  return [
    config.introduccion,
    `1. ${conNombre(nota.anuncio)}`,
    `2. ${conNombre(nota.exhortacion)}`,
    `3. ${conNombre(nota.condolencias)}`,
    conNombre(nota.despedida),
  ];
}

function dibujarTexto(doc, nota) {
  const x = config.margenLateral;
  const ancho = doc.page.width - 2 * config.margenLateral;
  const parrafos = armarParrafos(nota);
  const espacioDisponible = y.pie - 30 - y.texto;

  // 1. Tamaño de letra: el más grande con el que todo cabe.
  //    Entre párrafos queda una línea en blanco (el mismo alto que el tamaño de letra).
  let tamano = config.tamanoTexto.maximo;
  while (altoTotal(doc, parrafos, tamano, ancho) > espacioDisponible && tamano > config.tamanoTexto.minimo) {
    tamano = tamano - 0.5;
  }

  // 2. Escribir cada párrafo justificado, uno debajo del otro
  const opciones = { tamano: tamano, ancho: ancho };
  let yActual = y.texto;
  doc.fillColor(colores.texto);
  for (const parrafo of parrafos) {
    const alto = escribirJustificado(doc, parrafo, x, yActual, opciones);
    yActual = yActual + alto + tamano; // + una línea en blanco
  }
}

/** Alto de todos los párrafos con un tamaño de letra (sin dibujarlos). */
function altoTotal(doc, parrafos, tamano, ancho) {
  let total = 0;
  for (const parrafo of parrafos) {
    total = total + altoDeTexto(doc, parrafo, { tamano: tamano, ancho: ancho }) + tamano;
  }
  return total;
}

/** Lugar (en negrita) y fecha, abajo a la derecha. */
function dibujarPie(doc, nota) {
  const x = config.margenLateral;
  const ancho = doc.page.width - 2 * config.margenLateral;

  doc.fillColor(colores.texto).fontSize(12);
  doc.font('negrita').text(nota.lugar, x, y.pie, { width: ancho, align: 'right' });
  doc.font('normal').text(nota.fecha, x, y.pie + 17, { width: ancho, align: 'right' });
}
