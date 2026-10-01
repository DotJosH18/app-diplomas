// =============================================================
//  SERVICIO PDF
//  Dibuja los diplomas con la librería PDFKit.
//  Cada diploma ocupa una página. Varios diplomas = un solo PDF
//  con varias páginas.
//
//  Hay dos formas de dibujar, según el módulo:
//
//  1. Diplomas (Reconocimientos, Lugares): aquí se dibuja lo común
//     (banda, encabezado, texto principal, lugar y fecha, firmas) y el
//     módulo solo dibuja su parte central con "dibujarCuerpo".
//
//  2. Documentos con un diseño propio (Comunicado de duelo, Agradecimientos): el módulo tiene
//     "dibujarPagina" y dibuja la página completa él mismo.
//
//  Ver src/modulos/<módulo>/<módulo>.pdf.js
//
//  Para mover o cambiar algo, lo normal es editar
//  src/config/diseno.config.js, no este archivo.
//
//  IMPORTA                               DE                       PARA
//  PDFDocument                           pdfkit (librería)        crear el PDF
//  diseno                                config/diseno.config.js  medidas y colores comunes
//  escribirCentrado, tamanoParaUnaLinea  utils/pdfTexto.js        escribir textos
//  registrarFuentes                      utils/pdfFuentes.js      las fuentes
//
//  EXPORTA              LO IMPORTA                          PARA
//  generarPDF           controllers/diplomas.controller.js  un documento
//  generarPDFConVarios  controllers/diplomas.controller.js  un PDF con una página por fila del Excel
// =============================================================
import PDFDocument from 'pdfkit';
import diseno from '../config/diseno.config.js';
import { escribirCentrado, tamanoParaUnaLinea } from '../utils/pdfTexto.js';
import { registrarFuentes } from '../utils/pdfFuentes.js';

/**
 * Crea un PDF con un solo diploma.
 * @param {object} modulo           el tipo de diploma (ver src/modulos)
 * @param {object} diploma          datos ya validados por el esquema del módulo
 * @param {object} personalizacion  { colorBanda, logo } opcionales (ver leerPersonalizacion)
 * @returns {Promise<Buffer>} el archivo PDF
 */
export function generarPDF(modulo, diploma, personalizacion = {}) {
  return generarPDFConVarios(modulo, [diploma], personalizacion);
}

/**
 * Crea un solo PDF con una página por cada diploma.
 * @param {object} modulo           el tipo de diploma (ver src/modulos)
 * @param {object[]} diplomas       lista de diplomas ya validados
 * @param {object} personalizacion  { colorBanda, logo } opcionales (ver leerPersonalizacion)
 * @returns {Promise<Buffer>} el archivo PDF
 */
export function generarPDFConVarios(modulo, diplomas, personalizacion = {}) {
  // PDFKit trabaja con eventos, por eso envolvemos todo en una Promesa:
  // así el controlador solo tiene que hacer "await generarPDFConVarios(...)".
  // Tamaño de la hoja: el del módulo si tiene uno propio, si no, el de los diplomas
  let pagina = diseno.pagina;
  if (modulo.config.pagina) {
    pagina = modulo.config.pagina;
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: pagina.tamano,
      layout: pagina.orientacion,
      margin: 0,
      autoFirstPage: false, // las páginas las agregamos nosotros, una por diploma
    });

    // PDFKit entrega el archivo en pedazos. Los guardamos y al final los unimos.
    const pedazos = [];
    doc.on('data', (pedazo) => pedazos.push(pedazo));
    doc.on('end', () => resolve(Buffer.concat(pedazos)));
    doc.on('error', reject);

    try {
      // Nombres cortos para usar las fuentes: doc.font('negrita')
      registrarFuentes(doc);

      for (const diploma of diplomas) {
        doc.addPage();
        if (modulo.dibujarPagina) {
          modulo.dibujarPagina(doc, diploma, personalizacion); // diseño propio del módulo
        } else {
          dibujarDiploma(doc, modulo, diploma, personalizacion); // diseño de diploma
        }
      }

      doc.end(); // termina el PDF: dispara el evento 'end'
    } catch (error) {
      reject(error);
    }
  });
}

