// =============================================================
//  MÓDULO PLACAS - PDF
//  Dibuja la página COMPLETA (A4 horizontal):
//
//   ◤ cintas                                          ┐
//     ╔══════════════════════════════════════════╗     marco dorado doble
//     ║    UNIVERSIDAD CATÓLICA DE HONDURAS      ║
//     ║      NUESTRA SEÑORA REINA DE LA PAZ      ║
//     ║          CAMPUS SANTA CLARA              ║     (logo transparente
//     ║          Reconocimiento a:               ║      detrás del texto)
//     ║        𝒟𝒾𝒶𝓃𝒶 𝒢𝒶𝒷𝓇𝒾ℯ𝓁𝒶 𝒢𝒶𝓇𝒸í𝒶            ║
//     ║   ─────────────────────────────────────  ║
//     ║   Descripción (uno o varios párrafos)    ║
//     ║     Juticalpa, Olancho, 28 de …          ║
//     ║   𝒟𝒶𝓇í𝑜 𝐻ℯ𝓃𝓇í𝓆𝓊ℯ𝓏        ℐ𝓁ℯ𝒶𝓃𝒶 𝒞𝒶𝓇𝒾𝒶𝓈        ║     rúbricas
//     ║   ──────────            ──────────       ║
//     ║   NOMBRE                NOMBRE           ║
//     ║   Cargo                 Cargo            ║
//     ╚══════════════════════════════════════════╝
//                                             cintas ◢
//
//  IMPORTA               DE                       PARA
//  escribir…, acomodar…  ../../utils/pdfTexto.js  escribir textos y párrafos
//  config                placas.config.js         medidas, colores y textos
//
//  EXPORTA              LO IMPORTA              PARA
//  dibujarPagina        placas.modulo.js        dibujar la página completa
//  acomodarDescripcion  placas.schema.js        validar con el mismo cálculo del dibujo
//  rubricaDe            tests/diplomas.test.js  probar cómo se arma la rúbrica
// =============================================================
import diseno from '../../config/diseno.config.js';
import { escribirCentrado, tamanoParaUnaLinea, acomodarParrafos, escribirParrafos, yParaLineaBase } from '../../utils/pdfTexto.js';
import config from './placas.config.js';

const colores = config.colores;
const y = config.posiciones;

/**
 * @param {PDFDocument} doc
 * @param {object} placa            datos ya validados por el esquema
 * @param {object} personalizacion  { colorBanda, logo, encabezado1, encabezado2 } opcionales
 */
export function dibujarPagina(doc, placa, personalizacion) {
  const centro = doc.page.width / 2;

  const paleta = armarPaleta(personalizacion);

  dibujarMarcaDeAgua(doc, centro, personalizacion);
  dibujarMarco(doc, paleta);
  dibujarAdornosDeEsquina(doc, paleta); // en las 2 esquinas sin cintas (equilibran el diseño)
  dibujarCintas(doc, paleta);           // encima del marco, tapando sus esquinas
  dibujarEncabezado(doc, centro, placa, personalizacion, paleta);
  dibujarNombre(doc, centro, placa, paleta);
  dibujarDescripcion(doc, centro, placa);
  dibujarLugarYFecha(doc, centro, placa);
  dibujarFirmas(doc, centro, placa, paleta);
}

/**
 * Los 3 colores que se pueden cambiar en "Personalizar diseño".
 * Si alguno no se eligió, se usa el de placas.config.js.
 *   principal:  cinta principal y texto del campus   (azul)
 *   secundario: cinta secundaria, marco y adornos    (dorado)
 *   nombre:     nombre de la persona y rúbricas      (dorado oscuro)
 */
