// =============================================================
//  MÓDULO __TITULO__ - dibujo
//
//  Este módulo usa el DISEÑO COMÚN de diploma: pdf.service.js dibuja
//  la banda, el encabezado, el nombre en cursiva, lugar y fecha, y
//  las firmas. Aquí solo se dibuja la parte central (dibujarCuerpo).
//
//  ¿Quieres un diseño totalmente propio? Exporta "dibujarPagina(doc,
//  datos, personalizacion)" en lugar de "dibujarCuerpo" y úsala en
//  __ID__.modulo.js (mira src/modulos/placas como ejemplo).
//
//  IMPORTA                              DE                       PARA
//  diseno                               ../../config/diseno.config.js  colores comunes
//  acomodarParrafos, escribirParrafos   ../../utils/pdfTexto.js  la descripción en párrafos
//  config                               __ID__.config.js         posiciones y tamaños
//
//  EXPORTA              LO IMPORTA        PARA
//  dibujarCuerpo        __ID__.modulo.js  dibujar la parte central
//  acomodarDescripcion  __ID__.schema.js  validar con el mismo cálculo del dibujo
// =============================================================
import diseno from '../../config/diseno.config.js';
import { acomodarParrafos, escribirParrafos } from '../../utils/pdfTexto.js';
import config from './__ID__.config.js';

/**
 * Calcula cómo queda la descripción: sus párrafos, el tamaño de letra
 * y si cabe en su espacio. La usan el dibujo y el esquema.
 */
export function acomodarDescripcion(doc, texto) {
  const alto = config.posiciones.finDescripcion - config.posiciones.descripcion;
  const opciones = { tamano: config.descripcion.tamano, ancho: config.descripcion.ancho };
  return acomodarParrafos(doc, texto, opciones, alto, config.descripcion.tamanoMinimo);
}

/** Dibuja la parte central: la descripción, centrada, debajo del nombre. */
export function dibujarCuerpo(doc, centro, datos) {
  const acomodo = acomodarDescripcion(doc, datos.descripcion);

  doc.fillColor(diseno.colores.texto);
  escribirParrafos(doc, acomodo.parrafos, centro, config.posiciones.descripcion, {
    tamano: acomodo.tamano,
    ancho: config.descripcion.ancho,
  }, 'centrado');
}