/** Dibuja un diploma completo en la página actual. */
function dibujarDiploma(doc, modulo, diploma, personalizacion) {
  // Los textos se centran en la zona blanca (a la derecha de la barra azul)
  const inicioZonaBlanca = diseno.barraLateral.ancho;
  const anchoZonaBlanca = doc.page.width - inicioZonaBlanca;
  const centro = inicioZonaBlanca + anchoZonaBlanca / 2;

  dibujarBarraLateral(doc, personalizacion);
  dibujarEncabezado(doc, centro, diploma, personalizacion);
  dibujarSaludo(doc, centro, modulo.config.saludo);
  dibujarTextoPrincipal(doc, centro, modulo, diploma); // nombre, o el lugar obtenido
  modulo.dibujarCuerpo(doc, centro, diploma);   // ← la parte propia de cada módulo
  dibujarLugarYFecha(doc, centro, diploma);
  dibujarFirmas(doc, centro, diploma);
}

// -------------------------------------------------------------
//  Partes del diploma (de arriba hacia abajo)
// -------------------------------------------------------------

/**
 * Banda de color de la izquierda con el logo.
 * El color y el logo pueden venir personalizados; si no, se usan los de diseno.config.js.
 */
function dibujarBarraLateral(doc, personalizacion) {
  const barra = diseno.barraLateral;
  const caja = barra.cajaLogo;

  let color = diseno.colores.azul;
  if (personalizacion.colorBanda) {
    color = personalizacion.colorBanda;
  }

  let logo = diseno.logo;        // ruta del logo por defecto
  if (personalizacion.logo) {
    logo = personalizacion.logo; // Buffer con la imagen subida
  }

  // Rectángulo del alto de toda la página
  doc.rect(0, 0, barra.ancho, doc.page.height).fill(color);

  // Logo ajustado dentro de su caja, centrado y sin deformarse
  const xCaja = (barra.ancho - caja.ancho) / 2;
  doc.image(logo, xCaja, caja.y, {
    fit: [caja.ancho, caja.alto],
    align: 'center',
    valign: 'center',
  });
}

/**
 * Las 2 líneas de arriba (universidad y sede) y el campus.
 * Las líneas pueden venir personalizadas; si no, se usan las de diseno.config.js.
 */
function dibujarEncabezado(doc, centro, diploma, personalizacion) {
  const y = diseno.posiciones;
  const hayCampus = diploma.campus !== '';

  let linea1 = diseno.textosFijos.universidad;
  if (personalizacion.encabezado1) {
    linea1 = personalizacion.encabezado1.toUpperCase();
  }
  let linea2 = diseno.textosFijos.sede;
  if (personalizacion.encabezado2) {
    linea2 = personalizacion.encabezado2.toUpperCase();
  }

  // Sin campus queda un hueco; bajamos un poco los títulos para repartir el espacio
  let bajar = 0;
  if (!hayCampus) {
    bajar = 18;
  }

  // Si una línea es muy larga, su letra se achica para que quepa en una sola línea
  const opciones1 = { tamano: 22, ancho: 700, espaciado: 0.3, espacioPalabras: 6 };
  opciones1.tamano = tamanoParaUnaLinea(doc, linea1, opciones1, 12);
  const opciones2 = { tamano: 20, ancho: 700 };
  opciones2.tamano = tamanoParaUnaLinea(doc, linea2, opciones2, 12);

  doc.fillColor(diseno.colores.texto);
  escribirCentrado(doc, linea1, centro, y.universidad + bajar, opciones1);
  escribirCentrado(doc, linea2, centro, y.sede + bajar, opciones2);

  // El campus es opcional: solo se dibuja si tiene texto
  if (hayCampus) {
    doc.fillColor(diseno.colores.azul);
    escribirCentrado(doc, diploma.campus.toUpperCase(), centro, y.campus, {
      tamano: 15, ancho: 700, fuente: 'negrita',
    });
  }
}

/** Texto pequeño arriba del texto principal: "Reconocimiento a:", "Diploma otorgado por:"… */
function dibujarSaludo(doc, centro, saludo) {
  doc.fillColor(diseno.colores.texto);
  escribirCentrado(doc, saludo, centro, diseno.posiciones.saludo, {
    tamano: 10.5, ancho: 700, fuente: 'negrita',
  });
}

