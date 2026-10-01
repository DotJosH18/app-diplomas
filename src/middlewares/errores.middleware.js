// =============================================================
//  MIDDLEWARES DE ERRORES
//  Se registran al final de app.js.
//
//  IMPORTA    DE                    PARA
//  HttpError  utils/HttpError.js    reconocer los errores con código
//  appConfig  config/app.config.js  mensajes de tamaño máximo
//
//  EXPORTA           LO IMPORTA  PARA
//  rutaNoEncontrada  app.js      responder 404 a las rutas que no existen
//  manejarErrores    app.js      convertir cualquier error en { error: "…" }
// =============================================================
import multer from 'multer';
import HttpError from '../utils/HttpError.js';
import appConfig from '../config/app.config.js';

/**
 * Responde 404 cuando la URL no coincide con ninguna ruta de la API.
 */
export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` });
}

/**
 * Convierte cualquier error en una respuesta JSON: { "error": "mensaje" }.
 * Express sabe que es un middleware de errores porque recibe 4 parámetros
 * (error, req, res, next), aunque "next" no se use.
 */
// eslint-disable-next-line no-unused-vars
export function manejarErrores(error, req, res, next) {
  let status = 500;
  let mensaje = 'Ocurrió un error inesperado';

  if (error instanceof HttpError) {
    // Error que lanzamos nosotros a propósito (datos inválidos, archivo incorrecto…)
    status = error.status;
    mensaje = error.message;
  } else if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    // El archivo subido es demasiado grande
    status = 413;
    mensaje = `El archivo supera ${appConfig.excel.tamanoMaximoMB} MB`;
  } else if (error.type === 'entity.parse.failed') {
    // Llegó un JSON mal escrito
    status = 400;
    mensaje = 'Los datos enviados no son un JSON válido';
  } else {
    // Error que no esperábamos: se muestra completo en la consola para investigarlo
    console.error(error);
  }

  res.status(status).json({ error: mensaje });
}

