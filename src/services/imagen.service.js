// =============================================================
//  SERVICIO DE IMÁGENES
//  Convierte un PDF (ya generado) en una imagen PNG.
//  Así la imagen es idéntica al PDF: no hay que dibujar dos veces.
//
//  Usa la librería "pdf-to-img" (por dentro usa pdf.js, el mismo
//  lector de PDF de Firefox).
//
//  IMPORTA    DE                     PARA
//  pdf        pdf-to-img (librería)  convertir PDF en PNG
//  appConfig  config/app.config.js   la escala por defecto
//
//  EXPORTA     LO IMPORTA                          PARA
//  pdfAImagen  controllers/diplomas.controller.js  descargar PNG y miniaturas
// =============================================================
import { pdf } from 'pdf-to-img';
import appConfig from '../config/app.config.js';

// Las conversiones se hacen UNA A LA VEZ, en fila (como en un banco).
// Convertir un PDF en imagen usa bastante memoria; si llegan muchas juntas
// (por ejemplo, al hacer clic en varios colores seguidos), el servidor
// gratuito de Render (512 MB) podría quedarse sin memoria y reiniciarse.
// "fila" es la promesa de la última conversión: cada nueva espera a esa.
let fila = Promise.resolve();

/**
 * Devuelve la PRIMERA página del PDF como imagen PNG (Buffer).
 *
 * @param {Buffer} archivoPDF
 * @param {number} escala  cuántas veces más grande que el PDF (opcional).
 *   Ej. hoja de 612 x 720 puntos con escala 3 -> imagen de 1836 x 2160 píxeles.
 *   Si no se pasa, se usa la del .env (IMAGEN_ESCALA). Las miniaturas usan 1.
 * @returns {Promise<Buffer>}
 */
export function pdfAImagen(archivoPDF, escala = appConfig.imagen.escala) {
  const miTurno = fila.then(function () {
    return convertirPrimeraPagina(archivoPDF, escala);
  });
  // La siguiente espera a esta, aunque esta falle
  fila = miTurno.catch(function () {});
  return miTurno;
}

/** La conversión en sí. Al terminar, libera la memoria del documento (destroy). */
async function convertirPrimeraPagina(archivoPDF, escala) {
  const documento = await pdf(archivoPDF, { scale: escala });
  try {
    // documento.getPage(1) = la página 1 ya convertida en PNG
    return await documento.getPage(1);
  } finally {
    await documento.destroy(); // sin esto, la memoria no se libera
  }
}