function armarPaleta(personalizacion) {
  const paleta = {
    principal: colores.azul,
    secundario: colores.dorado,
    nombre: colores.doradoOscuro,
  };
  if (personalizacion.colorBanda) {
    paleta.principal = personalizacion.colorBanda;
  }
  if (personalizacion.colorSecundario) {
    paleta.secundario = personalizacion.colorSecundario;
  }
  if (personalizacion.colorNombre) {
    paleta.nombre = personalizacion.colorNombre;
  }
  return paleta;
}

// -------------------------------------------------------------
//  Fondo
// -------------------------------------------------------------

/**
 * El logo grande, muy transparente, CENTRADO dentro del marco
 * (a lo ancho y a lo alto), detrás de todo el texto.
 */
function dibujarMarcaDeAgua(doc, centro, personalizacion) {
  let logo = config.logo;
  if (personalizacion.logo) {
    logo = personalizacion.logo; // el que subió el usuario
  }

  const tamano = config.tamanoLogo;
  const centroVertical = doc.page.height / 2;

  doc.save();                               // guarda el estado (sin transparencia)
  doc.opacity(config.transparenciaLogo);    // todo lo que sigue sale transparente
  doc.image(logo, centro - tamano / 2, centroVertical - tamano / 2, {
    fit: [tamano, tamano],                  // cabe en el cuadro sin deformarse
    align: 'center',
    valign: 'center',
  });
  doc.restore();                            // vuelve a la normalidad
}

/**
 * Cintas curvas en la esquina de arriba a la izquierda y en la de
 * abajo a la derecha (la misma figura, girada 180 grados).
 */
function dibujarCintas(doc, paleta) {
  dibujarCintasDeEsquina(doc, paleta);

  doc.save();
  doc.rotate(180, { origin: [doc.page.width / 2, doc.page.height / 2] });
  dibujarCintasDeEsquina(doc, paleta);
  doc.restore();
}

/**
 * Las cintas de UNA esquina (la de arriba a la izquierda):
 *   1. la dorada, por detrás;
 *   2. la azul, encima (se cruzan como una cinta torcida);
 *   3. un filete dorado fino que acompaña a la azul por fuera.
 */
function dibujarCintasDeEsquina(doc, paleta) {
  const c = config.cintas;

  doc.polygon(...puntosDeFranja(c.dorada.interior, c.dorada.exterior)).fill(paleta.secundario);
  doc.polygon(...puntosDeFranja(c.azul.interior, c.azul.exterior)).fill(paleta.principal);

  const filete = puntosDeCurva(c.filete.x, c.filete.y, false);
  doc.moveTo(filete[0][0], filete[0][1]);
  for (const punto of filete) {
    doc.lineTo(punto[0], punto[1]);
  }
  doc.lineWidth(c.filete.grosor).strokeColor(paleta.secundario).stroke();
}

/**
 * Puntos de una curva suave que va del borde de arriba (x, 0) al borde
 * izquierdo (0, y), curvada hacia la esquina.
 *
 * Es una "curva de Bézier": sale de (x, 0), va hacia un punto de control
 * cerca de la esquina y llega a (0, y). "curvatura" dice qué tan cerca de la
 * esquina está ese punto: 0 = pegada a los bordes, 0.5 = casi una recta.
 * Con "alReves" = true los puntos van en sentido contrario.
 */
function puntosDeCurva(x, y, alReves) {
  const curvatura = config.cintas.curvatura;
  const controlX = x * curvatura;
  const controlY = y * curvatura;

  const puntos = [];
  const pasos = 48; // más pasos = curva más suave
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos; // de 0 (inicio) a 1 (final)
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    puntos.push([a * x + b * controlX + c * 0, a * 0 + b * controlY + c * y]);
  }
  if (alReves) {
    puntos.reverse();
  }
  return puntos;
}

/** Contorno de una franja curva: la curva exterior de ida y la interior de vuelta. */
function puntosDeFranja(interior, exterior) {
  const ida = puntosDeCurva(exterior.x, exterior.y, false);
  const vuelta = puntosDeCurva(interior.x, interior.y, true);
  return ida.concat(vuelta);
}

