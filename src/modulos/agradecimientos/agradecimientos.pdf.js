// =============================================================
//  MÓDULO AGRADECIMIENTOS - PDF
//  Dibuja la página COMPLETA (hoja oficio vertical):
//
//    ┌──────────────────────────────┐   ← marco café con esquinas curvas
//    │            [logo]            │
//    │        AGRADECIMIENTO        │   ← título
//    │         CONCEDIDO A:         │
//    │       Familia Zaldívar       │   ← nombre
//    │      ──────────────────      │
//    │  Expresamos nuestro más …    │   ← descripción (justificada, uno o varios párrafos)
//    │                              │
//    │      09 de abril de 2025     │   ← fecha
//    │            UNICAH            │
//    │     CAMPUS SANTA CLARA       │   ← campus (opcional)
//    └──────────────────────────────┘
//
//  IMPORTA               DE                         PARA
//  escribir…, acomodar…  ../../utils/pdfTexto.js    escribir textos y párrafos
//  config                agradecimientos.config.js  medidas, colores y textos
//
//  EXPORTA              LO IMPORTA                 PARA
//  dibujarPagina        agradecimientos.modulo.js  dibujar la página completa
//  acomodarDescripcion  agradecimientos.schema.js  validar con el mismo cálculo del dibujo
// =============================================================
import { escribirCentrado, acomodarParrafos, escribirParrafos } from '../../utils/pdfTexto.js';
import config from './agradecimientos.config.js';

const colores = config.colores;
const y = config.posiciones;
const tamanos = config.tamanos;

/**
 * @param {PDFDocument} doc
 * @param {object} diploma          datos ya validados por el esquema
 * @param {object} personalizacion  { logo } opcional
 */
export function dibujarPagina(doc, diploma, personalizacion) {
  const centro = doc.page.width / 2;

  dibujarFondo(doc);
  dibujarMarco(doc);
  dibujarLogo(doc, centro, personalizacion);
  dibujarTitulo(doc, centro, diploma);
  dibujarNombre(doc, centro, diploma);
  dibujarDescripcion(doc, diploma);
  dibujarFechaYPie(doc, centro, diploma);
}

// -------------------------------------------------------------

/** La imagen de pergamino ocupa toda la hoja. */
function dibujarFondo(doc) {
  doc.image(config.fondo, 0, 0, { width: doc.page.width, height: doc.page.height });
}

/** Línea gruesa, línea delgada por dentro y un cuadrito en cada esquina. */
function dibujarMarco(doc) {
  const m = config.marco;
  const izquierda = m.separacion;
  const arriba = m.separacion;
  const derecha = doc.page.width - m.separacion;
  const abajo = doc.page.height - m.separacion;

  doc.strokeColor(colores.marco);

  // 1. Línea gruesa
  doc.lineWidth(m.grosor);
  doc.path(caminoDelMarco(izquierda, arriba, derecha, abajo, 0, m.radioEsquina)).stroke();

  // 2. Línea delgada, un poco más adentro (sus curvas tienen el mismo centro)
  doc.lineWidth(m.grosorInterno);
  doc.path(caminoDelMarco(izquierda, arriba, derecha, abajo, m.separacionInterna, m.radioEsquina + m.separacionInterna)).stroke();

  // 3. Un cuadrito en cada esquina, dentro de la curva
  const lado = m.cuadroEsquina;
  const esquinas = [
    [izquierda, arriba],
    [derecha, arriba],
    [derecha, abajo],
    [izquierda, abajo],
  ];
  doc.lineWidth(1.5);
  for (const esquina of esquinas) {
    doc.rect(esquina[0] - lado / 2, esquina[1] - lado / 2, lado, lado).stroke();
  }
}

/**
 * Arma el contorno de un rectángulo con las 4 esquinas curvas HACIA ADENTRO,
 * como texto de "camino SVG" (M = mover, L = línea, A = arco, Z = cerrar).
 *
 * Las curvas tienen su centro en las esquinas del rectángulo exterior
 * (izquierda, arriba, derecha, abajo). "adentro" es cuánto más adentro va
 * esta línea, y "radio" el tamaño de la curva.
 */
function caminoDelMarco(izquierda, arriba, derecha, abajo, adentro, radio) {
  // Bordes de esta línea
  const x0 = izquierda + adentro;
  const y0 = arriba + adentro;
  const x1 = derecha - adentro;
  const y1 = abajo - adentro;

  // Dónde empieza cada curva, medido desde la esquina exterior (Pitágoras)
  const a = Math.sqrt(radio * radio - adentro * adentro);
  const arco = `A ${radio} ${radio} 0 0 0`;

  return [
    `M ${izquierda + a} ${y0}`,
    `L ${derecha - a} ${y0}`, `${arco} ${x1} ${arriba + a}`,  // esquina de arriba a la derecha
    `L ${x1} ${abajo - a}`, `${arco} ${derecha - a} ${y1}`,   // abajo a la derecha
    `L ${izquierda + a} ${y1}`, `${arco} ${x0} ${abajo - a}`, // abajo a la izquierda
    `L ${x0} ${arriba + a}`, `${arco} ${izquierda + a} ${y0}`, // arriba a la izquierda
    'Z',
  ].join(' ');
}

