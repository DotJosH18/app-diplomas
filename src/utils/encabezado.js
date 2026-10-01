// =============================================================
//  LAS 2 LÍNEAS DEL ENCABEZADO (universidad y sede)
//
//  Cada línea puede ser:
//    - la de siempre (si el usuario no escribió nada),
//    - la que escribió el usuario en "Personalizar diseño",
//    - o quedar EN BLANCO (si marcó "En blanco"): no se dibuja.
//
//  IMPORTA  (nada)
//
//  EXPORTA              LO IMPORTAN                                PARA
//  lineasDelEncabezado  services/pdf.service.js, placas.pdf.js     saber qué escribir en cada línea
// =============================================================

/**
 * Devuelve el texto de las 2 líneas. '' = la línea va en blanco.
 *
 * @param {object} personalizacion  { encabezado1, encabezado2, encabezado1EnBlanco, encabezado2EnBlanco }
 * @param {object} textosFijos      { universidad, sede }: los textos de siempre
 * @returns {{ linea1: string, linea2: string }}
 *
 * Ejemplo: lineasDelEncabezado({ encabezado1EnBlanco: true }, textos)
 *          -> { linea1: '', linea2: 'NUESTRA SEÑORA REINA DE LA PAZ' }
 */
export function lineasDelEncabezado(personalizacion, textosFijos) {
  return {
    linea1: unaLinea(personalizacion.encabezado1, personalizacion.encabezado1EnBlanco, textosFijos.universidad),
    linea2: unaLinea(personalizacion.encabezado2, personalizacion.encabezado2EnBlanco, textosFijos.sede),
  };
}

function unaLinea(textoEscrito, enBlanco, textoDeSiempre) {
  if (enBlanco) {
    return '';
  }
  if (textoEscrito) {
    return textoEscrito.toUpperCase();
  }
  return textoDeSiempre;
}