/** Marco dorado: línea gruesa por fuera y delgada por dentro. */
function dibujarMarco(doc, paleta) {
  const m = config.marco;
  const ancho = doc.page.width;
  const alto = doc.page.height;

  doc.strokeColor(paleta.secundario);
  doc.lineWidth(m.grosor)
    .rect(m.separacion, m.separacion, ancho - 2 * m.separacion, alto - 2 * m.separacion)
    .stroke();

  const adentro = m.separacion + m.separacionInterna;
  doc.lineWidth(m.grosorInterno)
    .rect(adentro, adentro, ancho - 2 * adentro, alto - 2 * adentro)
    .stroke();
}

/**
 * Adorno en las esquinas de arriba a la derecha y de abajo a la izquierda:
 * un rombo pequeño con dos líneas cortas, dentro del marco.
 */
function dibujarAdornosDeEsquina(doc, paleta) {
  const m = config.marco;
  const adentro = m.separacion + m.separacionInterna + 8; // un poco dentro de la línea delgada
  const largo = m.adorno;

  // [x, y, hacia dónde van las líneas en x, hacia dónde en y]
  const esquinas = [
    [doc.page.width - adentro, adentro, -1, 1],   // arriba a la derecha
    [adentro, doc.page.height - adentro, 1, -1],  // abajo a la izquierda
  ];

  doc.lineWidth(0.8).strokeColor(paleta.secundario).fillColor(paleta.secundario);
  for (const esquina of esquinas) {
    const x = esquina[0];
    const y = esquina[1];
    const dx = esquina[2];
    const dy = esquina[3];

    dibujarRombo(doc, x, y, 3.2);
    doc.moveTo(x + dx * 6, y).lineTo(x + dx * largo, y).stroke();   // línea horizontal
    doc.moveTo(x, y + dy * 6).lineTo(x, y + dy * largo).stroke();   // línea vertical
  }
}

/** Rombo relleno (◆) con centro en (x, y). */
function dibujarRombo(doc, x, y, radio) {
  doc.polygon([x, y - radio], [x + radio, y], [x, y + radio], [x - radio, y]).fill();
}

/**
 * Línea horizontal que se desvanece en las puntas (degradado):
 * transparente → color → transparente. Se ve más fina que una línea recta.
 */
function lineaDegradada(doc, centroX, y, ancho, grosor, color) {
  const inicio = centroX - ancho / 2;
  const degradado = doc.linearGradient(inicio, y, inicio + ancho, y);
  degradado.stop(0, color, 0);      // (posición, color, opacidad)
  degradado.stop(0.18, color, 1);
  degradado.stop(0.82, color, 1);
  degradado.stop(1, color, 0);
  doc.rect(inicio, y - grosor / 2, ancho, grosor).fill(degradado);
}

// -------------------------------------------------------------
//  Textos
// -------------------------------------------------------------

/** Universidad, sede (se pueden cambiar en "Personalizar") y campus. */
function dibujarEncabezado(doc, centro, placa, personalizacion, paleta) {
  let linea1 = diseno.textosFijos.universidad;
  if (personalizacion.encabezado1) {
    linea1 = personalizacion.encabezado1.toUpperCase();
  }
  let linea2 = diseno.textosFijos.sede;
  if (personalizacion.encabezado2) {
    linea2 = personalizacion.encabezado2.toUpperCase();
  }

  // Sin campus, el encabezado baja un poco para no dejar un hueco
  let bajar = 0;
  if (placa.campus === '') {
    bajar = 14;
  }

  const opciones1 = { tamano: 21, ancho: 620, espaciado: 1.2, espacioPalabras: 5 };
  opciones1.tamano = tamanoParaUnaLinea(doc, linea1, opciones1, 12);
  const opciones2 = { tamano: 14.5, ancho: 620, espaciado: 1.5 };
  opciones2.tamano = tamanoParaUnaLinea(doc, linea2, opciones2, 10);

  doc.fillColor(colores.texto);
  escribirCentrado(doc, linea1, centro, y.universidad + bajar, opciones1);
  doc.fillColor(colores.textoSuave);
  escribirCentrado(doc, linea2, centro, y.sede + bajar, opciones2);

  if (placa.campus !== '') {
    dibujarCampus(doc, centro, placa.campus.toUpperCase(), paleta);
  }
}