/** Logo arriba, al centro. */
function dibujarLogo(doc, centro, personalizacion) {
  let logo = config.logo;
  if (personalizacion.logo) {
    logo = personalizacion.logo; // el que subió el usuario
  }

  const caja = config.logoCaja;
  doc.image(logo, centro - caja.ancho / 2, y.logo, {
    fit: [caja.ancho, caja.alto],
    align: 'center',
    valign: 'center',
  });
}

/** "AGRADECIMIENTO" (o el título que escribieron) y "CONCEDIDO A:". */
function dibujarTitulo(doc, centro, diploma) {
  const titulo = diploma.tituloDiploma.toUpperCase();
  const tamano = tamanoQueCabe(doc, 'serifClasica', titulo, tamanos.titulo, 440, 1);

  doc.fillColor(colores.texto);
  escribirCentrado(doc, titulo, centro, y.titulo, { fuente: 'serifClasica', tamano: tamano, ancho: 500, espaciado: 1 });

  doc.fillColor(colores.saludo);
  escribirCentrado(doc, config.saludo, centro, y.saludo, { fuente: 'negrita', tamano: tamanos.saludo, ancho: 500 });
}

/** El nombre, con una línea debajo. */
function dibujarNombre(doc, centro, diploma) {
  const linea = config.lineaNombre;
  const tamano = tamanoQueCabe(doc, 'serifClasica', diploma.nombre, tamanos.nombre, 420, 0);

  doc.fillColor(colores.texto);
  escribirCentrado(doc, diploma.nombre, centro, y.nombre, { fuente: 'serifClasica', tamano: tamano, ancho: 500 });

  // Si el nombre es más ancho que la línea, la línea se alarga un poco
  doc.font('serifClasica').fontSize(tamano);
  const anchoLinea = Math.max(linea.ancho, doc.widthOfString(diploma.nombre) + 40);

  doc.moveTo(centro - anchoLinea / 2, y.lineaNombre)
    .lineTo(centro + anchoLinea / 2, y.lineaNombre)
    .lineWidth(linea.grosor)
    .strokeColor(colores.texto)
    .stroke();
}

/** Opciones de letra de la descripción (sin el tamaño, que se calcula). */
function opcionesDescripcion() {
  return {
    fuente: 'caligrafica',
    // Esta letra no tiene negrita: lo que va entre **asteriscos** se escribe con
    // la misma letra, repasando el borde para que se vea más gruesa
    fuenteNegrita: 'caligrafica',
    grosorNegrita: 0.45,
    colorTexto: colores.texto,
    ancho: config.pagina.tamano[0] - 2 * config.margenTexto, // ancho de la hoja menos los márgenes
  };
}

/**
 * Calcula cómo queda la descripción: sus párrafos, el tamaño de letra
 * y si cabe en su espacio. La usan el PDF y el esquema (para validar).
 */
export function acomodarDescripcion(doc, texto) {
  const opciones = opcionesDescripcion();
  opciones.tamano = tamanos.descripcion.maximo;
  const alto = y.finDescripcion - y.descripcion;
  return acomodarParrafos(doc, texto, opciones, alto, tamanos.descripcion.minimo);
}

/**
 * La descripción, justificada. Puede tener varios párrafos: cada salto de
 * línea (Enter) empieza uno nuevo. La letra se achica si el texto es largo.
 */
function dibujarDescripcion(doc, diploma) {
  const acomodo = acomodarDescripcion(doc, diploma.descripcion);
  const opciones = opcionesDescripcion();
  opciones.tamano = acomodo.tamano;

  doc.fillColor(colores.texto);
  escribirParrafos(doc, acomodo.parrafos, config.margenTexto, y.descripcion, opciones, 'justificado');
}

/** Fecha y, abajo, "UNICAH" con el campus (si hay). */
function dibujarFechaYPie(doc, centro, diploma) {
  doc.fillColor(colores.texto);
  escribirCentrado(doc, diploma.fecha, centro, y.fecha, { fuente: 'normal', tamano: tamanos.fecha, ancho: 500 });

  escribirCentrado(doc, config.institucion, centro, y.pie, { fuente: 'serifClasica', tamano: tamanos.pie, ancho: 500, espaciado: 0.5 });
  if (diploma.campus !== '') {
    const campus = diploma.campus.toUpperCase();
    const tamano = tamanoQueCabe(doc, 'serifClasica', campus, tamanos.pie, 440, 0.5);
    escribirCentrado(doc, campus, centro, y.pie + 32, { fuente: 'serifClasica', tamano: tamano, ancho: 500, espaciado: 0.5 });
  }
}

/**
 * El tamaño de letra más grande (empezando en "maximo") con el que el texto
 * cabe en "ancho" puntos, en una sola línea. Baja de 1 en 1 hasta 12.
 */
function tamanoQueCabe(doc, fuente, texto, maximo, ancho, espaciado) {
  let tamano = maximo;
  doc.font(fuente);
  while (tamano > 12) {
    doc.fontSize(tamano);
    if (doc.widthOfString(texto, { characterSpacing: espaciado }) <= ancho) {
      break; // ya cabe
    }
    tamano = tamano - 1;
  }
  return tamano;
}