/**
 * Texto grande en letra cursiva dorada, con una línea debajo.
 * Es el nombre de la persona, o el lugar obtenido en el módulo Lugares
 * (cada módulo lo decide en su función "textoPrincipal").
 */
function dibujarTextoPrincipal(doc, centro, modulo, diploma) {
  const texto = modulo.textoPrincipal(diploma);
  const y = diseno.posiciones;
  const opciones = { fuente: 'cursiva', tamano: 50, ancho: 560, espaciado: 1.5, espacioPalabras: 12 };

  // Si el texto es muy largo, se achica la letra para que quepa en una línea
  opciones.tamano = tamanoParaUnaLinea(doc, texto, opciones);

  doc.fillColor(diseno.colores.dorado);
  escribirCentrado(doc, texto, centro, y.textoPrincipal, opciones);

  // Línea debajo: la del módulo si tiene una propia, si no, la común
  let linea = diseno.lineaPrincipal;
  if (modulo.config.lineaPrincipal) {
    linea = modulo.config.lineaPrincipal;
  }

  const xInicio = centro - linea.ancho / 2;
  const xFin = centro + linea.ancho / 2;
  doc.moveTo(xInicio, y.lineaTextoPrincipal)
    .lineTo(xFin, y.lineaTextoPrincipal)
    .lineWidth(linea.grosor)
    .strokeColor(diseno.colores.linea)
    .stroke();
}

function dibujarLugarYFecha(doc, centro, diploma) {
  const texto = `${diploma.lugar}, ${diploma.fecha}.`;
  doc.fillColor(diseno.colores.texto);
  escribirCentrado(doc, texto, centro, diseno.posiciones.lugarYFecha, { tamano: 12, ancho: 560 });
}

/**
 * Firmas:
 *   - 2 firmas: una a la izquierda y otra a la derecha.
 *   - 3 firmas: la 1 a la izquierda, la 2 a la derecha y la 3 al centro, más arriba.
 */
function dibujarFirmas(doc, centro, diploma) {
  const y = diseno.posiciones;
  const medidas = diseno.firmas;

  const firma1 = { nombre: diploma.firmante1, cargo: diploma.cargo1 };
  const firma2 = { nombre: diploma.firmante2, cargo: diploma.cargo2 };
  const firma3 = { nombre: diploma.firmante3, cargo: diploma.cargo3 };

  const hayTerceraFirma = diploma.firmante3 !== '';

  if (hayTerceraFirma) {
    const mitad = medidas.distanciaCon3 / 2;
    dibujarUnaFirma(doc, firma1, centro - mitad, y.firmas);
    dibujarUnaFirma(doc, firma2, centro + mitad, y.firmas);
    dibujarUnaFirma(doc, firma3, centro, y.firmaCentral);
  } else {
    const mitad = medidas.distanciaCon2 / 2;
    dibujarUnaFirma(doc, firma1, centro - mitad, y.firmas);
    dibujarUnaFirma(doc, firma2, centro + mitad, y.firmas);
  }
}

/**
 * Dibuja la línea, el nombre (en MAYÚSCULAS) y el cargo de una firma.
 * @param {number} centroX  centro horizontal de la firma
 * @param {number} y        altura de la línea
 */
function dibujarUnaFirma(doc, firma, centroX, y) {
  if (firma.nombre === '') {
    return; // sin nombre no se dibuja esta firma
  }

  const anchoLinea = diseno.firmas.anchoLinea;
  const xLinea = centroX - anchoLinea / 2;

  // Línea
  doc.moveTo(xLinea, y)
    .lineTo(xLinea + anchoLinea, y)
    .lineWidth(1)
    .strokeColor(diseno.colores.linea)
    .stroke();

  // Nombre y cargo, centrados en una caja un poco más ancha que la línea
  const anchoCaja = anchoLinea + 60;
  const xCaja = centroX - anchoCaja / 2;
  const opcionesTexto = { width: anchoCaja, align: 'center' };

  doc.fillColor(diseno.colores.texto).fontSize(9.5);
  doc.font('negrita').text(firma.nombre.toUpperCase(), xCaja, y + 9, opcionesTexto);
  doc.font('normal').text(firma.cargo, xCaja, y + 30, opcionesTexto);
}