/** El campus (color principal), entre dos líneas con un rombo:  ◆──  CAMPUS  ──◆ */
function dibujarCampus(doc, centro, campus, paleta) {
  const opciones = { fuente: 'negrita', tamano: 11.5, ancho: 500, espaciado: 2 };
  opciones.tamano = tamanoParaUnaLinea(doc, campus, opciones, 8);

  doc.fillColor(paleta.principal);
  escribirCentrado(doc, campus, centro, y.campus, opciones);

  // Adornos a los lados, a la altura del centro del texto
  doc.font('negrita').fontSize(opciones.tamano);
  const mitadTexto = doc.widthOfString(campus, { characterSpacing: opciones.espaciado }) / 2;
  const yAdorno = y.campus + opciones.tamano * 0.62;
  const separacion = 14;
  const largo = 46;

  doc.lineWidth(0.8).strokeColor(paleta.secundario).fillColor(paleta.secundario);
  for (const lado of [-1, 1]) {
    const desde = centro + lado * (mitadTexto + separacion);
    const hasta = centro + lado * (mitadTexto + separacion + largo);
    doc.moveTo(desde, yAdorno).lineTo(hasta, yAdorno).stroke();
    dibujarRombo(doc, hasta + lado * 4, yAdorno, 3);
  }
}

/** "RECONOCIMIENTO A" y el nombre en cursiva dorada, con una línea debajo. */
function dibujarNombre(doc, centro, placa, paleta) {
  doc.fillColor(colores.textoSuave);
  escribirCentrado(doc, config.saludo, centro, y.saludo, { fuente: 'negrita', tamano: 8.5, ancho: 620, espaciado: 3 });

  const opciones = { fuente: 'cursiva', tamano: 48, ancho: 560, espaciado: 1.5, espacioPalabras: 12 };
  opciones.tamano = tamanoParaUnaLinea(doc, placa.nombre, opciones);

  // El nombre se "sienta" sobre la línea (aunque la letra se haya achicado)
  const yNombre = yParaLineaBase(doc, 'cursiva', opciones.tamano, y.lineaNombre - y.nombreSobreLinea);
  doc.fillColor(paleta.nombre);
  escribirCentrado(doc, placa.nombre, centro, yNombre, opciones);

  lineaDegradada(doc, centro, y.lineaNombre, 540, 1.2, paleta.secundario);
}

/**
 * Calcula cómo queda la descripción: sus párrafos, el tamaño de letra
 * y si cabe en su espacio. La usan el PDF y el esquema (para validar).
 */
export function acomodarDescripcion(doc, texto) {
  const alto = y.finDescripcion - y.descripcion;
  const opciones = { tamano: config.descripcion.tamano, ancho: config.descripcion.ancho };
  return acomodarParrafos(doc, texto, opciones, alto, config.descripcion.tamanoMinimo);
}

function dibujarDescripcion(doc, centro, placa) {
  const acomodo = acomodarDescripcion(doc, placa.descripcion);
  doc.fillColor(colores.texto);
  escribirParrafos(doc, acomodo.parrafos, centro, y.descripcion, {
    tamano: acomodo.tamano,
    ancho: config.descripcion.ancho,
  }, 'centrado');
}

function dibujarLugarYFecha(doc, centro, placa) {
  doc.fillColor(colores.textoSuave);
  escribirCentrado(doc, `${placa.lugar}, ${placa.fecha}.`, centro, y.lugarYFecha, { tamano: 10.5, ancho: 620 });
}

