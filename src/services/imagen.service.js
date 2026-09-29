// =============================================================
//  SERVICIO DE IMÁGENES
//  Convierte un PDF (ya generado) en una imagen PNG.
//  Así la imagen es idéntica al PDF: no hay que dibujar dos veces.
//
//  Usa la librería "pdf-to-img" (por dentro usa pdf.js, el mismo
//  lector de PDF de Firefox).
// =============================================================
import { pdf } from 'pdf-to-img';
import appConfig from '../config/app.config.js';

/**
 * Devuelve la PRIMERA página del PDF como imagen PNG (Buffer).
 *
 * @param {Buffer} archivoPDF
 * @returns {Promise<Buffer>}
 */
export async function pdfAImagen(archivoPDF) {
  // "escala" = cuántas veces más grande que el PDF.
  // Ej. hoja de 612 x 720 puntos con escala 3 -> imagen de 1836 x 2160 píxeles
  const documento = await pdf(archivoPDF, { scale: appConfig.imagen.escala });

  // documento.getPage(1) = la página 1 ya convertida en PNG
  const imagen = await documento.getPage(1);
  return imagen;
}
