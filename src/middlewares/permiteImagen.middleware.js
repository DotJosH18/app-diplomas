// =============================================================
//  MIDDLEWARE: ¿este módulo se puede descargar como imagen?
//
//  Solo los módulos con "descargaImagen: true" en su config
//  (por ahora, el Comunicado de duelo). Si no, responde 400
//  antes de validar los datos o generar nada.
//
//  IMPORTA    DE                  PARA
//  HttpError  utils/HttpError.js  responder 400
//
//  EXPORTA    LO IMPORTA                 PARA
//  (default)  routes/diplomas.routes.js  antes de POST /api/:modulo/imagen
// =============================================================
import HttpError from '../utils/HttpError.js';

export default function permiteImagen(req, res, next) {
  if (!req.modulo.config.descargaImagen) {
    throw new HttpError(400, `"${req.modulo.titulo}" no se puede descargar como imagen`);
  }
  next();
}