// -------------------------------------------------------------
//  Firmas
// -------------------------------------------------------------

/** 2 firmas a los lados, o 3 en la misma fila si hay Firmante 3. */
function dibujarFirmas(doc, centro, placa, paleta) {
  const firmas = [
    { nombre: placa.firmante1, cargo: placa.cargo1 },
    { nombre: placa.firmante2, cargo: placa.cargo2 },
  ];

  if (placa.firmante3 !== '') {
    const distancia = config.firmas.distanciaCon3;
    dibujarUnaFirma(doc, firmas[0], centro - distancia, paleta);
    dibujarUnaFirma(doc, { nombre: placa.firmante3, cargo: placa.cargo3 }, centro, paleta);
    dibujarUnaFirma(doc, firmas[1], centro + distancia, paleta);
  } else {
    const mitad = config.firmas.distanciaCon2 / 2;
    dibujarUnaFirma(doc, firmas[0], centro - mitad, paleta);
    dibujarUnaFirma(doc, firmas[1], centro + mitad, paleta);
  }
}

/** Rúbrica en cursiva, línea, nombre en mayúsculas y cargo. */
function dibujarUnaFirma(doc, firma, x, paleta) {
  const ancho = config.firmas.anchoLinea;

  // Rúbrica: "Mte. Darío Martín Henríquez" -> "Darío Henríquez"
  const rubrica = rubricaDe(firma.nombre);
  const opcionesRubrica = { fuente: 'cursiva', tamano: 25, ancho: ancho + 20, espaciado: 0.5, espacioPalabras: 6 };
  opcionesRubrica.tamano = tamanoParaUnaLinea(doc, rubrica, opcionesRubrica, 14);

  // La rúbrica se "sienta" sobre la línea de la firma, como una firma de verdad
  const yRubrica = yParaLineaBase(doc, 'cursiva', opcionesRubrica.tamano, y.lineaFirma - y.rubricaSobreLinea);
  doc.fillColor(paleta.nombre);
  escribirCentrado(doc, rubrica, x, yRubrica, opcionesRubrica);

  lineaDegradada(doc, x, y.lineaFirma, ancho + 20, 0.7, colores.lineaFirma);

  doc.fillColor(colores.texto);
  const nombre = firma.nombre.toUpperCase();
  const opcionesNombre = { fuente: 'negrita', tamano: 9, ancho: 220, espaciado: 0.4 };
  opcionesNombre.tamano = tamanoParaUnaLinea(doc, nombre, opcionesNombre, 7);
  escribirCentrado(doc, nombre, x, y.lineaFirma + 9, opcionesNombre);

  doc.fillColor(colores.textoSuave);
  escribirCentrado(doc, firma.cargo, x, y.lineaFirma + 24, { tamano: 9, ancho: 220 });
}

/**
 * Arma la rúbrica (la "firma" en cursiva) a partir del nombre:
 * quita los títulos (palabras que terminan en punto, como "Mte." o "MSc.")
 * y deja el primer nombre y el último apellido.
 *   'Mte. Darío Martín Henríquez' -> 'Darío Henríquez'
 *   'MSc. Ileana Nohemy Carias'   -> 'Ileana Carias'
 *   'Ana'                         -> 'Ana'
 */
export function rubricaDe(nombreCompleto) {
  const palabras = [];
  for (const palabra of nombreCompleto.split(' ')) {
    const esTitulo = palabra.endsWith('.');
    if (palabra !== '' && !esTitulo) {
      palabras.push(palabra);
    }
  }

  if (palabras.length === 0) {
    return nombreCompleto; // solo tenía títulos: se deja como está
  }
  if (palabras.length === 1) {
    return palabras[0];
  }
  return `${palabras[0]} ${palabras[palabras.length - 1]}`;
}
