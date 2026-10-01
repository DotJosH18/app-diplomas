// =============================================================
//  MÓDULO RECONOCIMIENTOS - parte central del PDF
//  Se dibuja entre el nombre y la línea de lugar y fecha.
//  El resto del diploma (encabezado, nombre, firmas) lo dibuja
//  src/services/pdf.service.js, igual para todos los módulos.
//
//  IMPORTA               DE                         PARA
//  escribir…, acomodar…  ../../utils/pdfTexto.js    escribir textos y párrafos
//  config                reconocimientos.config.js  medidas, colores y textos
//
//  EXPORTA              LO IMPORTA                 PARA
//  dibujarCuerpo        reconocimientos.modulo.js  dibujar la parte central (lo común lo dibuja pdf.service.js)
//  acomodarDescripcion  reconocimientos.schema.js  validar con el mismo cálculo del dibujo
// =============================================================
import diseno from '../../config/diseno.config.js';
import { acomodarParrafos, escribirParrafos } from '../../utils/pdfTexto.js';
import config from './reconocimientos.config.js';

/**
 * Calcula cómo queda la descripción: sus párrafos, el tamaño de letra
 * y si cabe en su espacio. La usan el PDF y el esquema (para validar).
 */
export function acomodarDescripcion(doc, texto) {
  const alto = config.posiciones.finDescripcion - config.posiciones.descripcion;
  const opciones = { tamano: config.descripcion.tamano, ancho: config.descripcion.ancho };
  return acomodarParrafos(doc, texto, opciones, alto, config.descripcion.tamanoMinimo);
}

export function dibujarCuerpo(doc, centro, diploma) {
  const acomodo = acomodarDescripcion(doc, diploma.descripcion);

  doc.fillColor(diseno.colores.texto);
  escribirParrafos(doc, acomodo.parrafos, centro, config.posiciones.descripcion, {
    tamano: acomodo.tamano,
    ancho: config.descripcion.ancho,
  }, 'centrado');
}
