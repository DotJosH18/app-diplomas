// =============================================================
//  MIDDLEWARE: ¿este módulo se puede descargar como imagen?
//
//  Solo los módulos con "descargaImagen: true" en su config
//  (por ahora, el Comunicado de duelo). Si no, responde 400
//  antes de validar los datos o generar nada.
// =============================================================
import HttpError from '../utils/HttpError.js';

export default function permiteImagen(req, res, next) {
  if (!req.modulo.config.descargaImagen) {
    throw new HttpError(400, `"${req.modulo.titulo}" no se puede descargar como imagen`);
  }
  next();
}
